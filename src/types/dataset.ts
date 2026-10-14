/**
 * SpeakTwin AI — Custom Speech Dataset Types
 */

export type SampleCategory = 'Good Speech' | 'Speech with Identified Errors';

export type VerificationStatus =
  | 'Pending Recording'
  | 'Recorded'
  | 'Pending Transcription Review'
  | 'Pending Annotation'
  | 'Verified'
  | 'Rejected';

export type ErrorCategory =
  | 'Grammar Error'
  | 'Incorrect Word Choice'
  | 'Unnecessary Word'
  | 'Missing Word'
  | 'Repeated Word'
  | 'Incorrect Verb Form'
  | 'Incorrect Article'
  | 'Incorrect Word Order'
  | 'Filler Word'
  | 'Long Pause'
  | 'Pronunciation Deviation'
  | 'Speech Recognition Uncertainty'
  | 'Correct Speech';

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type Confidence = 'Low' | 'Medium' | 'High';

export type AlignmentType =
  | 'Text Alignment'
  | 'Audio Timing Alignment'
  | 'Grammar Annotation'
  | 'Acoustic Delivery Annotation';

export interface DatasetMetadata {
  sample_id: string;
  sample_name: string;
  speaker_id: string;
  audio_file: string;
  audio_format: string;
  sample_rate_hz: number;
  channels: number;
  duration_seconds: number;
  file_size_bytes: number;
  sample_category: SampleCategory;
  recording_date: string;
  verification_status: VerificationStatus;
  created_at: string;
  notes: string;
}

export interface TranscriptRecord {
  sample_id: string;
  reference_pair_id: string;
  speaker_id: string;
  audio_file: string;
  original_transcript: string;
  verified_transcript: string;
  corrected_transcript: string;
  language: string;
  sample_category: SampleCategory;
  recording_date: string;
  verification_status: VerificationStatus;
  has_uncertainty: boolean;
}

export interface AlignmentLabelRecord {
  label_id: string;
  sample_id: string;
  reference_pair_id: string;
  start_time: number | null;
  end_time: number | null;
  reference_text: string;
  spoken_text: string;
  error_category: ErrorCategory;
  corrected_text: string;
  severity: Severity;
  confidence: Confidence;
  alignment_type: AlignmentType;
  annotation_notes: string;
}

export interface SpeechPairRecord {
  pair_id: string;
  good_sample_id: string;
  comparison_sample_id: string;
  intended_goal: string;
  reference_transcript: string;
  actual_good_transcript: string;
  actual_comparison_transcript: string;
  primary_error_category: ErrorCategory | string;
  corrected_sentence: string;
  annotation_notes: string;
  created_date: string;
}

export interface DatasetSampleComposite {
  metadata: DatasetMetadata;
  transcript?: TranscriptRecord;
  labels: AlignmentLabelRecord[];
  pair?: SpeechPairRecord;
  hasAudioOnDisk: boolean;
  audioUrl?: string;
}

export interface DatasetSummaryStats {
  totalSamples: number;
  goodSpeechCount: number;
  errorSpeechCount: number;
  unreviewedCount: number;
  verifiedCount: number;
  audioPairsCount: number;
  missingAudioCount: number;
  completionPercentage: number;
  totalAudioDuration: number;
  totalAlignmentLabels: number;
}
