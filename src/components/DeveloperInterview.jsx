import React, { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import VoiceInput from './VoiceInput'
import TextInput from './TextInput'
import LoadingSpinner from './LoadingSpinner'
import CameraPreview from './CameraPreview'

/**
 * DeveloperInterview Component
 * Split view for developer interviews:
 * - Left: Questions with input/output examples
 * - Right: Coding space
 */
const DeveloperInterview = ({ 
  messages, 
  isLoading, 
  error, 
  onSendMessage, 
  onVoiceTranscript, 
  onVoiceError,
  currentQuestion,
  questionInput,
  questionOutput,
  messagesEndRef
}) => {
  const [code, setCode] = useState('')
  const codeEditorRef = useRef(null)

  // Auto-resize code editor
  useEffect(() => {
    if (codeEditorRef.current) {
      codeEditorRef.current.style.height = 'auto'
      codeEditorRef.current.style.height = `${codeEditorRef.current.scrollHeight}px`
    }
  }, [code])

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 min-h-[600px]">
      {/* Left Side: Questions with Input/Output */}
      <div className="flex-1 flex flex-col bg-slate-900/60 border border-white/10 rounded-3xl shadow-2xl shadow-black/40 p-6 backdrop-blur-xl min-h-[600px]">
        <h3 className="text-xl font-bold text-white mb-4">Interview Questions</h3>
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar min-h-[300px]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 text-center">
                The interview will begin shortly...
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg.message}
                  sender={msg.sender}
                  timestamp={msg.timestamp}
                />
              ))}
              {isLoading && <LoadingSpinner message="Processing..." />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Current Question Display with Input/Output */}
        {currentQuestion && (
          <div className="mb-4 p-4 bg-cyan-500/10 rounded-2xl border border-cyan-400/20">
            <h4 className="font-semibold text-white mb-3">Current Coding Problem:</h4>
            <div className="text-sm text-slate-100 mb-3 whitespace-pre-wrap">
              {currentQuestion.split('\n').map((line, idx) => {
                // Highlight Input/Output labels
                if (line.match(/^(Input|Output|Example):/i)) {
                  return (
                    <div key={idx} className="font-semibold text-cyan-200 mt-2">
                      {line}
                    </div>
                  )
                }
                return <div key={idx}>{line}</div>
              })}
            </div>
            
            {questionInput && (
              <div className="mb-3 p-2 bg-slate-950/40 rounded-2xl border border-white/10">
                <span className="text-xs font-semibold text-slate-200 block mb-1">Input:</span>
                <pre className="text-xs text-slate-100 font-mono overflow-x-auto whitespace-pre-wrap bg-slate-950/40 border border-white/10 rounded-xl p-2">
                  {questionInput}
                </pre>
              </div>
            )}
            
            {questionOutput && (
              <div className="p-2 bg-slate-950/40 rounded-2xl border border-white/10">
                <span className="text-xs font-semibold text-slate-200 block mb-1">Expected Output:</span>
                <pre className="text-xs text-slate-100 font-mono overflow-x-auto whitespace-pre-wrap bg-slate-950/40 border border-white/10 rounded-xl p-2">
                  {questionOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-400/40 rounded-2xl">
            <p className="text-sm text-rose-100">{error}</p>
          </div>
        )}

        {/* Voice Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Voice Input
          </label>
          <VoiceInput
            onTranscript={onVoiceTranscript}
            onError={onVoiceError}
          />
        </div>

        {/* Camera Presence */}
        <div className="mb-4">
          <CameraPreview />
        </div>

        {/* Divider */}
        <div className="flex items-center my-2">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-4 text-sm text-slate-400">or</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Text Input
          </label>
          <TextInput onSend={onSendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Right Side: Coding Space */}
      <div className="flex-1 flex flex-col bg-slate-950/70 border border-white/10 rounded-3xl shadow-2xl shadow-black/40 p-6 min-h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Code Editor</h3>
          <button
            onClick={() => setCode('')}
            className="px-3 py-1.5 text-sm rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
          >
            Clear
          </button>
        </div>
        
        <textarea
          ref={codeEditorRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your code here..."
          className="
            flex-1 w-full bg-slate-900 text-emerald-300 font-mono text-sm
            p-4 rounded-2xl border border-white/10
            focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/60
            resize-none overflow-y-auto
            custom-scrollbar-dark
          "
          style={{ minHeight: '400px' }}
        />
        
        <div className="mt-4 p-3 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-xs text-slate-300">
            💡 Tip: Write your solution in the code editor. You can explain your approach using voice or text input.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DeveloperInterview

