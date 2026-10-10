import { StrictMode, createElement, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplates } from './useTemplates.js';
import { STORAGE_KEYS } from '../constants/config.js';
import { WorkoutTemplate } from '../types/index.js';

const custom: WorkoutTemplate = {
  id: 'c1',
  name: 'Push A',
  description: '',
  exercises: ['Przysiad'],
  category: 'strength',
  estimatedDuration: 45,
  difficulty: 'beginner',
  color: 'bg-blue-600',
  isCustom: true,
};

const strict = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children);
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.customTemplates) ?? 'null');

beforeEach(() => {
  localStorage.clear();
});

describe('useTemplates', () => {
  it('loads stored templates on the first render, also in StrictMode', () => {
    localStorage.setItem(STORAGE_KEYS.customTemplates, JSON.stringify([custom]));
    const { result } = renderHook(() => useTemplates(), { wrapper: strict });

    expect(result.current.customTemplates).toEqual([custom]);
    expect(stored()).toEqual([custom]);
  });

  it('drops invalid stored templates and reports them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.customTemplates, JSON.stringify([custom, { id: 'broken' }]));
    const { result } = renderHook(() => useTemplates());

    expect(result.current.customTemplates).toEqual([custom]);
    expect(warn).toHaveBeenCalledWith('useTemplates: skipped invalid stored templates', 1);
  });

  it('persists an added template', () => {
    const { result } = renderHook(() => useTemplates());
    act(() => result.current.addTemplate({ ...custom, id: 'c2' }));
    expect(stored()).toEqual([expect.objectContaining({ id: 'c2', isCustom: true })]);
  });
});
