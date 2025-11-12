import { useState, useEffect } from 'react';

/**
 * Uniwersalny hook do localStorage
 * @param key Klucz w localStorage
 * @param initialValue Wartość początkowa
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`❗ Błąd przy odczycie ${key} z localStorage`, error);
      return initialValue;
    }
  });

  // Aktualizacja localStorage przy każdej zmianie wartości
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`❗ Błąd przy zapisie ${key} do localStorage`, error);
    }
  }, [key, storedValue]);

  // Funkcja aktualizacji wartości
  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue(prev => (value instanceof Function ? value(prev) : value));
  };

  // Funkcja czyszczenia
  const clear = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`❗ Błąd przy czyszczeniu ${key} w localStorage`, error);
    }
  };

  return [storedValue, setValue, clear] as const;
}
