import React from 'react'

/**
 * BrowserCheck Component
 * Shows browser compatibility information for voice recognition
 */
const BrowserCheck = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const browserName = userAgent.includes('Chrome') ? 'Chrome' :
                      userAgent.includes('Edge') ? 'Edge' :
                      userAgent.includes('Safari') ? 'Safari' :
                      userAgent.includes('Firefox') ? 'Firefox' : 'Unknown'

  if (isSupported) {
    return null // Don't show anything if supported
  }

  return (
    <div className="mb-4 p-4 bg-cyan-500/10 border border-cyan-400/20 rounded-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-cyan-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white mb-1">
            Voice Recognition Not Available
          </p>
          <p className="text-xs text-slate-200">
            Your browser ({browserName}) does not support voice recognition. 
            {browserName === 'Firefox' && ' Please use Chrome, Edge, or Safari for voice input.'}
            {browserName !== 'Firefox' && ' Please use Chrome or Edge for the best experience.'}
            You can still use the text input below.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BrowserCheck








