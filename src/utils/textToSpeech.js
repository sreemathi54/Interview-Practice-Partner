/**
 * Text-to-Speech utility
 * Uses Web Speech API for voice output
 */

let synth = null
let currentUtterance = null

/**
 * Initialize speech synthesis
 */
export const initSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis
    return true
  }
  return false
}

/**
 * Speak text using Web Speech API
 * @param {string} text - Text to speak
 * @param {object} options - Speech options (rate, pitch, volume, voice)
 */
export const speakText = (text, options = {}) => {
  if (!synth) {
    if (!initSpeechSynthesis()) {
      console.warn('Speech synthesis not supported')
      return false
    }
  }

  // Cancel any ongoing speech
  if (currentUtterance) {
    synth.cancel()
  }

  const utterance = new SpeechSynthesisUtterance(text)
  
  // Set options
  utterance.rate = options.rate || 1.0
  utterance.pitch = options.pitch || 1.0
  utterance.volume = options.volume || 1.0
  utterance.lang = options.lang || 'en-US'

  // Try to use a natural-sounding voice
  const voices = synth.getVoices()
  const preferredVoice = voices.find(voice => 
    voice.lang.startsWith('en') && 
    (voice.name.includes('Natural') || voice.name.includes('Neural') || voice.name.includes('Premium'))
  ) || voices.find(voice => voice.lang.startsWith('en-US'))
  
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  currentUtterance = utterance

  utterance.onend = () => {
    currentUtterance = null
  }

  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event)
    currentUtterance = null
  }

  synth.speak(utterance)
  return true
}

/**
 * Stop current speech
 */
export const stopSpeech = () => {
  if (synth && currentUtterance) {
    synth.cancel()
    currentUtterance = null
  }
}

/**
 * Check if speech is currently playing
 */
export const isSpeaking = () => {
  return synth && synth.speaking
}

