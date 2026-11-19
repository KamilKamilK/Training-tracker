import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHandler, listFiles, POST, UNUSED_FILE_MIN_AGE_MS, type Access, type BucketEntry, type Dependencies } from '../../api/exercise-videos.js';

const MEDIA_ID = '0b5c4b8e-6a51-4c1f-9d2e-8f3a1c7e2b40';
const OTHER_MEDIA_ID = '7d1e9a42-3c5b-4f60-8a2d-6e4b1c9f0a73';
const ACCOUNTS: Record<string, { emailVerified: boolean; access: Access }> = {
  'admin-token': { emailVerified: true, access: { active: true, admin: true } },
  'owner-token': { emailVerified: true, access: { active: true, admin: false } },
  'inactive-token': { emailVerified: true, access: { active: false, admin: false } },
  'unverified-token': { emailVerified: false, access: { active: true, admin: true } },
};

let storage: Dependencies['storage'];
let readAccess: Dependencies['readAccess'];
let consumeQuota: Dependencies['consumeQuota'];
let readMediaIds: Dependencies['readMediaIds'];

const handle = (body: unknown, token?: string) =>
  createHandler({
    verifyIdToken: async value => {
      const account = ACCOUNTS[value];
      if (!account) throw new Error('invalid token');
      return { uid: value.replace('-token', ''), emailVerified: account.emailVerified };
    },
    consumeQuota,
    readAccess,
    readMediaIds,
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
  consumeQuota = vi.fn(async () => ({ allowed: true as const }));
  readMediaIds = vi.fn(async () => new Set<string>());
  storage = {
    createUploadUrl: vi.fn(async path => `https://storage.test/upload/${path}?token=t`),
    createViewUrl: vi.fn(async path => `https://storage.test/view/${path}?token=t`),
    list: vi.fn(async () => []),
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
    expect(storage.remove).toHaveBeenCalledWith([`${MEDIA_ID}.mp4`]);
  });

  it('counts every call of a verified account against its limit and answers 429 over it', async () => {
    vi.mocked(consumeQuota).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42 });
    const response = await handle({ action: 'view', mediaId: MEDIA_ID }, 'owner-token');
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('42');
    expect(await response.json()).toEqual({ error: 'rate-limited' });
    expect(consumeQuota).toHaveBeenCalledWith('owner');
    expect(readAccess).not.toHaveBeenCalled();
    expect(storage.createViewUrl).not.toHaveBeenCalled();

    expect((await handle('not json', 'owner-token')).status).toBe(400);
    expect(consumeQuota).toHaveBeenCalledTimes(2);
  });

  it('does not count a call without a valid token or a verified e-mail', async () => {
    await handle({ action: 'view', mediaId: MEDIA_ID }, 'forged-token');
    await handle({ action: 'view', mediaId: MEDIA_ID }, 'unverified-token');
    expect(consumeQuota).not.toHaveBeenCalled();
  });

  it('answers a failure of the limit check with a code', async () => {
    vi.mocked(consumeQuota).mockRejectedValueOnce(new Error('deadline exceeded'));
    const response = await handle({ action: 'view', mediaId: MEDIA_ID }, 'owner-token');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'internal' });
    expect(storage.createViewUrl).not.toHaveBeenCalled();
  });

  describe('cleanup', () => {
    const old = new Date(Date.now() - UNUSED_FILE_MIN_AGE_MS - 60_000);
    const recent = new Date(Date.now() - UNUSED_FILE_MIN_AGE_MS + 60_000);

    it('removes the old files without a document and keeps the files with one', async () => {
      const orphan = '3f9a6c1e-2b4d-4e8f-9a0b-5c7d1e3f2a64';
      vi.mocked(readMediaIds).mockResolvedValue(new Set([MEDIA_ID, OTHER_MEDIA_ID]));
      vi.mocked(storage.list).mockResolvedValue([
        { name: `${MEDIA_ID}.mp4`, createdAt: old },
        { name: `${orphan}.mp4`, createdAt: old },
        { name: `${OTHER_MEDIA_ID}.mp4`, createdAt: recent },
      ]);
      const response = await handle({ action: 'cleanup' }, 'admin-token');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ removed: 1 });
      expect(storage.remove).toHaveBeenCalledExactlyOnceWith([`${orphan}.mp4`]);
    });

    it('removes the old files the app did not create, also inside folders', async () => {
      vi.mocked(readMediaIds).mockResolvedValue(new Set([MEDIA_ID]));
      vi.mocked(storage.list).mockResolvedValue([
        { name: `${MEDIA_ID}.mp4`, createdAt: old },
        { name: 'notes.txt', createdAt: old },
        { name: 'test/.emptyFolderPlaceholder', createdAt: old },
        { name: `test/${MEDIA_ID}.mp4`, createdAt: old },
        { name: `test/nested/${OTHER_MEDIA_ID}.mp4`, createdAt: old },
      ]);
      const response = await handle({ action: 'cleanup' }, 'admin-token');
      expect(await response.json()).toEqual({ removed: 4 });
      expect(storage.remove).toHaveBeenCalledExactlyOnceWith([
        'notes.txt',
        'test/.emptyFolderPlaceholder',
        `test/${MEDIA_ID}.mp4`,
        `test/nested/${OTHER_MEDIA_ID}.mp4`,
      ]);
    });

    it('keeps every file younger than the minimum age, since it may still be uploading', async () => {
      vi.mocked(storage.list).mockResolvedValue([
        { name: `${MEDIA_ID}.mp4`, createdAt: recent },
        { name: 'test/notes.txt', createdAt: recent },
      ]);
      const response = await handle({ action: 'cleanup' }, 'admin-token');
      expect(await response.json()).toEqual({ removed: 0 });
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('is allowed only with the admin role', async () => {
      expect((await handle({ action: 'cleanup' }, 'owner-token')).status).toBe(403);
      expect(storage.list).not.toHaveBeenCalled();
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('removes nothing when the documents cannot be read', async () => {
      vi.mocked(readMediaIds).mockRejectedValue(new Error('exerciseVideos/x has no valid mediaId'));
      vi.mocked(storage.list).mockResolvedValue([{ name: `${MEDIA_ID}.mp4`, createdAt: old }]);
      const response = await handle({ action: 'cleanup' }, 'admin-token');
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'internal' });
      expect(storage.remove).not.toHaveBeenCalled();
    });
  });

  describe('listFiles', () => {
    const file = (name: string): BucketEntry => ({ name, id: `id-${name}`, created_at: '2026-11-19T10:00:00.000Z' });
    const folder = (name: string): BucketEntry => ({ name, id: null, created_at: null });

    it('lists the files of every folder with their full paths', async () => {
      const folders: Record<string, BucketEntry[]> = {
        '': [folder('test'), file('a.mp4')],
        'test/': [folder('nested'), file('.emptyFolderPlaceholder')],
        'test/nested/': [file('b.txt')],
      };
      const files = await listFiles(async prefix => folders[prefix]);
      expect(files.map(stored => stored.name)).toEqual(['test/nested/b.txt', 'test/.emptyFolderPlaceholder', 'a.mp4']);
    });

    it('reads the next page while a page is full', async () => {
      const pages = [Array.from({ length: 100 }, (_, index) => file(`${index}.mp4`)), [file('last.mp4')]];
      const listPage = vi.fn(async (_prefix: string, offset: number, limit: number) => pages[offset / limit]);
      expect(await listFiles(listPage)).toHaveLength(101);
      expect(listPage).toHaveBeenCalledTimes(2);
    });

    it('rejects a file without a creation time, so a cleanup never works on a partial list', async () => {
      await expect(listFiles(async () => [{ name: 'a.mp4', id: 'x', created_at: null }])).rejects.toThrow('a.mp4');
    });
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
