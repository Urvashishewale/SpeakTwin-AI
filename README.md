# AudioPulse — Real-Time Speech & Audio Analytics Dashboard

AudioPulse is a real-time speech and audio telemetry dashboard designed to analyze audio of **any duration** (`kiti pn timeparyant cha audio`). It simultaneously processes live microphone recordings or uploaded audio files to detect:
1. **Pauses & Silences** (breath intervals, noticeable hesitations, and awkward pauses > 1.2s).
2. **Wrong Words & Stumbles** (repeated stutters, mispronunciations, and grammatical slips).
3. **Speaking Speed (WPM)** (real-time words per minute gauge, pace consistency, and benchmark comparisons).
4. **Filler Words Frequency** (e.g. *um*, *uh*, *like*, *actually*, *basically*, and Marathi equivalents *म्हणजे*, *तर*, *वगैरे*).
5. **Interactive Waveform Heatmap** (scrubbable playback timeline with mapped pause blocks).
6. **AI Speech Coaching** (powered by Google Gemini 3.8 Flash with algorithmic fallback).

---

## How to Run in Visual Studio Code (VS Code)

### Step 1: Open the Project in VS Code
Open VS Code, press `Ctrl + O` (or `Cmd + O` on macOS), and select this project folder.

### Step 2: Open the Integrated Terminal
In VS Code, press ``Ctrl + ` `` (or `Terminal > New Terminal`).

### Step 3: Install Dependencies
Run:
```bash
npm install
```

### Step 4: (Optional) Set your Gemini API Key
To enable deep multimodal AI speech coaching and linguistic analysis, create or edit `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```
*(Note: If you don't provide an API key, the dashboard still runs with full real-time Web Audio API pause tracking, Web Speech transcription, WPM speed calculation, and algorithmic stumble detection offline!)*

### Step 5: Start the Development Server
Run:
```bash
npm run dev
```

### Step 6: Open the Dashboard in Your Browser
Open:
```
http://localhost:3000
```

---

## How Simultaneous Real-Time Analysis Works

- **Real-Time Web Audio Stream (`src/utils/audioAnalyzer.ts`)**:
  Connects to your microphone via an `AudioContext` and `AnalyserNode`. It samples the RMS energy every 25ms. When energy drops below the silence threshold for $\ge 0.45\text{s}$, a pause interval is logged and shown immediately on the oscilloscope and metrics cards.

- **Real-Time Speech Streaming (`src/utils/speechRecognition.ts`)**:
  Listens simultaneously to vocal utterances, calculates running Words Per Minute (WPM), flags hesitation fillers (`um`, `uh`, `like`, `म्हणजे`), and detects consecutive repeated stumbles.

- **Any Duration File Decoding**:
  When you click **Open Audio File**, the browser decodes the entire audio stream into PCM samples to extract peak envelopes and detect pauses across the full recording timeline (supporting 1 minute, 10 minutes, or 1 hour+ audio files).

- **Full-Stack Gemini Backend (`server.ts`)**:
  Provides `/api/analyze-speech` for deep linguistic audits, grammar corrections, and actionable vocal coaching drills.
# SpeakTwin-AI
AI-powered speech analysis and personalized speech improvement system.
