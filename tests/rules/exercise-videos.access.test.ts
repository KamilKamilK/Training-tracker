import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { consumeQuota, RATE_LIMIT, readAccess, readMediaIds } from '../../api/exercise-videos.js';

// readAccess in the Vercel function grants what isOwner() and isAdmin() in firestore.rules grant,
// and nothing for a profile it cannot read; here it reads real documents from the Firestore emulator,
// as do the call limit and the list of media ids the cleanup keeps.

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
  await db.recursiveDelete(db.collection('apiRateLimits'));
  await db.recursiveDelete(db.collection('exerciseVideos'));
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

describe('consumeQuota', () => {
  const start = Date.parse('2026-11-19T10:00:00Z');

  it('allows the limit within a window, then refuses until the window ends', async () => {
    const uid = 'quota-limit';
    for (let call = 0; call < RATE_LIMIT.calls; call++) {
      expect(await consumeQuota(db, uid, start + call * 1000)).toEqual({ allowed: true });
    }
    expect(await consumeQuota(db, uid, start + RATE_LIMIT.windowMs - 30_500)).toEqual({ allowed: false, retryAfterSeconds: 31 });
    expect((await db.doc(`apiRateLimits/${uid}`).get()).data()?.count).toBe(RATE_LIMIT.calls);

    expect(await consumeQuota(db, uid, start + RATE_LIMIT.windowMs)).toEqual({ allowed: true });
    expect((await db.doc(`apiRateLimits/${uid}`).get()).data()).toEqual({
      windowStart: Timestamp.fromMillis(start + RATE_LIMIT.windowMs),
      count: 1,
    });
  });

  it('lets concurrent calls through only up to the limit', async () => {
    const uid = 'quota-concurrent';
    await db.doc(`apiRateLimits/${uid}`).set({ windowStart: Timestamp.fromMillis(start), count: RATE_LIMIT.calls - 2 });
    const results = await Promise.all(Array.from({ length: 5 }, () => consumeQuota(db, uid, start + 1000)));
    expect(results.filter(result => result.allowed)).toHaveLength(2);
    expect((await db.doc(`apiRateLimits/${uid}`).get()).data()?.count).toBe(RATE_LIMIT.calls);
  });

  it('keeps separate limits for separate accounts', async () => {
    await db.doc('apiRateLimits/quota-full').set({ windowStart: Timestamp.fromMillis(start), count: RATE_LIMIT.calls });
    expect((await consumeQuota(db, 'quota-full', start + 1000)).allowed).toBe(false);
    expect((await consumeQuota(db, 'quota-other', start + 1000)).allowed).toBe(true);
  });

  it('starts a new window over a malformed counter', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await db.doc('apiRateLimits/quota-malformed').set({ windowStart: 'yesterday', count: 999 });
    expect(await consumeQuota(db, 'quota-malformed', start)).toEqual({ allowed: true });
    expect((await db.doc('apiRateLimits/quota-malformed').get()).data()?.count).toBe(1);
  });
});

describe('readMediaIds', () => {
  const video = (mediaId: unknown) => ({
    exerciseName: 'Przysiad',
    mediaId,
    sizeBytes: 1000,
    durationSec: 12,
    uploadedAt: '2026-11-19T10:00:00.000Z',
  });

  it('returns the media ids of all video documents and refuses a document without a valid one', async () => {
    await db.doc('exerciseVideos/a').set(video('0f8c2d5e-3b1a-4c7d-9e2f-1a2b3c4d5e6f'));
    await db.doc('exerciseVideos/b').set(video('1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'));
    expect(await readMediaIds(db)).toEqual(new Set(['0f8c2d5e-3b1a-4c7d-9e2f-1a2b3c4d5e6f', '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d']));

    await db.doc('exerciseVideos/c').set(video('../other'));
    await expect(readMediaIds(db)).rejects.toThrow('exerciseVideos/c has no valid mediaId');
  });
});
