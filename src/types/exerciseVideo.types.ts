import { z } from 'zod';
import { VALIDATION_RULES } from '../constants/validation.js';

const { maxBytes, maxDurationSec, maxExerciseNameLength } = VALIDATION_RULES.exerciseVideo;

/**
 * Technique video of an exercise, stored in exerciseVideos/{id} (ADR-0019). The document id is the
 * SHA-256 of `exerciseName`, the exact exercise text from the template, so an exercise has at most
 * one video. The file itself is `{mediaId}.mp4` in the private Supabase Storage bucket.
 */
export const ExerciseVideoDocumentSchema = z.object({
  exerciseName: z.string().min(1).max(maxExerciseNameLength),
  mediaId: z.uuid(),
  sizeBytes: z.int().positive().max(maxBytes),
  durationSec: z.number().positive().max(maxDurationSec),
  uploadedAt: z.string(),
});

export type ExerciseVideoDocument = z.infer<typeof ExerciseVideoDocumentSchema>;
export type ExerciseVideo = ExerciseVideoDocument & { id: string };
