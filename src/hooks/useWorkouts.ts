import { useState } from 'react';
import { Workout, WorkoutTemplate } from '../types/index.js';

export const useWorkouts = () => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);

  const startWorkout = (template: WorkoutTemplate) => {
    const newWorkout: Workout = {
      id: '', // zostanie nadane przez Firestore
      type: template.name,
      date: new Date().toISOString(),
      exercises: template.exercises.map(name => ({ name, sets: [] })),
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

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps' | 'rir', value: string) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exIdx].sets[setIdx][field] = value;
    setCurrentWorkout(updated);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    if (!currentWorkout) return;
    const updated = { ...currentWorkout };
    updated.exercises[exIdx].sets.splice(setIdx, 1);
    setCurrentWorkout(updated);
  };

  const finishWorkout = () => {
    if (!currentWorkout) return null;
    const finished: Workout = { 
      ...currentWorkout, 
      completed: true, 
      date: new Date().toISOString() 
    };
    setCurrentWorkout(null);
    return finished; // zwracamy trening zamiast go zapisywać
  };

  return { currentWorkout, startWorkout, addSet, updateSet, removeSet, finishWorkout };
};