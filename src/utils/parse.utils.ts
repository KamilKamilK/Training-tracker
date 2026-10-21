import {
  MeasurementDocumentSchema,
  UserProfileDocumentSchema,
  WeekPlanDocumentSchema,
  WorkoutDocumentSchema,
  WorkoutTemplateSchema,
  type Measurement,
  type UserProfile,
  type WeekPlanDocument,
  type Workout,
  type WorkoutTemplate,
} from '../types/index.js';

/** Builds a Workout from untrusted data (Firestore document or LocalStorage draft); null when invalid. */
export const parseWorkout = (id: string, value: unknown): Workout | null => {
  const result = WorkoutDocumentSchema.safeParse(value);
  return result.success ? { id, ...result.data } : null;
};

/** The LocalStorage draft keeps its workout id, so saving it again overwrites the same document. */
export const parseWorkoutDraft = (value: unknown): Workout | null => {
  const id = typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string' ? value.id : '';
  return parseWorkout(id, value);
};

export const parseMeasurement = (id: string, value: unknown): Measurement | null => {
  const result = MeasurementDocumentSchema.safeParse(value);
  return result.success ? { id, ...result.data } : null;
};

export const parseWeekPlanDocument = (value: unknown): WeekPlanDocument | null => {
  const result = WeekPlanDocumentSchema.safeParse(value);
  return result.success ? result.data : null;
};

/** Builds a template from an untrusted Firestore document stored under the template id. */
export const parseTemplate = (id: string, value: unknown): WorkoutTemplate | null => {
  if (typeof value !== 'object' || value === null) return null;
  const result = WorkoutTemplateSchema.safeParse({ ...value, id });
  return result.success ? result.data : null;
};

/** Valid templates from untrusted LocalStorage data; the number of skipped entries is reported. */
export const parseTemplates = (value: unknown): { templates: WorkoutTemplate[]; skipped: number } => {
  if (!Array.isArray(value)) return { templates: [], skipped: value === null || value === undefined ? 0 : 1 };
  const templates = value.flatMap(item => {
    const result = WorkoutTemplateSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
  return { templates, skipped: value.length - templates.length };
};

export const parseUserProfile = (value: unknown): UserProfile | null => {
  const result = UserProfileDocumentSchema.safeParse(value);
  return result.success ? result.data : null;
};
