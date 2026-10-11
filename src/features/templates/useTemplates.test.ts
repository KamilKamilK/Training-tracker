import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTemplates } from './useTemplates.js';
import { TemplatesService } from './templates.service.js';
import { STORAGE_KEYS } from '../../constants/config.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { WorkoutTemplate } from '../../types/index.js';

vi.mock('./templates.service.js', () => ({
  TemplatesService: { subscribe: vi.fn(), save: vi.fn(), delete: vi.fn(), saveAll: vi.fn() },
}));

const service = vi.mocked(TemplatesService);

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

let emit: (templates: WorkoutTemplate[]) => void;
const stored = () => localStorage.getItem(STORAGE_KEYS.customTemplates);

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  service.subscribe.mockImplementation((_uid, onChange) => {
    emit = onChange;
    return vi.fn();
  });
  service.save.mockResolvedValue(undefined);
  service.saveAll.mockResolvedValue(undefined);
});

describe('useTemplates', () => {
  it('shows the default templates and the custom templates from Firestore', () => {
    const { result } = renderHook(() => useTemplates('u1'));
    expect(service.subscribe).toHaveBeenCalledWith('u1', expect.any(Function), expect.any(Function));

    act(() => emit([custom]));
    expect(result.current.customTemplates).toEqual([custom]);
    expect(result.current.allTemplates.at(-1)).toEqual(custom);
    expect(result.current.allTemplates.length).toBe(result.current.defaultTemplates.length + 1);
  });

  it('imports templates saved in the browser and removes them only after the import succeeded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.customTemplates, JSON.stringify([custom, { id: 'broken' }]));
    renderHook(() => useTemplates('u1'));

    expect(service.saveAll).toHaveBeenCalledWith('u1', [custom]);
    expect(warn).toHaveBeenCalledWith('useTemplates: skipped invalid stored templates', 1);
    await waitFor(() => expect(stored()).toBeNull());
  });

  it('keeps the browser copy when the import fails', async () => {
    service.saveAll.mockRejectedValue(new Error('permission-denied'));
    localStorage.setItem(STORAGE_KEYS.customTemplates, JSON.stringify([custom]));
    const { result } = renderHook(() => useTemplates('u1'));

    await waitFor(() => expect(result.current.error).toBe(ERROR_MESSAGES.importTemplates));
    expect(stored()).not.toBeNull();
  });

  it('saves an added template as a custom template and reports a failed save', async () => {
    const { result } = renderHook(() => useTemplates('u1'));
    await act(async () => {
      await result.current.addTemplate({ ...custom, id: 'c2', isCustom: false });
    });
    expect(service.save).toHaveBeenCalledWith('u1', expect.objectContaining({ id: 'c2', isCustom: true }));

    service.save.mockRejectedValue(new Error('permission-denied'));
    let saved = true;
    await act(async () => {
      saved = await result.current.updateTemplate(custom);
    });
    expect(saved).toBe(false);
    expect(result.current.error).toBe(ERROR_MESSAGES.saveTemplate);
  });

  it('duplicates a default template under a new id', async () => {
    const { result } = renderHook(() => useTemplates('u1'));
    const original = result.current.defaultTemplates[0];
    await act(async () => {
      await result.current.duplicateTemplate(original.id);
    });
    const copy = service.save.mock.calls[0][1];
    expect(copy).toEqual(expect.objectContaining({ name: `${original.name} (kopia)`, isCustom: true }));
    expect(copy.id).not.toBe(original.id);
  });
});
