import { readFileSync } from 'node:fs';
import { HEALTH_CONSENT } from '../src/constants/consent.js';

const PROJECT_ID = 'demo-training-tracker';
const RULES = readFileSync('firestore.rules', 'utf8');
const WORKOUT_WRITE_RULE = 'allow create, update: if isActiveSelf() && isValidWorkout(request.resource.data);';
const MEASUREMENT_WRITE_RULE = 'allow create, update: if isActiveSelf() && isValidMeasurement(request.resource.data);';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
// The emulators accept this token as an admin that bypasses security rules.
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

const request = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${init.method} ${url} failed with ${response.status}`);
};

export const resetEmulators = async () => {
  await restoreRules();
  await request(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
    method: 'DELETE',
  });
  await request(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
};

export const grantOwner = (uid: string) =>
  request(`${FIRESTORE}/owners?documentId=${uid}`, { method: 'POST', headers: ADMIN, body: JSON.stringify({ fields: {} }) });

export const journalDocumentIds = async (uid: string, collection: 'measurements' | 'sessions') => {
  const response = await fetch(`${FIRESTORE}/users/${uid}/${collection}`, { headers: ADMIN });
  if (!response.ok) throw new Error(`Reading emulator journal failed with ${response.status}`);
  const data = (await response.json()) as { documents?: { name: string }[] };
  return (data.documents ?? []).map(document => document.name.split('/').at(-1)).sort();
};

export const measurementCount = async (uid: string) => {
  const response = await fetch(`${FIRESTORE}/users/${uid}/measurements`, { headers: ADMIN });
  if (!response.ok) throw new Error(`Reading emulator measurements failed with ${response.status}`);
  const data = (await response.json()) as { documents?: unknown[] };
  return data.documents?.length ?? 0;
};

/** Stores a profile with the accepted health consent, as the activation screen would. */
export const activateProfile = (uid: string, displayName = 'Anna') =>
  request(`${FIRESTORE}/users?documentId=${uid}`, {
    method: 'POST',
    headers: ADMIN,
    body: JSON.stringify({
      fields: {
        displayName: { stringValue: displayName },
        consents: {
          mapValue: {
            fields: {
              health: {
                mapValue: {
                  fields: {
                    accepted: { booleanValue: true },
                    version: { stringValue: HEALTH_CONSENT.version },
                    at: { timestampValue: new Date().toISOString() },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

const loadRules = (content: string) =>
  request(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}:securityRules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content }] } }),
  });

/** Makes the server reject every workout write while reads keep working. */
export const rejectWorkoutWrites = () => {
  if (!RULES.includes(WORKOUT_WRITE_RULE)) throw new Error('firestore.rules no longer contains the workout write rule');
  return loadRules(RULES.replace(WORKOUT_WRITE_RULE, 'allow create, update: if false;'));
};

export const rejectMeasurementWrites = () => {
  if (!RULES.includes(MEASUREMENT_WRITE_RULE)) throw new Error('Missing measurement write rule');
  return loadRules(RULES.replace(MEASUREMENT_WRITE_RULE, 'allow create, update: if false;'));
};

export const rejectJournalDeletes = () => {
  const rule = 'allow read, delete: if isActiveSelf();';
  if (!RULES.includes(rule)) throw new Error('Missing journal delete rule');
  return loadRules(RULES.replaceAll(rule, 'allow read: if isActiveSelf(); allow delete: if false;'));
};

export const restoreRules = () => loadRules(RULES);

const AUTH_ADMIN = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}`;

/** Opens the verification link the auth emulator "sent" to the address. */
export const confirmEmail = async (email: string) => {
  const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/oobCodes`);
  const { oobCodes } = (await response.json()) as { oobCodes: { email: string; requestType: string; oobLink: string }[] };
  const code = oobCodes.find(item => item.email === email && item.requestType === 'VERIFY_EMAIL');
  if (!code) throw new Error(`No verification e-mail for ${email}`);
  await request(code.oobLink, { method: 'GET' });
};

export const passwordResetSent = async (email: string) => {
  const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/oobCodes`);
  const { oobCodes } = (await response.json()) as { oobCodes: { email: string; requestType: string }[] };
  return oobCodes.some(item => item.email === email && item.requestType === 'PASSWORD_RESET');
};

export const uidOf = async (email: string) => {
  const response = await fetch(`${AUTH_ADMIN}/accounts:lookup`, { method: 'POST', headers: ADMIN, body: JSON.stringify({ email: [email] }) });
  const { users } = (await response.json()) as { users?: { localId: string }[] };
  if (!users?.[0]) throw new Error(`No account for ${email}`);
  return users[0].localId;
};
