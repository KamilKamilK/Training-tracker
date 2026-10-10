import { useState, useCallback } from 'react';
import { Workout, WorkoutSet, WorkoutTemplate } from '../../types/index.js';
import { getCurrentDate } from '../../utils/date.utils.js';
import { parseWorkoutDraft } from '../../utils/parse.utils.js';
import { LocalStorageService } from '../../services/storage/localStorage.service.js';
import { STORAGE_KEYS } from '../../constants/config.js';

type SetField = keyof WorkoutSet;

const loadDraft = (): Workout | null => {
  const stored = LocalStorageService.get<unknown>(STORAGE_KEYS.currentWorkoutDraft, null);
  if (stored === null) return null;
  const draft = parseWorkoutDraft(stored);
  if (!draft) {
    console.warn('useWorkoutDraft: discarded invalid workout draft');
  }
  return draft;
};

const persistDraft = (workout: Workout | null) => {
  if (workout) {
    LocalStorageService.set(STORAGE_KEYS.currentWorkoutDraft, workout);
  } else {
    LocalStorageService.remove(STORAGE_KEYS.currentWorkoutDraft);
  }
};

const updateSets = (
  workout: Workout,
  exerciseIndex: number,
  update: (sets: WorkoutSet[]) => WorkoutSet[],
): Workout => ({
  ...workout,
  exercises: workout.exercises.map((exercise, index) =>
    index === exerciseIndex ? { ...exercise, sets: update(exercise.sets) } : exercise,
  ),
});

/** Current workout draft, kept in LocalStorage so entered values survive a page refresh. */
export const useWorkoutDraft = () => {
  const [currentWorkout, setCurrentWorkoutState] = useState<Workout | null>(loadDraft);
  const [isFinishing, setIsFinishing] = useState(false);

  const setCurrentWorkout = useCallback((workout: Workout | null) => {
    setCurrentWorkoutState(workout);
    persistDraft(workout);
  }, []);

  const startWorkout = (template: WorkoutTemplate) => {
    setCurrentWorkout({
      id: crypto.randomUUID(),
      type: template.name,
      date: getCurrentDate(),
      exercises: template.exercises.map(name => ({ name, sets: [] })),
      notes: '',
      completed: false,
    });
  };

  const addSet = (exerciseIndex: number) => {
    if (!currentWorkout) return;
    setCurrentWorkout(
      updateSets(currentWorkout, exerciseIndex, sets => [...sets, { weight: '', reps: '', rir: '' }]),
    );
  };

  const updateSet = (exIdx: number, setIdx: number, field: SetField, value: string) => {
    if (!currentWorkout) return;
    setCurrentWorkout(
      updateSets(currentWorkout, exIdx, sets =>
        sets.map((set, index) => (index === setIdx ? { ...set, [field]: value } : set)),
      ),
    );
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    if (!currentWorkout) return;
    setCurrentWorkout(updateSets(currentWorkout, exIdx, sets => sets.filter((_, index) => index !== setIdx)));
  };

  /**
   * Marks the workout as completed and passes it to `save`. The draft is cleared only
   * when `save` resolves to true, so a failed write keeps every entered set. While a save
   * is pending (Firestore waits for the connection when offline) further calls are ignored,
   * so the workout cannot be stored twice.
   */
  const finishWorkout = async (save: (workout: Workout) => Promise<boolean>): Promise<boolean> => {
    if (!currentWorkout || isFinishing) return false;
    setIsFinishing(true);
    try {
      const id = currentWorkout.id || crypto.randomUUID();
      const saved = await save({ ...currentWorkout, id, completed: true, date: getCurrentDate() });
      if (saved) setCurrentWorkout(null);
      return saved;
    } finally {
      setIsFinishing(false);
    }
  };

  return { currentWorkout, isFinishing, startWorkout, addSet, updateSet, removeSet, finishWorkout };
};
