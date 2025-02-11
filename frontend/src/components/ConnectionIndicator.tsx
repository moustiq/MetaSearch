// src/components/ConnectionIndicator.tsx


const ConnectionIndicator = ({ status }: { status: 'connecting' | 'connected' | 'error' }) => {
  const statusColors = {
    connected: '#4CAF50',
    error: '#FF5252',
    connecting: '#FFC107'
  }

  return (
    <div className="connection-indicator" style={{ 
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      backgroundColor: statusColors[status],
      boxShadow: '0 0 10px rgba(0,0,0,0.2)'
    }}>
      {status === 'connecting' && (
        <div className="pulse-effect" />
      )}
    </div>
  )
}

export default ConnectionIndicator
