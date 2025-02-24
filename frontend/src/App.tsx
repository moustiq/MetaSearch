// src/App.tsx
import { useState, useEffect } from 'react';
import MT5LoginForm from './components/MT5LoginForm';
import ConnectionIndicator from './components/ConnectionIndicator';
import { apiClient } from './api/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import './index.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [appStatus, setAppStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const checkConnection = async () => {
    try {
      const { data } = await apiClient.get('/status');
      setIsConnected(data.connected);
      setAppStatus(data.connected ? 'connected' : 'connecting');
    } catch (error) {
      setAppStatus('error');
    }
  };

  useEffect(() => {
    const interval = setInterval(checkConnection, 5000);
    checkConnection();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    const savedConnectionStatus = localStorage.getItem('isConnected');
    if (savedConnectionStatus) {
      setIsConnected(savedConnectionStatus === 'true');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('isConnected', isConnected.toString());
  }, [isConnected]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <div className="app-container">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
      >
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </button>
      {!isConnected ? (
        <MT5LoginForm onSuccess={() => checkConnection()} />
      ) : (
        <div className="home-page">
          <Router>
            <div className="App">
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                </Routes>
              </main>
            </div>
          </Router>
        </div>
      )}
      <ConnectionIndicator status={appStatus} />
    </div>
  );
}

export default App;
