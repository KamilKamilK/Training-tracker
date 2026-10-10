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
