import speech_recognition as sr
import os

print("== Microphone diagnostic and short record test ==")

# List devices
try:
    names = sr.Microphone.list_microphone_names()
    print(f"Found {len(names)} microphone device(s):")
    for i, n in enumerate(names):
        print(f"  [{i}] {n}")
except Exception as e:
    print(f"Error listing microphone names: {e}")

# Choose device index from env or default
dev_index = os.getenv("MICROPHONE_INDEX")
if dev_index is not None:
    try:
        dev_index = int(dev_index)
        print(f"Using MICROPHONE_INDEX={dev_index}")
    except:
        dev_index = None

r = sr.Recognizer()
try:
    if dev_index is None:
        mic = sr.Microphone()
    else:
        mic = sr.Microphone(device_index=dev_index)

    with mic as source:
        print("Adjusting for ambient noise (1s)...")
        r.adjust_for_ambient_noise(source, duration=1.0)
        print("Recording 5 seconds... Speak now")
        audio = r.record(source, duration=5)

    wav_data = audio.get_wav_data()
    out_path = "test_capture.wav"
    with open(out_path, "wb") as f:
        f.write(wav_data)
    print(f"WAV saved to {out_path} ({len(wav_data)} bytes)")

except Exception as e:
    print(f"Error during capture: {e}")
    print("Hints:")
    print(" - Ensure microphone is connected and enabled in Windows Sound Settings.")
    print(" - Check Microphone privacy: Settings > Privacy & security > Microphone.")
    print(" - If PyAudio import fails, install with: pip install pipwin; pipwin install pyaudio")
    raise

print("Done. You can play test_capture.wav to verify audio or run: ffplay test_capture.wav (if ffmpeg installed)")
