import { expect, test, type Page } from '@playwright/test';
import { grantOwner, rejectWorkoutWrites, resetEmulators, restoreRules } from './emulators.js';

const OWNER = 'owner@example.com';
const STRANGER = 'stranger@example.com';

const signIn = (page: Page, email: string) =>
  page.evaluate(address => {
    if (!window.__e2eSignIn) throw new Error('The build is not connected to the emulators');
    return window.__e2eSignIn(address);
  }, email);

const openAsOwner = async (page: Page) => {
  await page.goto('/');
  const uid = await signIn(page, OWNER);
  await grantOwner(uid);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Rozpocznij Trening' })).toBeVisible();
  return uid;
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

test('the built app loads and shows the sign-in screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Kontynuuj z Google' })).toBeVisible();
});

test('an account outside owners sees no data', async ({ page }) => {
  await page.goto('/');
  await signIn(page, STRANGER);
  await expect(page.getByText(`Konto ${STRANGER} nie ma dostępu do tego dziennika.`)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rozpocznij Trening' })).toHaveCount(0);
});

test('the owner adds a measurement after fixing invalid values', async ({ page }) => {
  await openAsOwner(page);

  await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
  await page.getByLabel('Waga (kg)').fill('20');
  await page.getByLabel('Obwód talii (cm)').fill('abc');
  await page.getByRole('button', { name: 'Zapisz pomiar' }).click();
  await expect(page.getByText(/Waga musi mieścić się/)).toBeVisible();

  await page.getByLabel('Waga (kg)').fill('82,5');
  await page.getByLabel('Obwód talii (cm)').fill('90');
  await page.getByRole('button', { name: 'Zapisz pomiar' }).click();
  await expect(page.getByText('82.5 kg | 90 cm')).toBeVisible();
});

test('a workout survives a reload and a rejected save, then saves on retry', async ({ page }) => {
  await openAsOwner(page);
  const workoutTab = page.getByRole('link', { name: 'Trening', exact: true });

  await page.getByText('Trening A - Klatka + Barki').click();
  await workoutTab.click();
  await page.getByRole('button', { name: 'Dodaj serię' }).first().click();
  await page.getByPlaceholder('kg').fill('80');

  await page.reload();
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByPlaceholder('kg')).toHaveValue('80');

  await rejectWorkoutWrites();
  await page.getByRole('button', { name: 'Zakończ trening' }).click();
  await expect(page.getByRole('alert')).toContainText('Nie udało się zapisać treningu');
  await expect(page.getByPlaceholder('kg')).toHaveValue('80');

  await restoreRules();
  await page.getByRole('button', { name: 'Zakończ trening' }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('heading', { name: /Historia Treningów/ })).toBeVisible();
  await expect(page.getByText('Trening A - Klatka + Barki')).toBeVisible();
});

test('every tab has its own address that survives a reload and the back button', async ({ page }) => {
  await openAsOwner(page);
  const tabs = [
    ['Szablony', '/templates', /Szablony Treningów/],
    ['Plan', '/plan', /Plan Treningowy/],
    ['Historia', '/history', /Brak treningów w historii|Historia Treningów/],
    ['Postępy', '/progress', /Twoje Postępy/],
  ] as const;

  for (const [label, path, content] of tabs) {
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByText(content).first()).toBeVisible();
  }

  await page.reload();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByText(/Twoje Postępy/)).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole('link', { name: 'Historia', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('an unknown address leads to the start page', async ({ page }) => {
  await openAsOwner(page);
  await page.goto('/does-not-exist');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Rozpocznij Trening' })).toBeVisible();
});

test('a change made in one tab appears in another without a reload', async ({ page, context }) => {
  await openAsOwner(page);
  const other = await context.newPage();
  other.on('pageerror', error => pageErrors.push(error.message));
  await other.goto('/');
  await expect(other.getByRole('heading', { name: 'Rozpocznij Trening' })).toBeVisible();

  await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
  await page.getByLabel('Waga (kg)').fill('81');
  await page.getByLabel('Obwód talii (cm)').fill('89');
  await page.getByRole('button', { name: 'Zapisz pomiar' }).click();

  await expect(other.getByText('81 kg | 89 cm')).toBeVisible();
});

test('a workout finished offline is stored once when the connection returns', async ({ page, context }) => {
  await openAsOwner(page);
  await page.getByText('Trening A - Klatka + Barki').click();
  await page.getByRole('link', { name: 'Trening', exact: true }).click();
  await page.getByRole('button', { name: 'Dodaj serię' }).first().click();
  await page.getByPlaceholder('kg').fill('80');

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Zakończ trening' }).click();
  await expect(page.getByRole('button', { name: 'Zapisywanie...' })).toBeDisabled();
  await page.getByRole('link', { name: 'Historia', exact: true }).click();
  await expect(page.getByText('Trening A - Klatka + Barki')).toHaveCount(1);

  await context.setOffline(false);
  await expect(page).toHaveURL(/\/history$/);
  await page.reload();
  await expect(page.getByText('Trening A - Klatka + Barki')).toHaveCount(1);
});

test('signing out removes the local data cache', async ({ page }) => {
  await openAsOwner(page);
  const cacheNames = () =>
    page.evaluate(async () => (await indexedDB.databases()).map(db => db.name ?? '').filter(name => name.startsWith('firestore/')));
  await expect.poll(cacheNames).not.toEqual([]);

  // Signing out reloads the app, so wait for the new page load before checking the cache.
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Wyloguj' }).click()]);
  await expect(page.getByRole('button', { name: 'Kontynuuj z Google' })).toBeVisible();
  expect(await cacheNames()).toEqual([]);
});
