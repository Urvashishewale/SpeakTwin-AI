# SpeakTwin AI — Dataset Annotation Guidelines

## 1. Introduction and Objectives
The SpeakTwin AI research project builds speech models and feedback systems capable of analyzing delivery cadence, grammatical cohesion, and acoustic intelligibility in professional and cross-cultural communication. 

To maintain high dataset integrity across research annotators, all speech samples, transcripts, and alignment labels must strictly adhere to the standardized guidelines described below.

---

## 2. Classification Criteria: Good Speech vs. Speech with Identified Errors

Annotators must evaluate speech based strictly on linguistic, syntactic, and delivery metrics. **Never classify speech as erroneous due to regional accent, native language background, vocal timbre, gender, or age.**

### 2.1 Good Speech Criteria
A speech sample is categorized as **Good Speech** (`Good Speech`) when:
- **Grammatical Accuracy**: Follows standard grammatical rules (subject-verb agreement, correct tense, standard preposition usage).
- **Pacing & Cadence**: Pacing falls within the international baseline of **125–155 WPM** without excessive syllable rushing ($>175\text{ WPM}$) or lethargic dragging ($<100\text{ WPM}$).
- **Controlled Pauses**: Pauses occur naturally at clause and sentence boundaries ($\le 1.0\text{s}$) rather than awkward mid-word stops.
- **Minimal Fillers**: Hesitation markers (*um, uh, basically, like*) constitute less than 2% of total spoken tokens.

### 2.2 Speech with Identified Errors Criteria
A speech sample is categorized as **Speech with Identified Errors** (`Speech with Identified Errors`) when one or more of the following are present:
- **Syntactic & Grammatical Breakdowns**: Subject-verb mismatches, incorrect verb forms, wrong articles, or disjointed word orders.
- **Intrusive Fillers**: Multiple back-to-back filler words (*"um like basically you know"*).
- **Stutters & Repetitions**: Unintentional repetitions of words or syllables (*"we we will do"*).
- **Acoustic Hesitation Stalls**: Unintentional silences $>1.2\text{s}$ occurring inside grammatical phrases.
- **Colloquial Mismatches**: Non-standard phrasing that causes international interviewers to misinterpret technical content (e.g., *"myself [Name]"*, *"revert back"*, *"prepone"*).

---

## 3. Transcript Management Protocol

For each sample, transcripts are managed across three distinct fields:

| Field Name | Description | Immutable Rule |
| :--- | :--- | :--- |
| `original_transcript` | Raw verbatim output from Speech Recognition or annotator's exact phonetic capture. | **NEVER modify or overwrite.** Preserves the raw acoustic truth. |
| `verified_transcript` | Annotator-verified verbatim text of what the speaker actually uttered, correcting speech-to-text recognition errors. | Confirms literal speech without cleaning up speaker's grammar mistakes. |
| `corrected_transcript` | The grammatically and stylistically polished reference target. | Shows what the speaker *intended* to communicate. |

> **Critical Rule**: Never silently replace `original_transcript` with `corrected_transcript`. Speech recognition uncertainty must be flagged explicitly (`has_uncertainty: true`).

---

## 4. Alignment Labels & Error Taxonomy

Annotations may be applied at the word level or sentence level:

### 4.1 Taxonomy Categories
1. **Grammar Error**: Broad structural grammatical faults in clause organization.
2. **Incorrect Word Choice**: Semantically inaccurate word used instead of the intended term.
3. **Unnecessary Word**: Extraneous words that clutter the sentence (e.g., *"revert back"* $\rightarrow$ *"revert"*).
4. **Missing Word**: Essential syntactic particle or pronoun omitted.
5. **Repeated Word**: Involuntary stutter repetition (e.g., *"the the system"*).
6. **Incorrect Verb Form**: Tense or conjugation errors (e.g., *"did not got"* $\rightarrow$ *"did not get"*).
7. **Incorrect Article**: Improper or unnecessary definite/indefinite article (e.g., *"the Urvashi"*).
8. **Incorrect Word Order**: Inversion of standard English constituent ordering.
9. **Filler Word**: Hesitation interjections (*um, uh, er, ah, basically, like*).
10. **Long Pause**: Extended silence segment ($>1.2\text{s}$) interrupting speech cadence.
11. **Pronunciation Deviation**: Phrasing or phoneme articulation that significantly obscures comprehension.
12. **Speech Recognition Uncertainty**: Low-confidence ASR segments requiring manual acoustic verification.
13. **Correct Speech**: Valid reference anchor segments verifying clean execution.

### 4.2 Severity Levels
- **Low**: Minor stylistic or non-distracting hesitation ($<1\text{s}$).
- **Medium**: Noticeable pause or single colloquial slip that does not alter sentence meaning.
- **High**: Obvious grammatical breakdown or multiple fillers impairing international listener comprehension.
- **Critical**: Utterance syntax completely broken or core technical meaning distorted.

---

## 5. Paired Speech Structure Example

```
Sample Pair ID: PAIR_001
Intended Goal: Deliver a crisp, professional candidate self-introduction.

[Good Speech Sample: SMP_001_GOOD]
Reference Transcript: "My name is Urvashi Shewale."
Actual Spoken Transcript: "My name is Urvashi Shewale."

[Speech with Identified Errors: SMP_002_ERROR]
Actual Spoken Transcript: "My name is the Urvashi is Shewale."
Corrected Sentence: "My name is Urvashi Shewale."
Error Labels:
  1. "the Urvashi" -> Incorrect Article (Severity: Medium)
  2. "is Shewale" -> Incorrect Verb Form (Severity: High)
  3. Full sentence -> Grammar Error (Severity: High)
```

---

## 6. Timestamp Discipline
- Word-level timestamps (`start_time`, `end_time` in seconds) must only be documented if measured via Web Audio API analysis, synchronized ASR word timing, or manual audio scrubbing.
- If reliable timing data is unavailable, leave fields empty and mark alignment status as pending.
- **Never fabricate or extrapolate artificial word timestamps.**

---

## 7. Ethical Standards, Privacy & Consent
1. Obtain informed consent from all recorded contributors before logging audio.
2. Anonymize all personally identifiable information (PII) other than research pseudonym IDs (`SPK_xxx`).
3. Allow contributors to inspect, modify, or permanently delete their audio recordings and associated metadata upon request.
