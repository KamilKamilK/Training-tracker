import { z } from 'zod';

export const WorkoutSetSchema = z.object({
  weight: z.string(),
  reps: z.string(),
  rir: z.string(),
});

export const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.array(WorkoutSetSchema),
  notes: z.string().optional(),
});

/**
 * Workout document as stored in Firestore and in the LocalStorage draft. Documents written before
 * `exercises` and `notes` were required default to empty values. `type` is the template name at the
 * start of the workout; `templateId` links it to the template and is missing in workouts started
 * before it was stored.
 */
export const WorkoutDocumentSchema = z.object({
  type: z.string(),
  templateId: z.string().optional(),
  date: z.string(),
  exercises: z.array(ExerciseSchema).default([]),
  notes: z.string().default(''),
  duration: z.number().finite().optional(),
  completed: z.boolean().optional(),
});

export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Workout = z.infer<typeof WorkoutDocumentSchema> & { id: string };
