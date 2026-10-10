import { expect, test, type Page } from '@playwright/test';
import { confirmEmail, grantOwner, passwordResetSent, resetEmulators, uidOf } from './emulators.js';

const EMAIL = 'anna@example.com';
const PASSWORD = 'Silne1haslo';

const pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors.length = 0;
  page.on('pageerror', error => pageErrors.push(error.message));
  await resetEmulators();
});

test.afterEach(() => {
  expect(pageErrors, 'uncaught errors in the page').toEqual([]);
});

const register = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Zarejestruj/ }).click();
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Hasło', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Powtórz hasło').fill(PASSWORD);
  await page.getByRole('button', { name: 'Załóż konto' }).click();
  await expect(page.getByText(`Potwierdź adres ${EMAIL}`)).toBeVisible();
};

test('a new account sees no data until the e-mail is confirmed', async ({ page }) => {
  await register(page);

  await page.getByRole('button', { name: 'Potwierdziłem adres' }).click();
  await expect(page.getByRole('status')).toContainText('nie jest jeszcze potwierdzony');

  await confirmEmail(EMAIL);
  await page.getByRole('button', { name: 'Potwierdziłem adres' }).click();
  await expect(page.getByText(`Konto ${EMAIL} nie ma dostępu do tego dziennika.`)).toBeVisible();

  await grantOwner(await uidOf(EMAIL));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Rozpocznij Trening' })).toBeVisible();
});

test('a wrong password gets the same message as an unknown account', async ({ page }) => {
  await register(page);
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Wyloguj' }).click()]);

  for (const [email, password] of [
    [EMAIL, 'Zle1haslo'],
    ['nobody@example.com', PASSWORD],
  ]) {
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Hasło', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await expect(page.getByRole('alert')).toContainText('Nieprawidłowy e-mail lub hasło.');
  }
});

test('a password reset link is sent without revealing whether the account exists', async ({ page }) => {
  await register(page);
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Wyloguj' }).click()]);

  await page.getByRole('button', { name: 'Nie pamiętasz hasła?' }).click();
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByRole('button', { name: 'Wyślij link' }).click();
  await expect(page.getByRole('status')).toContainText('Jeśli konto z tym adresem istnieje');
  expect(await passwordResetSent(EMAIL)).toBe(true);
});
