import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from './useAuth.js';
import { AuthService } from './auth.service.js';

vi.mock('./auth.service.js', () => ({
  AuthService: { onUserChanged: vi.fn(), hasPendingWrites: vi.fn(), signOut: vi.fn() },
}));

const service = vi.mocked(AuthService);
const assign = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  service.onUserChanged.mockReturnValue(() => undefined);
  service.signOut.mockResolvedValue();
  vi.stubGlobal('location', { assign });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAuth sign-out', () => {
  it('signs out and reloads the app at once when no write waits for the server', async () => {
    service.hasPendingWrites.mockResolvedValue(false);
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signOut());

    expect(result.current.isSignOutWarningOpen).toBe(false);
    expect(service.signOut).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/');
  });

  it('asks before deleting unsent writes and keeps the session when cancelled', async () => {
    service.hasPendingWrites.mockResolvedValue(true);
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signOut());
    expect(result.current.isSignOutWarningOpen).toBe(true);
    expect(service.signOut).not.toHaveBeenCalled();

    act(() => result.current.cancelSignOut());
    expect(result.current.isSignOutWarningOpen).toBe(false);
    expect(service.signOut).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('signs out after the confirmation despite unsent writes', async () => {
    service.hasPendingWrites.mockResolvedValue(true);
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signOut());
    await act(() => result.current.confirmSignOut());

    expect(service.signOut).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/');
  });

  it('keeps the warning open with an error when signing out fails', async () => {
    service.hasPendingWrites.mockResolvedValue(true);
    service.signOut.mockRejectedValue(new Error('terminate failed'));
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signOut());
    await act(() => result.current.confirmSignOut());

    expect(result.current.isSignOutWarningOpen).toBe(true);
    expect(result.current.isSigningOut).toBe(false);
    expect(result.current.error).toBe('Nie udało się wykonać operacji. Spróbuj ponownie.');
    expect(assign).not.toHaveBeenCalled();
  });

  it('does not sign out when the check for unsent writes fails', async () => {
    service.hasPendingWrites.mockRejectedValue(new Error('client terminated'));
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.signOut());

    expect(service.signOut).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Nie udało się wykonać operacji. Spróbuj ponownie.');
  });
});
