import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDuration, getMinutesBetween, isThisWeek } from './date.utils.js';

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

describe('getMinutesBetween', () => {
  it('rounds the elapsed time to whole minutes', () => {
    expect(getMinutesBetween('2026-11-09T10:00:00.000Z', '2026-11-09T11:02:29.000Z')).toBe(62);
    expect(getMinutesBetween('2026-11-09T10:00:00.000Z', '2026-11-09T10:00:31.000Z')).toBe(1);
    expect(getMinutesBetween('2026-11-09T10:00:00.000Z', '2026-11-09T10:00:00.000Z')).toBe(0);
  });

  it('has no value for an invalid date or an end before the start', () => {
    expect(getMinutesBetween('not a date', '2026-11-09T10:00:00.000Z')).toBeUndefined();
    expect(getMinutesBetween('2026-11-09T10:00:00.000Z', '2026-11-09T09:59:00.000Z')).toBeUndefined();
  });
});

describe('formatDuration', () => {
  it('shows minutes, and hours from one hour on', () => {
    expect(formatDuration(0)).toBe('< 1 min');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(95)).toBe('1 h 35 min');
  });
});
