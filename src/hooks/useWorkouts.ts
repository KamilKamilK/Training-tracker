import { useState, useEffect } from 'react';
import { Workout, WorkoutTemplate } from '../types/index.js';
import { getCurrentDate } from '../utils/date.utils.js';
import { LocalStorageService } from '../services/storage/localStorage.service.js';
import { STORAGE_KEYS } from '../constants/config.js';

export const useWorkouts = () => {
const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(() => {
    // wczytaj szkic z LocalStorage przy inicjalizacji
    return LocalStorageService.get<Workout | null>(STORAGE_KEYS.currentWorkoutDraft, null);
  });

  useEffect(() => {
    // dopilnuj, że jeśli ktoś ręcznie wyczyści LocalStorage poza hookiem, stan zsynchronizowany
    const stored = LocalStorageService.get<Workout | null>(STORAGE_KEYS.currentWorkoutDraft, null);
    if (!currentWorkout && stored) {
      setCurrentWorkout(stored);
    }
  }, []);

  const startWorkout = (template: WorkoutTemplate) => {
    const newWorkout: Workout = {
      id: '',
      type: template.name,
      date: getCurrentDate(),
      exercises: template.exercises.map(name => ({ name, sets: [] })),
      notes: '',
      completed: false,
    };
    setCurrentWorkout(newWorkout);
    LocalStorageService.set(STORAGE_KEYS.currentWorkoutDraft, newWorkout);
  };

  const addSet = (exerciseIndex: number) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets.push({ weight: '', reps: '', rir: '' });
    setCurrentWorkout(updated);
    LocalStorageService.set(STORAGE_KEYS.currentWorkoutDraft, updated);
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: 'weight' | 'reps' | 'rir',
    value: string
  ) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exIdx].sets[setIdx][field] = value;
    setCurrentWorkout(updated);
    LocalStorageService.set(STORAGE_KEYS.currentWorkoutDraft, updated);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exIdx].sets.splice(setIdx, 1);
    setCurrentWorkout(updated);
    LocalStorageService.set(STORAGE_KEYS.currentWorkoutDraft, updated);
  };

  const finishWorkout = (): Workout | null => {
    if (!currentWorkout) return null;
    const finished: Workout = {
      ...currentWorkout,
      completed: true,
      date: getCurrentDate(),
    };
    setCurrentWorkout(null);
    // usuń szkic po zakończeniu treningu
    LocalStorageService.set(STORAGE_KEYS.currentWorkoutDraft, null);
    return finished;
  };

  return { currentWorkout, startWorkout, addSet, updateSet, removeSet, finishWorkout };
};