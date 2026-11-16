import { useState, useEffect } from 'react';

/**
 * Custom React hook that debounces fast-changing values (such as search keystrokes)
 * to prevent unnecessary re-render cascades across heavy downstream component trees.
 *
 * @param value Fast-changing input value
 * @param delayMs Debounce delay in milliseconds (default: 150ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delayMs: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

