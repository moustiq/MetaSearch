// src/components/UserSettings.tsx
import usePersistedState  from '../hooks/usePersistedState'; // Ensure this path is correct or update it to the correct path
import { UserPreferences } from '../types/userPreferences';

const UserSettings = () => {
  const [preferences, setPreferences] = usePersistedState<UserPreferences>('userPreferences', {
    theme: 'light',
    fontSize: 16,
    language: 'fr',
  });

  const toggleTheme = () => {
    setPreferences({
      ...preferences,
      theme: preferences.theme === 'light' ? 'dark' : 'light',
    });
  };

  return (
    <div>
      <button onClick={toggleTheme}>
        Activer le thème {preferences.theme === 'light' ? 'sombre' : 'clair'}
      </button>
      <p>Taille de police : {preferences.fontSize}px</p>
    </div>
  );
};

export default UserSettings;
