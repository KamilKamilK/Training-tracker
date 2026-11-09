import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

const { waitForWrites } = vi.hoisted(() => ({ waitForWrites: vi.fn<() => Promise<void>>() }));

vi.mock('firebase/auth', () => ({}));
vi.mock('firebase/firestore', () => ({ waitForPendingWrites: waitForWrites }));
vi.mock('../../lib/firebaseConfig.js', () => ({ auth: {}, db: {} }));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe('AuthService.hasPendingWrites', () => {
  it('reports no pending writes once the server acknowledged them', async () => {
    waitForWrites.mockResolvedValue();
    await expect(AuthService.hasPendingWrites()).resolves.toBe(false);
  });

  it('reports pending writes still unacknowledged after the time limit', async () => {
    waitForWrites.mockReturnValue(new Promise(() => undefined));
    const result = AuthService.hasPendingWrites();
    await vi.advanceTimersByTimeAsync(2000);
    await expect(result).resolves.toBe(true);
  });

  it('passes on a failed check', async () => {
    const error = new Error('client terminated');
    waitForWrites.mockRejectedValue(error);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(AuthService.hasPendingWrites()).rejects.toBe(error);
  });
});
