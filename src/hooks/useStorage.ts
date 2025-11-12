import { useState, useEffect } from 'react';
import { Workout, Measurement } from '../types/index.js';
import { useLocalStorage } from './useLocalStorage.js';

/**
 * Hook aplikacji do zarządzania stanem treningów i pomiarów
 */
export function useStorage() {
  // 🔹 Stan za pomocą useLocalStorage
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('workouts', []);
  const [measurements, setMeasurements] = useLocalStorage<Measurement[]>('measurements', []);

  // 🔹 Stan ładowania (na początku)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Możesz tu dodać dodatkowe asynchroniczne inicjalizacje np. z Firebase
    setIsLoading(false);
  }, []);

  // 🔹 Funkcja zapisu danych do localStorage
  const saveData = () => {
    try {
      setWorkouts(prev => [...prev]); // trigger zapis
      setMeasurements(prev => [...prev]);
      console.log('💾 Dane zapisane!');
    } catch (error) {
      console.warn('❌ Błąd przy zapisie danych', error);
    }
  };

  return {
    workouts,
    setWorkouts,
    measurements,
    setMeasurements,
    saveData,
    isLoading
  };
}
