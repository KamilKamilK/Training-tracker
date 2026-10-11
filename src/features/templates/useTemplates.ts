import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkoutTemplate } from '../../types/index.js';
import { defaultWorkoutTemplates } from './defaultTemplates.js';
import { TemplatesService } from './templates.service.js';
import { LocalStorageService } from '../../services/storage/localStorage.service.js';
import { STORAGE_KEYS } from '../../constants/config.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { parseTemplates } from '../../utils/parse.utils.js';

const storedTemplates = (): WorkoutTemplate[] => {
  const { templates, skipped } = parseTemplates(LocalStorageService.get<unknown>(STORAGE_KEYS.customTemplates, null));
  if (skipped > 0) console.warn('useTemplates: skipped invalid stored templates', skipped);
  return templates;
};

/**
 * Default templates plus the account's custom templates kept in sync with Firestore. Templates
 * still saved in this browser from before are imported once; the stored copy is removed only after
 * the import succeeded.
 */
export function useTemplates(uid: string) {
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      TemplatesService.subscribe(uid, setCustomTemplates, () => {
        setError(ERROR_MESSAGES.loadTemplates);
      }),
    [uid],
  );

  useEffect(() => {
    const pending = storedTemplates();
    if (pending.length === 0) {
      LocalStorageService.remove(STORAGE_KEYS.customTemplates);
      return;
    }
    TemplatesService.saveAll(uid, pending)
      .then(() => LocalStorageService.remove(STORAGE_KEYS.customTemplates))
      .catch(() => setError(ERROR_MESSAGES.importTemplates));
  }, [uid]);

  const allTemplates = useMemo(() => [...defaultWorkoutTemplates, ...customTemplates], [customTemplates]);

  /** Resolves to true only when Firestore confirmed the write; the list updates through the subscription. */
  const write = useCallback(async (action: () => Promise<void>, failure: string): Promise<boolean> => {
    try {
      await action();
      setError(null);
      return true;
    } catch {
      setError(failure);
      return false;
    }
  }, []);

  const addTemplate = useCallback(
    (template: WorkoutTemplate) =>
      write(
        () => TemplatesService.save(uid, { ...template, isCustom: true, createdAt: new Date().toISOString() }),
        ERROR_MESSAGES.saveTemplate,
      ),
    [uid, write],
  );

  const updateTemplate = useCallback(
    (updated: WorkoutTemplate) =>
      write(() => TemplatesService.save(uid, { ...updated, isCustom: true }), ERROR_MESSAGES.saveTemplate),
    [uid, write],
  );

  const deleteTemplate = useCallback(
    (id: string) => write(() => TemplatesService.delete(uid, id), ERROR_MESSAGES.deleteTemplate),
    [uid, write],
  );

  const duplicateTemplate = useCallback(
    (id: string) => {
      const original = allTemplates.find(t => t.id === id);
      if (!original) return Promise.resolve(false);
      return write(
        () =>
          TemplatesService.save(uid, {
            ...original,
            id: crypto.randomUUID(),
            name: `${original.name} (kopia)`,
            isCustom: true,
            createdAt: new Date().toISOString(),
          }),
        ERROR_MESSAGES.saveTemplate,
      );
    },
    [allTemplates, uid, write],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    allTemplates,
    defaultTemplates: defaultWorkoutTemplates,
    customTemplates,
    error,
    clearError,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}
