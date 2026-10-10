import { z } from 'zod';
import { toFieldErrors } from '../../utils/form.utils.js';

/** Mirrors the password policy set in the Firebase console (README, „Konfiguracja Firebase”). */
export const PASSWORD_RULES = 'Co najmniej 8 znaków, w tym wielka i mała litera oraz cyfra.';

const email = z.string().trim().min(1, 'Podaj adres e-mail.').pipe(z.email('Podaj poprawny adres e-mail.'));

const password = z
  .string()
  .min(8, PASSWORD_RULES)
  .max(128, 'Hasło może mieć najwyżej 128 znaków.')
  .regex(/[a-z]/, PASSWORD_RULES)
  .regex(/[A-Z]/, PASSWORD_RULES)
  .regex(/\d/, PASSWORD_RULES);

const SignInSchema = z.object({ email, password: z.string().min(1, 'Podaj hasło.') });

const RegisterSchema = z
  .object({ email, password, confirmPassword: z.string() })
  .refine(input => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Hasła nie są takie same.',
  });

const ResetSchema = z.object({ email });

export type SignInInput = z.input<typeof SignInSchema>;
export type RegisterInput = z.input<typeof RegisterSchema>;
export type ResetInput = z.input<typeof ResetSchema>;
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const validate = <Input, Output>(
  schema: z.ZodType<Output, Input>,
  input: Input,
): { data: Output } | { errors: FieldErrors<Input> } => {
  const result = schema.safeParse(input);
  if (!result.success) return { errors: toFieldErrors<Extract<keyof Input, string>>(result.error) as FieldErrors<Input> };
  return { data: result.data };
};

export const validateSignIn = (input: SignInInput) => validate(SignInSchema, input);
export const validateRegister = (input: RegisterInput) => validate(RegisterSchema, input);
export const validateReset = (input: ResetInput) => validate(ResetSchema, input);
