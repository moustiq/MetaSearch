// src/context/PreferencesContext.tsx
import { createContext, useContext } from 'react';
import usePersistedState from '../hooks/usePersistedState';
import { UserPreferences } from '../types/userPreferences';

const PreferencesContext = createContext<{
  preferences: UserPreferences;
  setPreferences: (value: UserPreferences) => void;
} | null>(null);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = usePersistedState<UserPreferences>(
    'userPreferences',
    { theme: 'light', fontSize: 16, language: 'fr' }
  );

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext)!;
