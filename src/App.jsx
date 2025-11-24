import React, { useState, useRef, useEffect } from 'react'
import ChatMessage from './components/ChatMessage'
import VoiceInput from './components/VoiceInput'
import TextInput from './components/TextInput'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import BackendStatus from './components/BackendStatus'
import BrowserCheck from './components/BrowserCheck'
import RoleSelection from './components/RoleSelection'
import DeveloperInterview from './components/DeveloperInterview'
import CameraPreview from './components/CameraPreview'
import { speakText, initSpeechSynthesis, stopSpeech } from './utils/textToSpeech'

// Backend API URL
const backendURL = "http://localhost:5000/api"

/**
 * Main App Component
 * Handles chat interface, voice/text input, and backend communication
 */
function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionInput, setQuestionInput] = useState(null)
  const [questionOutput, setQuestionOutput] = useState(null)
  const messagesEndRef = useRef(null)

  // Initialize speech synthesis
  useEffect(() => {
    initSpeechSynthesis()
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * Parse coding question to extract input/output examples
   */
  const parseCodingQuestion = (questionText) => {
    if (!questionText) return { input: null, output: null }
    
    // Try multiple patterns to extract input/output
    let input = null
    let output = null
    
    // Pattern 1: Input: ... Output: ... (with code blocks)
    const inputBlockMatch = questionText.match(/Input[:\s]*\n?```?\s*\n?([\s\S]*?)```?/i)
    const outputBlockMatch = questionText.match(/Output[:\s]*\n?```?\s*\n?([\s\S]*?)```?/i)
    
    if (inputBlockMatch) {
      input = inputBlockMatch[1].trim()
    } else {
      // Pattern 2: Input: ... (without code blocks, until Output or end)
      const inputMatch = questionText.match(/Input[:\s]*\n?([\s\S]*?)(?=Output|$)/i)
      if (inputMatch) {
        input = inputMatch[1].trim()
        // Clean up common prefixes
        input = input.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      }
    }
    
    if (outputBlockMatch) {
      output = outputBlockMatch[1].trim()
    } else {
      // Pattern 2: Output: ... (without code blocks)
      const outputMatch = questionText.match(/Output[:\s]*\n?([\s\S]*?)(?=Input|Explanation|$)/i)
      if (outputMatch) {
        output = outputMatch[1].trim()
        // Clean up common prefixes
        output = output.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      }
    }
    
    // Pattern 3: Look for example format like "nums = [2, 7, 11, 15], target = 9"
    if (!input && !output) {
      const exampleMatch = questionText.match(/(?:Input|Example)[:\s]*\n?([^\n]+(?:\n[^\n]+)*?)(?:\nOutput|$)/i)
      if (exampleMatch) {
        const exampleText = exampleMatch[1].trim()
        // Try to split if it contains both input and output
        if (exampleText.includes('Output') || exampleText.includes('=')) {
          input = exampleText.split(/Output|Expected/i)[0].trim()
          const outputPart = exampleText.match(/Output[:\s]*([^\n]+)/i)
          if (outputPart) {
            output = outputPart[1].trim()
          }
        }
      }
    }

    return { input, output }
  }

  /**
   * Sends a message to the backend API
   * @param {string} userMessage - The user's message text
   */
  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return

    // Add user message to chat
    const userMsg = {
      id: Date.now(),
      message: userMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setError('')
    setIsLoading(true)

    try {
      // Send to backend with session ID and role
      const response = await fetch(backendURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          session_id: sessionId,
          role: selectedRole
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`)
      }

      const data = await response.json()
      
      // Extract response text (handle different response formats)
      const backendResponse = data.response || data.message || data.text || JSON.stringify(data)
      
      // Add backend response to chat
      const backendMsg = {
        id: Date.now() + 1,
        message: backendResponse,
        sender: 'backend',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, backendMsg])

      // For developer role, parse coding question
      if (selectedRole === 'engineer' && backendResponse) {
        const parsed = parseCodingQuestion(backendResponse)
        if (parsed.input || parsed.output) {
          setCurrentQuestion(backendResponse)
          setQuestionInput(parsed.input)
          setQuestionOutput(parsed.output)
        } else {
          setCurrentQuestion(backendResponse)
        }
      } else {
        setCurrentQuestion(backendResponse)
      }

      // Speak the response if voice is enabled
      if (voiceEnabled && backendResponse) {
        stopSpeech() // Stop any ongoing speech
        setTimeout(() => {
          speakText(backendResponse, { rate: 0.9, pitch: 1.0 })
        }, 100)
      }
      
    } catch (err) {
      // Provide more specific error messages
      let errorMessage = 'Failed to communicate with the backend.'
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = `Connection failed. Please ensure:
1. Backend server is running on ${backendURL}
2. CORS is enabled on the backend
3. No firewall is blocking the connection`
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Add error message to chat for visibility
      const errorMsg = {
        id: Date.now() + 1,
        message: `Error: ${errorMessage}`,
        sender: 'backend',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles voice transcription result
   * @param {string} transcript - The transcribed text from voice input
   */
  const handleVoiceTranscript = (transcript) => {
    console.log('Voice transcript received:', transcript)
    if (transcript && transcript.trim()) {
      // Automatically send the transcribed message
      sendMessage(transcript.trim())
    } else {
      console.warn('Empty transcript received')
    }
  }

  /**
   * Handles errors from voice input
   * @param {string} errorMessage - The error message
   */
  const handleVoiceError = (errorMessage) => {
    setError(errorMessage)
  }

  /**
   * Handles role selection
   * @param {string} roleId - The selected role ID
   */
  const handleRoleSelect = async (roleId) => {
    setSelectedRole(roleId)
    setError('')
    setIsLoading(true)
    setMessages([])
    setCurrentQuestion(null)
    setQuestionInput(null)
    setQuestionOutput(null)

    try {
      const response = await fetch(`${backendURL}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          role: roleId
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      const welcomeMessage = data.response || `Welcome! Let's start your ${roleId} interview.`

      // Add welcome message to chat
      const welcomeMsg = {
        id: Date.now(),
        message: welcomeMessage,
        sender: 'backend',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages([welcomeMsg])
      setInterviewStarted(true)

      // Speak welcome message
      if (voiceEnabled) {
        speakText(welcomeMessage, { rate: 0.9, pitch: 1.0 })
      }

    } catch (err) {
      const errorMessage = err.message || 'Failed to start interview. Please try again.'
      setError(errorMessage)
      setSelectedRole(null)
      setInterviewStarted(false)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Starts a new interview session (shows role selection)
   */
  const startInterview = () => {
    setInterviewStarted(false)
    setSelectedRole(null)
    setMessages([])
    setError('')
    setCurrentQuestion(null)
    setQuestionInput(null)
    setQuestionOutput(null)
    stopSpeech()
  }

  const isDeveloperRole = selectedRole === 'engineer'

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-30 theme-grid opacity-40"></div>
      <div className="absolute inset-0 -z-40">
        <div className="absolute -top-32 -right-12 h-96 w-96 bg-fuchsia-500/40 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-[-10%] h-[28rem] w-[28rem] bg-cyan-500/30 blur-3xl rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 h-64 w-64 bg-sky-400/20 blur-2xl rounded-full"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-6xl xl:max-w-7xl">
          {/* Header Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-cyan-900/30 p-6 sm:p-8 mb-6 backdrop-blur-xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-3 drop-shadow-lg">
              Interview Practice Partner
            </h1>
            <p className="text-slate-300 text-center text-base mb-6">
              Voice, text, and webcam presence to mirror high-stakes interviews
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
              <BackendStatus backendURL={backendURL} />
              <label className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-3 py-2 rounded-2xl backdrop-blur-lg">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => {
                    setVoiceEnabled(e.target.checked)
                    if (!e.target.checked) {
                      stopSpeech()
                    }
                  }}
                  className="w-4 h-4 text-cyan-400 rounded focus:ring-cyan-400 border-white/40 bg-transparent"
                />
                <span className="text-sm text-slate-200">Voice Output</span>
              </label>
            </div>
            
            {!interviewStarted && !selectedRole && (
              <div className="flex justify-center">
                <button
                  onClick={() => setInterviewStarted(true)}
                  disabled={isLoading}
                  className="px-8 py-3 rounded-2xl font-semibold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-xl shadow-cyan-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Starting...' : 'Start Interview'}
                </button>
              </div>
            )}

            {interviewStarted && !selectedRole && (
              <RoleSelection onRoleSelect={handleRoleSelect} disabled={isLoading} />
            )}

            {interviewStarted && selectedRole && (
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Role: <span className="font-semibold capitalize">{selectedRole}</span>
                  </p>
                </div>
                <button
                  onClick={startInterview}
                  className="px-4 py-2 text-sm rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all"
                >
                  New Interview
                </button>
              </div>
            )}
          </div>

        {/* Main Interview Area */}
        {interviewStarted && selectedRole ? (
          isDeveloperRole ? (
            // Developer Interview - Split View
            <DeveloperInterview
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSendMessage={sendMessage}
              onVoiceTranscript={handleVoiceTranscript}
              onVoiceError={handleVoiceError}
              currentQuestion={currentQuestion}
              questionInput={questionInput}
              questionOutput={questionOutput}
              messagesEndRef={messagesEndRef}
            />
          ) : (
            // Normal Interview - Chat View
            <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl shadow-black/40 p-6 sm:p-8 mb-6 backdrop-blur-xl">
              {/* Chat Messages Area */}
              <div className="h-96 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400 text-center">
                      Start by speaking or typing your message below
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

              {/* Error Message Display */}
              {error && (
                <ErrorMessage
                  message={error}
                  onDismiss={() => setError('')}
                />
              )}

              {/* Voice Input Section */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Voice Input
                </label>
                <BrowserCheck />
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  onError={handleVoiceError}
                />
              </div>

              {/* Camera Presence */}
              <div className="mb-6">
                <CameraPreview />
              </div>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="px-4 text-sm text-slate-400">or</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>

              {/* Text Input Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Text Input
                </label>
                <TextInput onSend={sendMessage} isLoading={isLoading} />
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  </div>
  )
}

export default App
