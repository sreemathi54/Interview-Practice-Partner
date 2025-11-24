import sounddevice as sd
import soundfile as sf

DURATION = 5  # seconds
DEVICE_ID = 1  # Microphone Array (Realtek)

print("Recording for 5 seconds... Speak now!")

recording = sd.rec(
    int(44100 * DURATION),
    samplerate=44100,
    channels=1,
    device=DEVICE_ID,
    dtype='float32'
)

sd.wait()

sf.write("output.wav", recording, 44100)

print("Recording saved as output.wav")
print("Playing back...")

data, samplerate = sf.read("output.wav")
sd.play(data, samplerate)
sd.wait()
