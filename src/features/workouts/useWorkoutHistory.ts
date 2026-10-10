import { useState, useEffect, useCallback } from 'react';
import { Workout } from '../../types/index.js';
import { WorkoutsService } from './workouts.service.js';
import { sortByDateDesc } from './workout.utils.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';

/** Workout history kept in sync with Firestore; writes show up through the subscription. */
export const useWorkoutHistory = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      WorkoutsService.subscribe(
        data => {
          setWorkouts(sortByDateDesc(data));
          setIsLoading(false);
        },
        () => {
          setError(ERROR_MESSAGES.loadWorkouts);
          setIsLoading(false);
        },
      ),
    [],
  );

  /** Resolves to true only when Firestore confirmed the write. */
  const saveWorkout = useCallback(async (workout: Workout): Promise<boolean> => {
    try {
      await WorkoutsService.save(workout);
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
