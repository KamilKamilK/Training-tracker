import { expect, test, type Page } from '@playwright/test';
import { grantOwner, resetEmulators, revokeOwner } from './emulators.js';

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
  await expect(page.getByRole('button', { name: 'Zaloguj przez Google' })).toBeVisible();
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
  const uid = await openAsOwner(page);
  const workoutTab = page.getByRole('button', { name: 'Trening', exact: true });

  await page.getByText('Trening A - Klatka + Barki').click();
  await workoutTab.click();
  await page.getByRole('button', { name: 'Dodaj serię' }).first().click();
  await page.getByPlaceholder('kg').fill('80');

  await page.reload();
  await workoutTab.click();
  await expect(page.getByPlaceholder('kg')).toHaveValue('80');

  await revokeOwner(uid);
  await page.getByRole('button', { name: 'Zakończ trening' }).click();
  await expect(page.getByRole('alert')).toContainText('Nie udało się zapisać treningu');
  await expect(page.getByPlaceholder('kg')).toHaveValue('80');

  await grantOwner(uid);
  await page.getByRole('button', { name: 'Zakończ trening' }).click();
  await expect(page.getByRole('heading', { name: /Historia Treningów/ })).toBeVisible();
  await expect(page.getByText('Trening A - Klatka + Barki')).toBeVisible();
});
