# AI Interview Practice Partner

An end-to-end mock interview assistant that pairs a conversational React/Vite frontend with a Flask backend powered by Groq's Llama 3.3 LLM, Whisper speech recognition, and Edge-TTS voice responses.

## Repository Layout
- `backend_api.py` – Flask server that brokers interview sessions for the web UI.
- `requirements.txt` – Minimal dependencies required to run the Flask backend.
- `interview/` – Voice-first CLI/Streamlit experience plus all LLM, TTS, and ASR logic. Its own `requirements.txt` covers heavier AI libraries.
- `src/` – React frontend (Vite + Tailwind) that talks to the Flask API.
- `package.json` / `package-lock.json` – Frontend dependencies.

## Requirements
### System Prerequisites
- Python 3.10+ (for LangChain + Whisper stack)
- Node.js 18+ and npm 9+ (for Vite dev server)
- FFmpeg and PortAudio runtime (needed by Whisper/SpeechRecognition/PyAudio)

### Python Dependencies
Python Dependencies (Explained Clearly)
There are two separate requirements.txt files in this project, each serving a different purpose:
i)Root-level requirements.txt:
This file contains only the lightweight dependencies required for the Flask API, including CORS support.

To install these packages, run:
pip install -r requirements.txt

interview/requirements.txt:
This file includes the heavier AI-related dependencies used by the voice-first CLI and Streamlit applications. It installs LangChain, the Groq SDK, Whisper, Torch CPU-only wheels, Edge-TTS, audio input/output libraries, and various utilities. The file also contains a --find-links entry that points to the official CPU-only PyTorch wheels, ensuring that torch and torchaudio install correctly even on machines without CUDA.

To install these packages, run:
pip install -r interview/requirements.txt

ii) The second requirements file includes a `--find-links` entry pointing to the official CPU-only Torch wheels. Keep it as-is so `pip` can resolve `torch` and `torchaudio` on machines without CUDA.

### Node Dependencies
Run `npm install` in the repository root (where `package.json` lives) to pull React, Vite, Tailwind, and their type definitions.

## Environment Variables (`.env`)
Create a `.env` file in the project root (shared by both the Flask API and the interview scripts). 
GROQ_API_KEY
Required. This is your Groq API key. Needed for the Llama 3.3 model to work.

MICROPHONE_INDEX
Optional. Set the microphone number if you have many mics. If not set, the system uses the default mic.

Project Setup:
1.Clone the project
git clone <your-fork-url>
cd Agent-INTERVIEW_PARTNER

2.Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # Windows PowerShell

3.Install backend packages
pip install -r requirements.txt
pip install -r interview/requirements.txt

4.Install frontend packages
npm install

5.Create a .env file
Add your GROQ_API_KEY and (optionally) MICROPHONE_INDEX.

## Running the Project
Flask API (Backend)
python backend_api.py
Runs at: http://localhost:5000

React/Vite Frontend
npm run dev
Starts the UI and connects to the Flask API.

Voice Mode (CLI or Streamlit)
cd interview
streamlit run app.py     # Streamlit UI
or
python main.py           # Terminal version

Verification Checklist:
Visit http://localhost:5000/health
 — should show {"status":"online"}.

Frontend opens at http://localhost:5173
 and starts interviews.

Voice mode detects your mic; Whisper should show “model loaded”.


