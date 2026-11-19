export const VALIDATION_RULES = {
  measurement: {
    minWeight: 30,
    maxWeight: 300,
    minWaist: 50,
    maxWaist: 200,
  },
  template: {
    minNameLength: 3,
    maxNameLength: 50,
    minExercises: 1,
    maxExercises: 20,
  },
  // Mirrored in firestore.rules (isValidExerciseVideo) and in the Supabase bucket limits (ADR-0019).
  exerciseVideo: {
    maxBytes: 10 * 1024 * 1024,
    maxDurationSec: 30,
    maxExerciseNameLength: 200,
  },
};