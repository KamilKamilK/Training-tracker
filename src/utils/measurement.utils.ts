import { Measurement } from '../types/index.js';

export const promptForMeasurement = (): Omit<Measurement, 'id'> | null => {
  const date = prompt('Data pomiaru (YYYY-MM-DD):');
  if (!date) return null;
  
  const weightStr = prompt('Waga (kg):');
  const waistStr = prompt('Obwód talii (cm):');
  if (!weightStr || !waistStr) return null;
  
  const weight = parseFloat(weightStr);
  const waist = parseFloat(waistStr);
  
  if (isNaN(weight) || isNaN(waist)) return null;
  
  return { date, weight, waist };
};

export const getLastMeasurement = (measurements: Measurement[]): Measurement | undefined => {
  return measurements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

export const calculateWeightDiff = (current: Measurement, previous: Measurement): number => {
  return Number((current.weight - previous.weight).toFixed(1));
};

export const calculateWaistDiff = (current: Measurement, previous: Measurement): number => {
  return Number((current.waist - previous.waist).toFixed(1));
};