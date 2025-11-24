import React from 'react'

/**
 * ErrorMessage Component
 * Displays error messages in a user-friendly way
 * 
 * @param {string} message - Error message to display
 * @param {function} onDismiss - Optional callback to dismiss the error
 */
const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null

  return (
    <div className="mb-4 p-4 bg-rose-500/10 border border-rose-400/40 rounded-2xl animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <svg
            className="w-5 h-5 text-rose-200 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-rose-100 flex-1">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-rose-200 hover:text-rose-100 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage








