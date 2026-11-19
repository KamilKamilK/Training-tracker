import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHandler, POST, type Access, type Dependencies } from '../../api/exercise-videos.js';

const MEDIA_ID = '0b5c4b8e-6a51-4c1f-9d2e-8f3a1c7e2b40';
const ACCOUNTS: Record<string, { emailVerified: boolean; access: Access }> = {
  'admin-token': { emailVerified: true, access: { active: true, admin: true } },
  'owner-token': { emailVerified: true, access: { active: true, admin: false } },
  'inactive-token': { emailVerified: true, access: { active: false, admin: false } },
  'unverified-token': { emailVerified: false, access: { active: true, admin: true } },
};

let storage: Dependencies['storage'];
let readAccess: Dependencies['readAccess'];

const handle = (body: unknown, token?: string) =>
  createHandler({
    verifyIdToken: async value => {
      const account = ACCOUNTS[value];
      if (!account) throw new Error('invalid token');
      return { uid: value.replace('-token', ''), emailVerified: account.emailVerified };
    },
    readAccess,
    storage,
  })(
    new Request('http://localhost/api/exercise-videos', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  readAccess = vi.fn(async (uid: string) => ACCOUNTS[`${uid}-token`].access);
  storage = {
    createUploadUrl: vi.fn(async path => `https://storage.test/upload/${path}?token=t`),
    createViewUrl: vi.fn(async path => `https://storage.test/view/${path}?token=t`),
    remove: vi.fn(async () => undefined),
  };
});

describe('exercise-videos function', () => {
  it('rejects a request without a valid token', async () => {
    expect((await handle({ action: 'view', mediaId: MEDIA_ID })).status).toBe(401);
    expect((await handle({ action: 'view', mediaId: MEDIA_ID }, 'forged-token')).status).toBe(401);
    expect(readAccess).not.toHaveBeenCalled();
  });

  it('rejects an account whose e-mail is not verified, even with the admin role', async () => {
    expect((await handle({ action: 'upload', mediaId: MEDIA_ID }, 'unverified-token')).status).toBe(403);
    expect(storage.createUploadUrl).not.toHaveBeenCalled();
  });

  it.each([
    ['an unknown action', { action: 'list', mediaId: MEDIA_ID }],
    ['a path instead of a media id', { action: 'view', mediaId: '../other.mp4' }],
    ['a body that is not JSON', 'not json'],
  ])('rejects %s', async (_, body) => {
    const response = await handle(body, 'admin-token');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid-request' });
  });

  it('gives an active account a short-lived link to watch a video', async () => {
    const response = await handle({ action: 'view', mediaId: MEDIA_ID }, 'owner-token');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: `https://storage.test/view/${MEDIA_ID}.mp4?token=t` });
    expect(storage.createViewUrl).toHaveBeenCalledWith(`${MEDIA_ID}.mp4`, 300);
  });

  it('refuses an inactive account any link', async () => {
    expect((await handle({ action: 'view', mediaId: MEDIA_ID }, 'inactive-token')).status).toBe(403);
    expect(storage.createViewUrl).not.toHaveBeenCalled();
  });

  it.each(['upload', 'delete'])('allows %s only with the admin role', async action => {
    expect((await handle({ action, mediaId: MEDIA_ID }, 'owner-token')).status).toBe(403);
    expect(storage.createUploadUrl).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('gives the admin an upload link for the media id', async () => {
    const response = await handle({ action: 'upload', mediaId: MEDIA_ID }, 'admin-token');
    expect(await response.json()).toEqual({ url: `https://storage.test/upload/${MEDIA_ID}.mp4?token=t` });
  });

  it('lets the admin delete a file', async () => {
    expect((await handle({ action: 'delete', mediaId: MEDIA_ID }, 'admin-token')).status).toBe(204);
    expect(storage.remove).toHaveBeenCalledWith(`${MEDIA_ID}.mp4`);
  });

  it('answers a storage failure with a code, without the details of the error', async () => {
    vi.mocked(storage.createViewUrl).mockRejectedValue(new Error('bucket exercise-videos not found'));
    const response = await handle({ action: 'view', mediaId: MEDIA_ID }, 'owner-token');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'internal' });
  });

  it('reports a malformed service account key without quoting it', () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '{"private_key": MIIEsecret}');
    try {
      const request = new Request('http://localhost/api/exercise-videos', { method: 'POST', body: '{}' });
      expect(() => POST(request)).toThrow(new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON'));
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
