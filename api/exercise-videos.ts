import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Server-side gate for exercise technique videos (ADR-0019). The files are in a private Supabase
// Storage bucket; the browser never holds a Supabase key and gets only short-lived signed URLs.
// Permissions come from the same Firestore documents the security rules read: watching needs an
// active account, uploading and deleting also the `admin` role in users/{uid} (ADR-0016).

const RequestSchema = z.object({
  action: z.enum(['upload', 'view', 'delete']),
  mediaId: z.uuid(),
});

const VIEW_URL_TTL_SECONDS = 300;
const DEFAULT_BUCKET = 'exercise-videos';

export interface Access {
  active: boolean;
  admin: boolean;
}

export interface VideoStorage {
  createUploadUrl(path: string): Promise<string>;
  createViewUrl(path: string, expiresInSeconds: number): Promise<string>;
  remove(path: string): Promise<void>;
}

export interface Dependencies {
  /** Rejects when the token is invalid or expired. */
  verifyIdToken(token: string): Promise<{ uid: string; emailVerified: boolean }>;
  readAccess(uid: string): Promise<Access>;
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

const json = (status: number, body: unknown) => Response.json(body, { status });
const failure = (status: number, code: string) => json(status, { error: code });

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

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure(400, 'invalid-request');
  const { action, mediaId } = parsed.data;
  const path = `${mediaId}.mp4`;

  try {
    const access = await deps.readAccess(user.uid);
    if (!(action === 'view' ? access.active : access.admin)) return failure(403, 'forbidden');

    switch (action) {
      case 'upload':
        return json(200, { url: await deps.storage.createUploadUrl(path) });
      case 'view':
        return json(200, { url: await deps.storage.createViewUrl(path, VIEW_URL_TTL_SECONDS) });
      case 'delete':
        await deps.storage.remove(path);
        return new Response(null, { status: 204 });
    }
  } catch (error) {
    console.error(`exercise-videos.${action} error for ${mediaId}:`, error);
    return failure(500, 'internal');
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
    readAccess: uid => readAccess(db, uid),
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
      async remove(path) {
        const { error } = await bucket.remove([path]);
        if (error) throw error;
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
