import React, { useState, useEffect } from 'react'

/**
 * BackendStatus Component
 * Checks if the backend is reachable
 * 
 * @param {string} backendURL - The backend API URL
 */
const BackendStatus = ({ backendURL }) => {
  const [status, setStatus] = useState('checking') // 'online', 'offline', 'checking'
  const [lastChecked, setLastChecked] = useState(null)

  const checkBackend = async () => {
    setStatus('checking')
    try {
      // Try a simple POST request with minimal data to check connectivity
      const response = await fetch(backendURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'ping' }),
        mode: 'cors',
      }).catch(() => null)

      // If we get any response (even error), backend is reachable
      if (response !== null) {
        setStatus('online')
      } else {
        setStatus('offline')
      }
    } catch (error) {
      // Network error means backend is offline
      setStatus('offline')
    }
    setLastChecked(new Date())
  }

  useEffect(() => {
    checkBackend()
    // Check every 10 seconds
    const interval = setInterval(checkBackend, 10000)
    return () => clearInterval(interval)
  }, [backendURL])

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/40'
      case 'offline':
        return 'bg-rose-500/10 text-rose-200 border border-rose-400/40'
      default:
        return 'bg-amber-500/10 text-amber-100 border border-amber-300/30'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Backend Online'
      case 'offline':
        return 'Backend Offline'
      default:
        return 'Checking Connection...'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'offline':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )
    }
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-medium backdrop-blur ${getStatusColor()}`}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      <button
        onClick={checkBackend}
        className="ml-2 hover:opacity-80 transition-opacity"
        title="Recheck connection"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  )
}

export default BackendStatus

