import { Measurement } from '../types/index.js';
import { VALIDATION_RULES } from '../constants/validation.js';

export interface MeasurementInput {
  date: string;
  weight: string;
  waist: string;
}

export type MeasurementInputErrors = Partial<Record<keyof MeasurementInput, string>>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDecimal = (value: string): number => Number(value.trim().replace(',', '.'));

/** Validates the measurement form; returns the measurement or field-level messages. */
export const validateMeasurementInput = (
  input: MeasurementInput,
): { measurement: Omit<Measurement, 'id'> } | { errors: MeasurementInputErrors } => {
  const { minWeight, maxWeight, minWaist, maxWaist } = VALIDATION_RULES.measurement;
  const errors: MeasurementInputErrors = {};

  const date = new Date(`${input.date}T00:00:00`);
  if (!DATE_PATTERN.test(input.date) || Number.isNaN(date.getTime())) {
    errors.date = 'Podaj poprawną datę.';
  } else if (date.getTime() > Date.now()) {
    errors.date = 'Data pomiaru nie może być z przyszłości.';
  }

  const weight = parseDecimal(input.weight);
  if (input.weight.trim() === '' || !Number.isFinite(weight) || weight < minWeight || weight > maxWeight) {
    errors.weight = `Waga musi mieścić się w zakresie ${minWeight}–${maxWeight} kg.`;
  }

  const waist = parseDecimal(input.waist);
  if (input.waist.trim() === '' || !Number.isFinite(waist) || waist < minWaist || waist > maxWaist) {
    errors.waist = `Obwód talii musi mieścić się w zakresie ${minWaist}–${maxWaist} cm.`;
  }

  if (Object.keys(errors).length > 0) return { errors };
  return { measurement: { date: input.date, weight, waist } };
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
