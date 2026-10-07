import {
  DAYS_OF_WEEK,
  Exercise,
  Measurement,
  WeekPlan,
  WeekPlanDocument,
  Workout,
  WorkoutSet,
} from '../types/index.js';

type Data = Record<string, unknown>;

const isRecord = (value: unknown): value is Data =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isOptional = <T>(value: unknown, guard: (v: unknown) => v is T): boolean =>
  value === undefined || guard(value);

const parseSet = (value: unknown): WorkoutSet | null => {
  if (!isRecord(value)) return null;
  const { weight, reps, rir } = value;
  if (!isString(weight) || !isString(reps) || !isString(rir)) return null;
  return { weight, reps, rir };
};

const parseExercise = (value: unknown): Exercise | null => {
  if (!isRecord(value) || !isString(value.name) || !Array.isArray(value.sets)) return null;
  if (!isOptional(value.notes, isString)) return null;
  const sets = value.sets.map(parseSet);
  if (sets.some(s => s === null)) return null;
  return {
    name: value.name,
    sets: sets as WorkoutSet[],
    ...(isString(value.notes) ? { notes: value.notes } : {}),
  };
};

/**
 * Builds a Workout from untrusted data (Firestore document or LocalStorage draft).
 * Documents written before `exercises` and `notes` were required default to empty values;
 * any other missing or mistyped field makes the whole document invalid.
 */
export const parseWorkout = (id: string, value: unknown): Workout | null => {
  if (!isRecord(value) || !isString(value.type) || !isString(value.date)) return null;
  if (!isOptional(value.notes, isString) || !isOptional(value.duration, isFiniteNumber)) return null;
  if (value.completed !== undefined && typeof value.completed !== 'boolean') return null;

  const rawExercises = value.exercises ?? [];
  if (!Array.isArray(rawExercises)) return null;
  const exercises = rawExercises.map(parseExercise);
  if (exercises.some(e => e === null)) return null;

  return {
    id,
    type: value.type,
    date: value.date,
    exercises: exercises as Exercise[],
    notes: isString(value.notes) ? value.notes : '',
    ...(isFiniteNumber(value.duration) ? { duration: value.duration } : {}),
    ...(typeof value.completed === 'boolean' ? { completed: value.completed } : {}),
  };
};

export const parseMeasurement = (id: string, value: unknown): Measurement | null => {
  if (!isRecord(value) || !isString(value.date)) return null;
  if (!isFiniteNumber(value.weight) || !isFiniteNumber(value.waist)) return null;
  if (!isOptional(value.bodyFat, isFiniteNumber)) return null;
  const photos = value.photos;
  if (photos !== undefined && !(Array.isArray(photos) && photos.every(isString))) return null;

  return {
    id,
    date: value.date,
    weight: value.weight,
    waist: value.waist,
    ...(isFiniteNumber(value.bodyFat) ? { bodyFat: value.bodyFat } : {}),
    ...(photos !== undefined ? { photos: photos as string[] } : {}),
  };
};

export const parseWeekPlanDocument = (value: unknown): WeekPlanDocument | null => {
  if (!isRecord(value) || !isRecord(value.plan) || !isString(value.updatedAt)) return null;
  const plan = {} as WeekPlan;
  for (const day of DAYS_OF_WEEK) {
    const templateId = value.plan[day] ?? null;
    if (templateId !== null && !isString(templateId)) return null;
    plan[day] = templateId;
  }
  return { plan, updatedAt: value.updatedAt };
};
