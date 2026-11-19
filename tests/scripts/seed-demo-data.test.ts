import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, setLogLevel, Timestamp } from 'firebase/firestore';
import { defaultWorkoutTemplates } from '../../src/features/templates/defaultTemplates.js';
import {
  ABC_TEMPLATES,
  DEMO_COLLECTIONS,
  buildDemoData,
  findDemoData,
  removeDemoData,
  seedDemoData,
} from '../../scripts/seed-demo-data.js';

const PROJECT_ID = 'demo-training-tracker';
const UID = 'owner-uid';
const UNTIL = new Date('2026-11-19T12:00:00Z');
const ownWorkout = { type: 'Trening A', date: '2026-10-07T10:00:00.000Z', exercises: [], notes: '', completed: true };
const ownWeekPlan = { plan: { monday: 'ABC-A' }, updatedAt: '2026-10-07T10:00:00.000Z' };

let app: App;
let db: Firestore;
let env: RulesTestEnvironment;

const data = buildDemoData(UNTIL);

beforeAll(async () => {
  setLogLevel('silent');
  app = initializeApp({ projectId: PROJECT_ID }, 'seed-demo-data-test');
  db = getFirestore(app);
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
  await deleteApp(app);
});

beforeEach(async () => {
  await env.clearFirestore();
  await db.doc(`users/${UID}/sessions/own-workout`).set(ownWorkout);
  await db.doc(`users/${UID}/weekPlans/default_week_plan`).set(ownWeekPlan);
});

describe('buildDemoData', () => {
  it('copies the names and exercises of the default ABC templates', () => {
    for (const template of Object.values(ABC_TEMPLATES)) {
      const original = defaultWorkoutTemplates.find(t => t.id === template.id);
      expect(template.name).toBe(original?.name);
      expect(template.exercises.map(e => e.name)).toEqual(original?.exercises);
    }
  });

  it('builds the same data on every run, nothing after the given date and only demo ids', () => {
    expect(buildDemoData(UNTIL)).toEqual(data);
    const dates = Object.values(data.sessions).map(s => new Date(s.date).getTime());
    expect(Math.max(...dates)).toBeLessThanOrEqual(UNTIL.getTime());
    expect(Object.keys(data.sessions).length).toBeGreaterThanOrEqual(40);
    expect(Object.keys(data.measurements)).toHaveLength(13);
    for (const name of DEMO_COLLECTIONS) {
      expect(Object.keys(data[name]).every(id => id.startsWith('demo-'))).toBe(true);
    }
  });

  it('shows progress: heavier top sets at the end and lower weight in the measurements', () => {
    const sessions = Object.values(data.sessions).filter(s => s.templateId === 'ABC-C');
    const topSet = (i: number) => Number(sessions[i].exercises[4].sets[3].weight);
    expect(topSet(sessions.length - 1)).toBeGreaterThan(topSet(0));
    const weights = Object.values(data.measurements).map(m => m.weight);
    expect(weights.at(-1)).toBeLessThan(weights[0]);
  });
});

describe('demo data in Firestore', () => {
  it('passes the security rules for the account owner, so it can be edited in the app', async () => {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'owners', UID), {});
      await setDoc(doc(context.firestore(), 'users', UID), {
        displayName: 'Anna',
        consents: { health: { accepted: true, version: '2026-10-10', at: Timestamp.now() } },
      });
    });
    const owner = env.authenticatedContext(UID, { email_verified: true }).firestore();
    for (const name of DEMO_COLLECTIONS) {
      for (const [id, document] of Object.entries(data[name])) {
        await assertSucceeds(setDoc(doc(owner, 'users', UID, name, id), document));
      }
    }
  });

  it('writes every demo document and leaves the account data and week plan intact', async () => {
    await seedDemoData(db, UID, data);
    const found = await findDemoData(db, UID);
    for (const name of DEMO_COLLECTIONS) {
      expect(found[name].sort()).toEqual(Object.keys(data[name]).sort());
    }
    const [id, session] = Object.entries(data.sessions)[0];
    expect((await db.doc(`users/${UID}/sessions/${id}`).get()).data()).toEqual(session);
    expect((await db.doc(`users/${UID}/sessions/own-workout`).get()).data()).toEqual(ownWorkout);
    expect((await db.doc(`users/${UID}/weekPlans/default_week_plan`).get()).data()).toEqual(ownWeekPlan);
  });

  it('refuses to write when demo data is already there', async () => {
    await db.doc(`users/${UID}/measurements/demo-measurement-2026-01-01`).set({ date: '2026-01-01', weight: 80, waist: 90 });
    await expect(seedDemoData(db, UID, data)).rejects.toThrow('--remove');
    expect((await findDemoData(db, UID)).sessions).toEqual([]);
  });

  it('removes only the demo documents', async () => {
    await seedDemoData(db, UID, data);
    const total = DEMO_COLLECTIONS.reduce((sum, name) => sum + Object.keys(data[name]).length, 0);
    expect(await removeDemoData(db, UID)).toBe(total);
    expect(Object.values(await findDemoData(db, UID)).flat()).toEqual([]);
    expect((await db.collection(`users/${UID}/sessions`).get()).docs.map(d => d.id)).toEqual(['own-workout']);
    expect((await db.doc(`users/${UID}/weekPlans/default_week_plan`).get()).exists).toBe(true);
  });
});
