import React from 'react'

/**
 * LoadingSpinner Component
 * Displays a professional loading indicator
 */
const LoadingSpinner = ({ message = "Processing..." }) => {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-b-transparent border-l-transparent text-cyan-400"></div>
      <span className="text-slate-200 font-medium">{message}</span>
    </div>
  )
}

export default LoadingSpinner








