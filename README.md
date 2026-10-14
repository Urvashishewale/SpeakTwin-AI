# SpeakTwin AI — Speech Analytics & Custom Speech Dataset Research Platform

SpeakTwin AI (AudioPulse) is a real-time speech telemetry and linguistic dataset engineering platform designed for **cross-cultural public speaking, high-stakes international interviews, and speech model research**. It integrates real-time acoustic DSP, continuous multilingual speech recognition, multimodal linguistic coaching, and an empirical **Custom Speech Dataset Module**.

---

## 1. Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: v20 or later
- **npm**: v9 or later
- Microphone access enabled in your browser

### Installation
```bash
# 1. Clone repository or open in VS Code
git clone https://github.com/YOUR_TEAM/speaktwin-ai.git
cd speaktwin-ai

# 2. Install dependencies
npm install

# 3. (Optional) Configure Gemini API Key
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY for deep AI coaching (offline algorithmic analysis functions without a key)

# 4. Start Development Server
npm run dev

# 5. Open in Browser
# http://localhost:3000
```

---

## 2. Platform Architecture

SpeakTwin AI combines client-side low-latency DSP pipelines with server-side persistence and generative AI:

```
speaktwin-ai/
├── dataset/                          # Custom Speech Dataset Research Corpus
│   ├── README.md                     # Dataset documentation and schemas
│   ├── metadata.csv                  # Audio technical parameters and states
│   ├── transcripts.csv               # Tripartite transcripts (original, verified, corrected)
│   ├── alignment_labels.csv          # Word/sentence alignment tags (13 error categories)
│   ├── pairs.csv                     # Contrastive Good vs Bad speech pairs
│   ├── audio/
│   │   ├── good/                     # Verified Good Speech audio (.webm, .wav, .mp3)
│   │   └── bad/                      # Verified Speech with Identified Errors
│   └── annotations/
│       └── annotation_guidelines.md  # Annotator operational guidelines
├── docs/
│   └── technical_documentation.pdf   # 6-page technical architecture & research report
├── scripts/
│   ├── validate_dataset.ts           # Automated dataset integrity validator
│   └── generate_documentation_pdf.ts # Technical documentation PDF generator
├── src/
│   ├── components/
│   │   ├── dataset/                  # Custom Speech Dataset UI Subsystem
│   │   │   ├── DatasetDashboard.tsx  # Dynamic KPI strip, catalog, & pairs explorer
│   │   │   ├── RecordSampleModal.tsx # In-browser mic recording & file upload
│   │   │   ├── SampleDetailsModal.tsx# Tripartite transcript editor & label tagger
│   │   │   ├── CreatePairModal.tsx   # Contrastive speech pair creator
│   │   │   └── ExportDatasetModal.tsx# Standardized CSV exporter
│   │   ├── AudioVisualizer.tsx       # 25ms Web Audio RMS Oscilloscope
│   │   ├── GlobalToneCard.tsx        # International intelligibility index
│   │   ├── LiveCameraFeed.tsx        # Live webcam posture & facial feed
│   │   ├── LiveTranscriptViewer.tsx  # Real-time token streaming
│   │   ├── MetricsCards.tsx          # Real-time WPM, pauses, and clarity scores
│   │   ├── SentenceComparisonPanel.tsx# "Right Sentence" executive comparisons
│   │   ├── TopBar.tsx                # 3-Zone navigation header
│   │   └── WaveformTimeline.tsx      # Full-duration audio scrub timeline
│   ├── types/
│   │   ├── audio.ts                  # Acoustic & telemetry types
│   │   └── dataset.ts                # Dataset schemas, taxonomy, & states
│   └── utils/
│       ├── audioAnalyzer.ts          # Web Audio API silence & pause detector
│       └── speechRecognition.ts      # Multilingual continuous ASR engine
└── server.ts                         # Express server, Gemini proxy, & /api/dataset
```

---

## 3. Custom Speech Dataset Module

The **Custom Speech Dataset** module enables researchers and annotators to curate empirical speech samples for training neural alignment and speech coaching models.

### 3.1 Dataset Completion Status
- **Status**: **Active / In Progress (Pending Initial Acoustic Baseline)**.
- Template benchmark pairs (e.g., `PAIR_001`) are registered with explicit `Pending Recording` flags until real audio samples are recorded or uploaded.
- **Ground-Truth Policy**: AI-generated corrections are never silently saved as ground truth. Every sample requires explicit human review and verification.

### 3.2 Good Speech vs. Speech with Identified Errors Criteria
- **Good Speech**: Standard syntactic grammar, controlled cadence (125–155 WPM), natural clause pauses ($\le 1.0\text{s}$), and $<2\%$ filler interjections.
- **Speech with Identified Errors**: Contains grammatical faults, redundant articles, extra copula verbs, stutters, intrusive hesitation silences ($>1.2\text{s}$), or colloquial mismatches (e.g., *"myself [Name]"*, *"did not got"*, *"prepone"*).
- **Zero-Bias Policy**: Speech is never classified as erroneous due to regional accent, native language, vocal timbre, gender, or age.

### 3.3 Contrastive Speech Pairs (e.g., PAIR_001)
Couples two speech recordings sharing the identical underlying communication objective:
- **Sample Pair ID**: `PAIR_001`
- **Intended Goal**: Candidate self-introduction for international interviews.
- **Good Speech (SMP_001_GOOD)**: *"My name is Urvashi Shewale."*
- **Speech with Grammar Error (SMP_002_ERROR)**: *"My name is the Urvashi is Shewale."*
- **Expected Ground-Truth Correction**: *"My name is Urvashi Shewale."*
- **Associated Error Labels**:
  - `LBL_001`: *"the Urvashi"* $\rightarrow$ Incorrect Article (Severity: Medium)
  - `LBL_002`: *"is Shewale"* $\rightarrow$ Incorrect Verb Form (Severity: High)
  - `LBL_003`: Full utterance $\rightarrow$ Grammar Error (Severity: High)

### 3.4 Tripartite Transcript Management
1. `original_transcript`: Verbatim, immutable baseline output from speech recognition. Preserved to evaluate ASR accuracy.
2. `verified_transcript`: Human-confirmed record of what the speaker literally uttered (preserving errors).
3. `corrected_transcript`: Target grammatically polished reference sentence.
4. `has_uncertainty`: Flag identifying low-confidence ASR audio requiring manual verification.

### 3.5 13-Category Alignment Taxonomy
Supports word-level and sentence-level annotations across:
- `Grammar Error`, `Incorrect Word Choice`, `Unnecessary Word`, `Missing Word`
- `Repeated Word`, `Incorrect Verb Form`, `Incorrect Article`, `Incorrect Word Order`
- `Filler Word`, `Long Pause`, `Pronunciation Deviation`
- `Speech Recognition Uncertainty`, `Correct Speech`

Timestamps (`start_time`, `end_time`) are only populated when derived from instrumented Web Audio analysis. When unverified, timestamps remain empty and marked pending.

---

## 4. How to Record and Upload Dataset Samples

### Option A: From the Custom Speech Dataset View
1. Click **Custom Speech Dataset** in the top navigation bar.
2. Click **Record / Upload Sample**.
3. Choose category: **A. Good Speech** or **B. Speech with Identified Errors**.
4. Record audio via microphone or upload an audio file (`.wav`, `.mp3`, `.webm`, `.m4a`).
5. Play back the audio using the built-in player to inspect audio clarity.
6. Verify the auto-generated transcript, review the suggested target correction, and click **Save to Dataset**.

### Option B: From the Live Speech Telemetry Coach
1. Speak into the microphone in the main telemetry view to build clarity scores.
2. Click **Save to Dataset** in the workspace toolbar.
3. The system pre-fills the transcript, duration, wrong words, and pauses for review before saving.

---

## 5. Automated Dataset Validation

Run the automated integrity and relational validator:
```bash
npx tsx scripts/validate_dataset.ts
```
The validator checks:
- Header schema conformity across all CSV tables.
- Primary key uniqueness (detects duplicate `sample_id`, `pair_id`, or `label_id`).
- Foreign key referential integrity across metadata, transcripts, labels, and pairs.
- Physical audio file existence in `dataset/audio/good/` and `dataset/audio/bad/`.
- Timestamp sanity (`start_time <= end_time`).

---

## 6. Technical Documentation PDF

A 6-page comprehensive research and architectural specification document is generated and maintained at:
```
docs/technical_documentation.pdf
```
To regenerate the PDF at any time:
```bash
npx tsx scripts/generate_documentation_pdf.ts
```

---

## 7. Demo Video & Team Collaboration Workflow

### Demonstration Walkthrough
1. **Live Telemetry & Right-Sentence Diff**: Shows real-time WPM calculation, 25ms volume RMS silence detection, and executive right-sentence generation.
2. **Dataset Dashboard KPIs**: Dynamic calculation of registered samples, good vs bad speech counts, unreviewed queue, and completion percentages.
3. **Contrastive Speech Pair Inspection**: Walkthrough of `PAIR_001` showing good vs error speech comparison.
4. **Sample Inspection & Audio Streaming**: In-browser audio playback, tripartite transcript review, and error taxonomy tagging.
5. **CSV Export & Validator Run**: Demonstrating `validate_dataset.ts` passing 100% relational checks.

### Pushing Code to GitHub
```bash
git add .
git commit -m "feat: complete Custom Speech Dataset module with paired corpus & validator"
git push origin main
```
To add collaborators, navigate to **Settings $\rightarrow$ Collaborators** on your GitHub repository.
Contributed by iamprasiddhi
