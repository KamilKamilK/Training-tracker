import { useState, useEffect } from 'react';
import { Measurement } from '../types/index.js';
import { MeasurementsService } from '../services/firebase/measurements.service.js';

export const useMeasurements = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await MeasurementsService.getAll();
        setMeasurements(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      } catch (err) {
        console.error('Measurements fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveMeasurement = async (measurement: Omit<Measurement, 'id'>) => {
    try {
      const id = await MeasurementsService.save(measurement);
      setMeasurements(prev => [...prev, { ...measurement, id }]);
      console.log('💾 Pomiar zapisany!');
    } catch (err) {
      console.error('Błąd zapisu pomiaru:', err);
    }
  };

  const deleteMeasurement = async (id: string) => {
    try {
      await MeasurementsService.delete(id);
      setMeasurements(prev => prev.filter(m => m.id !== id));
      console.log('🗑️ Pomiar usunięty!');
    } catch (err) {
      console.error('Błąd usuwania pomiaru:', err);
    }
  };

  return { measurements, saveMeasurement, deleteMeasurement, isLoading };
};