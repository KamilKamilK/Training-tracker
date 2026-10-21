import { useState, useCallback, useRef } from 'react';
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
  // The latest draft, read when a save resolves: by then another workout may have been started.
  const draftRef = useRef(currentWorkout);

  const setCurrentWorkout = useCallback((workout: Workout | null) => {
    draftRef.current = workout;
    setCurrentWorkoutState(workout);
    persistDraft(workout);
  }, []);

  /**
   * Starts a workout from the template and resolves to whether it started. A draft is replaced only
   * with `replaceDraft`, so entered sets are never lost by accident; a draft whose save is pending
   * is already handed to Firestore and does not block a new workout.
   */
  const startWorkout = (template: WorkoutTemplate, { replaceDraft = false } = {}): boolean => {
    if (currentWorkout && !isFinishing && !replaceDraft) return false;
    setCurrentWorkout({
      id: crypto.randomUUID(),
      type: template.name,
      date: getCurrentDate(),
      exercises: template.exercises.map(name => ({ name, sets: [] })),
      notes: '',
      completed: false,
    });
    return true;
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
   * when `save` resolves to true, so a failed write keeps every entered set, and only if it is
   * still the saved workout, so a workout started meanwhile stays. While a save is pending
   * (Firestore waits for the connection when offline) further calls are ignored, so the workout
   * cannot be stored twice.
   */
  const finishWorkout = async (save: (workout: Workout) => Promise<boolean>): Promise<boolean> => {
    if (!currentWorkout || isFinishing) return false;
    setIsFinishing(true);
    try {
      const draftId = currentWorkout.id;
      const id = draftId || crypto.randomUUID();
      const saved = await save({ ...currentWorkout, id, completed: true, date: getCurrentDate() });
      if (saved && draftRef.current?.id === draftId) setCurrentWorkout(null);
      return saved;
    } finally {
      setIsFinishing(false);
    }
  };

  return { currentWorkout, isFinishing, startWorkout, addSet, updateSet, removeSet, finishWorkout };
};
