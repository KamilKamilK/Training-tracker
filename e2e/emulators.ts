import { readFileSync } from 'node:fs';

const PROJECT_ID = 'demo-training-tracker';
const RULES = readFileSync('firestore.rules', 'utf8');
const WORKOUT_WRITE_RULE = 'allow create, update: if isOwner() && isValidWorkout(request.resource.data);';
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

export const restoreRules = () => loadRules(RULES);
