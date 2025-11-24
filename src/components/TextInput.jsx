import React, { useState } from 'react'

/**
 * TextInput Component
 * Text input field with send button and loading state
 * 
 * @param {function} onSend - Callback when message is sent
 * @param {boolean} isLoading - Whether a request is in progress
 */
const TextInput = ({ onSend, isLoading }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSend(message.trim())
      setMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3 flex-col lg:flex-row">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={isLoading}
          rows={3}
          className="
            flex-1 px-4 py-3 rounded-2xl border border-white/15 bg-slate-950/60 text-slate-100 placeholder-slate-500
            focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40
            resize-none text-base
            disabled:bg-slate-800/50 disabled:text-slate-500 disabled:cursor-not-allowed
            transition-all duration-200
          "
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="
            px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white rounded-2xl font-semibold
            hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-0.5
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg shadow-cyan-500/30
            whitespace-nowrap self-start lg:self-auto
          "
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </span>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </form>
  )
}

export default TextInput








