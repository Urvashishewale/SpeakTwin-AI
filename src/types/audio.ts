export interface DetectedPause {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  duration: number; // seconds
  type: 'breath' | 'noticeable' | 'awkward';
}

export interface WrongWordItem {
  id: string;
  word: string;
  context: string;
  timestamp?: number;
  issue: 'Grammar' | 'Mispronounced' | 'Stutter' | 'Colloquialism' | 'Awkward';
  suggestion: string;
  rightAlternative?: string;
}

export interface FillerWordItem {
  word: string;
  count: number;
  percentage: number;
}

export interface SentenceComparison {
  id: string;
  originalSentence: string;
  rightSentence: string;
  improvements: string[];
  category: 'Grammar' | 'Global Tone' | 'Clarity' | 'Pronunciation & Phrasing';
  whyItSoundsBetter: string;
}

export interface GlobalToneMetrics {
  toneCategory: 'Confident & Poised' | 'Slightly Rushed' | 'Hesitant / Stalling' | 'Monotone / Flat';
  globalComprehensionScore: number; // 0-100 (intelligibility to US/UK/global interviewers)
  speedPacingAdvice: string; // Specific advice on avoiding rapid cadence
  accentToneAdvice: string; // Tips for Indian professionals speaking to international teams
  cadenceProfile: string; // e.g. "Rapid Syllable-timed" vs "Controlled Stress-timed"
}

export interface TranscriptWord {
  id: string;
  word: string;
  timestamp: number;
  isFiller: boolean;
  isWrong: boolean;
  issue?: string;
  suggestion?: string;
  pauseAfter?: number; // duration if a pause occurred right after this word
}

export interface SpeedDataPoint {
  time: number;
  wpm: number;
}

export interface AudioAnalysisResult {
  source: 'realtime' | 'algorithmic' | 'gemini-ai';
  durationSeconds: number;
  wordCount: number;
  wpm: number;
  fluencyScore: number;
  clarityScore: number;
  paceScore: number;
  detectedPaceCategory: 'Too Slow' | 'Optimal' | 'Slightly Fast' | 'Too Fast';
  pacingComment: string;
  pauses: DetectedPause[];
  totalSilenceSeconds: number;
  silenceRatio: number; // 0-1
  wrongWords: WrongWordItem[];
  fillerWords: FillerWordItem[];
  sentenceComparisons: SentenceComparison[];
  globalToneMetrics: GlobalToneMetrics;
  pausesEvaluation: {
    totalAwkwardPauses: number;
    assessment: string;
    advice: string;
  };
  actionableTips: string[];
  summary: string;
}

export type InputMode = 'record' | 'upload' | 'demo';
export type SupportedLanguage = 'en-US' | 'mr-IN' | 'hi-IN';
export type InterviewScenario = 'tech-interview' | 'study-visa' | 'executive-pitch' | 'general-fluent';
