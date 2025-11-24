import React, { useState, useRef, useEffect } from 'react'

/**
 * VoiceInput Component
 * Reliable voice recording with proper error handling
 * 
 * @param {function} onTranscript - Callback when transcription is ready
 * @param {function} onError - Callback for errors
 */
const VoiceInput = ({ onTranscript, onError }) => {
  const [isListening, setIsListening] = useState(false)
  const [warning, setWarning] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)
  const hasResultRef = useRef(false)

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const supported = typeof SpeechRecognition !== 'undefined'
      setIsSupported(supported)
      setIsInitialized(true)
      
      if (!supported) {
        if (onError) {
          onError('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.')
        }
      }
    }

    checkSupport()
    const timeout = setTimeout(checkSupport, 100)
    
    return () => clearTimeout(timeout)
  }, [onError])

  // Create recognition instance
  const createRecognition = () => {
    if (!isSupported) {
      return null
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    try {
      const recognition = new SpeechRecognition()
      
      // Simple, reliable configuration
      recognition.continuous = false
      recognition.interimResults = false  // Disable interim for more reliable results
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        hasResultRef.current = false
        setWarning('')
        setIsListening(true)
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Set timeout for no speech (10 seconds)
        timeoutRef.current = setTimeout(() => {
          if (!hasResultRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.stop()
            } catch (e) {
              // Ignore
            }
            setWarning('No voice detected. Please speak clearly or type your message.')
            setIsListening(false)
          }
        }, 10000)
      }

      recognition.onresult = (event) => {
        // Clear timeout since we got a result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        hasResultRef.current = true
        
        if (event.results && event.results.length > 0) {
          const result = event.results[0]
          if (result && result.length > 0) {
            const transcript = result[0].transcript
            
            if (transcript && transcript.trim()) {
              setWarning('')
              
              // Call the callback with the transcript
              if (onTranscript) {
                onTranscript(transcript.trim())
              }
            }
          }
        }
        
        setIsListening(false)
      }

      recognition.onerror = (event) => {
        setIsListening(false)
        hasResultRef.current = false
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        // Handle specific errors
        switch (event.error) {
          case 'no-speech':
            if (!hasResultRef.current) {
              setWarning('No voice detected. Please speak clearly or type your message.')
            }
            break
          case 'audio-capture':
            if (onError) {
              onError('No microphone found. Please connect a microphone and try again.')
            }
            break
          case 'not-allowed':
            if (onError) {
              onError('Microphone access denied. Please allow microphone access in your browser settings and try again.')
            }
            break
          case 'network':
            if (onError) {
              onError('Network error. Please check your internet connection and try again.')
            }
            break
          case 'aborted':
            // User stopped - this is normal, don't show error
            break
          case 'service-not-allowed':
            if (onError) {
              onError('Speech recognition service is not available. Please try again later.')
            }
            break
          default:
            // Only show error if it's not a normal abort
            if (onError && event.error !== 'aborted') {
              console.error('Speech recognition error:', event.error)
              onError(`Speech recognition error: ${event.error}. Please try again.`)
            }
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }

      return recognition
    } catch (error) {
      console.error('Failed to create recognition:', error)
      if (onError) {
        onError(`Failed to initialize speech recognition: ${error.message || 'Unknown error'}`)
      }
      return null
    }
  }

  const startListening = () => {
    // Check support
    if (!isSupported || !isInitialized) {
      if (onError) {
        onError('Speech recognition is not supported or not ready in your browser.')
      }
      return
    }

    // If already listening, stop first
    if (isListening) {
      stopListening()
      return
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null
    }

    // Create new recognition instance
    const recognition = createRecognition()
    if (!recognition) {
      return
    }

    recognitionRef.current = recognition
    hasResultRef.current = false
    setWarning('')

    try {
      recognition.start()
      console.log('Voice recognition started')
    } catch (error) {
      console.error('Error starting recognition:', error)
      setIsListening(false)
      const errorMsg = error.message || error.toString() || 'Unknown error'
      
      // Handle "already started" error
      if (errorMsg.toLowerCase().includes('started') || 
          errorMsg.toLowerCase().includes('already')) {
        // Stop and retry after a short delay
        try {
          if (recognitionRef.current) {
            recognitionRef.current.stop()
          }
        } catch (e) {
          // Ignore
        }
        
        setTimeout(() => {
          if (recognitionRef.current === recognition) {
            try {
              recognition.start()
            } catch (e2) {
              console.error('Retry failed:', e2)
              if (onError) {
                onError('Voice recognition is busy. Please wait a moment and try again.')
              }
            }
          }
        }, 500)
      } else {
        if (onError) {
          onError(`Failed to start voice recognition: ${errorMsg}. Please try again.`)
        }
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null
    }
    
    setIsListening(false)
    setWarning('')
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        stopListening()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isListening])

  if (!isInitialized) {
    return (
      <div className="w-full">
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium text-base opacity-50 cursor-not-allowed bg-gray-100 text-gray-500"
        >
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Initializing...</span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={!isSupported}
        type="button"
        className={`
          w-full flex items-center justify-center gap-3 px-6 py-4 
          rounded-2xl font-semibold text-base tracking-wide
          transition-all duration-200
          ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30 shadow-xl'
              : 'bg-white/10 border border-white/20 hover:bg-white/20 text-slate-100 shadow-xl shadow-black/40'
          }
          ${!isSupported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <svg
              className="w-6 h-6 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span>Listening... (Click to stop)</span>
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span>Speak</span>
          </>
        )}
      </button>
      
      {warning && (
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-300/30 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-100">{warning}</p>
          </div>
        </div>
      )}

      {isListening && (
        <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-400/30 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs text-cyan-100">Speak now... I'm listening</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceInput
