import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkoutTemplate } from '../types/index.js';
import { defaultWorkoutTemplates } from '../constants/workoutTemplates.js';
import { LocalStorageService } from '../services/storage/localStorage.service.js';
import { STORAGE_KEYS } from '../constants/config.js';
import { parseTemplates } from '../utils/parse.utils.js';

const loadCustomTemplates = (): WorkoutTemplate[] => {
  const { templates, skipped } = parseTemplates(
    LocalStorageService.get<unknown>(STORAGE_KEYS.customTemplates, []),
  );
  if (skipped > 0) {
    console.warn('useTemplates: skipped invalid stored templates', skipped);
  }
  return templates;
};

export function useTemplates() {
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>(loadCustomTemplates);

  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.customTemplates, customTemplates);
  }, [customTemplates]);

  const allTemplates = useMemo(
    () => [...defaultWorkoutTemplates, ...customTemplates],
    [customTemplates]
  );

  const addTemplate = useCallback((template: WorkoutTemplate) => {
    setCustomTemplates(prev => [
      ...prev,
      { ...template, isCustom: true, createdAt: new Date().toISOString() },
    ]);
  }, []);

  const updateTemplate = useCallback((updated: WorkoutTemplate) => {
    setCustomTemplates(prev =>
      prev.map(t => (t.id === updated.id ? { ...updated, isCustom: true } : t))
    );
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const duplicateTemplate = useCallback(
    (id: string) => {
      const original =
        customTemplates.find(t => t.id === id) ||
        defaultWorkoutTemplates.find(t => t.id === id);
      if (!original) return;

      const duplicated: WorkoutTemplate = {
        ...original,
        id: `copy-${Date.now()}`,
        name: `${original.name} (kopia)`,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      setCustomTemplates(prev => [...prev, duplicated]);
    },
    [customTemplates]
  );

  return {
    allTemplates,
    defaultTemplates: defaultWorkoutTemplates,
    customTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}