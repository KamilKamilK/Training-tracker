import { useState, useEffect, useCallback } from 'react';
import { Measurement } from '../types/index.js';
import { MeasurementsService } from '../services/firebase/measurements.service.js';
import { sortByDateAsc } from '../utils/measurement.utils.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

export const useMeasurements = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    MeasurementsService.getAll()
      .then(data => {
        if (!cancelled) setMeasurements(sortByDateAsc(data));
      })
      .catch(() => {
        if (!cancelled) setError(ERROR_MESSAGES.loadMeasurements);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Resolves to true only when Firestore confirmed the write. */
  const saveMeasurement = useCallback(async (measurement: Omit<Measurement, 'id'>): Promise<boolean> => {
    try {
      const id = await MeasurementsService.save(measurement);
      setMeasurements(prev => sortByDateAsc([...prev, { ...measurement, id }]));
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
      setMeasurements(prev => prev.filter(m => m.id !== id));
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
