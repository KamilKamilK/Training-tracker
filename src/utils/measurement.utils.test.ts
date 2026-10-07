import { describe, expect, it } from 'vitest';
import { getLastMeasurement, sortByDateAsc, validateMeasurementInput } from './measurement.utils.js';

describe('validateMeasurementInput', () => {
  it('accepts a valid measurement with a decimal comma', () => {
    expect(validateMeasurementInput({ date: '2026-10-01', weight: '82,5', waist: '90' })).toEqual({
      measurement: { date: '2026-10-01', weight: 82.5, waist: 90 },
    });
  });

  it('accepts the range boundaries', () => {
    expect(validateMeasurementInput({ date: '2026-10-01', weight: '30', waist: '200' })).toHaveProperty('measurement');
    expect(validateMeasurementInput({ date: '2026-10-01', weight: '300', waist: '50' })).toHaveProperty('measurement');
  });

  it('reports every invalid field', () => {
    const result = validateMeasurementInput({ date: '01.10.2026', weight: '29', waist: 'abc' });
    expect(result).toEqual({
      errors: {
        date: expect.any(String),
        weight: expect.any(String),
        waist: expect.any(String),
      },
    });
  });

  it('rejects empty values and a future date', () => {
    const result = validateMeasurementInput({ date: '2999-01-01', weight: '', waist: ' ' });
    expect(result).toEqual({
      errors: { date: expect.any(String), weight: expect.any(String), waist: expect.any(String) },
    });
  });
});

describe('measurement ordering', () => {
  const measurements = [
    { id: 'a', date: '2026-01-01', weight: 85, waist: 95 },
    { id: 'b', date: '2026-03-01', weight: 83, waist: 92 },
    { id: 'c', date: '2026-02-01', weight: 84, waist: 93 },
  ];

  it('returns the most recent measurement without reordering the input', () => {
    const before = measurements.map(m => m.id);
    expect(getLastMeasurement(measurements)?.id).toBe('b');
    expect(measurements.map(m => m.id)).toEqual(before);
  });

  it('sorts ascending into a new array', () => {
    expect(sortByDateAsc(measurements).map(m => m.id)).toEqual(['a', 'c', 'b']);
    expect(measurements.map(m => m.id)).toEqual(['a', 'b', 'c']);
  });
});
