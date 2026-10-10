import { z } from 'zod';

/** First validation message per top-level form field. */
export const toFieldErrors = <Field extends string>(error: z.ZodError): Partial<Record<Field, string>> => {
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as Field | undefined;
    if (field !== undefined && errors[field] === undefined) errors[field] = issue.message;
  }
  return errors;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Parses form input with a schema; field errors carry the first message per field. */
export const validate = <Input, Output>(
  schema: z.ZodType<Output, Input>,
  input: Input,
): { data: Output } | { errors: FieldErrors<Input> } => {
  const result = schema.safeParse(input);
  if (!result.success) return { errors: toFieldErrors<Extract<keyof Input, string>>(result.error) as FieldErrors<Input> };
  return { data: result.data };
};
