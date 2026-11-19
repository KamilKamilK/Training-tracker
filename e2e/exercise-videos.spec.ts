import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { activateProfile, exerciseVideoDocuments, grantAdmin, grantOwner, resetEmulators, storeExerciseVideo } from './emulators.js';
import { buildMp4 } from '../src/test/mp4.js';

// The Vercel function and Supabase Storage are replaced by routes in the page; the documents go
// to the Firestore emulator with the real rules. The synthetic MP4 has no playable frames, so the
// tests check the player's source rather than playback.

const OWNER = 'owner@example.com';
const EXERCISE = 'Rozgrzewka: Wioślarz 1000m (opór 7/8)';
const OTHER_EXERCISE = 'Rozgrzewka: Ski-erg 1000m (opór 7/8)';
const STORAGE = 'https://storage.example.test';
const videoId = (name: string) => createHash('sha256').update(name).digest('hex');

// The service worker would answer some requests itself, out of reach of page.route.
test.use({ serviceWorkers: 'block' });

interface ApiCall {
  action: string;
  mediaId?: string;
}

const stubVideoBackend = async (page: Page) => {
  const calls: ApiCall[] = [];
  const uploads: string[] = [];
  await page.route('**/api/exercise-videos', async route => {
    const call = route.request().postDataJSON() as ApiCall;
    expect(route.request().headers().authorization).toMatch(/^Bearer \S+$/);
    calls.push(call);
    if (call.action === 'delete') return route.fulfill({ status: 204 });
    if (call.action === 'cleanup') return route.fulfill({ json: { removed: 1 } });
    return route.fulfill({ json: { url: `${STORAGE}/${call.action}/${call.mediaId}.mp4?token=t` } });
  });
  await page.route(`${STORAGE}/**`, async route => {
    if (route.request().method() === 'PUT') {
      uploads.push(new URL(route.request().url()).pathname);
      return route.fulfill({ status: 200, json: { Key: 'ok' } });
    }
    return route.fulfill({ contentType: 'video/mp4', body: Buffer.from(buildMp4()) });
  });
  return { calls, uploads };
};

const signIn = (page: Page, email: string) =>
  page.evaluate(address => {
    if (!window.__e2eSignIn) throw new Error('The build is not connected to the emulators');
    return window.__e2eSignIn(address);
  }, email);

const openWorkoutAs = async (page: Page, { admin }: { admin: boolean }) => {
  await page.goto('/');
  const uid = await signIn(page, OWNER);
  await grantOwner(uid);
  await activateProfile(uid);
  if (admin) await grantAdmin(uid);
  await page.reload();
  await page.getByRole('button', { name: 'Trening A - Klatka + Barki' }).click();
  await expect(page).toHaveURL(/\/workout$/);
};

const pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors.length = 0;
  page.on('pageerror', error => pageErrors.push(error.message));
  await resetEmulators();
});

test.afterEach(() => {
  expect(pageErrors, 'uncaught errors in the page').toEqual([]);
});

test('an account without the admin role watches a video and has no upload option', async ({ page }) => {
  const mediaId = '0f8c2d5e-3b1a-4c7d-9e2f-1a2b3c4d5e6f';
  await storeExerciseVideo(videoId(EXERCISE), { exerciseName: EXERCISE, mediaId });
  const { calls } = await stubVideoBackend(page);
  await openWorkoutAs(page, { admin: false });

  await expect(page.getByRole('button', { name: `Dodaj film techniki: ${OTHER_EXERCISE}` })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Dodaj film/ })).toHaveCount(0);
  await page.getByRole('button', { name: `Technika: ${EXERCISE}` }).click();

  const dialog = page.getByRole('dialog', { name: `Technika: ${EXERCISE}` });
  await expect(dialog.getByLabel(`Film techniki: ${EXERCISE}`)).toHaveAttribute('src', `${STORAGE}/view/${mediaId}.mp4?token=t`);
  await expect(dialog.getByLabel(/Plik MP4/)).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Usuń film' })).toHaveCount(0);
  expect(calls).toEqual([{ action: 'view', mediaId }]);
});

test('the admin uploads a video after an invalid file, then deletes it with confirmation', async ({ page }) => {
  const { calls, uploads } = await stubVideoBackend(page);
  await openWorkoutAs(page, { admin: true });

  await page.getByRole('button', { name: `Dodaj film techniki: ${EXERCISE}` }).click();
  const dialog = page.getByRole('dialog', { name: `Technika: ${EXERCISE}` });
  const fileInput = dialog.getByLabel(/Plik MP4/);
  await fileInput.setInputFiles({ name: 'za-dlugi.mp4', mimeType: 'video/mp4', buffer: Buffer.from(buildMp4({ durationSec: 45 })) });
  await dialog.getByRole('button', { name: 'Wgraj film' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Film może trwać najwyżej 30 s.');
  expect(calls).toEqual([]);

  await fileInput.setInputFiles({ name: 'wioslarz.mp4', mimeType: 'video/mp4', buffer: Buffer.from(buildMp4({ durationSec: 18 })) });
  await dialog.getByRole('button', { name: 'Wgraj film' }).click();
  const player = dialog.getByLabel(`Film techniki: ${EXERCISE}`);
  await expect(player).toHaveAttribute('src', /^https:\/\/storage\.example\.test\/view\/[0-9a-f-]{36}\.mp4\?token=t$/);
  // The label returns once Firestore has confirmed the document.
  await expect(dialog.getByRole('button', { name: 'Wgraj nowy film' })).toBeVisible();
  const [upload] = calls;
  expect(upload.action).toBe('upload');
  expect(uploads).toEqual([`/upload/${upload.mediaId}.mp4`]);
  expect(await exerciseVideoDocuments()).toEqual([{ id: videoId(EXERCISE), exerciseName: EXERCISE }]);

  await dialog.getByRole('button', { name: 'Usuń film' }).click();
  const confirm = page.getByRole('dialog', { name: 'Usunąć film?' });
  await confirm.getByRole('button', { name: 'Usuń film' }).click();
  await expect(confirm).toHaveCount(0);
  await expect(dialog.getByText('To ćwiczenie nie ma jeszcze filmu.')).toBeVisible();
  expect(calls.at(-1)).toEqual({ action: 'delete', mediaId: upload.mediaId });
  expect(await exerciseVideoDocuments()).toEqual([]);

  await dialog.getByRole('button', { name: 'Usuń pliki bez filmu' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Usunięte pliki bez filmu: 1.');
  expect(calls.at(-1)).toEqual({ action: 'cleanup' });
});
