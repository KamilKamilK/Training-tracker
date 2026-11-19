import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { readAccess } from '../../api/exercise-videos.js';

// readAccess in the Vercel function grants what isOwner() and isAdmin() in firestore.rules grant,
// and nothing for a profile it cannot read; here it reads real documents from the Firestore emulator.

let app: App;
let db: Firestore;

const profile = (accepted: boolean, roles?: unknown) => ({
  displayName: 'Anna',
  consents: { health: { accepted, version: '2026-10-10', at: Timestamp.fromDate(new Date('2026-10-10T08:00:00Z')) } },
  ...(roles === undefined ? {} : { roles }),
});

const seed = async (uid: string, { owner, user }: { owner: boolean; user?: object }) => {
  if (owner) await db.doc(`owners/${uid}`).set({});
  if (user) await db.doc(`users/${uid}`).set(user);
};

beforeAll(() => {
  app = initializeApp({ projectId: 'demo-training-tracker' }, 'exercise-videos-access');
  db = getFirestore(app);
});

afterAll(async () => {
  await db.recursiveDelete(db.collection('owners'));
  await db.recursiveDelete(db.collection('users'));
  await deleteApp(app);
});

describe('readAccess', () => {
  it.each([
    ['an admin', 'access-admin', { owner: true, user: profile(true, ['admin']) }, { active: true, admin: true }],
    ['an active account', 'access-active', { owner: true, user: profile(true) }, { active: true, admin: false }],
    ['an account with other roles', 'access-coach', { owner: true, user: profile(true, ['coach']) }, { active: true, admin: false }],
    ['an admin without the consent', 'access-no-consent', { owner: true, user: profile(false, ['admin']) }, { active: false, admin: false }],
    ['an admin outside owners', 'access-not-owner', { owner: false, user: profile(true, ['admin']) }, { active: false, admin: false }],
    ['an owner without a profile', 'access-no-profile', { owner: true }, { active: false, admin: false }],
    ['a profile with malformed roles', 'access-bad-roles', { owner: true, user: profile(true, 'admin') }, { active: false, admin: false }],
  ])('grants %s the expected access', async (_, uid, state, expected) => {
    await seed(uid, state);
    expect(await readAccess(db, uid)).toEqual(expected);
  });
});
