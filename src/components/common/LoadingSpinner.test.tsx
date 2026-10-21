import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoadingSpinner, SLOW_LOADING_MS } from './LoadingSpinner.js';

const SLOW_TEXT = /Wczytywanie trwa dłużej niż zwykle/;

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('explains a longer wait only after the usual loading time', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Ładowanie danych...')).toBeTruthy();

    act(() => vi.advanceTimersByTime(SLOW_LOADING_MS - 1));
    expect(screen.queryByText(SLOW_TEXT)).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText(SLOW_TEXT)).toBeTruthy();
  });
});
