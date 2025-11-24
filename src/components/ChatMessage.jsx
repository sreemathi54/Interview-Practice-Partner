import React from 'react'

/**
 * ChatMessage Component
 * Displays a chat message bubble (user or backend)
 * 
 * @param {string} message - The message text
 * @param {string} sender - 'user' or 'backend'
 * @param {string} timestamp - Optional timestamp
 */
const ChatMessage = ({ message, sender, timestamp }) => {
  const isUser = sender === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white rounded-br-none shadow-cyan-500/40'
            : 'bg-white/10 text-slate-100 rounded-bl-none border border-white/10 backdrop-blur-xl'
        }`}
      >
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
          {message}
        </p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-slate-300'}`}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  )
}

export default ChatMessage








