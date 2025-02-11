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

  return (
    <div className="app-container">
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
