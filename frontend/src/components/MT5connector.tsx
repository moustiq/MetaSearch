import { useEffect, useState } from 'react'
import axios from 'axios'

interface MT5Status {
    connected: boolean
    version?: string
    terminal_info?: {
        community_account: boolean
        community_connection: boolean
        connected: boolean
        // ...autres champs
    }
    error?: string
}

const MT5Connector = () => {
    const [status, setStatus] = useState<MT5Status | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await axios.get('http://localhost:8000/status')
                setStatus(response.data)
            } catch (error) {
                console.error('Erreur de connexion:', error)
                setStatus({
                    connected: false,
                    error: 'Impossible de contacter le serveur backend'
                })
            } finally {
                setLoading(false)
            }
        }

        checkConnection()
    }, [])

    if (loading) return <div>Vérification de la connexion MT5...</div>

    return (
        <div className="mt5-connector">
            <h2>Statut MT5</h2>
            {status?.connected ? (
                <div className="connected">
                    <p>✅ Connecté à MT5 (v{status.version})</p>
                    <p>Broker: {status.terminal_info?.community_account}</p>
                </div>
            ) : (
                <div className="error">
                    <p>❌ Échec de la connexion</p>
                    {status?.error && <p>Erreur: {status.error}</p>}
                </div>
            )}
        </div>
    )
}

export default MT5Connector
