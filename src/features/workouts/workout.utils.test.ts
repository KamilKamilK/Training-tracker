import { describe, expect, it } from 'vitest';
import type { Workout, WorkoutTemplate } from '../../types/index.js';
import { getLastWorkout } from './workout.utils.js';

const template = (id: string, name: string): WorkoutTemplate => ({
  id,
  name,
  description: '',
  exercises: ['Przysiad'],
  category: 'strength',
  estimatedDuration: 60,
  difficulty: 'beginner',
  color: 'bg-blue-600',
});

const workout = (id: string, date: string, type: string, templateId?: string): Workout => ({
  id,
  type,
  date,
  exercises: [],
  notes: '',
  ...(templateId === undefined ? {} : { templateId }),
});

describe('getLastWorkout', () => {
  it('returns the latest workout started from the template', () => {
    const workouts = [
      workout('w1', '2026-10-01T10:00:00.000Z', 'Trening A', 't1'),
      workout('w2', '2026-10-08T10:00:00.000Z', 'Trening A', 't1'),
      workout('w3', '2026-10-09T10:00:00.000Z', 'Trening B', 't2'),
    ];

    expect(getLastWorkout(workouts, template('t1', 'Trening A'))?.id).toBe('w2');
  });

  it('keeps the last workout after the template is renamed', () => {
    const workouts = [workout('w1', '2026-10-01T10:00:00.000Z', 'Trening A', 't1')];

    expect(getLastWorkout(workouts, template('t1', 'Nogi i plecy'))?.id).toBe('w1');
  });

  it('keeps the history of two templates with the same name apart', () => {
    const workouts = [
      workout('w1', '2026-10-01T10:00:00.000Z', 'Trening A', 't1'),
      workout('w2', '2026-10-08T10:00:00.000Z', 'Trening A', 't2'),
    ];

    expect(getLastWorkout(workouts, template('t1', 'Trening A'))?.id).toBe('w1');
    expect(getLastWorkout(workouts, template('t2', 'Trening A'))?.id).toBe('w2');
  });

  it('does not match a workout of another template that had the same name', () => {
    const workouts = [workout('w1', '2026-10-01T10:00:00.000Z', 'Trening A', 't2')];

    expect(getLastWorkout(workouts, template('t1', 'Trening A'))).toBeUndefined();
  });

  it('matches a workout saved without a template id by the template name', () => {
    const workouts = [
      workout('w1', '2026-10-08T10:00:00.000Z', 'Trening A'),
      workout('w2', '2026-10-01T10:00:00.000Z', 'Trening A', 't1'),
      workout('w3', '2026-10-09T10:00:00.000Z', 'Trening B'),
    ];

    expect(getLastWorkout(workouts, template('t1', 'Trening A'))?.id).toBe('w1');
  });

  it('does not reorder the workouts it receives', () => {
    const workouts = [
      workout('w1', '2026-10-01T10:00:00.000Z', 'Trening A', 't1'),
      workout('w2', '2026-10-08T10:00:00.000Z', 'Trening A', 't1'),
    ];

    getLastWorkout(workouts, template('t1', 'Trening A'));

    expect(workouts.map(w => w.id)).toEqual(['w1', 'w2']);
  });
});
