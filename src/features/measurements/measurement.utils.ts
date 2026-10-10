import { Measurement } from '../../types/index.js';
import { z } from 'zod';
import { VALIDATION_RULES } from '../../constants/validation.js';
import { toFieldErrors } from '../../utils/form.utils.js';

export interface MeasurementInput {
  date: string;
  weight: string;
  waist: string;
}

export type MeasurementInputErrors = Partial<Record<keyof MeasurementInput, string>>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const decimalInRange = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform(value => Number(value.replace(',', '.')))
    .refine(value => Number.isFinite(value) && value >= min && value <= max, message);

const { minWeight, maxWeight, minWaist, maxWaist } = VALIDATION_RULES.measurement;

const MeasurementInputSchema = z.object({
  date: z
    .string()
    .refine(value => DATE_PATTERN.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), 'Podaj poprawną datę.')
    .refine(value => new Date(`${value}T00:00:00`).getTime() <= Date.now(), 'Data pomiaru nie może być z przyszłości.'),
  weight: decimalInRange(minWeight, maxWeight, `Waga musi mieścić się w zakresie ${minWeight}–${maxWeight} kg.`),
  waist: decimalInRange(minWaist, maxWaist, `Obwód talii musi mieścić się w zakresie ${minWaist}–${maxWaist} cm.`),
});

/** Validates the measurement form; returns the measurement or field-level messages. */
export const validateMeasurementInput = (
  input: MeasurementInput,
): { measurement: Omit<Measurement, 'id'> } | { errors: MeasurementInputErrors } => {
  const result = MeasurementInputSchema.safeParse(input);
  if (!result.success) return { errors: toFieldErrors<keyof MeasurementInput>(result.error) };
  return { measurement: result.data };
};

export const sortByDateAsc = (measurements: Measurement[]): Measurement[] =>
  [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const getLastMeasurement = (measurements: Measurement[]): Measurement | undefined =>
  sortByDateAsc(measurements).at(-1);

export const calculateWeightDiff = (current: Measurement, previous: Measurement): number => {
  return Number((current.weight - previous.weight).toFixed(1));
};

export const calculateWaistDiff = (current: Measurement, previous: Measurement): number => {
  return Number((current.waist - previous.waist).toFixed(1));
};
