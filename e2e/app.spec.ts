import { expect, test, type Page } from '@playwright/test';
import { activateProfile, grantOwner, journalDocumentIds, measurementCount, rejectJournalDeletes, rejectMeasurementWrites, rejectWorkoutWrites, resetEmulators, restoreRules } from './emulators.js';

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
  await activateProfile(uid);
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

test('a modal excludes the background from keyboard navigation and restores focus after closing', async ({ page }) => {
  await openAsOwner(page);
  const opener = page.getByRole('button', { name: 'Dodaj', exact: true });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Nowy pomiar' });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Zamknij' });
  await expect(close).toBeFocused();

  for (const key of ['Tab', 'Shift+Tab']) {
    for (let index = 0; index < 10; index++) {
      await page.keyboard.press(key);
      // Native dialogs allow focusing browser chrome, while keeping the page behind them inert.
      await expect.poll(() => dialog.evaluate(element =>
        !document.hasFocus() || element.contains(document.activeElement),
      )).toBe(true);
    }
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');
  await close.click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('a measurement can be corrected and deleted with confirmation, also after a reload', async ({ page }) => {
  const uid = await openAsOwner(page);
  await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
  await page.getByLabel('Data pomiaru').fill('2026-10-01');
  await page.getByLabel('Waga (kg)').fill('82');
  await page.getByLabel('Obwód talii (cm)').fill('90');
  await page.getByRole('button', { name: 'Zapisz pomiar' }).click();
  await expect(page.getByRole('heading', { name: 'Nowy pomiar' })).toHaveCount(0);
  const originalIds = await journalDocumentIds(uid, 'measurements');
  expect(originalIds).toHaveLength(1);

  await page.getByRole('button', { name: /Edytuj pomiar/ }).click();
  await expect(page.getByLabel('Waga (kg)')).toHaveValue('82');
  await page.getByLabel('Waga (kg)').fill('83');
  await page.getByRole('button', { name: 'Anuluj' }).click();
  await expect(page.getByText('82 kg | 90 cm')).toBeVisible();

  await page.getByRole('button', { name: /Edytuj pomiar/ }).click();
  await page.getByLabel('Data pomiaru').fill('2026-10-02');
  await page.getByLabel('Waga (kg)').fill('81,5');
  await page.getByLabel('Obwód talii (cm)').fill('89');
  await rejectMeasurementWrites();
  await page.getByRole('button', { name: 'Zapisz pomiar' }).click();
  await expect(page.getByRole('alert')).toContainText('Nie udało się zapisać pomiaru');
  await expect(page.getByLabel('Waga (kg)')).toHaveValue('81,5');
  await restoreRules();
  await page.getByRole('button', { name: 'Zapisz pomiar' }).click();
  await expect(page.getByRole('heading', { name: 'Edytuj pomiar' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('81.5 kg | 89 cm')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edytuj pomiar z 02.10.2026' })).toBeVisible();
  expect(await journalDocumentIds(uid, 'measurements')).toEqual(originalIds);

  await page.getByRole('button', { name: /Usuń pomiar/ }).click();
  await page.getByRole('button', { name: 'Anuluj' }).click();
  await expect(page.getByText('81.5 kg | 89 cm')).toBeVisible();
  await rejectJournalDeletes();
  await page.getByRole('button', { name: /Usuń pomiar/ }).click();
  await page.getByRole('button', { name: 'Usuń', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Nie udało się usunąć pomiaru');
  await expect.poll(() => journalDocumentIds(uid, 'measurements')).toEqual(originalIds);
  await restoreRules();
  await page.getByRole('button', { name: 'Usuń', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Usunąć pomiar?' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Brak pomiarów. Dodaj pierwszy!')).toBeVisible();
  expect(await journalDocumentIds(uid, 'measurements')).toEqual([]);
});

test('a saved workout can be corrected and deleted without touching the active workout draft', async ({ page }) => {
  const uid = await openAsOwner(page);
  await page.getByText('Trening A - Klatka + Barki').click();
  await page.getByRole('button', { name: 'Dodaj serię' }).first().click();
  await page.getByPlaceholder('kg').fill('80');
  await page.getByPlaceholder('powt.').fill('8');
  await page.getByPlaceholder('RIR').fill('2');
  await page.getByRole('button', { name: 'Zakończ trening' }).click();
  await expect(page).toHaveURL(/\/history$/);
  const originalIds = await journalDocumentIds(uid, 'sessions');
  expect(originalIds).toHaveLength(1);

  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await page.getByText('Trening B - Plecy + Barki Tylne').click();
  await page.getByRole('button', { name: 'Dodaj serię' }).first().click();
  await page.getByPlaceholder('kg').fill('50');
  const activeDraft = await page.evaluate(() => localStorage.getItem('currentWorkoutDraft'));
  await page.getByRole('link', { name: 'Historia', exact: true }).click();
  await page.getByRole('button', { name: /Edytuj trening/ }).click();
  await page.getByPlaceholder('kg').fill('85');
  await page.getByPlaceholder('powt.').fill('10');
  await page.getByPlaceholder('RIR').fill('1');
  await page.getByLabel('Notatki treningu').fill('Poprawiony ciężar');
  await rejectWorkoutWrites();
  await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
  await expect(page.getByRole('alert')).toContainText('Nie udało się zapisać treningu');
  await expect(page.getByPlaceholder('kg')).toHaveValue('85');
  await restoreRules();
  await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
  await expect(page.getByLabel('Notatki treningu')).toHaveCount(0);
  await page.reload();
  expect(await journalDocumentIds(uid, 'sessions')).toEqual(originalIds);
  await page.getByRole('button', { name: 'Podgląd' }).click();
  const preview = page.getByRole('dialog', { name: 'Trening A - Klatka + Barki' });
  await expect(preview).toBeVisible();
  await expect(page.getByText('85 kg × 10 powt.')).toBeVisible();
  await expect(page.getByText('RIR: 1')).toBeVisible();
  await expect(page.getByText('Poprawiony ciężar')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(preview).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Podgląd' })).toBeFocused();
  await page.reload();
  await page.getByRole('button', { name: /Usuń trening/ }).click();
  await page.getByRole('button', { name: 'Anuluj' }).click();
  expect(await journalDocumentIds(uid, 'sessions')).toEqual(originalIds);
  await rejectJournalDeletes();
  await page.getByRole('button', { name: /Usuń trening/ }).click();
  await page.getByRole('button', { name: 'Usuń', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Nie udało się usunąć treningu');
  await restoreRules();
  await page.getByRole('button', { name: 'Usuń', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Usunąć trening?' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Brak treningów w historii.')).toBeVisible();
  expect(await journalDocumentIds(uid, 'sessions')).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('currentWorkoutDraft'))).toBe(activeDraft);
  await page.getByRole('link', { name: 'Trening', exact: true }).click();
  await expect(page.getByPlaceholder('kg')).toHaveValue('50');
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

test('a fresh page connects within five seconds when the previous primary lease remains', async ({ page }) => {
  await openAsOwner(page);
  // A same-origin empty page lets the old client shut down before recreating the lease left
  // by an interrupted unload. This reproduces the race without depending on reload timing.
  await page.route('**/__cache-fixture', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
  await page.goto('/__cache-fixture');
  await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    const name = databases.find(database => database.name?.startsWith('firestore/'))?.name;
    if (!name) throw new Error('No persistent Firestore cache');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('owner', 'readwrite');
        // Firestore's lease format: a live multi-tab primary that did not mark itself closed.
        transaction.objectStore('owner').put({
          ownerId: 'previous-page',
          allowTabSynchronization: true,
          leaseTimestampMs: Date.now(),
        }, 'owner');
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onabort = () => { database.close(); reject(transaction.error); };
      };
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Rozpocznij Trening' })).toBeVisible({ timeout: 5_000 });
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

  await other.reload();
  await expect(other.getByText('81 kg | 89 cm')).toBeVisible();

  // The second tab also writes through its own server connection while IndexedDB is occupied.
  await other.getByRole('button', { name: 'Dodaj', exact: true }).click();
  await other.getByLabel('Waga (kg)').fill('82');
  await other.getByLabel('Obwód talii (cm)').fill('90');
  await other.getByRole('button', { name: 'Zapisz pomiar' }).click();
  await expect(page.getByText('82 kg | 90 cm')).toBeVisible();
});

test('an offline measurement survives closing the last tab and is sent once after reopening', async ({ page, context }) => {
  const uid = await openAsOwner(page);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
  await page.getByLabel('Waga (kg)').fill('83');
  await page.getByLabel('Obwód talii (cm)').fill('91');
  await page.getByRole('button', { name: 'Zapisz pomiar' }).click();
  await expect(page.getByRole('button', { name: 'Zapisywanie...' })).toBeDisabled();
  await page.getByRole('button', { name: 'Anuluj' }).click();
  await expect(page.getByText('83 kg | 91 cm')).toBeVisible();
  expect(await measurementCount(uid)).toBe(0);
  await page.close();

  await context.setOffline(false);
  const reopened = await context.newPage();
  reopened.on('pageerror', error => pageErrors.push(error.message));
  await reopened.goto('/');
  await expect(reopened.getByText('83 kg | 91 cm')).toBeVisible();
  await expect.poll(() => measurementCount(uid)).toBe(1);
  await reopened.reload();
  await expect(reopened.getByText('83 kg | 91 cm')).toBeVisible();
  expect(await measurementCount(uid)).toBe(1);
});

test('a workout finished offline is stored once when the connection returns', async ({ page, context }) => {
  await openAsOwner(page);
  await page.getByText('Trening A - Klatka + Barki').click();
  await expect(page).toHaveURL(/\/workout$/);
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

test('choosing a template during a workout asks before replacing it', async ({ page }) => {
  await openAsOwner(page);
  await page.getByText('Trening A - Klatka + Barki').click();
  await expect(page).toHaveURL(/\/workout$/);
  await page.getByRole('button', { name: 'Dodaj serię' }).first().click();
  await page.getByPlaceholder('kg').fill('80');

  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await page.getByText('Trening B - Plecy + Barki Tylne').click();
  await expect(page.getByRole('heading', { name: 'Trwa inny trening' })).toBeVisible();
  await page.getByRole('button', { name: 'Wróć do treningu' }).click();
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByPlaceholder('kg')).toHaveValue('80');

  await page.getByRole('link', { name: 'Start', exact: true }).click();
  await page.getByText('Trening B - Plecy + Barki Tylne').click();
  await page.getByRole('button', { name: 'Zacznij nowy trening' }).click();
  await expect(page).toHaveURL(/\/workout$/);
  await expect(page.getByRole('heading', { name: 'Trening B - Plecy + Barki Tylne' })).toBeVisible();
  await expect(page.getByPlaceholder('kg')).toHaveCount(0);
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

test('signing out asks about the workout in progress and leaves nothing for the next account', async ({ page }) => {
  await openAsOwner(page);
  await page.getByText('Trening A - Klatka + Barki').click();
  await page.getByRole('button', { name: 'Dodaj serię' }).first().click();
  await page.getByPlaceholder('kg').fill('80');

  await page.getByRole('button', { name: 'Wyloguj' }).click();
  await expect(page.getByRole('heading', { name: 'Wylogować się?' })).toBeVisible();
  await page.getByRole('button', { name: 'Anuluj' }).click();
  await expect(page.getByPlaceholder('kg')).toHaveValue('80');

  // Measurements kept in the browser by the first versions of the app.
  await page.evaluate(() => localStorage.setItem('measurements', '[{"weight":"82"}]'));
  await page.getByRole('button', { name: 'Wyloguj' }).click();
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Wyloguj i usuń trening' }).click()]);
  await expect(page.getByRole('button', { name: 'Kontynuuj z Google' })).toBeVisible();
  expect(
    await page.evaluate(() => [localStorage.getItem('currentWorkoutDraft'), localStorage.getItem('measurements')]),
  ).toEqual([null, null]);

  const other = await signIn(page, 'other-owner@example.com');
  await grantOwner(other);
  await activateProfile(other, 'Ola');
  await page.goto('/workout');
  await expect(page.getByText('Brak aktywnego treningu')).toBeVisible();
});

test('the owner activates the account with the consent and deactivates it by withdrawing it', async ({ page }) => {
  await page.goto('/');
  await grantOwner(await signIn(page, OWNER));
  await page.reload();
  const activate = page.getByRole('button', { name: 'Aktywuj konto' });
  await expect(activate).toBeVisible();

  await page.getByLabel('Imię').fill('Anna');
  await activate.click();
  await expect(page.getByText(/bez niej konto pozostaje nieaktywne/)).toBeVisible();
  await page.getByRole('checkbox').check();
  await activate.click();
  await expect(page.getByRole('heading', { name: 'Rozpocznij Trening' })).toBeVisible();

  await page.getByRole('link', { name: 'Ustawienia' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByLabel('Imię').fill('Anna Nowak');
  await page.getByRole('button', { name: 'Zapisz' }).click();
  await expect(page.getByRole('status')).toHaveText('Zapisano.');
  await page.reload();
  await expect(page.getByLabel('Imię')).toHaveValue('Anna Nowak');

  await page.getByRole('button', { name: 'Wycofaj zgodę' }).click();
  await page.getByRole('dialog', { name: 'Wycofać zgodę?' }).getByRole('button', { name: 'Wycofaj zgodę' }).click();
  await expect(activate).toBeVisible();
  await expect(page.getByLabel('Imię')).toHaveValue('Anna Nowak');
  await page.reload();
  await expect(activate).toBeVisible();

  await page.getByRole('checkbox').check();
  await activate.click();
  await expect(page.getByRole('heading', { name: 'Ustawienia' })).toBeVisible();
  await page.getByRole('link', { name: 'Historia', exact: true }).click();
  await expect(page.getByText(/Brak treningów w historii|Historia Treningów/).first()).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('custom templates are stored in the account, including ones saved before in the browser', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem(
      'customTemplates',
      JSON.stringify([
        {
          id: 'old-1',
          name: 'Stary szablon',
          description: '',
          exercises: ['Przysiad'],
          category: 'strength',
          estimatedDuration: 45,
          difficulty: 'beginner',
          color: 'bg-lime-700',
          isCustom: true,
        },
      ]),
    ),
  );
  await openAsOwner(page);
  await page.getByRole('link', { name: 'Szablony', exact: true }).click();
  await expect(page.getByText('Stary szablon')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('customTemplates'))).toBeNull();

  await page.getByRole('button', { name: /Nowy Szablon/ }).click();
  await page.getByLabel('Nazwa').fill('Basen');
  await page.getByRole('button', { name: /Dodaj ćwiczenie/ }).click();
  await page.getByPlaceholder('Ćwiczenie 1').fill('Kraul');
  await page.getByRole('radio', { name: '🏊' }).click();
  await page.getByRole('button', { name: /Utwórz/ }).click();
  await expect(page.getByText('Basen')).toBeVisible();

  // A fresh browser profile has no local copy: the templates come from Firestore.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('link', { name: 'Szablony', exact: true }).click();
  await expect(page.getByText('Stary szablon')).toBeVisible();
  await expect(page.getByText('Basen')).toBeVisible();
});
