import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirebaseStorage } from './useFirebaseStorage.js';
import { WorkoutsService } from '../services/firebase/workouts.service.js';
import { ERROR_MESSAGES } from '../constants/messages.js';
import { Workout } from '../types/index.js';

vi.mock('../services/firebase/workouts.service.js', () => ({
  WorkoutsService: { getAll: vi.fn(), save: vi.fn(), delete: vi.fn() },
}));

const service = vi.mocked(WorkoutsService);

const workout: Workout = { id: '', type: 'A', date: '2026-10-07', exercises: [], notes: '' };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useFirebaseStorage', () => {
  it('exposes a load error instead of an empty history', async () => {
    service.getAll.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useFirebaseStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(ERROR_MESSAGES.loadWorkouts);
  });

  it('reports a failed save and leaves the history unchanged', async () => {
    service.getAll.mockResolvedValue([]);
    service.save.mockRejectedValue(new Error('permission-denied'));
    const { result } = renderHook(() => useFirebaseStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let saved = true;
    await act(async () => {
      saved = await result.current.saveWorkout(workout);
    });

    expect(saved).toBe(false);
    expect(result.current.error).toBe(ERROR_MESSAGES.saveWorkout);
    expect(result.current.workouts).toEqual([]);
  });

  it('adds a saved workout with its new id', async () => {
    service.getAll.mockResolvedValue([]);
    service.save.mockResolvedValue('w1');
    const { result } = renderHook(() => useFirebaseStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveWorkout(workout);
    });

    expect(result.current.workouts).toEqual([{ ...workout, id: 'w1' }]);
    expect(result.current.error).toBeNull();
  });
});
