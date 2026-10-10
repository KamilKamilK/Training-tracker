import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  setLogLevel,
  updateDoc,
} from 'firebase/firestore';

const OWNER = 'owner-uid';
const STRANGER = 'stranger-uid';

const workout = {
  type: 'Trening A',
  date: '2026-10-07T10:00:00.000Z',
  exercises: [{ name: 'Przysiad', sets: [{ weight: '80', reps: '8', rir: '2' }] }],
  notes: '',
  completed: true,
};
const measurement = { date: '2026-10-07', weight: 82.5, waist: 90 };
const weekPlan = {
  plan: { monday: 'ABC-A', tuesday: null, wednesday: null, thursday: null, friday: null, saturday: null, sunday: null },
  updatedAt: '2026-10-07T10:00:00.000Z',
};

let env: RulesTestEnvironment;

const VERIFIED = { email_verified: true };

const ownerDb = () => env.authenticatedContext(OWNER, VERIFIED).firestore();
const unverifiedOwnerDb = () => env.authenticatedContext(OWNER, { email_verified: false }).firestore();
const strangerDb = () => env.authenticatedContext(STRANGER, VERIFIED).firestore();
const anonymousDb = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  // Denied requests are the expected outcome of most tests; keep the SDK from logging each one.
  setLogLevel('silent');
  env = await initializeTestEnvironment({
    projectId: 'demo-training-tracker',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'owners', OWNER), {});
    await setDoc(doc(db, 'workouts', 'w1'), workout);
    await setDoc(doc(db, 'measurements', 'm1'), measurement);
    await setDoc(doc(db, 'weekPlans', 'default_week_plan'), weekPlan);
  });
});

describe('access', () => {
  it('lets the owner read and write every collection', async () => {
    const db = ownerDb();
    await assertSucceeds(getDocs(collection(db, 'workouts')));
    await assertSucceeds(getDocs(collection(db, 'measurements')));
    await assertSucceeds(getDoc(doc(db, 'weekPlans', 'default_week_plan')));
    await assertSucceeds(addDoc(collection(db, 'workouts'), workout));
    await assertSucceeds(addDoc(collection(db, 'measurements'), measurement));
    await assertSucceeds(setDoc(doc(db, 'weekPlans', 'default_week_plan'), weekPlan));
    await assertSucceeds(deleteDoc(doc(db, 'workouts', 'w1')));
    await assertSucceeds(deleteDoc(doc(db, 'measurements', 'm1')));
  });

  it.each([
    ['anonymous', anonymousDb],
    ['signed-in stranger', strangerDb],
  ])('denies a %s any access to data', async (_, database) => {
    const db = database();
    await assertFails(getDocs(collection(db, 'workouts')));
    await assertFails(getDoc(doc(db, 'measurements', 'm1')));
    await assertFails(getDoc(doc(db, 'weekPlans', 'default_week_plan')));
    await assertFails(addDoc(collection(db, 'workouts'), workout));
    await assertFails(addDoc(collection(db, 'measurements'), measurement));
    await assertFails(setDoc(doc(db, 'weekPlans', 'default_week_plan'), weekPlan));
    await assertFails(deleteDoc(doc(db, 'workouts', 'w1')));
  });

  it('lets a user read only their own owner document and never write it', async () => {
    await assertSucceeds(getDoc(doc(strangerDb(), 'owners', STRANGER)));
    await assertFails(getDoc(doc(strangerDb(), 'owners', OWNER)));
    await assertFails(setDoc(doc(strangerDb(), 'owners', STRANGER), {}));
    await assertFails(getDocs(collection(ownerDb(), 'owners')));
  });

  it('denies the owner account until its e-mail address is verified', async () => {
    const db = unverifiedOwnerDb();
    await assertFails(getDocs(collection(db, 'workouts')));
    await assertFails(getDoc(doc(db, 'measurements', 'm1')));
    await assertFails(addDoc(collection(db, 'workouts'), workout));
    await assertFails(setDoc(doc(db, 'weekPlans', 'default_week_plan'), weekPlan));
  });

  it('denies collections without rules', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'other', 'x'), { a: 1 }));
  });
});

describe('workout validation', () => {
  it.each([
    ['missing type', { ...workout, type: undefined }],
    ['empty type', { ...workout, type: '' }],
    ['exercises not a list', { ...workout, exercises: 'Przysiad' }],
    ['unknown field', { ...workout, admin: true }],
    ['completed not a boolean', { ...workout, completed: 'yes' }],
  ])('rejects %s', async (_, data) => {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    await assertFails(addDoc(collection(ownerDb(), 'workouts'), clean));
  });

  it('validates the merged document on update', async () => {
    await assertSucceeds(updateDoc(doc(ownerDb(), 'workouts', 'w1'), { notes: 'ok' }));
    await assertFails(updateDoc(doc(ownerDb(), 'workouts', 'w1'), { notes: 5 }));
  });
});

describe('measurement validation', () => {
  it('accepts the range boundaries', async () => {
    await assertSucceeds(addDoc(collection(ownerDb(), 'measurements'), { date: '2026-10-07', weight: 30, waist: 200 }));
    await assertSucceeds(addDoc(collection(ownerDb(), 'measurements'), { date: '2026-10-07', weight: 300, waist: 50 }));
  });

  it.each([
    ['weight below range', { ...measurement, weight: 29.9 }],
    ['waist above range', { ...measurement, waist: 200.1 }],
    ['weight as text', { ...measurement, weight: '82' }],
    ['date in another format', { ...measurement, date: '07.10.2026' }],
    ['unknown field', { ...measurement, note: 'x' }],
  ])('rejects %s', async (_, data) => {
    await assertFails(addDoc(collection(ownerDb(), 'measurements'), data));
  });
});

describe('week plan validation', () => {
  it.each([
    ['unknown day', { ...weekPlan, plan: { ...weekPlan.plan, holiday: 'ABC-A' } }],
    ['template id not a string', { ...weekPlan, plan: { ...weekPlan.plan, monday: 1 } }],
    ['missing updatedAt', { plan: weekPlan.plan }],
  ])('rejects %s', async (_, data) => {
    await assertFails(setDoc(doc(ownerDb(), 'weekPlans', 'default_week_plan'), data));
  });

  it('cannot be deleted', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), 'weekPlans', 'default_week_plan')));
  });
});
