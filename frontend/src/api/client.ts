import axios from 'axios'

export const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Intercepteur pour les erreurs
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.detail || error.message
        return Promise.reject(message)
    }
)


