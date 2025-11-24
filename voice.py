import whisper
import speech_recognition as sr
import os
import warnings
import asyncio
import edge_tts
import pygame
import time

# Suppress warnings
warnings.filterwarnings("ignore")

# Load Whisper model once
try:
    print("Loading Whisper model... (this may take a moment)")
    # Switch to tiny for speed, or keep base if accuracy is key. 
    # User said "too slow", so let's try tiny first, or stick to base but optimize mic.
    # Let's stick to base but optimize the interaction speed first.
    model = whisper.load_model("base") 
    print("Whisper model loaded.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")
    model = None

def transcribe_audio():
    """
    Captures audio from the microphone and transcribes it using Whisper.
    Returns the transcribed text, or empty string if no audio detected.
    """
    if model is None:
        return ""

    r = sr.Recognizer()
    # Improved sensitivity settings for better detection
    r.energy_threshold = 300  # Balanced threshold
    r.dynamic_energy_threshold = True
    r.pause_threshold = 1.0   # Slightly longer pause for better phrase detection
    r.phrase_threshold = 0.3  # Minimum seconds of speaking audio
    
    try:
        with sr.Microphone() as source:
            print("\n🎙️  Listening... (Speak now)")
            # Adjust for ambient noise with longer duration for better calibration
            r.adjust_for_ambient_noise(source, duration=1.0)
            
            try:
                # Listen with reasonable timeout and phrase limit
                audio = r.listen(source, timeout=8, phrase_time_limit=60)
                print("⏳ Processing audio...")
                
                # Check if audio has any data
                if len(audio.frame_data) < 1000:  # Very short audio likely noise
                    print("⚠️  Audio too short, likely noise.")
                    return ""
                
                # Save to temporary file
                with open("temp.wav", "wb") as f:
                    f.write(audio.get_wav_data())
                
                # Transcribe with better parameters
                result = model.transcribe("temp.wav", 
                                         language="en",
                                         task="transcribe",
                                         temperature=0.0,  # More deterministic
                                         no_speech_threshold=0.6)
                text = result['text'].strip()
                
                # Clean up
                if os.path.exists("temp.wav"):
                    try:
                        os.remove("temp.wav")
                    except:
                        pass
                
                # Check if transcription is meaningful (not just noise words)
                if not text or len(text) < 2:
                    print("⚠️  Could not understand audio.")
                    return ""
                
                # Filter out common noise/error patterns
                noise_patterns = ["thank you for watching", "you", "uh", "um", "hmm"]
                if text.lower().strip() in noise_patterns and len(text.split()) <= 2:
                    print("⚠️  Detected noise, not meaningful speech.")
                    return ""
                    
                return text
                
            except sr.WaitTimeoutError:
                print("⚠️  No speech detected (Timeout).")
                return ""
            except sr.RequestError as e:
                print(f"⚠️  Could not request results: {e}")
                return ""
            except Exception as e:
                print(f"⚠️  Error during audio capture: {e}")
                return ""
                
    except Exception as e:
        print(f"⚠️  Error accessing microphone: {e}")
        return ""

async def _generate_speech(text):
    # Use a natural voice and increase rate slightly
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural", rate="+10%")
    await communicate.save("temp_speech.mp3")

def speak_text(text):
    """
    Converts text to speech using edge-tts (Natural & Fast) and plays it.
    """
    try:
        print(f"\n🔊 AI: {text}")
        
        # Generate speech asynchronously
        # Fix for Windows Event Loop Policy
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        loop.run_until_complete(_generate_speech(text))
        
        # Initialize pygame mixer
        pygame.mixer.init()
        pygame.mixer.music.load("temp_speech.mp3")
        pygame.mixer.music.play()
        
        # Wait for playback to finish
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
            
        # Clean up
        pygame.mixer.quit()
        if os.path.exists("temp_speech.mp3"):
            try:
                os.remove("temp_speech.mp3")
            except PermissionError:
                pass # Sometimes file is still locked
            
    except Exception as e:
        print(f"\n(TTS Error: {e})")
