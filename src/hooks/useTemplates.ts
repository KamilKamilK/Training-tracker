import { useCallback, useMemo } from 'react';
import { WorkoutTemplate } from '../types/index.js';
import { defaultWorkoutTemplates } from '../constants/workoutTemplates.js';
import { useLocalStorage } from './useLocalStorage.js';

/**
 * Hook zarządzający szablonami treningowymi.
 * Łączy szablony domyślne i użytkownika, z obsługą CRUD + localStorage.
 */
export function useTemplates() {
  // 🔹 Stan custom templates w localStorage
  const [customTemplates, setCustomTemplates, clearCustomTemplates] = useLocalStorage<WorkoutTemplate[]>(
    'customTemplates',
    []
  );

  // 🔹 Wszystkie szablony (domyślne + niestandardowe)
  const allTemplates = useMemo(() => [...defaultWorkoutTemplates, ...customTemplates], [customTemplates]);

  // 🔹 Dodaj nowy szablon
  const addTemplate = useCallback(
    (template: WorkoutTemplate) => {
      setCustomTemplates(prev => [...prev, { ...template, isCustom: true, createdAt: new Date().toISOString() }]);
    },
    [setCustomTemplates]
  );

  // 🔹 Aktualizuj szablon
  const updateTemplate = useCallback(
    (updated: WorkoutTemplate) => {
      setCustomTemplates(prev =>
        prev.map(t => (t.id === updated.id ? { ...updated, isCustom: true } : t))
      );
    },
    [setCustomTemplates]
  );

  // 🔹 Usuń szablon
  const deleteTemplate = useCallback(
    (id: string) => {
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    },
    [setCustomTemplates]
  );

  // 🔹 Duplikuj szablon
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
    [customTemplates, setCustomTemplates]
  );

  // 🔹 Reset custom templates
  const resetCustomTemplates = useCallback(() => {
    clearCustomTemplates();
  }, [clearCustomTemplates]);

  return {
    allTemplates,
    defaultTemplates: defaultWorkoutTemplates,
    customTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    resetCustomTemplates,
  };
}
