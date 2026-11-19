import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Server-side gate for exercise technique videos (ADR-0019). The files are in a private Supabase
// Storage bucket; the browser never holds a Supabase key and gets only short-lived signed URLs.
// Permissions come from the same Firestore documents the security rules read: watching needs an
// active account, uploading, deleting and removing unused files also the `admin` role in
// users/{uid} (ADR-0016). Every account has a call limit kept in apiRateLimits/{uid}.

const RequestSchema = z.union([
  z.object({ action: z.enum(['upload', 'view', 'delete']), mediaId: z.uuid() }),
  z.object({ action: z.literal('cleanup') }),
]);

const VIEW_URL_TTL_SECONDS = 300;
const DEFAULT_BUCKET = 'exercise-videos';
export const RATE_LIMIT = { calls: 60, windowMs: 10 * 60 * 1000 };
// A file reaches the bucket before its document is written, so a younger file without a document
// may be an upload still in progress.
export const UNUSED_FILE_MIN_AGE_MS = 60 * 60 * 1000;
const MEDIA_FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.mp4$/;

export interface Access {
  active: boolean;
  admin: boolean;
}

export type Quota = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export interface StoredFile {
  /** Path from the bucket root, with folders, e.g. `a/b.txt`. */
  name: string;
  createdAt: Date;
}

export interface VideoStorage {
  createUploadUrl(path: string): Promise<string>;
  createViewUrl(path: string, expiresInSeconds: number): Promise<string>;
  /** All files in the bucket, also those inside folders. */
  list(): Promise<StoredFile[]>;
  /** Removing a file that is already gone succeeds. */
  remove(paths: string[]): Promise<void>;
}

export interface Dependencies {
  /** Rejects when the token is invalid or expired. */
  verifyIdToken(token: string): Promise<{ uid: string; emailVerified: boolean }>;
  /** Counts the call against the account's limit. */
  consumeQuota(uid: string): Promise<Quota>;
  readAccess(uid: string): Promise<Access>;
  /** The media ids referenced by exerciseVideos documents. */
  readMediaIds(): Promise<Set<string>>;
  storage: VideoStorage;
}

const ProfileSchema = z.object({
  consents: z.object({ health: z.object({ accepted: z.boolean() }) }),
  roles: z.array(z.string()).optional(),
});

/** Mirrors isOwner() and isAdmin() in firestore.rules. */
export const readAccess = async (db: Firestore, uid: string): Promise<Access> => {
  const [owner, profile] = await Promise.all([db.doc(`owners/${uid}`).get(), db.doc(`users/${uid}`).get()]);
  const parsed = ProfileSchema.safeParse(profile.data());
  const active = owner.exists && parsed.success && parsed.data.consents.health.accepted;
  return { active, admin: active && (parsed.data?.roles ?? []).includes('admin') };
};

const RateLimitSchema = z.object({ windowStart: z.instanceof(Timestamp), count: z.number().int().nonnegative() });

/**
 * A fixed window per account in apiRateLimits/{uid}, written only here: the security rules deny
 * the app any access to the collection. A document of an unexpected shape starts a new window.
 */
export const consumeQuota = (db: Firestore, uid: string, now = Date.now()): Promise<Quota> =>
  db.runTransaction(async transaction => {
    const ref = db.doc(`apiRateLimits/${uid}`);
    const snapshot = await transaction.get(ref);
    const parsed = RateLimitSchema.safeParse(snapshot.data());
    if (snapshot.exists && !parsed.success) console.warn('exercise-videos: reset malformed rate limit', uid);
    const current = parsed.success && now - parsed.data.windowStart.toMillis() < RATE_LIMIT.windowMs ? parsed.data : null;
    if (current && current.count >= RATE_LIMIT.calls) {
      const windowEnd = current.windowStart.toMillis() + RATE_LIMIT.windowMs;
      return { allowed: false, retryAfterSeconds: Math.ceil((windowEnd - now) / 1000) };
    }
    transaction.set(ref, current
      ? { windowStart: current.windowStart, count: current.count + 1 }
      : { windowStart: Timestamp.fromMillis(now), count: 1 });
    return { allowed: true };
  });

const VideoReferenceSchema = z.object({ mediaId: z.uuid() });

/** Rejects on a document without a valid media id, so a cleanup never runs on a partial list. */
export const readMediaIds = async (db: Firestore): Promise<Set<string>> => {
  const snapshot = await db.collection('exerciseVideos').get();
  return new Set(snapshot.docs.map(document => {
    const parsed = VideoReferenceSchema.safeParse(document.data());
    if (!parsed.success) throw new Error(`exerciseVideos/${document.id} has no valid mediaId`);
    return parsed.data.mediaId;
  }));
};

/**
 * The bucket holds only the app's videos, `{mediaId}.mp4` in its root. Every other file old enough
 * is removed: a video no document refers to (failed upload, replaced video) and anything added
 * outside the app, also inside folders. A folder disappears with its last file.
 */
const removeUnusedFiles = async (deps: Dependencies): Promise<number> => {
  const [files, mediaIds] = await Promise.all([deps.storage.list(), deps.readMediaIds()]);
  const cutoff = Date.now() - UNUSED_FILE_MIN_AGE_MS;
  const unused = files
    .filter(file => {
      const mediaId = MEDIA_FILE.exec(file.name)?.[1];
      return !(mediaId !== undefined && mediaIds.has(mediaId)) && file.createdAt.getTime() < cutoff;
    })
    .map(file => file.name);
  if (unused.length > 0) await deps.storage.remove(unused);
  return unused.length;
};

const json = (status: number, body: unknown, headers?: HeadersInit) => Response.json(body, { status, headers });
const failure = (status: number, code: string, headers?: HeadersInit) => json(status, { error: code }, headers);

export const createHandler = (deps: Dependencies) => async (request: Request): Promise<Response> => {
  const token = /^Bearer (\S+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token) return failure(401, 'unauthenticated');

  let user: Awaited<ReturnType<Dependencies['verifyIdToken']>>;
  try {
    user = await deps.verifyIdToken(token);
  } catch (error) {
    console.warn('exercise-videos: rejected token', error instanceof Error ? error.name : 'unknown');
    return failure(401, 'unauthenticated');
  }
  if (!user.emailVerified) return failure(403, 'forbidden');

  let quota: Quota;
  try {
    quota = await deps.consumeQuota(user.uid);
  } catch (error) {
    console.error(`exercise-videos.consumeQuota error for ${user.uid}:`, error);
    return failure(500, 'internal');
  }
  if (!quota.allowed) {
    console.warn('exercise-videos: rate limit reached', user.uid);
    return failure(429, 'rate-limited', { 'Retry-After': String(quota.retryAfterSeconds) });
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure(400, 'invalid-request');
  const body = parsed.data;
  const subject = body.action === 'cleanup' ? '' : ` for ${body.mediaId}`;

  try {
    const access = await deps.readAccess(user.uid);
    if (!(body.action === 'view' ? access.active : access.admin)) return failure(403, 'forbidden');

    switch (body.action) {
      case 'upload':
        return json(200, { url: await deps.storage.createUploadUrl(`${body.mediaId}.mp4`) });
      case 'view':
        return json(200, { url: await deps.storage.createViewUrl(`${body.mediaId}.mp4`, VIEW_URL_TTL_SECONDS) });
      case 'delete':
        await deps.storage.remove([`${body.mediaId}.mp4`]);
        return new Response(null, { status: 204 });
      case 'cleanup':
        return json(200, { removed: await removeUnusedFiles(deps) });
    }
  } catch (error) {
    console.error(`exercise-videos.${body.action} error${subject}:`, error);
    return failure(500, 'internal');
  }
};

const LIST_PAGE_SIZE = 100;
// Supabase Storage removes at most 1000 objects in one request.
const REMOVE_BATCH_SIZE = 1000;

/** A bucket entry as Supabase lists it: a folder has no id and no creation time. */
export interface BucketEntry {
  name: string;
  id: string | null;
  created_at: string | null;
}

/** Lists every file under the prefix, going into folders; `listPage` reads one page of one folder. */
export const listFiles = async (
  listPage: (prefix: string, offset: number, limit: number) => Promise<BucketEntry[]>,
  prefix = '',
): Promise<StoredFile[]> => {
  const files: StoredFile[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const entries = await listPage(prefix, offset, LIST_PAGE_SIZE);
    for (const entry of entries) {
      const name = `${prefix}${entry.name}`;
      if (entry.id === null) {
        files.push(...(await listFiles(listPage, `${name}/`)));
        continue;
      }
      const createdAt = new Date(entry.created_at ?? Number.NaN);
      if (Number.isNaN(createdAt.getTime())) throw new Error(`File ${name} has no creation time`);
      files.push({ name, createdAt });
    }
    if (entries.length < LIST_PAGE_SIZE) return files;
  }
};

const requiredEnv = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

// JSON.parse quotes part of its input in the error message, and the input is a private key, so the
// error that reaches the logs names only the variable.
const parseServiceAccount = (json: string): object => {
  try {
    return JSON.parse(json) as object;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }
};

/**
 * Production: FIREBASE_SERVICE_ACCOUNT holds the service account key (JSON). Local development and
 * tests use the emulators (FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST) with
 * GCLOUD_PROJECT instead.
 */
const createDependencies = (env: NodeJS.ProcessEnv): Dependencies => {
  const app = getApps()[0] ?? initializeApp(
    env.FIREBASE_SERVICE_ACCOUNT
      ? { credential: cert(parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT)) }
      : { projectId: requiredEnv(env, 'GCLOUD_PROJECT') },
  );
  const db = getFirestore(app);
  const bucket = createClient(requiredEnv(env, 'SUPABASE_URL'), requiredEnv(env, 'SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).storage.from(env.SUPABASE_BUCKET || DEFAULT_BUCKET);

  return {
    verifyIdToken: async token => {
      const decoded = await getAuth(app).verifyIdToken(token);
      return { uid: decoded.uid, emailVerified: decoded.email_verified === true };
    },
    consumeQuota: uid => consumeQuota(db, uid),
    readAccess: uid => readAccess(db, uid),
    readMediaIds: () => readMediaIds(db),
    storage: {
      async createUploadUrl(path) {
        const { data, error } = await bucket.createSignedUploadUrl(path);
        if (error) throw error;
        return data.signedUrl;
      },
      async createViewUrl(path, expiresInSeconds) {
        const { data, error } = await bucket.createSignedUrl(path, expiresInSeconds);
        if (error) throw error;
        return data.signedUrl;
      },
      list: () =>
        listFiles(async (prefix, offset, limit) => {
          // Supabase lists the folder given without its trailing slash.
          const { data, error } = await bucket.list(prefix.replace(/\/$/, ''), { limit, offset, sortBy: { column: 'name', order: 'asc' } });
          if (error) throw error;
          return data;
        }),
      async remove(paths) {
        for (let start = 0; start < paths.length; start += REMOVE_BATCH_SIZE) {
          const { error } = await bucket.remove(paths.slice(start, start + REMOVE_BATCH_SIZE));
          if (error) throw error;
        }
      },
    },
  };
};

let handler: ReturnType<typeof createHandler> | undefined;

/** Vercel function: POST /api/exercise-videos with `Authorization: Bearer <Firebase ID token>`. */
export const POST = (request: Request): Promise<Response> => {
  handler ??= createHandler(createDependencies(process.env));
  return handler(request);
};
