import { z } from 'zod';
import { validate } from '../../utils/form.utils.js';

const displayName = z.string().trim().min(1, 'Podaj imię.').max(60, 'Imię może mieć najwyżej 60 znaków.');

const ActivationSchema = z.object({
  displayName,
  healthConsent: z.boolean().refine(accepted => accepted, 'Zaznacz zgodę — bez niej konto pozostaje nieaktywne.'),
});

const DisplayNameSchema = z.object({ displayName });

export type ActivationInput = z.input<typeof ActivationSchema>;
export type DisplayNameInput = z.input<typeof DisplayNameSchema>;

export const validateActivation = (input: ActivationInput) => validate(ActivationSchema, input);
export const validateDisplayName = (input: DisplayNameInput) => validate(DisplayNameSchema, input);
