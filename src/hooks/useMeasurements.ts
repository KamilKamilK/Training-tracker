import { useState, useEffect, useCallback } from 'react';
import { Measurement } from '../types/index.js';
import { MeasurementsService } from '../services/firebase/measurements.service.js';
import { sortByDateAsc } from '../utils/measurement.utils.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

/** Measurements kept in sync with Firestore; writes show up through the subscription. */
export const useMeasurements = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      MeasurementsService.subscribe(
        data => {
          setMeasurements(sortByDateAsc(data));
          setIsLoading(false);
        },
        () => {
          setError(ERROR_MESSAGES.loadMeasurements);
          setIsLoading(false);
        },
      ),
    [],
  );

  /** Resolves to true only when Firestore confirmed the write. */
  const saveMeasurement = useCallback(async (measurement: Omit<Measurement, 'id'>): Promise<boolean> => {
    try {
      await MeasurementsService.save(measurement);
      setError(null);
      return true;
    } catch {
      setError(ERROR_MESSAGES.saveMeasurement);
      return false;
    }
  }, []);

  const deleteMeasurement = useCallback(async (id: string): Promise<boolean> => {
    try {
      await MeasurementsService.delete(id);
      setError(null);
      return true;
    } catch {
      setError(ERROR_MESSAGES.deleteMeasurement);
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { measurements, saveMeasurement, deleteMeasurement, isLoading, error, clearError };
};
