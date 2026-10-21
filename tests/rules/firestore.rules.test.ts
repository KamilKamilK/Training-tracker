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
  serverTimestamp,
  setDoc,
  setLogLevel,
  Timestamp,
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

const consent = (accepted: boolean, at: unknown = serverTimestamp()) => ({ accepted, version: '2026-10-10', at });
const profile = (accepted = true, at: unknown = serverTimestamp()) => ({ displayName: 'Anna', consents: { health: consent(accepted, at) } });
const storedProfile = (accepted: boolean) => profile(accepted, Timestamp.fromDate(new Date('2026-10-10T08:00:00Z')));

const template = {
  name: 'Push A',
  description: '',
  exercises: ['Przysiad'],
  category: 'strength',
  estimatedDuration: 45,
  difficulty: 'beginner',
  color: 'bg-blue-600',
  icon: '💪',
  isCustom: true,
  createdAt: '2026-10-11T08:00:00.000Z',
};

// Second active account, to check that two accounts never see each other's data.
const OTHER_OWNER = 'other-owner-uid';

const SESSIONS = `users/${OWNER}/sessions`;
const MEASUREMENTS = `users/${OWNER}/measurements`;
const WEEK_PLAN = `users/${OWNER}/weekPlans/default_week_plan`;
const ROOT_COLLECTIONS = ['workouts', 'measurements', 'weekPlans'];

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
    await setDoc(doc(db, 'users', OWNER), storedProfile(true));
    await setDoc(doc(db, 'owners', OTHER_OWNER), {});
    await setDoc(doc(db, 'users', OTHER_OWNER), storedProfile(true));
    for (const uid of [OWNER, OTHER_OWNER]) {
      await setDoc(doc(db, 'users', uid, 'sessions', 'w1'), workout);
      await setDoc(doc(db, 'users', uid, 'measurements', 'm1'), measurement);
      await setDoc(doc(db, 'users', uid, 'weekPlans', 'default_week_plan'), weekPlan);
      await setDoc(doc(db, 'users', uid, 'templates', 't1'), template);
    }
    await setDoc(doc(db, 'workouts', 'w1'), workout);
    await setDoc(doc(db, 'measurements', 'm1'), measurement);
    await setDoc(doc(db, 'weekPlans', 'default_week_plan'), weekPlan);
  });
});

describe('access', () => {
  it.each([
    ['anonymous', anonymousDb],
    ['signed-in stranger', strangerDb],
  ])('denies a %s any access to data', async (_, database) => {
    const db = database();
    await assertFails(getDocs(collection(db, SESSIONS)));
    await assertFails(getDoc(doc(db, MEASUREMENTS, 'm1')));
    await assertFails(getDoc(doc(db, WEEK_PLAN)));
    await assertFails(addDoc(collection(db, SESSIONS), workout));
    await assertFails(addDoc(collection(db, MEASUREMENTS), measurement));
    await assertFails(setDoc(doc(db, WEEK_PLAN), weekPlan));
    await assertFails(deleteDoc(doc(db, SESSIONS, 'w1')));
  });

  it('lets a user read only their own owner document and never write it', async () => {
    await assertSucceeds(getDoc(doc(strangerDb(), 'owners', STRANGER)));
    await assertFails(getDoc(doc(strangerDb(), 'owners', OWNER)));
    await assertFails(setDoc(doc(strangerDb(), 'owners', STRANGER), {}));
    await assertFails(getDocs(collection(ownerDb(), 'owners')));
  });

  it('denies the owner account until its e-mail address is verified', async () => {
    const db = unverifiedOwnerDb();
    await assertFails(getDocs(collection(db, SESSIONS)));
    await assertFails(getDoc(doc(db, MEASUREMENTS, 'm1')));
    await assertFails(addDoc(collection(db, SESSIONS), workout));
    await assertFails(setDoc(doc(db, WEEK_PLAN), weekPlan));
  });

  it.each([
    ['without a profile', null],
    ['after withdrawing the health consent', storedProfile(false)],
  ])('denies the owner account %s', async (_, ownerProfile) => {
    await env.withSecurityRulesDisabled(async context => {
      const ref = doc(context.firestore(), 'users', OWNER);
      await (ownerProfile ? setDoc(ref, ownerProfile) : deleteDoc(ref));
    });
    const db = ownerDb();
    await assertFails(getDocs(collection(db, SESSIONS)));
    await assertFails(getDoc(doc(db, MEASUREMENTS, 'm1')));
    await assertFails(addDoc(collection(db, SESSIONS), workout));
    await assertFails(setDoc(doc(db, WEEK_PLAN), weekPlan));
  });

  it('denies collections without rules', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'other', 'x'), { a: 1 }));
  });

  it('denies even the owner the collections in the database root from before users/{uid}', async () => {
    const db = ownerDb();
    for (const name of ROOT_COLLECTIONS) {
      await assertFails(getDocs(collection(db, name)));
    }
    await assertFails(getDoc(doc(db, 'workouts', 'w1')));
    await assertFails(addDoc(collection(db, 'workouts'), workout));
    await assertFails(addDoc(collection(db, 'measurements'), measurement));
    await assertFails(setDoc(doc(db, 'weekPlans', 'default_week_plan'), weekPlan));
    await assertFails(deleteDoc(doc(db, 'workouts', 'w1')));
    await assertFails(deleteDoc(doc(db, 'measurements', 'm1')));
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
    await assertFails(addDoc(collection(ownerDb(), SESSIONS), clean));
  });

  it('validates the merged document on update', async () => {
    await assertSucceeds(updateDoc(doc(ownerDb(), SESSIONS, 'w1'), { notes: 'ok' }));
    await assertFails(updateDoc(doc(ownerDb(), SESSIONS, 'w1'), { notes: 5 }));
  });
});

describe('measurement validation', () => {
  it('accepts the range boundaries', async () => {
    await assertSucceeds(addDoc(collection(ownerDb(), MEASUREMENTS), { date: '2026-10-07', weight: 30, waist: 200 }));
    await assertSucceeds(addDoc(collection(ownerDb(), MEASUREMENTS), { date: '2026-10-07', weight: 300, waist: 50 }));
  });

  it.each([
    ['weight below range', { ...measurement, weight: 29.9 }],
    ['waist above range', { ...measurement, waist: 200.1 }],
    ['weight as text', { ...measurement, weight: '82' }],
    ['date in another format', { ...measurement, date: '07.10.2026' }],
    ['unknown field', { ...measurement, note: 'x' }],
  ])('rejects %s', async (_, data) => {
    await assertFails(addDoc(collection(ownerDb(), MEASUREMENTS), data));
  });
});

describe('week plan validation', () => {
  it.each([
    ['unknown day', { ...weekPlan, plan: { ...weekPlan.plan, holiday: 'ABC-A' } }],
    ['template id not a string', { ...weekPlan, plan: { ...weekPlan.plan, monday: 1 } }],
    ['missing updatedAt', { plan: weekPlan.plan }],
  ])('rejects %s', async (_, data) => {
    await assertFails(setDoc(doc(ownerDb(), WEEK_PLAN), data));
  });

  it('cannot be deleted', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), WEEK_PLAN)));
  });
});

describe('user profile', () => {
  const ownProfile = (db = strangerDb()) => doc(db, 'users', STRANGER);

  it('lets a verified account create, read and rename its own profile', async () => {
    await assertSucceeds(setDoc(ownProfile(), profile()));
    await assertSucceeds(getDoc(ownProfile()));
    await assertSucceeds(updateDoc(ownProfile(), { displayName: 'Anna Nowak' }));
  });

  it('records a withdrawal only with the server time', async () => {
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users', STRANGER), storedProfile(true)));
    await assertFails(updateDoc(ownProfile(), { 'consents.health.accepted': false }));
    await assertSucceeds(updateDoc(ownProfile(), { 'consents.health': consent(false) }));
  });

  it('denies another account, an unverified account and anonymous access', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'users', STRANGER), profile()));
    await assertFails(getDoc(doc(strangerDb(), 'users', OWNER)));
    await assertFails(setDoc(doc(env.authenticatedContext(STRANGER, { email_verified: false }).firestore(), 'users', STRANGER), profile()));
    await assertFails(getDoc(doc(anonymousDb(), 'users', OWNER)));
    await assertFails(getDocs(collection(ownerDb(), 'users')));
  });

  it('cannot be deleted from the app', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), 'users', OWNER)));
  });

  it.each([
    ['a client-chosen consent time', profile(true, Timestamp.fromDate(new Date('2020-01-01T00:00:00Z')))],
    ['an empty name', { ...profile(), displayName: '' }],
    ['a name over 60 characters', { ...profile(), displayName: 'a'.repeat(61) }],
    ['an unknown field', { ...profile(), ownerId: STRANGER }],
    ['an unknown consent', { ...profile(), consents: { health: consent(true), marketing: consent(true) } }],
    ['consent accepted as text', { ...profile(), consents: { health: { ...consent(true), accepted: 'yes' } } }],
    ['a missing consent version', { ...profile(), consents: { health: { accepted: true, at: serverTimestamp() } } }],
  ])('rejects a profile with %s', async (_, data) => {
    await assertFails(setDoc(ownProfile(), data));
  });
});

describe('per-user journal', () => {
  const own = (db = ownerDb()) => (path: string, ...segments: string[]) => doc(db, 'users', OWNER, path, ...segments);

  it('lets an active account read and write its own sessions, measurements, plan and templates', async () => {
    const db = ownerDb();
    for (const name of ['sessions', 'measurements', 'templates']) {
      await assertSucceeds(getDocs(collection(db, 'users', OWNER, name)));
    }
    await assertSucceeds(getDoc(own()('weekPlans', 'default_week_plan')));
    await assertSucceeds(setDoc(own()('sessions', 'w2'), workout));
    await assertSucceeds(setDoc(own()('measurements', 'm2'), measurement));
    await assertSucceeds(setDoc(own()('weekPlans', 'default_week_plan'), weekPlan));
    await assertSucceeds(setDoc(own()('templates', 't2'), template));
    await assertSucceeds(deleteDoc(own()('sessions', 'w1')));
    await assertSucceeds(deleteDoc(own()('templates', 't1')));
  });

  it('keeps two active accounts out of each other\'s data', async () => {
    const other = env.authenticatedContext(OTHER_OWNER, VERIFIED).firestore();
    for (const name of ['sessions', 'measurements', 'templates']) {
      await assertFails(getDocs(collection(other, 'users', OWNER, name)));
    }
    await assertFails(getDoc(own(other)('weekPlans', 'default_week_plan')));
    await assertFails(setDoc(own(other)('sessions', 'w2'), workout));
    await assertFails(setDoc(own(other)('templates', 't2'), template));
    await assertFails(deleteDoc(own(other)('measurements', 'm1')));
  });

  it('denies an account outside owners its own journal', async () => {
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users', STRANGER), storedProfile(true)));
    await assertFails(setDoc(doc(strangerDb(), 'users', STRANGER, 'sessions', 'w1'), workout));
  });

  it('denies the journal without the accepted consent or a verified e-mail', async () => {
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users', OWNER), storedProfile(false)));
    await assertFails(getDocs(collection(ownerDb(), 'users', OWNER, 'sessions')));
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users', OWNER), storedProfile(true)));
    await assertFails(getDocs(collection(unverifiedOwnerDb(), 'users', OWNER, 'sessions')));
  });

  it('denies subcollections without rules', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'users', OWNER, 'other', 'x'), { a: 1 }));
  });

  it.each([
    ['a name shorter than 3 characters', { ...template, name: 'AB' }],
    ['no exercises', { ...template, exercises: [] }],
    ['more than 20 exercises', { ...template, exercises: Array(21).fill('Przysiad') }],
    ['an unknown category', { ...template, category: 'yoga' }],
    ['a duration over 600 minutes', { ...template, estimatedDuration: 601 }],
    ['a description over 1000 characters', { ...template, description: 'a'.repeat(1001) }],
    ['an unknown field', { ...template, ownerId: OWNER }],
  ])('rejects a template with %s', async (_, data) => {
    await assertFails(setDoc(own()('templates', 't2'), data));
  });
});

describe('roles', () => {
  it('lets only the administrator set roles: the owner can neither add nor change them', async () => {
    await assertFails(setDoc(doc(strangerDb(), 'users', STRANGER), { ...profile(), roles: ['coach'] }));
    await assertFails(updateDoc(doc(ownerDb(), 'users', OWNER), { roles: ['admin'] }));

    await env.withSecurityRulesDisabled(context =>
      setDoc(doc(context.firestore(), 'users', OWNER), { ...storedProfile(true), roles: ['coach'] }),
    );
    await assertSucceeds(updateDoc(doc(ownerDb(), 'users', OWNER), { displayName: 'Trener Anna' }));
    await assertFails(updateDoc(doc(ownerDb(), 'users', OWNER), { roles: ['coach', 'admin'] }));
    // Accepting the consent again (as ProfileService.activate does) keeps the roles.
    await assertSucceeds(setDoc(doc(ownerDb(), 'users', OWNER), profile(), { merge: true }));
    await assertFails(setDoc(doc(ownerDb(), 'users', OWNER), profile()));
  });
});
