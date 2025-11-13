import { Workout, Measurement, WorkoutTemplate } from '../types/index.js';
import { VALIDATION_RULES } from '../constants/validation.js';

export const validateMeasurement = (m: Partial<Measurement>): boolean => {
  if (!m.date || !m.weight || !m.waist) return false;
  
  const { minWeight, maxWeight, minWaist, maxWaist } = VALIDATION_RULES.measurement;
  
  return (
    m.weight >= minWeight &&
    m.weight <= maxWeight &&
    m.waist >= minWaist &&
    m.waist <= maxWaist
  );
};

export const validateWorkout = (w: Partial<Workout>): boolean => {
  if (!w.type || !w.date || !w.exercises) return false;
  
  const { minExercises, maxExercises } = VALIDATION_RULES.workout;
  const exerciseCount = w.exercises.filter(ex => ex.sets.length > 0).length;
  
  return exerciseCount >= minExercises && exerciseCount <= maxExercises;
};

export const validateTemplate = (t: Partial<WorkoutTemplate>): boolean => {
  if (!t.name || !t.exercises) return false;
  
  const { minNameLength, maxNameLength, minExercises, maxExercises } = VALIDATION_RULES.template;
  
  return (
    t.name.length >= minNameLength &&
    t.name.length <= maxNameLength &&
    t.exercises.length >= minExercises &&
    t.exercises.length <= maxExercises
  );
};