const PROJECT_ID = 'demo-training-tracker';
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
// The emulators accept this token as an admin that bypasses security rules.
const ADMIN = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

const request = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${init.method} ${url} failed with ${response.status}`);
};

export const resetEmulators = async () => {
  await request(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
    method: 'DELETE',
  });
  await request(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
};

export const grantOwner = (uid: string) =>
  request(`${FIRESTORE}/owners?documentId=${uid}`, { method: 'POST', headers: ADMIN, body: JSON.stringify({ fields: {} }) });

export const revokeOwner = (uid: string) => request(`${FIRESTORE}/owners/${uid}`, { method: 'DELETE', headers: ADMIN });
