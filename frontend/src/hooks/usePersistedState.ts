// src/hooks/usePersistedState.ts
import { useState, useEffect } from 'react';

const usePersistedState = <T>(
  key: string, 
  defaultValue: T
): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(() => {
    const storedValue = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};
export default usePersistedState;
// src/hooks/usePersistedState.ts