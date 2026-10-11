// Copies the owner's data from the collections in the database root to users/{uid}/… (ADR-0016,
// pkt 7). Dry run by default; `--apply` writes. Documents keep their ids and contents, so running
// it again only copies what is missing. Source documents are never changed or deleted.
//
// Usage (credentials: `gcloud auth application-default login` or GOOGLE_APPLICATION_CREDENTIALS):
//   node scripts/migrate-to-users.ts --project training-tracker-6d13b --uid <owner uid> [--apply]
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/** Root collection → subcollection of users/{uid}. */
export const MOVES = [
  { from: 'workouts', to: 'sessions' },
  { from: 'measurements', to: 'measurements' },
  { from: 'weekPlans', to: 'weekPlans' },
] as const;

export interface MoveReport {
  from: string;
  to: string;
  source: number;
  copied: number;
  alreadyThere: number;
  /** Ids present in both places with different contents; never overwritten. */
  conflicts: string[];
}

export const migrateToUsers = async (db: Firestore, uid: string, apply: boolean): Promise<MoveReport[]> => {
  const reports: MoveReport[] = [];
  for (const { from, to } of MOVES) {
    const source = await db.collection(from).get();
    const target = db.collection('users').doc(uid).collection(to);
    const report: MoveReport = { from, to, source: source.size, copied: 0, alreadyThere: 0, conflicts: [] };
    const writer = db.bulkWriter();
    for (const document of source.docs) {
      const existing = await target.doc(document.id).get();
      if (!existing.exists) {
        report.copied += 1;
        if (apply) void writer.create(target.doc(document.id), document.data());
      } else if (isDeepStrictEqual(existing.data(), document.data())) {
        report.alreadyThere += 1;
      } else {
        report.conflicts.push(document.id);
      }
    }
    await writer.close();
    reports.push(report);
  }
  return reports;
};

const main = async () => {
  const { values } = parseArgs({
    options: { project: { type: 'string' }, uid: { type: 'string' }, apply: { type: 'boolean', default: false } },
  });
  if (!values.project || !values.uid) {
    console.error('Usage: node scripts/migrate-to-users.ts --project <project id> --uid <owner uid> [--apply]');
    process.exit(2);
  }
  const db = getFirestore(initializeApp({ projectId: values.project }));
  const target = process.env.FIRESTORE_EMULATOR_HOST ? `emulator ${process.env.FIRESTORE_EMULATOR_HOST}` : 'PRODUCTION';
  console.warn(`${values.apply ? 'APPLY' : 'DRY RUN'} — project ${values.project} (${target}), users/${values.uid}`);

  const reports = await migrateToUsers(db, values.uid, values.apply);
  for (const r of reports) {
    console.warn(
      `${r.from} → users/${values.uid}/${r.to}: ${r.source} in source, ${r.copied} ${values.apply ? 'copied' : 'to copy'}, ` +
        `${r.alreadyThere} already there, ${r.conflicts.length} conflicts${r.conflicts.length ? ` (${r.conflicts.join(', ')})` : ''}`,
    );
  }
  if (values.apply) {
    const check = await migrateToUsers(db, values.uid, false);
    const complete = check.every(r => r.copied === 0 && r.conflicts.length === 0 && r.alreadyThere === r.source);
    console.warn(complete ? 'Check: every source document has an identical copy.' : 'Check FAILED: run again or inspect the conflicts.');
    if (!complete) process.exit(1);
  }
  if (reports.some(r => r.conflicts.length > 0)) process.exit(1);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('migrate-to-users failed:', error);
    process.exit(1);
  });
}
