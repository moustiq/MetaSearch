// src/components/MT5LoginForm.tsx (version simplifiée)
import React, { useState } from 'react'
import { apiClient } from '../api/client'

const MT5LoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [credentials, setCredentials] = useState({
    server: '',
    login: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await apiClient.post('/connect', {
        server: credentials.server,
        login: Number(credentials.login),
        password: credentials.password
      })
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-form">
      {loading && <div className="loading-overlay">Connexion en cours...</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Serveur MT5"
          value={credentials.server}
          onChange={(e) => setCredentials({ ...credentials, server: e.target.value })}
        />
        <input
          type="number"
          placeholder="Numéro de compte"
          value={credentials.login}
          onChange={(e) => setCredentials({ ...credentials, login: e.target.value })}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

export default MT5LoginForm
