// Deletes the owner's collections from before the per-user model (`workouts`, `measurements`,
// `weekPlans` in the database root). It deletes only when every root document has an identical
// copy in users/{uid}/… (the check of migrate-to-users.ts) and only after the documents are saved
// to a JSON backup file. Dry run by default; `--apply` writes the backup and deletes.
//
// Usage (credentials: `gcloud auth application-default login` or GOOGLE_APPLICATION_CREDENTIALS):
//   node scripts/remove-root-collections.ts --project training-tracker-6d13b --uid <owner uid> [--apply --backup <file>]
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import { MOVES, migrateToUsers, type MoveReport } from './migrate-to-users.ts';

/** Root collection → document id → document data. */
export type RootBackup = Record<string, Record<string, DocumentData>>;

export const readRootCollections = async (db: Firestore): Promise<RootBackup> => {
  const backup: RootBackup = {};
  for (const { from } of MOVES) {
    const snapshot = await db.collection(from).get();
    backup[from] = Object.fromEntries(snapshot.docs.map(document => [document.id, document.data()]));
  }
  return backup;
};

/** Reports of the collections whose documents do not all have an identical copy in users/{uid}/…. */
export const findIncompleteCopies = async (db: Firestore, uid: string): Promise<MoveReport[]> =>
  (await migrateToUsers(db, uid, false)).filter(r => r.copied > 0 || r.conflicts.length > 0);

/** Deletes the root collections; throws without deleting anything when a copy is missing. */
export const deleteRootCollections = async (db: Firestore, uid: string): Promise<void> => {
  const incomplete = await findIncompleteCopies(db, uid);
  if (incomplete.length > 0) {
    throw new Error(`no identical copy in users/${uid} for: ${incomplete.map(r => r.from).join(', ')}`);
  }
  for (const { from } of MOVES) {
    await db.recursiveDelete(db.collection(from));
  }
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      project: { type: 'string' },
      uid: { type: 'string' },
      apply: { type: 'boolean', default: false },
      backup: { type: 'string' },
    },
  });
  if (!values.project || !values.uid || (values.apply && !values.backup)) {
    console.error('Usage: node scripts/remove-root-collections.ts --project <project id> --uid <owner uid> [--apply --backup <file>]');
    process.exit(2);
  }
  const db = getFirestore(initializeApp({ projectId: values.project }));
  const target = process.env.FIRESTORE_EMULATOR_HOST ? `emulator ${process.env.FIRESTORE_EMULATOR_HOST}` : 'PRODUCTION';
  console.warn(`${values.apply ? 'APPLY' : 'DRY RUN'} — project ${values.project} (${target}), users/${values.uid}`);

  const backup = await readRootCollections(db);
  for (const [name, documents] of Object.entries(backup)) {
    console.warn(`${name}: ${Object.keys(documents).length} documents`);
  }
  const incomplete = await findIncompleteCopies(db, values.uid);
  for (const r of incomplete) {
    console.warn(
      `${r.from}: ${r.copied} without a copy, ${r.conflicts.length} different from the copy` +
        `${r.conflicts.length ? ` (${r.conflicts.join(', ')})` : ''} — run migrate-to-users.ts or inspect the conflicts`,
    );
  }
  if (incomplete.length > 0) process.exit(1);
  console.warn('Check: every root document has an identical copy.');
  if (!values.apply || !values.backup) return;

  // 'wx' refuses to overwrite an earlier backup.
  await writeFile(values.backup, JSON.stringify(backup, null, 2), { flag: 'wx' });
  console.warn(`Backup written to ${values.backup}`);
  await deleteRootCollections(db, values.uid);
  const left = Object.values(await readRootCollections(db)).reduce((sum, documents) => sum + Object.keys(documents).length, 0);
  console.warn(left === 0 ? 'Check: the root collections are empty.' : `Check FAILED: ${left} documents left.`);
  if (left > 0) process.exit(1);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('remove-root-collections failed:', error);
    process.exit(1);
  });
}
