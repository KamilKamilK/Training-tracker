import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkoutHistory } from './useWorkoutHistory.js';
import { WorkoutsService } from './workouts.service.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { Workout } from '../../types/index.js';

vi.mock('./workouts.service.js', () => ({
  WorkoutsService: { subscribe: vi.fn(), save: vi.fn(), delete: vi.fn() },
}));

const service = vi.mocked(WorkoutsService);

const workout = (id: string, date: string): Workout => ({ id, type: 'A', date, exercises: [], notes: '' });

let emit: (workouts: Workout[]) => void;
let fail: (error: unknown) => void;
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  service.subscribe.mockImplementation((onChange, onError) => {
    emit = onChange;
    fail = onError;
    return unsubscribe;
  });
});

describe('useWorkoutHistory', () => {
  it('shows every update from the subscription, newest first', () => {
    const { result } = renderHook(() => useWorkoutHistory());
    expect(result.current.isLoading).toBe(true);

    act(() => emit([workout('a', '2026-10-01'), workout('b', '2026-10-05')]));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.workouts.map(w => w.id)).toEqual(['b', 'a']);

    act(() => emit([workout('a', '2026-10-01')]));
    expect(result.current.workouts.map(w => w.id)).toEqual(['a']);
  });

  it('exposes a load error instead of an empty history', () => {
    const { result } = renderHook(() => useWorkoutHistory());
    act(() => fail(new Error('permission-denied')));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(ERROR_MESSAGES.loadWorkouts);
  });

  it('stops listening on unmount', () => {
    const { unmount } = renderHook(() => useWorkoutHistory());
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('reports a failed save', async () => {
    service.save.mockRejectedValue(new Error('permission-denied'));
    const { result } = renderHook(() => useWorkoutHistory());

    let saved = true;
    await act(async () => {
      saved = await result.current.saveWorkout(workout('a', '2026-10-01'));
    });

    expect(saved).toBe(false);
    expect(result.current.error).toBe(ERROR_MESSAGES.saveWorkout);
  });

  it('resolves to true once the write is confirmed', async () => {
    service.save.mockResolvedValue(undefined);
    const { result } = renderHook(() => useWorkoutHistory());

    let saved = false;
    await act(async () => {
      saved = await result.current.saveWorkout(workout('a', '2026-10-01'));
    });

    expect(saved).toBe(true);
    expect(service.save).toHaveBeenCalledWith(workout('a', '2026-10-01'));
  });
});
