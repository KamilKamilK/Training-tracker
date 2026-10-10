import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkouts } from './useWorkouts.js';
import { STORAGE_KEYS } from '../constants/config.js';
import { WorkoutTemplate } from '../types/index.js';

const template: WorkoutTemplate = {
  id: 't1',
  name: 'Trening A',
  description: '',
  exercises: ['Przysiad', 'Wiosłowanie'],
  category: 'strength',
  estimatedDuration: 60,
  difficulty: 'beginner',
  color: 'bg-blue-600',
};

const storedDraft = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.currentWorkoutDraft) ?? 'null');

const startedHook = () => {
  const hook = renderHook(() => useWorkouts());
  act(() => hook.result.current.startWorkout(template));
  act(() => hook.result.current.addSet(0));
  return hook;
};

beforeEach(() => {
  localStorage.clear();
});

describe('useWorkouts', () => {
  it('updates sets without mutating the previous workout', () => {
    const { result } = startedHook();
    const before = result.current.currentWorkout!;
    const beforeSets = before.exercises[0].sets;

    act(() => result.current.updateSet(0, 0, 'weight', '80'));
    act(() => result.current.addSet(0));
    act(() => result.current.removeSet(0, 1));

    expect(beforeSets).toEqual([{ weight: '', reps: '', rir: '' }]);
    expect(before.exercises[1].sets).toEqual([]);
    expect(result.current.currentWorkout!.exercises[0].sets).toEqual([{ weight: '80', reps: '', rir: '' }]);
  });

  it('keeps the draft in LocalStorage after every change', () => {
    const { result } = startedHook();
    act(() => result.current.updateSet(0, 0, 'reps', '8'));
    expect(storedDraft().exercises[0].sets[0].reps).toBe('8');
  });

  it('restores a valid draft and discards an invalid one', () => {
    const { result } = startedHook();
    const draft = result.current.currentWorkout;
    expect(renderHook(() => useWorkouts()).result.current.currentWorkout).toEqual(draft);

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.currentWorkoutDraft, JSON.stringify({ type: 5 }));
    expect(renderHook(() => useWorkouts()).result.current.currentWorkout).toBeNull();
  });

  it('keeps the workout and its draft when saving fails', async () => {
    const { result } = startedHook();
    act(() => result.current.updateSet(0, 0, 'weight', '80'));
    const save = vi.fn().mockResolvedValue(false);

    let finished = true;
    await act(async () => {
      finished = await result.current.finishWorkout(save);
    });

    expect(finished).toBe(false);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ completed: true }));
    expect(result.current.currentWorkout?.exercises[0].sets[0].weight).toBe('80');
    expect(storedDraft()?.exercises[0].sets[0].weight).toBe('80');
  });

  it('clears the workout and its draft after a successful save', async () => {
    const { result } = startedHook();
    const save = vi.fn().mockResolvedValue(true);

    await act(async () => {
      await result.current.finishWorkout(save);
    });

    expect(result.current.currentWorkout).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.currentWorkoutDraft)).toBeNull();
  });
});

describe('useWorkouts while saving', () => {
  it('ignores a second finish while the first save is pending', async () => {
    const { result } = startedHook();
    let resolveSave: (saved: boolean) => void = () => {};
    const save = vi.fn(() => new Promise<boolean>(resolve => (resolveSave = resolve)));

    let first: Promise<boolean> = Promise.resolve(false);
    act(() => {
      first = result.current.finishWorkout(save);
    });
    expect(result.current.isFinishing).toBe(true);

    let second = true;
    await act(async () => {
      second = await result.current.finishWorkout(save);
    });
    await act(async () => {
      resolveSave(true);
      await first;
    });

    expect(second).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.isFinishing).toBe(false);
    expect(result.current.currentWorkout).toBeNull();
  });
});
