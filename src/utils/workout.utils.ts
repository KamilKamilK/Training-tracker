import { Workout } from '../types/index.js';
import { isThisMonth, isThisWeek } from './date.utils.js';

export const getTotalSets = (workout: Workout): number => {
  return workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
};

export const getExerciseCount = (workout: Workout): number => {
  return workout.exercises.filter(ex => ex.sets.length > 0).length;
};

export const filterByMonth = (workouts: Workout[]): Workout[] => {
  return workouts.filter(w => isThisMonth(w.date));
};

export const filterByWeek = (workouts: Workout[]): Workout[] => {
  return workouts.filter(w => isThisWeek(w.date));
};

export const sortByDateDesc = (workouts: Workout[]): Workout[] => {
  return [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getLastWorkout = (workouts: Workout[], templateName: string): Workout | undefined => {
  return workouts
    .filter(w => w.type === templateName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};