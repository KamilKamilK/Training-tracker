import { VALIDATION_RULES } from '../constants/validation.js';

export interface TemplateInputErrors {
  name?: string;
  exercises?: string;
}

/**
 * Validates the template form. Exercise fields left empty are dropped, so the returned
 * template data holds the trimmed name and only filled-in exercises.
 */
export const validateTemplateInput = (input: {
  name: string;
  exercises: string[];
}): { name: string; exercises: string[] } | { errors: TemplateInputErrors } => {
  const { minNameLength, maxNameLength, minExercises, maxExercises } = VALIDATION_RULES.template;
  const name = input.name.trim();
  const exercises = input.exercises.map(exercise => exercise.trim()).filter(Boolean);
  const errors: TemplateInputErrors = {};

  if (name.length < minNameLength || name.length > maxNameLength) {
    errors.name = `Nazwa musi mieć od ${minNameLength} do ${maxNameLength} znaków.`;
  }
  if (exercises.length < minExercises || exercises.length > maxExercises) {
    errors.exercises = `Szablon musi mieć od ${minExercises} do ${maxExercises} ćwiczeń.`;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { name, exercises };
};
