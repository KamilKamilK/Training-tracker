import { Workout, WorkoutTemplate } from '../../types/index.js';
import { isThisMonth, isThisWeek } from '../../utils/date.utils.js';

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

/**
 * The latest workout started from the template, matched by template id, so renaming the template
 * keeps its history. Workouts saved before the id was stored have only the template name and are
 * matched by it.
 */
export const getLastWorkout = (workouts: Workout[], template: WorkoutTemplate): Workout | undefined => {
  return sortByDateDesc(
    workouts.filter(w => (w.templateId === undefined ? w.type === template.name : w.templateId === template.id)),
  )[0];
};
