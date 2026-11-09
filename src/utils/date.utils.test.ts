import { afterEach, describe, expect, it, vi } from 'vitest';
import { isThisWeek } from './date.utils.js';

const local = (year: number, month: number, day: number, hours = 0, minutes = 0, ms = 0) =>
  new Date(year, month - 1, day, hours, minutes, 0, ms);

describe('isThisWeek', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  const at = (now: Date) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(now);
  };

  it('starts the week on Monday at local midnight', () => {
    at(local(2026, 11, 9, 8));
    expect(isThisWeek(local(2026, 11, 9).toISOString())).toBe(true);
    expect(isThisWeek(local(2026, 11, 8, 23, 59, 999).toISOString())).toBe(false);
    expect(isThisWeek(local(2026, 11, 3, 18).toISOString())).toBe(false);
  });

  it('on Sunday still counts the whole week from Monday and nothing from the next one', () => {
    at(local(2026, 11, 15, 23, 59));
    expect(isThisWeek(local(2026, 11, 9).toISOString())).toBe(true);
    expect(isThisWeek(local(2026, 11, 15, 23, 59).toISOString())).toBe(true);
    expect(isThisWeek(local(2026, 11, 16).toISOString())).toBe(false);
  });

  it('keeps a week that spans the turn of a month', () => {
    at(local(2026, 8, 1, 12));
    expect(isThisWeek(local(2026, 7, 27).toISOString())).toBe(true);
    expect(isThisWeek(local(2026, 7, 26, 23, 59).toISOString())).toBe(false);
  });

  it('keeps a week that spans the turn of a year', () => {
    at(local(2026, 1, 1, 12));
    expect(isThisWeek(local(2025, 12, 29).toISOString())).toBe(true);
    expect(isThisWeek(local(2025, 12, 28, 23, 59).toISOString())).toBe(false);
  });

  it('uses the browser time zone, not UTC', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    // Monday 2026-11-09 08:00 in Tokyo; the workout is Monday 01:00 in Tokyo but still Sunday in UTC.
    at(new Date('2026-11-08T23:00:00.000Z'));
    expect(isThisWeek('2026-11-08T16:00:00.000Z')).toBe(true);
    expect(isThisWeek('2026-11-08T14:59:00.000Z')).toBe(false);
  });
});
