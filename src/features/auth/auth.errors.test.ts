import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './auth.errors.js';

describe('authErrorMessage', () => {
  it('gives every sign-in failure the same message, so it does not reveal whether an account exists', () => {
    const codes = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'];
    expect(new Set(codes.map(authErrorMessage))).toEqual(new Set(['Nieprawidłowy e-mail lub hasło.']));
  });

  it('explains rate limiting and network problems', () => {
    expect(authErrorMessage('auth/too-many-requests')).toMatch(/Zbyt wiele prób/);
    expect(authErrorMessage('auth/network-request-failed')).toMatch(/Brak połączenia/);
  });

  it('falls back to a generic message', () => {
    expect(authErrorMessage(undefined)).toMatch(/Nie udało się/);
  });
});
