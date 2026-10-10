import { z } from 'zod';
import { VALIDATION_RULES } from '../../constants/validation.js';
import { toFieldErrors } from '../../utils/form.utils.js';

export interface TemplateInputErrors {
  name?: string;
  exercises?: string;
}

const { minNameLength, maxNameLength, minExercises, maxExercises } = VALIDATION_RULES.template;

const TemplateInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(minNameLength, `Nazwa musi mieć od ${minNameLength} do ${maxNameLength} znaków.`)
    .max(maxNameLength, `Nazwa musi mieć od ${minNameLength} do ${maxNameLength} znaków.`),
  exercises: z
    .array(z.string())
    .transform(exercises => exercises.map(exercise => exercise.trim()).filter(Boolean))
    .refine(
      exercises => exercises.length >= minExercises && exercises.length <= maxExercises,
      `Szablon musi mieć od ${minExercises} do ${maxExercises} ćwiczeń.`,
    ),
});

/**
 * Validates the template form. Exercise fields left empty are dropped, so the returned
 * template data holds the trimmed name and only filled-in exercises.
 */
export const validateTemplateInput = (input: {
  name: string;
  exercises: string[];
}): { name: string; exercises: string[] } | { errors: TemplateInputErrors } => {
  const result = TemplateInputSchema.safeParse(input);
  if (!result.success) return { errors: toFieldErrors<keyof TemplateInputErrors>(result.error) };
  return result.data;
};
