import { useState, useEffect } from 'react';

/**
 * Custom hook for managing state with localStorage persistence
 * @param key - The localStorage key to use
 * @param initialValue - The initial value if nothing is in localStorage
 * @returns [value, setValue] - The current value and a function to update it
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initialization to read from localStorage on first render
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Effect to write to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}