import { describe, expect, it } from 'vitest';
import { parseMeasurement, parseWeekPlanDocument, parseWorkout } from './parse.utils.js';

const workout = {
  type: 'Trening A',
  date: '2026-10-07T10:00:00.000Z',
  exercises: [{ name: 'Przysiad', sets: [{ weight: '80', reps: '8', rir: '2' }] }],
  notes: 'ok',
  completed: true,
};

describe('parseWorkout', () => {
  it('returns a workout for a valid document', () => {
    expect(parseWorkout('w1', workout)).toEqual({ id: 'w1', ...workout });
  });

  it('defaults exercises and notes missing from older documents', () => {
    expect(parseWorkout('w1', { type: 'A', date: '2026-01-01' })).toEqual({
      id: 'w1',
      type: 'A',
      date: '2026-01-01',
      exercises: [],
      notes: '',
    });
  });

  it.each([
    ['not an object', 'text'],
    ['missing type', { ...workout, type: undefined }],
    ['date as number', { ...workout, date: 1 }],
    ['set value as number', { ...workout, exercises: [{ name: 'X', sets: [{ weight: 80, reps: '8', rir: '' }] }] }],
    ['exercise without sets', { ...workout, exercises: [{ name: 'X' }] }],
    ['completed as text', { ...workout, completed: 'yes' }],
  ])('rejects %s', (_, value) => {
    expect(parseWorkout('w1', value)).toBeNull();
  });
});

describe('parseMeasurement', () => {
  it('returns a measurement for a valid document', () => {
    expect(parseMeasurement('m1', { date: '2026-10-07', weight: 82, waist: 90 })).toEqual({
      id: 'm1',
      date: '2026-10-07',
      weight: 82,
      waist: 90,
    });
  });

  it.each([
    ['weight as text', { date: '2026-10-07', weight: '82', waist: 90 }],
    ['missing waist', { date: '2026-10-07', weight: 82 }],
    ['photos with a number', { date: '2026-10-07', weight: 82, waist: 90, photos: [1] }],
  ])('rejects %s', (_, value) => {
    expect(parseMeasurement('m1', value)).toBeNull();
  });
});

describe('parseWeekPlanDocument', () => {
  it('fills days missing from the stored plan with null', () => {
    expect(parseWeekPlanDocument({ plan: { monday: 'A' }, updatedAt: 'now' })).toEqual({
      plan: {
        monday: 'A',
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null,
      },
      updatedAt: 'now',
    });
  });

  it('rejects a template id that is not a string', () => {
    expect(parseWeekPlanDocument({ plan: { monday: 1 }, updatedAt: 'now' })).toBeNull();
  });
});
