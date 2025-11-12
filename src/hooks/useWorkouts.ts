import { useState } from 'react';
import { Workout, WorkoutTemplate } from '../types/index.js';
import { useStorage } from './useStorage.js';
import { saveWorkoutToFirebase } from './../utils/firebaseHelpers.js';

export const useWorkouts = () => {
  const { workouts, setWorkouts, saveData } = useStorage();
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);

  const startWorkout = (template: WorkoutTemplate) => {
    const newWorkout: Workout = {
      id: Date.now(),
      type: template.name,
      date: new Date().toISOString().split('T')[0],
      exercises: template.exercises.map(name => ({
        name,
        sets: [],
      })),
      notes: '',
      completed: false,
    };
    setCurrentWorkout(newWorkout);
  };

  const addSet = (exerciseIndex: number) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exerciseIndex].sets.push({ weight: '', reps: '', rir: '' });
    setCurrentWorkout(updated);
  };

  const updateSet = (exIdx: number, setIdx: number, field: string, value: string) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exIdx].sets[setIdx][field as 'weight' | 'reps' | 'rir'] = value;
    setCurrentWorkout(updated);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exIdx].sets.splice(setIdx, 1);
    setCurrentWorkout(updated);
  };

  const finishWorkout = async () => {
    if (!currentWorkout) return;
    const finished = { ...currentWorkout, completed: true, date: new Date().toISOString() };
    const newList = [...workouts, finished];
    setWorkouts(newList);
    saveData();

    await saveWorkoutToFirebase(finished);
    setCurrentWorkout(null);
  };

  return {
    currentWorkout,
    workouts,
    startWorkout,
    addSet,
    updateSet,
    removeSet,
    finishWorkout,
  };
};
