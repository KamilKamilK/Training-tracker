import { useState, useEffect, useCallback } from 'react';
import { DAYS_OF_WEEK, DayOfWeek, WeekPlan } from '../../types/index.js';
import { WeekPlanService } from './weekPlan.service.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';

const createEmptyPlan = (): WeekPlan =>
  Object.fromEntries(DAYS_OF_WEEK.map(day => [day, null])) as WeekPlan;

/** Week plan kept in sync with Firestore; a save shows up through the subscription. */
export const useWeekPlan = () => {
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(createEmptyPlan);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      WeekPlanService.subscribe(
        document => {
          setWeekPlan(document?.plan ?? createEmptyPlan());
          setLastSaved(document?.updatedAt ?? null);
          setIsLoading(false);
        },
        () => {
          setError(ERROR_MESSAGES.loadWeekPlan);
          setIsLoading(false);
        },
      ),
    [],
  );

  /** Resolves to true only when Firestore confirmed the write. */
  const saveWeekPlan = useCallback(async (plan: WeekPlan): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updatedAt = new Date().toISOString();
      await WeekPlanService.save({ plan, updatedAt });
      setError(null);
      return true;
    } catch {
      setError(ERROR_MESSAGES.saveWeekPlan);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateDay = async (day: DayOfWeek, templateId: string | null) => {
    return saveWeekPlan({ ...weekPlan, [day]: templateId });
  };

  const clearDay = async (day: DayOfWeek) => updateDay(day, null);

  const clearAllDays = async () => {
    return saveWeekPlan(createEmptyPlan());
  };

  const getStats = () => {
    const activeDays = Object.values(weekPlan).filter(v => v !== null).length;
    const restDays = 7 - activeDays;

    return {
      activeDays,
      restDays,
      workloadPercentage: Math.round((activeDays / 7) * 100)
    };
  };

  return {
    weekPlan,
    isLoading,
    isSaving,
    lastSaved,
    error,
    clearError: () => setError(null),
    updateDay,
    clearDay,
    clearAllDays,
    saveWeekPlan: () => saveWeekPlan(weekPlan),
    getStats
  };
};
