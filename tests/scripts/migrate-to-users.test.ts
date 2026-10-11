import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { migrateToUsers } from '../../scripts/migrate-to-users.js';

const PROJECT_ID = 'demo-training-tracker';
const UID = 'owner-uid';
const workout = { type: 'Trening A', date: '2026-10-07T10:00:00.000Z', exercises: [], notes: '', completed: true };
const measurement = { date: '2026-10-07', weight: 82.5, waist: 90 };
const weekPlan = { plan: { monday: 'ABC-A' }, updatedAt: '2026-10-07T10:00:00.000Z' };

let app: App;
let db: Firestore;

const ids = async (path: string) => (await db.collection(path).get()).docs.map(d => d.id).sort();

beforeAll(() => {
  app = initializeApp({ projectId: PROJECT_ID }, 'migration-test');
  db = getFirestore(app);
});

afterAll(() => deleteApp(app));

beforeEach(async () => {
  await db.recursiveDelete(db.collection('workouts'));
  await db.recursiveDelete(db.collection('measurements'));
  await db.recursiveDelete(db.collection('weekPlans'));
  await db.recursiveDelete(db.collection('users'));
  await db.doc('workouts/w1').set(workout);
  await db.doc('workouts/w2').set({ ...workout, type: 'Trening B' });
  await db.doc('measurements/m1').set(measurement);
  await db.doc('weekPlans/default_week_plan').set(weekPlan);
});

describe('migrateToUsers', () => {
  it('reports without writing in a dry run', async () => {
    const reports = await migrateToUsers(db, UID, false);
    expect(reports.map(r => [r.from, r.source, r.copied])).toEqual([
      ['workouts', 2, 2],
      ['measurements', 1, 1],
      ['weekPlans', 1, 1],
    ]);
    expect(await ids(`users/${UID}/sessions`)).toEqual([]);
  });

  it('copies every document with its id and contents and leaves the source intact', async () => {
    await migrateToUsers(db, UID, true);
    expect(await ids(`users/${UID}/sessions`)).toEqual(['w1', 'w2']);
    expect((await db.doc(`users/${UID}/sessions/w2`).get()).data()).toEqual({ ...workout, type: 'Trening B' });
    expect((await db.doc(`users/${UID}/measurements/m1`).get()).data()).toEqual(measurement);
    expect((await db.doc(`users/${UID}/weekPlans/default_week_plan`).get()).data()).toEqual(weekPlan);
    expect(await ids('workouts')).toEqual(['w1', 'w2']);
  });

  it('copies only what is missing when run again and never overwrites a different copy', async () => {
    await migrateToUsers(db, UID, true);
    await db.doc('workouts/w3').set(workout);
    await db.doc(`users/${UID}/measurements/m1`).set({ ...measurement, weight: 80 });

    const [sessions, measurements] = await migrateToUsers(db, UID, true);
    expect([sessions.copied, sessions.alreadyThere]).toEqual([1, 2]);
    expect(measurements.conflicts).toEqual(['m1']);
    expect((await db.doc(`users/${UID}/measurements/m1`).get()).data()?.weight).toBe(80);
  });
});
