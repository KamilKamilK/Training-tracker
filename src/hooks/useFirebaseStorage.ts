import { useState, useEffect, useCallback } from 'react';
import { Workout } from '../types/index.js';
import { WorkoutsService } from '../services/firebase/workouts.service.js';
import { sortByDateDesc } from '../utils/workout.utils.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

export const useFirebaseStorage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    WorkoutsService.getAll()
      .then(data => {
        if (!cancelled) setWorkouts(sortByDateDesc(data));
      })
      .catch(() => {
        if (!cancelled) setError(ERROR_MESSAGES.loadWorkouts);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Resolves to true only when Firestore confirmed the write. */
  const saveWorkout = useCallback(async (workout: Workout): Promise<boolean> => {
    try {
      const id = await WorkoutsService.save(workout);
      const saved = { ...workout, id };
      setWorkouts(prev => sortByDateDesc([...prev.filter(w => w.id !== id), saved]));
      setError(null);
      return true;
    } catch {
      setError(ERROR_MESSAGES.saveWorkout);
      return false;
    }
  }, []);

  const deleteWorkout = useCallback(async (id: string): Promise<boolean> => {
    try {
      await WorkoutsService.delete(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
      setError(null);
      return true;
    } catch {
      setError(ERROR_MESSAGES.deleteWorkout);
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { workouts, saveWorkout, deleteWorkout, isLoading, error, clearError };
};
