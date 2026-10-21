import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { migrateToUsers } from '../../scripts/migrate-to-users.js';
import { deleteRootCollections, readRootCollections } from '../../scripts/remove-root-collections.js';

const PROJECT_ID = 'demo-training-tracker';
const UID = 'owner-uid';
const workout = { type: 'Trening A', date: '2026-10-07T10:00:00.000Z', exercises: [], notes: '', completed: true };
const measurement = { date: '2026-10-07', weight: 82.5, waist: 90 };
const weekPlan = { plan: { monday: 'ABC-A' }, updatedAt: '2026-10-07T10:00:00.000Z' };

let app: App;
let db: Firestore;

const ids = async (path: string) => (await db.collection(path).get()).docs.map(d => d.id).sort();

beforeAll(() => {
  app = initializeApp({ projectId: PROJECT_ID }, 'remove-root-test');
  db = getFirestore(app);
});

afterAll(() => deleteApp(app));

beforeEach(async () => {
  for (const name of ['workouts', 'measurements', 'weekPlans', 'users']) {
    await db.recursiveDelete(db.collection(name));
  }
  await db.doc('workouts/w1').set(workout);
  await db.doc('workouts/w2').set({ ...workout, type: 'Trening B' });
  await db.doc('measurements/m1').set(measurement);
  await db.doc('weekPlans/default_week_plan').set(weekPlan);
});

describe('removeRootCollections', () => {
  it('reads every root document with its id for the backup', async () => {
    expect(await readRootCollections(db)).toEqual({
      workouts: { w1: workout, w2: { ...workout, type: 'Trening B' } },
      measurements: { m1: measurement },
      weekPlans: { default_week_plan: weekPlan },
    });
  });

  it('deletes the root collections and keeps the copies in users/{uid}', async () => {
    await migrateToUsers(db, UID, true);
    await deleteRootCollections(db, UID);
    expect([await ids('workouts'), await ids('measurements'), await ids('weekPlans')]).toEqual([[], [], []]);
    expect(await ids(`users/${UID}/sessions`)).toEqual(['w1', 'w2']);
    expect((await db.doc(`users/${UID}/measurements/m1`).get()).data()).toEqual(measurement);
  });

  it.each([
    ['a document has no copy', async () => db.doc('workouts/w3').set(workout)],
    ['a copy differs from the root document', async () => db.doc(`users/${UID}/measurements/m1`).set({ ...measurement, weight: 80 })],
  ])('deletes nothing when %s', async (_, change) => {
    await migrateToUsers(db, UID, true);
    await change();
    await expect(deleteRootCollections(db, UID)).rejects.toThrow(/no identical copy/);
    expect(await ids('workouts')).not.toEqual([]);
    expect(await ids('measurements')).toEqual(['m1']);
  });
});
