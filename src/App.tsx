/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Upload,
  PlayCircle,
  FileDown,
  Globe,
  Radio,
  Sparkles,
  Info,
  CheckCircle,
  Briefcase,
  Compass,
  Github,
  Camera,
  Video,
  Database,
  GitCompare,
  Volume2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

import { TopBar } from './components/TopBar';
import { SideDashboard, DashboardViewType } from './components/SideDashboard';
import { MetricsCards } from './components/MetricsCards';
import { AudioVisualizer } from './components/AudioVisualizer';
import { LiveCameraFeed } from './components/LiveCameraFeed';
import { WaveformTimeline } from './components/WaveformTimeline';
import { LiveTranscriptViewer } from './components/LiveTranscriptViewer';
import { DetailedIssuesPanel } from './components/DetailedIssuesPanel';
import { SentenceComparisonPanel } from './components/SentenceComparisonPanel';
import { GlobalToneCard } from './components/GlobalToneCard';
import { PracticeDrillsView } from './components/PracticeDrillsView';

import { VSCodeGuideModal } from './components/VSCodeGuideModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';
import { ExportModal } from './components/ExportModal';
import { DatasetValidatorModal } from './components/DatasetValidatorModal';
import { AnnotationGuidelinesModal } from './components/AnnotationGuidelinesModal';

import { DatasetDashboard } from './components/dataset/DatasetDashboard';
import { RecordSampleModal } from './components/dataset/RecordSampleModal';
import { CreatePairModal } from './components/dataset/CreatePairModal';

import {
  AudioAnalysisResult,
  DetectedPause,
  FillerWordItem,
  GlobalToneMetrics,
  InterviewScenario,
  SentenceComparison,
  SupportedLanguage,
  TranscriptWord,
  WrongWordItem,
} from './types/audio';

import {
  RealtimeAudioEngine,
  RealtimeAudioStats,
  analyzeAudioFile,
  createSyntheticDemoAudio,
} from './utils/audioAnalyzer';

import { SpeechRecognitionEngine } from './utils/speechRecognition';
import { DatasetSampleComposite } from './types/dataset';

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<DashboardViewType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [isVSCodeModalOpen, setIsVSCodeModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveToDatasetModalOpen, setIsSaveToDatasetModalOpen] = useState(false);
  const [isValidatorModalOpen, setIsValidatorModalOpen] = useState(false);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [isCreatePairModalOpen, setIsCreatePairModalOpen] = useState(false);

  // Audio Engine & Speech State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en-US');
  const [interviewScenario, setInterviewScenario] = useState<InterviewScenario>('tech-interview');

  // Live Camera Video State
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  // Real-time Visualizer Stats
  const [audioStats, setAudioStats] = useState<RealtimeAudioStats | null>(null);
  const [isPausedSilence, setIsPausedSilence] = useState(false);
  const [activePauseDuration, setActivePauseDuration] = useState(0);

  // Analysis Data: Initialized to 0 as requested!
  const [wpm, setWpm] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([]);
  const [pauses, setPauses] = useState<DetectedPause[]>([]);
  const [wrongWords, setWrongWords] = useState<WrongWordItem[]>([]);
  const [fillerWords, setFillerWords] = useState<FillerWordItem[]>([]);

  // Scores start at 0 initially and increase dynamically as you speak!
  const [fluencyScore, setFluencyScore] = useState(0);
  const [clarityScore, setClarityScore] = useState(0);
  const [paceScore, setPaceScore] = useState(0);
  const [paceCategory, setPaceCategory] = useState<'Too Slow' | 'Optimal' | 'Slightly Fast' | 'Too Fast'>('Optimal');

  // Sentence Comparisons & Global Tone
  const [sentenceComparisons, setSentenceComparisons] = useState<SentenceComparison[]>([]);
  const [globalToneMetrics, setGlobalToneMetrics] = useState<GlobalToneMetrics>({
    toneCategory: 'Confident & Poised',
    globalComprehensionScore: 0,
    speedPacingAdvice: 'Target 125–145 WPM for global interviewers. Pacing above 160 WPM causes international interviewers to lose critical technical points.',
    accentToneAdvice: 'Emphasize terminal consonants (-ed, -s, -t) and maintain a stress-timed cadence.',
    cadenceProfile: 'Controlled Stress-timed (Global standard)',
  });

  // Waveform Data
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [totalAudioDuration, setTotalAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Deep AI Analysis State
  const [analysisSource, setAnalysisSource] = useState<'realtime' | 'algorithmic' | 'gemini-ai'>('realtime');
  const [summary, setSummary] = useState(
    'Professional interview speech analytics active. Scores start at 0 and build up as you speak clearly.'
  );
  const [actionableTips, setActionableTips] = useState<string[]>([
    'Start speaking into your microphone to build your clarity and fluency scores from 0.',
    'Slow down by 15 WPM when explaining technical architectures so global interviewers absorb every concept.',
    'Embrace silent 1-second pauses instead of saying "um", "like", or "basically".',
  ]);
  const [isAnalyzingDeep, setIsAnalyzingDeep] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dataset Samples Cache for Pair Modal
  const [datasetSamplesCache, setDatasetSamplesCache] = useState<DatasetSampleComposite[]>([]);
  const [datasetCount, setDatasetCount] = useState<number>(0);

  // Engines Refs
  const audioEngineRef = useRef<RealtimeAudioEngine | null>(null);
  const speechEngineRef = useRef<SpeechRecognitionEngine | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const liveAudioBlobRef = useRef<Blob | null>(null);

  // Initialize Engines & Camera on mount
  useEffect(() => {
    audioEngineRef.current = new RealtimeAudioEngine();
    speechEngineRef.current = new SpeechRecognitionEngine();

    // Attempt preview camera on load if permitted
    initCameraPreview();
    fetchDatasetSummaryQuick();

    return () => {
      audioEngineRef.current?.stop();
      speechEngineRef.current?.stop();
      stopCameraStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const fetchDatasetSummaryQuick = async () => {
    try {
      const res = await fetch('/api/dataset/summary');
      if (res.ok) {
        const data = await res.json();
        setDatasetCount(data.totalSamples || 0);
      }
      const sRes = await fetch('/api/dataset/samples');
      if (sRes.ok) {
        const sData = await sRes.json();
        setDatasetSamplesCache(sData);
      }
    } catch (e) {
      // offline fallback
    }
  };

  // Camera Management Helpers
  const initCameraPreview = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setVideoStream(stream);
      setIsCameraEnabled(true);
    } catch (err) {
      console.warn('Camera preview not auto-started or permission deferred:', err);
    }
  };

  const stopCameraStream = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  };

  const toggleCamera = async () => {
    if (isCameraEnabled && videoStream) {
      stopCameraStream();
      setIsCameraEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });
        setVideoStream(stream);
        setIsCameraEnabled(true);
      } catch (err: any) {
        setStatusMessage(`Could not access webcam: ${err?.message || 'Permission denied'}`);
      }
    }
  };

  // Generate Sentence Comparisons locally when words change
  const buildLocalComparisons = (text: string) => {
    if (!text.trim()) return [];
    const sentences = text.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 3);
    return sentences.slice(0, 6).map((s, idx) => {
      let polished = s.trim();
      const improvements: string[] = [];

      if (/(\bum\b|\buh\b|\bbasically\b|\blike\b)/i.test(polished)) {
        polished = polished.replace(/(\bum\b|\buh\b|\bbasically\b|\blike\b)/gi, '').replace(/\s{2,}/g, ' ').trim();
        improvements.push('Eliminated filler words');
      }

      if (/(\bthe\s+the\b|\bi\s+i\b|\bwe\s+we\b)/i.test(polished)) {
        polished = polished.replace(/\b(\w+)\s+\1\b/gi, '$1');
        improvements.push('Removed repeated stutter');
      }

      if (/^myself\s+/i.test(polished)) {
        polished = polished.replace(/^myself\s+/i, 'My name is ');
        improvements.push('Replaced colloquial "Myself" with standard interview greeting');
      }

      if (/\bdid\s+not\s+got\b/i.test(polished)) {
        polished = polished.replace(/\bdid\s+not\s+got\b/gi, 'did not encounter');
        improvements.push('Corrected past-tense verb grammar');
      }

      if (/\bprepone\b/i.test(polished)) {
        polished = polished.replace(/\bprepone\b/gi, 'move up / expedite');
        improvements.push('Replaced Indianism "prepone" with global corporate standard');
      }

      if (/\brevert\s+back\b/i.test(polished)) {
        polished = polished.replace(/\brevert\s+back\b/gi, 'follow up');
        improvements.push('Removed redundant phrasing "revert back"');
      }

      if (/\bdo\s+one\s+thing\b/i.test(polished)) {
        polished = polished.replace(/\bdo\s+one\s+thing\b/gi, 'proceed by');
        improvements.push('Upgraded colloquial phrase to decisive executive action');
      }

      polished = polished.charAt(0).toUpperCase() + polished.slice(1);
      if (!/[.?!]$/.test(polished)) polished += '.';

      return {
        id: `sc-${idx + 1}`,
        originalSentence: s.trim(),
        rightSentence: polished.length > 5 ? polished : 'Today, I would like to present a structured overview of our system.',
        improvements: improvements.length > 0 ? improvements : ['Enhanced professional diction and pacing for international interviewers'],
        category: (improvements.length > 0 ? 'Grammar' : 'Global Tone') as any,
        whyItSoundsBetter: 'Presents a calm, poised cadence that international interviewers find instantly clear and persuasive.',
      };
    });
  };

  // Recalculate Scores: Starting at 0 and climbing dynamically with speech clarity
  useEffect(() => {
    // If no words spoken yet, maintain 0
    if (transcriptWords.length === 0) {
      setClarityScore(0);
      setFluencyScore(0);
      setPaceScore(0);
      setGlobalToneMetrics((prev) => ({ ...prev, globalComprehensionScore: 0 }));
      return;
    }

    const fillerMap: Record<string, number> = {};
    const wrongList: WrongWordItem[] = [];

    transcriptWords.forEach((tw) => {
      if (tw.isFiller) {
        const clean = tw.word.toLowerCase();
        fillerMap[clean] = (fillerMap[clean] || 0) + 1;
      }
      if (tw.isWrong) {
        wrongList.push({
          id: tw.id,
          word: tw.word,
          context: `"...${tw.word}..."`,
          issue: (tw.issue as any) || 'Stutter',
          suggestion: tw.suggestion || 'Avoid vocal repetition',
        });
      }
    });

    const fillersArray: FillerWordItem[] = Object.entries(fillerMap).map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / transcriptWords.length) * 100),
    }));

    setFillerWords(fillersArray);
    setWrongWords(wrongList);

    // Compute pace category
    let category: 'Too Slow' | 'Optimal' | 'Slightly Fast' | 'Too Fast' = 'Optimal';
    if (wpm > 0) {
      if (wpm < 110) category = 'Too Slow';
      else if (wpm > 175) category = 'Too Fast';
      else if (wpm > 155) category = 'Slightly Fast';
    }
    setPaceCategory(category);

    const totalFillers = fillersArray.reduce((acc, f) => acc + f.count, 0);
    const awkwardPausesCount = pauses.filter((p) => p.duration > 1.2).length;
    const cleanWordsCount = transcriptWords.filter((tw) => !tw.isFiller && !tw.isWrong).length;

    // DYNAMIC SCORE GROWTH ENGINE (Starts at 0, increases as clarity of speech is good)
    const baseClarityGain = Math.min(96, Math.round((cleanWordsCount / 14) * 94));
    const clarityPenalties = (wrongList.length * 6) + (totalFillers * 3);
    const calculatedClarity = cleanWordsCount > 0
      ? Math.max(10, Math.min(100, baseClarityGain - clarityPenalties))
      : 0;

    const baseFluencyGain = Math.min(92, Math.round((cleanWordsCount / 14) * 90));
    const fluencyPenalties = (awkwardPausesCount * 5) + (totalFillers * 4);
    const calculatedFluency = cleanWordsCount > 0
      ? Math.max(10, Math.min(100, baseFluencyGain - fluencyPenalties))
      : 0;

    const baseComprehension = Math.min(95, Math.round((cleanWordsCount / 14) * 95));
    const speedDeduction = (wpm > 155 ? (wpm - 155) * 0.9 : 0);
    const calculatedComprehension = cleanWordsCount > 0
      ? Math.max(15, Math.min(100, Math.round(baseComprehension - speedDeduction - (totalFillers * 3))))
      : 0;

    setClarityScore(calculatedClarity);
    setFluencyScore(calculatedFluency);
    setPaceScore(wpm > 0 ? (category === 'Optimal' ? 95 : 75) : 0);

    // Update sentence comparisons
    if (transcriptText.trim().length > 15) {
      const generatedComparisons = buildLocalComparisons(transcriptText);
      if (generatedComparisons.length > 0) {
        setSentenceComparisons(generatedComparisons);
      }
    }

    setGlobalToneMetrics((prev) => ({
      ...prev,
      globalComprehensionScore: calculatedComprehension,
      toneCategory: wpm > 165 ? 'Slightly Rushed' : awkwardPausesCount > 2 ? 'Hesitant / Stalling' : 'Confident & Poised',
      cadenceProfile: wpm > 155 ? 'Rapid Syllable-timed' : 'Controlled Stress-timed (Global standard)',
    }));
  }, [transcriptWords, pauses, wpm, transcriptText]);

  // Start Real-Time Microphone Recording + Camera
  const startRecording = async () => {
    try {
      setStatusMessage('Connecting audio stream and camera...');
      setPauses([]);
      setTranscriptWords([]);
      setTranscriptText('');
      setSentenceComparisons([]);
      setWpm(0);
      setRecordingDuration(0);
      setWaveformPeaks([]);
      recordedChunksRef.current = [];

      // Reset scores to 0
      setClarityScore(0);
      setFluencyScore(0);
      setPaceScore(0);
      setGlobalToneMetrics((prev) => ({ ...prev, globalComprehensionScore: 0 }));

      // Ensure camera is open if enabled
      if (isCameraEnabled && !videoStream) {
        await initCameraPreview();
      }

      let pauseTimerStart = 0;
      const stream = await audioEngineRef.current!.startMicrophone(
        (stats, currentDuration) => {
          setAudioStats(stats);
          setRecordingDuration(currentDuration);
          setTotalAudioDuration(currentDuration);

          if (stats.isSilent) {
            setIsPausedSilence(true);
            if (!pauseTimerStart) pauseTimerStart = performance.now();
            setActivePauseDuration((performance.now() - pauseTimerStart) / 1000);
          } else {
            setIsPausedSilence(false);
            pauseTimerStart = 0;
            setActivePauseDuration(0);
          }
        },
        (detectedPause) => {
          setPauses((prev) => [...prev, detectedPause]);
        }
      );

      try {
        const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: mime });
          liveAudioBlobRef.current = blob;
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        };
        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
      } catch (e) {
        console.warn('MediaRecorder warning:', e);
      }

      speechEngineRef.current?.start(
        selectedLanguage,
        (fullText, words) => {
          setTranscriptText(fullText);
          setTranscriptWords(words);
        },
        (currentWpm) => {
          setWpm(currentWpm);
        },
        (err) => {
          setStatusMessage(err);
        }
      );

      setIsRecording(true);
      setStatusMessage('Live interview recording active. Speak clearly to watch your clarity score climb from 0!');
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setStatusMessage(`Microphone error: ${err?.message || 'Access denied. Check browser permissions.'}`);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    audioEngineRef.current?.stop();
    speechEngineRef.current?.stop();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPausedSilence(false);
    setActivePauseDuration(0);
    setStatusMessage('Recording finished. Final speech clarity and sentence comparisons calculated.');

    if (transcriptText.trim().length > 10) {
      runDeepSpeechAnalysis();
    }
  };

  // Handle Opening / Uploading Audio File of ANY Duration
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatusMessage(`Decoding audio file "${file.name}" of any duration...`);

      const { duration, peaks, pauses: detectedPauses, totalSilenceSeconds } =
        await analyzeAudioFile(file);

      setWaveformPeaks(peaks);
      setTotalAudioDuration(duration);
      setRecordingDuration(duration);
      setPauses(detectedPauses);

      const objectUrl = URL.createObjectURL(file);
      setAudioUrl(objectUrl);

      const estimatedWords = Math.round((duration - totalSilenceSeconds) * 2.3);
      const estWpm = duration > 0 ? Math.round((estimatedWords / duration) * 60) : 135;
      setWpm(estWpm);

      setStatusMessage(
        `Analyzed ${duration.toFixed(1)}s audio file. Detected ${detectedPauses.length} pause segments.`
      );

      runDeepSpeechAnalysis(file, duration, detectedPauses);
    } catch (err: any) {
      console.error('File analysis error:', err);
      setStatusMessage(`Failed to process audio file: ${err?.message || 'Unsupported format'}`);
    }
  };

  // Load Synthetic Demo Audio for 1-click test
  const handleLoadDemo = () => {
    setStatusMessage('Loading cross-cultural interview speech benchmark...');
    const demo = createSyntheticDemoAudio();

    setWaveformPeaks(demo.peaks);
    setTotalAudioDuration(demo.duration);
    setRecordingDuration(demo.duration);
    setPauses(demo.samplePauses);
    setTranscriptText(demo.sampleTranscript);

    const rawTokens = demo.sampleTranscript.split(/\s+/);
    const words: TranscriptWord[] = rawTokens.map((w, idx) => {
      const clean = w.toLowerCase().replace(/[^\w]/g, '');
      const isFiller = ['um', 'uh', 'basically', 'like', 'you know'].includes(clean);
      const prev = idx > 0 ? rawTokens[idx - 1].toLowerCase().replace(/[^\w]/g, '') : '';
      const isWrong = idx > 0 && clean === prev && clean.length > 1;

      return {
        id: `demo-w-${idx}`,
        word: w,
        timestamp: (idx / rawTokens.length) * demo.duration,
        isFiller,
        isWrong,
        issue: isWrong ? 'Stutter Repetition' : undefined,
        suggestion: isWrong ? `Avoid repeating "${clean}"` : undefined,
      };
    });

    setTranscriptWords(words);
    const computedWpm = Math.round((rawTokens.length / demo.duration) * 60);
    setWpm(computedWpm);

    const demoComparisons: SentenceComparison[] = [
      {
        id: 'sc-1',
        originalSentence: 'Hello everyone, myself Rahul.',
        rightSentence: 'Hello everyone, my name is Rahul.',
        improvements: ['Replaced colloquial "myself" with standard professional greeting', 'Clear vocal articulation'],
        category: 'Global Tone',
        whyItSoundsBetter: 'In US and European corporate interviews, starting with "Myself [Name]" sounds informal. "My name is [Name]" is internationally respected.',
      },
      {
        id: 'sc-2',
        originalSentence: 'Um today I want to give an update regarding our core platform architecture.',
        rightSentence: 'Today, I would like to provide an executive update on our core platform architecture.',
        improvements: ['Removed hesitation sound "um"', 'Upgraded "want to give" to executive phrasing "would like to provide"'],
        category: 'Clarity',
        whyItSoundsBetter: 'Sounds authoritative, organized, and confident from the very first opening sentence.',
      },
      {
        id: 'sc-3',
        originalSentence: 'Uh we did not got any blocker issues and basically we can prepone our release schedule.',
        rightSentence: 'We encountered no blocking issues, allowing us to expedite our release schedule.',
        improvements: ['Corrected past tense grammar ("did not got")', 'Replaced Indianism "prepone" with global standard "expedite"', 'Eliminated "uh" and "basically"'],
        category: 'Grammar',
        whyItSoundsBetter: 'International interviewers outside South Asia are unfamiliar with the word "prepone". Using "expedite" or "move forward" ensures total comprehension.',
      },
      {
        id: 'sc-4',
        originalSentence: 'Like you know our latency is 20 milliseconds, but we we will do one thing, we will test everything before pushing to production.',
        rightSentence: 'Our system latency is currently twenty milliseconds. We will conduct comprehensive testing prior to production deployment.',
        improvements: ['Eliminated filler "like you know"', 'Removed stutter repetition "we we"', 'Replaced colloquial "do one thing" with decisive action'],
        category: 'Pronunciation & Phrasing',
        whyItSoundsBetter: 'Conveys deep engineering rigor and executive clarity without conversational hesitation.',
      },
    ];

    setSentenceComparisons(demoComparisons);
    setGlobalToneMetrics({
      toneCategory: 'Slightly Rushed',
      globalComprehensionScore: 78,
      speedPacingAdvice: 'Speaking at 168 WPM with syllable-timed cadence. Slow down to 135 WPM so American & European interviewers can digest technical points easily.',
      accentToneAdvice: 'Enunciate the -ed in "encountered" and separate thoughts with 1-second strategic pauses.',
      cadenceProfile: 'Rapid Syllable-timed cadence',
    });

    setClarityScore(76);
    setFluencyScore(72);
    setPaceScore(80);
    setAnalysisSource('algorithmic');
    setSummary(
      'Interview benchmark loaded. Key findings: 3 awkward pauses (>1.2s), rapid 168 WPM pacing, colloquial Indianisms ("myself Rahul", "prepone", "do one thing"), and 4 filler words. Right-sentence comparisons generated below.'
    );
    setStatusMessage('Demo speech loaded. Waveform, pauses, and right-sentence comparisons are displayed below.');
  };

  // Deep AI Analysis Call to server.ts
  const runDeepSpeechAnalysis = async (
    optionalFile?: File,
    overrideDuration?: number,
    overridePauses?: DetectedPause[]
  ) => {
    setIsAnalyzingDeep(true);
    setStatusMessage('Running deep linguistic & cross-cultural analysis with Gemini AI...');

    try {
      const duration = overrideDuration || recordingDuration || totalAudioDuration || 1;
      const currentPauses = overridePauses || pauses;

      let audioBase64: string | null = null;
      let mimeType = 'audio/webm';

      const fileToConvert = optionalFile || liveAudioBlobRef.current;
      if (fileToConvert && fileToConvert.size < 20 * 1024 * 1024) {
        mimeType = fileToConvert.type || 'audio/webm';
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(fileToConvert);
        });
      }

      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptText,
          durationSeconds: duration,
          detectedPauses: currentPauses,
          language: selectedLanguage,
          audioBase64,
          mimeType,
          scenario: interviewScenario,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis server responded with ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.analysis;

      if (analysis) {
        setAnalysisSource(data.source || 'gemini-ai');
        if (analysis.fluencyScore) setFluencyScore(analysis.fluencyScore);
        if (analysis.clarityScore) setClarityScore(analysis.clarityScore);
        if (analysis.paceScore) setPaceScore(analysis.paceScore);
        if (analysis.detectedPaceCategory) setPaceCategory(analysis.detectedPaceCategory);
        if (analysis.sentenceComparisons && analysis.sentenceComparisons.length > 0) {
          setSentenceComparisons(analysis.sentenceComparisons);
        }
        if (analysis.globalToneMetrics) {
          setGlobalToneMetrics(analysis.globalToneMetrics);
        }
        if (analysis.wrongWords && analysis.wrongWords.length > 0) {
          setWrongWords(analysis.wrongWords);
        }
        if (analysis.fillerWords && analysis.fillerWords.length > 0) {
          setFillerWords(analysis.fillerWords);
        }
        if (analysis.actionableTips) setActionableTips(analysis.actionableTips);
        if (analysis.summary) setSummary(analysis.summary);
      }

      setStatusMessage('Deep interview analysis complete. Sentence comparisons updated.');
    } catch (err: any) {
      console.warn('Deep speech analysis call warning:', err);
      setStatusMessage('Speech analyzed with onboard algorithmic engine.');
    } finally {
      setIsAnalyzingDeep(false);
    }
  };

  // Add custom comparison item from the Refiner
  const handleAddCustomComparison = (original: string, right: string, category: string, why: string) => {
    const newItem: SentenceComparison = {
      id: `custom-sc-${Date.now()}`,
      originalSentence: original,
      rightSentence: right,
      improvements: ['Executive Polish & Cross-Cultural Alignment'],
      category: category as any,
      whyItSoundsBetter: why,
    };
    setSentenceComparisons((prev) => [newItem, ...prev]);
    setStatusMessage('Added custom refined sentence comparison.');
  };

  // Handle saving comparison as pair in dataset
  const handleSaveAsPair = (original: string, right: string) => {
    setIsCreatePairModalOpen(true);
  };

  const currentResult: AudioAnalysisResult = {
    source: analysisSource,
    durationSeconds: totalAudioDuration || recordingDuration,
    wordCount: transcriptWords.length,
    wpm,
    fluencyScore,
    clarityScore,
    paceScore,
    detectedPaceCategory: paceCategory,
    pacingComment: `Measured rate is ${wpm} WPM. Optimal benchmark for international interviewers: 125–145 WPM.`,
    pauses,
    totalSilenceSeconds: pauses.reduce((acc, p) => acc + p.duration, 0),
    silenceRatio:
      totalAudioDuration > 0
        ? pauses.reduce((acc, p) => acc + p.duration, 0) / totalAudioDuration
        : 0,
    wrongWords,
    fillerWords,
    sentenceComparisons,
    globalToneMetrics,
    pausesEvaluation: {
      totalAwkwardPauses: pauses.filter((p) => p.duration > 1.2).length,
      assessment:
        pauses.filter((p) => p.duration > 1.2).length > 2
          ? 'Noticeable hesitation silences detected'
          : 'Natural cadence with controlled pauses',
      advice: 'Target steady breathing to eliminate hesitation stalls before complex words.',
    },
    actionableTips,
    summary,
  };

  const isCurrentlySpeaking = Boolean(isRecording && audioStats && !audioStats.isSilent);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-x-hidden">
      {/* 1. Interactive Side Dashboard (Sidebar) */}
      <SideDashboard
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeView={activeView}
        onSelectView={(v) => {
          if (v === 'guidelines') {
            setIsGuidelinesModalOpen(true);
          } else {
            setActiveView(v);
          }
        }}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        wpm={wpm}
        clarityScore={clarityScore}
        fluencyScore={fluencyScore}
        paceCategory={paceCategory}
        audioStats={audioStats}
        interviewScenario={interviewScenario}
        onSelectScenario={setInterviewScenario}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={(l) => {
          setSelectedLanguage(l);
          speechEngineRef.current?.setLanguage(l);
        }}
        onLoadDemo={handleLoadDemo}
        onOpenFileUpload={() => fileInputRef.current?.click()}
        onOpenVSCodeModal={() => setIsVSCodeModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenValidatorModal={() => setIsValidatorModalOpen(true)}
        onOpenGuidelinesModal={() => setIsGuidelinesModalOpen(true)}
        counts={{
          wrongWords: wrongWords.length,
          fillerWords: fillerWords.reduce((acc, f) => acc + f.count, 0),
          comparisons: sentenceComparisons.length,
          datasetSamples: datasetCount,
          awkwardPauses: pauses.filter((p) => p.duration > 1.2).length,
        }}
      />

      {/* 2. Main Application Flow Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Bar Header */}
        <TopBar
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenVSCodeModal={() => setIsVSCodeModalOpen(true)}
          onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
          isRecording={isRecording}
          durationSeconds={recordingDuration}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Quick Action Ribbon */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Record / Stop Button */}
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-rose-900/30"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Live Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 rounded-lg transition-colors"
                >
                  <Square className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>Stop Recording</span>
                </button>
              )}

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Open Audio File */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                title="Supports MP3, WAV, M4A, WEBM of any duration"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Audio File</span>
              </button>

              {/* Demo Sample Audio */}
              <button
                onClick={handleLoadDemo}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Benchmark Demo</span>
              </button>

              {/* Export Audit Report */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Audit</span>
              </button>

              {/* Save Current Speech to Dataset */}
              <button
                onClick={() => setIsSaveToDatasetModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/80 text-cyan-300 text-xs font-medium rounded-lg transition-colors"
                title="Save transcript, pauses, wrong words, and audio to the SpeakTwin AI Dataset"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save to Dataset</span>
              </button>

              {/* Integrity Validator Modal */}
              <button
                onClick={() => setIsValidatorModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/80 text-emerald-300 text-xs font-medium rounded-lg transition-colors"
                title="Run relational CSV and audio file validator"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Run Validator</span>
              </button>
            </div>

            {/* Scenario & Language Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                <select
                  value={interviewScenario}
                  onChange={(e) => setInterviewScenario(e.target.value as InterviewScenario)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="tech-interview">Global Tech Interview (US/UK)</option>
                  <option value="study-visa">Study Abroad &amp; Visa Interview</option>
                  <option value="executive-pitch">Executive Keynote &amp; Pitch</option>
                  <option value="general-fluent">General Fluent Speaking</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    const l = e.target.value as SupportedLanguage;
                    setSelectedLanguage(l);
                    speechEngineRef.current?.setLanguage(l);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="en-US">English (US/Global)</option>
                  <option value="mr-IN">Marathi (मराठी)</option>
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Live Notification Bar */}
          {statusMessage && (
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* DYNAMIC VIEW ROUTING */}
          {activeView === 'dataset' && (
            <DatasetDashboard onBackToTelemetry={() => setActiveView('dashboard')} />
          )}

          {activeView === 'drills' && (
            <PracticeDrillsView
              isRecording={isRecording}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              currentWpm={wpm}
              clarityScore={clarityScore}
              fluencyScore={fluencyScore}
              onLoadPromptDemo={(promptText) => {
                setTranscriptText(promptText);
                const tokens = promptText.split(/\s+/);
                setTranscriptWords(
                  tokens.map((t, idx) => ({
                    id: `drill-w-${idx}`,
                    word: t,
                    timestamp: idx * 0.45,
                    isFiller: false,
                    isWrong: false,
                  }))
                );
                setWpm(132);
                setClarityScore(88);
                setFluencyScore(84);
                setStatusMessage('Loaded practice prompt into telemetry engine.');
              }}
            />
          )}

          {activeView === 'comparison' && (
            <div className="space-y-6">
              <SentenceComparisonPanel
                comparisons={sentenceComparisons}
                onAddCustomComparison={handleAddCustomComparison}
                onSaveAsPair={handleSaveAsPair}
              />
              <GlobalToneCard metrics={globalToneMetrics} wpm={wpm} />
            </div>
          )}

          {activeView === 'timeline' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WaveformTimeline
                  peaks={waveformPeaks}
                  durationSeconds={totalAudioDuration || recordingDuration}
                  pauses={pauses}
                  audioUrl={audioUrl}
                />
                <AudioVisualizer
                  stats={audioStats}
                  isRecording={isRecording}
                  isPausedSilence={isPausedSilence}
                  pauseDurationActive={activePauseDuration}
                />
              </div>

              <LiveTranscriptViewer
                transcriptText={transcriptText}
                transcriptWords={transcriptWords}
              />
            </div>
          )}

          {activeView === 'issues' && (
            <div className="space-y-6">
              <DetailedIssuesPanel
                wrongWords={wrongWords}
                fillerWords={fillerWords}
                pauses={pauses}
                actionableTips={actionableTips}
                summary={summary}
                source={analysisSource}
                onRunDeepAnalysis={() => runDeepSpeechAnalysis()}
                isAnalyzingDeep={isAnalyzingDeep}
              />
              <GlobalToneCard metrics={globalToneMetrics} wpm={wpm} />
            </div>
          )}

          {activeView === 'dashboard' && (
            <>
              {/* 3. Core Telemetry KPI Strip */}
              <section aria-label="Core speech telemetry">
                <MetricsCards
                  wpm={wpm}
                  durationSeconds={totalAudioDuration || recordingDuration}
                  wordCount={transcriptWords.length}
                  pauses={pauses}
                  wrongWords={wrongWords}
                  fillerWords={fillerWords}
                  fluencyScore={fluencyScore}
                  clarityScore={clarityScore}
                  detectedPaceCategory={paceCategory}
                  globalToneMetrics={globalToneMetrics}
                />
              </section>

              {/* 4. Global Cross-Cultural Tone Card */}
              <section aria-label="Cross-cultural tone insights">
                <GlobalToneCard metrics={globalToneMetrics} wpm={wpm} />
              </section>

              {/* 5. Synchronized Sentence Comparisons ("Right Sentence") */}
              <section aria-label="Right sentence comparisons">
                <SentenceComparisonPanel
                  comparisons={sentenceComparisons}
                  onAddCustomComparison={handleAddCustomComparison}
                  onSaveAsPair={handleSaveAsPair}
                />
              </section>

              {/* 6. Live Interview Camera Feed + Acoustic Oscilloscope + Waveform Section */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Live Camera Viewport */}
                <div className="lg:col-span-1">
                  <LiveCameraFeed
                    stream={videoStream}
                    isCameraEnabled={isCameraEnabled}
                    isRecording={isRecording}
                    isSpeaking={isCurrentlySpeaking}
                    onToggleCamera={toggleCamera}
                    clarityScore={clarityScore}
                  />
                </div>

                {/* Live Acoustic Oscilloscope */}
                <div className="lg:col-span-1">
                  <AudioVisualizer
                    stats={audioStats}
                    isRecording={isRecording}
                    isPausedSilence={isPausedSilence}
                    pauseDurationActive={activePauseDuration}
                  />
                </div>

                {/* Interactive Waveform Timeline with Pauses Heatmap */}
                <div className="lg:col-span-1">
                  <WaveformTimeline
                    peaks={waveformPeaks}
                    durationSeconds={totalAudioDuration || recordingDuration}
                    pauses={pauses}
                    audioUrl={audioUrl}
                  />
                </div>
              </section>

              {/* 7. Synchronized Transcript & Issues Breakdown */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <LiveTranscriptViewer
                    transcriptText={transcriptText}
                    transcriptWords={transcriptWords}
                  />
                </div>

                <div>
                  <DetailedIssuesPanel
                    wrongWords={wrongWords}
                    fillerWords={fillerWords}
                    pauses={pauses}
                    actionableTips={actionableTips}
                    summary={summary}
                    source={analysisSource}
                    onRunDeepAnalysis={() => runDeepSpeechAnalysis()}
                    isAnalyzingDeep={isAnalyzingDeep}
                  />
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* 8. Modals */}
      <VSCodeGuideModal
        isOpen={isVSCodeModalOpen}
        onClose={() => setIsVSCodeModalOpen(false)}
      />

      <GitHubGuideModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        result={currentResult}
        transcriptText={transcriptText}
      />

      <DatasetValidatorModal
        isOpen={isValidatorModalOpen}
        onClose={() => setIsValidatorModalOpen(false)}
      />

      <AnnotationGuidelinesModal
        isOpen={isGuidelinesModalOpen}
        onClose={() => setIsGuidelinesModalOpen(false)}
      />

      <CreatePairModal
        isOpen={isCreatePairModalOpen}
        onClose={() => setIsCreatePairModalOpen(false)}
        onPairCreated={() => {
          setStatusMessage('New contrastive speech pair added to dataset.');
          fetchDatasetSummaryQuick();
        }}
        existingSamples={datasetSamplesCache}
      />

      <RecordSampleModal
        isOpen={isSaveToDatasetModalOpen}
        onClose={() => setIsSaveToDatasetModalOpen(false)}
        onSampleCreated={() => {
          setStatusMessage('Analysis saved as a sample in the Custom Speech Dataset.');
          fetchDatasetSummaryQuick();
        }}
        initialData={{
          transcript: transcriptText,
          audioBlob: liveAudioBlobRef.current,
          duration: totalAudioDuration || recordingDuration,
          wrongWords: wrongWords,
          category:
            wrongWords.length > 0 || fillerWords.length > 2
              ? 'Speech with Identified Errors'
              : 'Good Speech',
        }}
      />
    </div>
  );
}
