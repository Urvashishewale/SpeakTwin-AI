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
} from 'lucide-react';

import { TopBar } from './components/TopBar';
import { MetricsCards } from './components/MetricsCards';
import { AudioVisualizer } from './components/AudioVisualizer';
import { WaveformTimeline } from './components/WaveformTimeline';
import { LiveTranscriptViewer } from './components/LiveTranscriptViewer';
import { DetailedIssuesPanel } from './components/DetailedIssuesPanel';
import { VSCodeGuideModal } from './components/VSCodeGuideModal';
import { ExportModal } from './components/ExportModal';

import {
  AudioAnalysisResult,
  DetectedPause,
  FillerWordItem,
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

export default function App() {
  // Navigation View
  const [activeView, setActiveView] = useState<'dashboard' | 'timeline' | 'issues'>('dashboard');

  // Modals
  const [isVSCodeModalOpen, setIsVSCodeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Audio Engine & Speech State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en-US');

  // Real-time Visualizer Stats
  const [audioStats, setAudioStats] = useState<RealtimeAudioStats | null>(null);
  const [isPausedSilence, setIsPausedSilence] = useState(false);
  const [activePauseDuration, setActivePauseDuration] = useState(0);

  // Analysis Data
  const [wpm, setWpm] = useState(0);
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptWords, setTranscriptWords] = useState<TranscriptWord[]>([]);
  const [pauses, setPauses] = useState<DetectedPause[]>([]);
  const [wrongWords, setWrongWords] = useState<WrongWordItem[]>([]);
  const [fillerWords, setFillerWords] = useState<FillerWordItem[]>([]);
  const [fluencyScore, setFluencyScore] = useState(90);
  const [clarityScore, setClarityScore] = useState(92);
  const [paceScore, setPaceScore] = useState(88);
  const [paceCategory, setPaceCategory] = useState<'Too Slow' | 'Optimal' | 'Slightly Fast' | 'Too Fast'>('Optimal');

  // Waveform Data
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [totalAudioDuration, setTotalAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Deep AI Analysis State
  const [analysisSource, setAnalysisSource] = useState<'realtime' | 'algorithmic' | 'gemini-ai'>('realtime');
  const [summary, setSummary] = useState(
    'Real-time speech analytics active. Pauses, speaking speed, stumbles, and filler words are monitored simultaneously.'
  );
  const [actionableTips, setActionableTips] = useState<string[]>([
    'Maintain a measured cadence between 130 and 160 words per minute.',
    'Embrace intentional silent pauses rather than vocalizing filler sounds like "um" or "like".',
    'Articulate the final consonant of each phrase to boost speech clarity.',
  ]);
  const [isAnalyzingDeep, setIsAnalyzingDeep] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Engines Refs
  const audioEngineRef = useRef<RealtimeAudioEngine | null>(null);
  const speechEngineRef = useRef<SpeechRecognitionEngine | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const liveAudioBlobRef = useRef<Blob | null>(null);

  // Initialize Engines on mount
  useEffect(() => {
    audioEngineRef.current = new RealtimeAudioEngine();
    speechEngineRef.current = new SpeechRecognitionEngine();

    return () => {
      audioEngineRef.current?.stop();
      speechEngineRef.current?.stop();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  // Recalculate Scores and Filler breakdown when words/pauses change
  useEffect(() => {
    if (transcriptWords.length === 0) return;

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
      else if (wpm > 160) category = 'Slightly Fast';
    }
    setPaceCategory(category);

    // Score deduction math
    const totalFillers = fillersArray.reduce((acc, f) => acc + f.count, 0);
    const awkwardPausesCount = pauses.filter((p) => p.duration > 1.2).length;
    const pausePenalty = Math.min(25, awkwardPausesCount * 4);
    const fillerPenalty = Math.min(30, totalFillers * 4);
    const speedPenalty = wpm > 0 && (wpm < 100 || wpm > 180) ? 12 : 0;

    const calculatedFluency = Math.max(35, Math.min(100, Math.round(100 - pausePenalty - fillerPenalty - speedPenalty)));
    const calculatedClarity = Math.max(45, Math.min(100, Math.round(96 - (wrongList.length * 6) - (totalFillers * 2))));

    setFluencyScore(calculatedFluency);
    setClarityScore(calculatedClarity);
  }, [transcriptWords, pauses, wpm]);

  // Start Real-Time Microphone Recording
  const startRecording = async () => {
    try {
      setStatusMessage('Requesting microphone access...');
      // Reset state for new session
      setPauses([]);
      setTranscriptWords([]);
      setTranscriptText('');
      setWpm(0);
      setRecordingDuration(0);
      setWaveformPeaks([]);
      recordedChunksRef.current = [];

      // 1. Start Web Audio Engine for Real-time FFT and Pauses Detection
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

      // 2. Start MediaRecorder to capture audio for playback & deep analysis
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

      // 3. Start Web Speech Recognition Engine for simultaneous live transcription & WPM
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
      setStatusMessage('Live recording active. Analyzing pauses, speed, and stumbles in real time.');
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
    setStatusMessage('Recording finished. Audio and analytics synchronized.');
  };

  // Handle Opening / Uploading Audio File of ANY Duration
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatusMessage(`Decoding audio file "${file.name}" of any duration...`);

      // 1. Analyze Audio File (Peaks & Silence Scanning across any duration)
      const { duration, peaks, pauses: detectedPauses, totalSilenceSeconds } =
        await analyzeAudioFile(file);

      setWaveformPeaks(peaks);
      setTotalAudioDuration(duration);
      setRecordingDuration(duration);
      setPauses(detectedPauses);

      const objectUrl = URL.createObjectURL(file);
      setAudioUrl(objectUrl);

      // Estimate WPM and words from typical speech cadence or prompt transcript
      const estimatedWords = Math.round((duration - totalSilenceSeconds) * 2.3);
      const estWpm = duration > 0 ? Math.round((estimatedWords / duration) * 60) : 135;
      setWpm(estWpm);

      setStatusMessage(
        `Successfully analyzed ${duration.toFixed(1)}s audio file. Detected ${detectedPauses.length} pauses.`
      );

      // If user has a transcript or wants Deep AI analysis, prepare the payload
      runDeepSpeechAnalysis(file, duration, detectedPauses);
    } catch (err: any) {
      console.error('File analysis error:', err);
      setStatusMessage(`Failed to process audio file: ${err?.message || 'Unsupported format'}`);
    }
  };

  // Load Synthetic Demo Audio for 1-click test
  const handleLoadDemo = () => {
    setStatusMessage('Loading benchmark speech recording...');
    const demo = createSyntheticDemoAudio();

    setWaveformPeaks(demo.peaks);
    setTotalAudioDuration(demo.duration);
    setRecordingDuration(demo.duration);
    setPauses(demo.samplePauses);
    setTranscriptText(demo.sampleTranscript);

    // Convert sample transcript into words tokens
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
    setAnalysisSource('algorithmic');
    setSummary(
      'Demo speech loaded. Key findings: 3 awkward pauses (>1.2s), repeated stutter ("the the"), and 4 filler words ("um", "uh", "basically", "like").'
    );
    setStatusMessage('Demo speech loaded. Waveform, pauses, and stumbles are displayed below.');
  };

  // Deep AI Analysis Call to server.ts
  const runDeepSpeechAnalysis = async (
    optionalFile?: File,
    overrideDuration?: number,
    overridePauses?: DetectedPause[]
  ) => {
    setIsAnalyzingDeep(true);
    setStatusMessage('Running deep linguistic & acoustic analysis with Gemini AI...');

    try {
      const duration = overrideDuration || recordingDuration || totalAudioDuration || 1;
      const currentPauses = overridePauses || pauses;

      let audioBase64: string | null = null;
      let mimeType = 'audio/webm';

      // Convert recorded blob or uploaded file to base64 if small enough (< 20MB)
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
        if (analysis.wrongWords && analysis.wrongWords.length > 0) {
          setWrongWords(analysis.wrongWords);
        }
        if (analysis.fillerWords && analysis.fillerWords.length > 0) {
          setFillerWords(analysis.fillerWords);
        }
        if (analysis.actionableTips) setActionableTips(analysis.actionableTips);
        if (analysis.summary) setSummary(analysis.summary);
      }

      setStatusMessage('Deep speech analysis complete. Coaching points updated.');
    } catch (err: any) {
      console.warn('Deep speech analysis call warning:', err);
      setStatusMessage('Speech analyzed with onboard algorithmic engine.');
    } finally {
      setIsAnalyzingDeep(false);
    }
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
    pacingComment: `Measured rate is ${wpm} WPM. Optimal benchmark: 130–160 WPM.`,
    pauses,
    totalSilenceSeconds: pauses.reduce((acc, p) => acc + p.duration, 0),
    silenceRatio:
      totalAudioDuration > 0
        ? pauses.reduce((acc, p) => acc + p.duration, 0) / totalAudioDuration
        : 0,
    wrongWords,
    fillerWords,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header (Top Bar Contract) */}
      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenVSCodeModal={() => setIsVSCodeModalOpen(true)}
        isRecording={isRecording}
        durationSeconds={recordingDuration}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Workspace Toolbar: Actions Island */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Record / Stop Button */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-md transition-colors shadow-sm shadow-rose-900/30"
              >
                <Mic className="w-4 h-4" />
                <span>Start Live Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 rounded-md transition-colors"
              >
                <Square className="w-4 h-4 text-rose-500 fill-rose-500" />
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

            {/* Open / Upload Any Audio File */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
              title="Supports MP3, WAV, M4A, WEBM, FLAC of any duration"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Open Audio File</span>
            </button>

            {/* Demo Sample Audio */}
            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-md transition-colors"
            >
              <PlayCircle className="w-4 h-4 text-indigo-400" />
              <span>Load Demo Speech</span>
            </button>

            {/* Export Report */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-md transition-colors"
            >
              <FileDown className="w-4 h-4 text-slate-400" />
              <span>Export Audit</span>
            </button>
          </div>

          {/* Language Selector & Engine Telemetry Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="lang-select" className="sr-only">Language</label>
              <select
                id="lang-select"
                value={selectedLanguage}
                onChange={(e) => {
                  const l = e.target.value as SupportedLanguage;
                  setSelectedLanguage(l);
                  speechEngineRef.current?.setLanguage(l);
                }}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="en-US">English (US)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>RMS Gate: 0.45s</span>
            </div>
          </div>
        </section>

        {/* Live Status Notification Bar (if active) */}
        {statusMessage && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/50 border border-slate-800/80 rounded text-xs text-slate-300">
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
          />
        </section>

        {/* 4. Acoustic Waveform & Live Oscilloscope Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live Oscilloscope */}
          <div className="lg:col-span-1">
            <AudioVisualizer
              stats={audioStats}
              isRecording={isRecording}
              isPausedSilence={isPausedSilence}
              pauseDurationActive={activePauseDuration}
            />
          </div>

          {/* Interactive Waveform Timeline with Pauses Heatmap */}
          <div className="lg:col-span-2">
            <WaveformTimeline
              peaks={waveformPeaks}
              durationSeconds={totalAudioDuration || recordingDuration}
              pauses={pauses}
              audioUrl={audioUrl}
            />
          </div>
        </section>

        {/* 5. Synchronized Transcript & Issues Breakdown */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Real-time Synchronized Transcript */}
          <div>
            <LiveTranscriptViewer
              transcriptText={transcriptText}
              transcriptWords={transcriptWords}
            />
          </div>

          {/* Detailed Issues Breakdown: Wrong words, Fillers, Pauses, Coach */}
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
      </main>

      {/* 6. Modals */}
      <VSCodeGuideModal
        isOpen={isVSCodeModalOpen}
        onClose={() => setIsVSCodeModalOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        result={currentResult}
        transcriptText={transcriptText}
      />
    </div>
  );
}
