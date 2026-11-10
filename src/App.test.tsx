import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.js';
import { AuthService } from './features/auth/auth.service.js';
import { ProfileService } from './features/profile/profile.service.js';
import { WorkoutsService } from './features/workouts/workouts.service.js';
import { MeasurementsService } from './features/measurements/measurements.service.js';
import { TemplatesService } from './features/templates/templates.service.js';
import { HEALTH_CONSENT } from './constants/consent.js';
import { ERROR_MESSAGES } from './constants/messages.js';
import type { UserProfile } from './types/index.js';

vi.mock('./features/auth/auth.service.js', () => ({
  AuthService: { onUserChanged: vi.fn(), isOwner: vi.fn(), hasPendingWrites: vi.fn(), signOut: vi.fn() },
}));
vi.mock('./features/profile/profile.service.js', () => ({
  ProfileService: { subscribe: vi.fn(), activate: vi.fn() },
}));
vi.mock('./features/workouts/workouts.service.js', () => ({ WorkoutsService: { subscribe: vi.fn() } }));
vi.mock('./features/measurements/measurements.service.js', () => ({ MeasurementsService: { subscribe: vi.fn() } }));
vi.mock('./features/templates/templates.service.js', () => ({ TemplatesService: { subscribe: vi.fn() } }));
vi.mock('./features/plan/weekPlan.service.js', () => ({ WeekPlanService: {} }));

const auth = vi.mocked(AuthService);
const profiles = vi.mocked(ProfileService);
const assign = vi.fn();
const failureMessage = 'Nie udało się wykonać operacji. Spróbuj ponownie.';
const activeProfile: UserProfile = {
  displayName: 'Anna',
  consents: { health: { accepted: true, version: HEALTH_CONSENT.version, at: new Date() } },
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.stubGlobal('location', { assign });
  auth.onUserChanged.mockImplementation(onChange => {
    onChange({ uid: 'owner', email: 'anna@example.com', emailVerified: true, displayName: 'Anna' });
    return () => undefined;
  });
  auth.isOwner.mockResolvedValue(true);
  auth.hasPendingWrites.mockResolvedValue(false);
  auth.signOut.mockResolvedValue();
  profiles.subscribe.mockImplementation((_uid, onChange) => {
    onChange(activeProfile, false);
    return () => undefined;
  });
  vi.mocked(WorkoutsService.subscribe).mockImplementation((_uid, onChange) => {
    onChange([]);
    return () => undefined;
  });
  vi.mocked(MeasurementsService.subscribe).mockImplementation((_uid, onChange) => {
    onChange([]);
    return () => undefined;
  });
  vi.mocked(TemplatesService.subscribe).mockImplementation((_uid, onChange) => {
    onChange([]);
    return () => undefined;
  });
});

afterEach(() => vi.unstubAllGlobals());

describe.each(['journal', 'consent'] as const)('sign-out errors on the %s screen', view => {
  beforeEach(() => {
    if (view === 'consent') {
      profiles.subscribe.mockImplementation((_uid, onChange) => {
        onChange(null, false);
        return () => undefined;
      });
    }
  });

  it.each(['signOut', 'hasPendingWrites'] as const)('shows a dismissible error when %s fails and allows a retry', async operation => {
    auth[operation].mockRejectedValueOnce(new Error('internal failure details'));
    render(<MemoryRouter><App /></MemoryRouter>);
    const user = userEvent.setup();
    const signOut = await screen.findByRole('button', { name: 'Wyloguj' });

    await user.click(signOut);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(failureMessage);
    expect(screen.queryByText('internal failure details')).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Niewysłane zmiany' })).toBeNull();
    expect(assign).not.toHaveBeenCalled();
    expect(auth.signOut).toHaveBeenCalledTimes(operation === 'signOut' ? 1 : 0);
    expect(screen.getByRole(view === 'journal' ? 'heading' : 'button', {
      name: view === 'journal' ? 'Rozpocznij Trening' : 'Aktywuj konto',
    })).toBeTruthy();

    await user.click(within(alert).getByRole('button', { name: 'Zamknij' }));
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(signOut);
    expect(assign).toHaveBeenCalledWith('/');
    expect(auth.signOut).toHaveBeenCalledTimes(operation === 'signOut' ? 2 : 1);
  });

  it('shows the error only inside the unsent changes dialog when confirmation fails', async () => {
    auth.hasPendingWrites.mockResolvedValue(true);
    auth.signOut.mockRejectedValue(new Error('sign-out failed'));
    render(<MemoryRouter><App /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Wyloguj' }));
    const dialog = screen.getByRole('dialog', { name: 'Niewysłane zmiany' });
    await user.click(within(dialog).getByRole('button', { name: 'Wyloguj i usuń zmiany' }));

    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(dialog).getByRole('alert').textContent).toBe(failureMessage);
    expect(assign).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Anuluj' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

it('keeps the consent activation error when the sign-out error is dismissed', async () => {
  profiles.subscribe.mockImplementation((_uid, onChange) => {
    onChange(null, false);
    return () => undefined;
  });
  profiles.activate.mockRejectedValue(new Error('activation failed'));
  auth.signOut.mockRejectedValue(new Error('sign-out failed'));
  render(<MemoryRouter><App /></MemoryRouter>);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('checkbox'));
  await user.clear(screen.getByLabelText('Imię'));
  await user.type(screen.getByLabelText('Imię'), 'Alicja');
  await user.click(screen.getByRole('button', { name: 'Aktywuj konto' }));
  await user.click(screen.getByRole('button', { name: 'Wyloguj' }));

  const authAlert = screen.getAllByRole('alert').find(alert => alert.textContent === failureMessage);
  expect(authAlert).toBeDefined();
  await user.click(within(authAlert!).getByRole('button', { name: 'Zamknij' }));
  expect(screen.getByRole('alert').textContent).toBe(ERROR_MESSAGES.saveProfile);
  expect((screen.getByLabelText('Imię') as HTMLInputElement).value).toBe('Alicja');
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
});
