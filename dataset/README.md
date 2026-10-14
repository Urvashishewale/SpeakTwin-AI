# SpeakTwin AI — Custom Speech Dataset Documentation

## 1. Dataset Purpose
The **SpeakTwin AI Custom Speech Dataset** is an open empirical speech and linguistic corpus designed for research into:
- Real-time vocal delivery coaching (speech pacing, pause dynamics, stuttering, and filler detection).
- Grammar and phrasing error classification in professional cross-cultural scenarios (technical interviews, viva presentations, executive briefings).
- Direct acoustic and text alignment between erroneous utterances and polished reference sentences (Paired Speech Corpus).

> **Current Dataset Completion Status**: **Active / In Progress (Pending Initial Acoustic Baseline)**.  
> Uncollected audio recordings are strictly marked as `Pending Recording`. Ground truth labels require explicit human annotator verification before transitioning to `Verified`.

---

## 2. Directory Structure

```
speaktwin-ai/
├── dataset/
│   ├── README.md                     # This documentation file
│   ├── metadata.csv                  # Audio technical parameters and lifecycle states
│   ├── transcripts.csv               # Tripartite transcripts (original, verified, corrected)
│   ├── alignment_labels.csv          # Fine-grained word/sentence error and alignment tags
│   ├── pairs.csv                     # Good speech vs Error comparison speech pairs
│   ├── audio/
│   │   ├── good/                     # Verified audio files for Good Speech (.wav, .mp3, .webm)
│   │   └── bad/                      # Verified audio files with Identified Errors
│   └── annotations/
│       └── annotation_guidelines.md  # Detailed annotator rulebook and criteria
├── docs/
│   └── technical_documentation.pdf   # Complete system architecture and methodology report
└── scripts/
    └── validate_dataset.ts           # Automated relational and integrity validator
```

---

## 3. CSV Column Schemas

### 3.1 `metadata.csv`
Defines acoustic container parameters and processing states for each registered sample:

| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `sample_id` | String | Unique sample identifier (`SMP_xxx_GOOD` or `SMP_xxx_ERROR`) | `SMP_001_GOOD` |
| `sample_name` | String | Human-readable title describing the sample context | `Self Introduction Clean` |
| `speaker_id` | String | Anonymous research speaker identifier | `SPK_001` |
| `audio_file` | String | Filename relative to `audio/good/` or `audio/bad/` (empty if pending) | `smp_001_good.webm` |
| `audio_format` | String | Container format (`webm`, `wav`, `mp3`, `m4a`) | `webm` |
| `sample_rate_hz` | Integer| Audio sampling frequency in Hertz | `48000` |
| `channels` | Integer| Audio channel count (1 = mono, 2 = stereo) | `1` |
| `duration_seconds` | Float | Measured audio runtime in seconds | `3.42` |
| `file_size_bytes` | Integer| File size on disk in bytes | `54280` |
| `sample_category` | Enum | Classification: `Good Speech` or `Speech with Identified Errors` | `Good Speech` |
| `recording_date` | String | ISO 8601 timestamp of recording | `2026-10-13T08:45:00Z` |
| `verification_status` | Enum | Lifecycle status (see Section 6) | `Pending Recording` |
| `created_at` | String | Record creation timestamp | `2026-10-13T08:45:00Z` |
| `notes` | String | Annotator engineering context or collection notes | `"Baseline intro sample"` |

### 3.2 `transcripts.csv`
Maintains verbatim original capture, confirmed actual speech, and polished reference targets:

| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `sample_id` | String | Foreign key matching `metadata.csv` | `SMP_001_GOOD` |
| `reference_pair_id`| String | Associated speech pair identifier (matches `pairs.csv`) | `PAIR_001` |
| `speaker_id` | String | Anonymous speaker ID | `SPK_001` |
| `audio_file` | String | Associated audio file | `smp_001_good.webm` |
| `original_transcript` | String | Verbatim automated speech recognition output | `"My name is Urvashi Shewale."` |
| `verified_transcript` | String | Human-confirmed transcript of what was actually said | `"My name is Urvashi Shewale."` |
| `corrected_transcript`| String | Target grammatically correct reference | `"My name is Urvashi Shewale."` |
| `language` | String | BCP-47 language tag | `en-US` |
| `sample_category` | Enum | `Good Speech` or `Speech with Identified Errors` | `Good Speech` |
| `recording_date` | String | Date of capture | `2026-10-13` |
| `verification_status` | Enum | Current transcript validation state | `Pending Recording` |
| `has_uncertainty` | Boolean| Flag indicating low-confidence ASR or muffled speech | `false` |

### 3.3 `alignment_labels.csv`
Fine-grained linguistic and acoustic alignment units:

| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `label_id` | String | Unique label identifier (`LBL_xxx`) | `LBL_001` |
| `sample_id` | String | Foreign key referencing sample | `SMP_002_ERROR` |
| `reference_pair_id`| String | Foreign key referencing speech pair | `PAIR_001` |
| `start_time` | Float? | Segment start time in seconds (empty if pending) | `0.92` |
| `end_time` | Float? | Segment end time in seconds (empty if pending) | `1.45` |
| `reference_text` | String | Reference target word or segment | `Urvashi` |
| `spoken_text` | String | Actual spoken segment containing deviation | `the Urvashi` |
| `error_category` | Enum | Error taxonomy category (see Section 7) | `Incorrect Article` |
| `corrected_text` | String | Suggested correction | `Urvashi` |
| `severity` | Enum | `Low`, `Medium`, `High`, `Critical` | `Medium` |
| `confidence` | Enum | `Low`, `Medium`, `High` | `High` |
| `alignment_type` | Enum | `Text Alignment`, `Audio Timing Alignment`, `Grammar Annotation`, `Acoustic Delivery Annotation` | `Grammar Annotation` |
| `annotation_notes` | String | Technical justification | `"Spurious article before proper noun"` |

### 3.4 `pairs.csv`
Links Good Speech and Error speech counterparts into actionable contrastive training units:

| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `pair_id` | String | Unique pair identifier (`PAIR_xxx`) | `PAIR_001` |
| `good_sample_id` | String | Foreign key to good speech sample | `SMP_001_GOOD` |
| `comparison_sample_id` | String | Foreign key to erroneous speech sample | `SMP_002_ERROR` |
| `intended_goal` | String | Speaker objective | `"Candidate self-introduction"` |
| `reference_transcript` | String | Reference target utterance | `"My name is Urvashi Shewale."` |
| `actual_good_transcript` | String | Verbatim good transcript | `"My name is Urvashi Shewale."` |
| `actual_comparison_transcript` | String | Verbatim error transcript | `"My name is the Urvashi is Shewale."` |
| `primary_error_category` | String | Dominant error category | `"Grammar Error"` |
| `corrected_sentence` | String | Full corrected sentence | `"My name is Urvashi Shewale."` |
| `annotation_notes` | String | Contrastive pedagogical notes | `"Demonstrates article and verb duplication"` |
| `created_date` | String | Creation date | `2026-10-13` |

---

## 4. Audio Collection & Recording Requirements

1. **Acoustic Environment**:
   - Background noise floor $\le -42\text{ dBFS}$.
   - Omnidirectional or cardioid microphone at 15–20 cm distance.
   - Recommended sampling rate: $\ge 44.1\text{ kHz}$, 16-bit PCM or high-bitrate Opus (WebM/WAV/MP3).
2. **Supported Audio Containers**:
   - `WAV` (linear PCM, 16/24-bit).
   - `MP3` ($\ge 128\text{ kbps}$).
   - `WebM` (Opus codec, browser live recording standard).
   - `M4A` / `AAC` ($\ge 128\text{ kbps}$).
3. **Validation Thresholds**:
   - Minimum duration: 0.8 seconds (to reject accidental clicks).
   - Maximum file size: 50 MB per sample.
   - Validated MIME types: `audio/webm`, `audio/wav`, `audio/wave`, `audio/x-wav`, `audio/mpeg`, `audio/mp3`, `audio/mp4`, `audio/x-m4a`, `audio/ogg`.

---

## 5. Sample Naming Conventions

- **Sample IDs**:
  - Format: `SMP_{3-digit-counter}_{CATEGORY}`
  - Example: `SMP_001_GOOD`, `SMP_002_ERROR`
- **Audio Files**:
  - Saved inside `dataset/audio/good/` or `dataset/audio/bad/`.
  - Naming: `{sample_id_lowercase}.{ext}` (e.g., `smp_001_good.webm`).
- **Pair IDs**:
  - Format: `PAIR_{3-digit-counter}` (e.g., `PAIR_001`).
- **Label IDs**:
  - Format: `LBL_{3-digit-counter}` (e.g., `LBL_001`).

---

## 6. Dataset Quality & Lifecycle Review

Every sample proceeds through a strictly monitored state machine:

1. `Pending Recording`: Sample and text definition registered, but audio file has not yet been provided.
2. `Recorded`: Audio file successfully written to disk; acoustic validation passed.
3. `Pending Transcription Review`: Verbatim speech recognition output loaded; awaits human reviewer check.
4. `Pending Annotation`: Transcript verified; linguistic alignment labels being marked.
5. `Verified`: Audio present, verbatim transcript verified, alignment labels reviewed, and quality confirmed by reviewer.
6. `Rejected`: Audio clipped, background noise unacceptable, or speaker retracted consent.

---

## 7. Error Category Definitions

- `Grammar Error`: Broad syntactic and morphological structure defects.
- `Incorrect Word Choice`: Lexical misselection or semantic mismatch.
- `Unnecessary Word`: Extraneous or redundant filler word.
- `Missing Word`: Omission of vital clause components.
- `Repeated Word`: Stutter repetition or false start.
- `Incorrect Verb Form`: Tense discord or improper participle conjugation.
- `Incorrect Article`: Superfluous or missing `a`, `an`, or `the`.
- `Incorrect Word Order`: Scrambled clause constituent sequence.
- `Filler Word`: Spoken hesitation interjections (*um, uh, basically, like*).
- `Long Pause`: Awkward hesitation gap exceeding 1.2 seconds.
- `Pronunciation Deviation`: Non-standard phonetic articulation.
- `Speech Recognition Uncertainty`: Ambiguous acoustic segment flagged for review.
- `Correct Speech`: Ground-truth benchmark confirming clean articulation.

---

## 8. Privacy, Consent & Data Governance

1. **Speaker Consent**: Obtain recorded or written contributor consent prior to saving audio.
2. **PII Redaction**: Do not log real names or sensitive credentials in transcripts unless the contributor explicitly supplies them as a generic demo.
3. **Right to Erasure**: Any contributor can delete their recordings and associated CSV rows using the Delete button in the dashboard or via the REST API (`DELETE /api/dataset/samples/:id`).
4. **Local Prototype Storage**: Audio files are stored locally in `dataset/audio/` and are NOT automatically uploaded to GitHub or external servers unless exported and committed by repository maintainers.

---

## 9. How to Add New Recordings

### Method A: Via Custom Speech Dataset Dashboard
1. Navigate to the **Custom Speech Dataset** tab in the SpeakTwin AI dashboard.
2. Click **Record New Sample** or **Upload Audio File**.
3. Enter or confirm Sample ID, Sample Name, Speaker ID, and Category (**Good Speech** or **Speech with Identified Errors**).
4. Record speech via microphone or upload a local file.
5. Play back the audio using the built-in player to verify sound quality.
6. Review the speech-to-text transcript; edit `verified_transcript` and `corrected_transcript`.
7. Click **Save to Dataset**. The audio file is written directly to disk and registered in `metadata.csv` and `transcripts.csv`.

### Method B: From the Live Speech Telemetry Coach
1. Record or analyze speech in the main telemetry view.
2. Click **Save Analysis to Dataset**.
3. The system pre-fills transcripts, filler counts, pauses, and sentence diffs.
4. Review and confirm the category and annotations before saving.

---

## 10. How to Export the Dataset

1. In the **Custom Speech Dataset** dashboard, click **Export Dataset Package**.
2. Select desired CSV tables (`metadata.csv`, `transcripts.csv`, `alignment_labels.csv`, `pairs.csv`).
3. Download individual CSV files or download the consolidated dataset zip containing both CSV tables and audio directories.

---

## 11. Automated Dataset Validation

Run the automated integrity validator script using:
```bash
npx tsx scripts/validate_dataset.ts
```
The script validates:
- Foreign key consistency between `metadata.csv`, `transcripts.csv`, `alignment_labels.csv`, and `pairs.csv`.
- Detection of duplicate IDs.
- Presence of audio files on disk corresponding to non-pending samples.
- Empty timestamp flags.
- Formatting of ISO timestamps and numeric columns.
