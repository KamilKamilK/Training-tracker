export class LocalStorageService {
  static get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.warn(`LocalStorage get error for key: ${key}`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`LocalStorage set error for key: ${key}`, error);
    }
  }

  static remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`LocalStorage remove error for key: ${key}`, error);
    }
  }

  static clear(): void {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn('LocalStorage clear error', error);
    }
  }
}