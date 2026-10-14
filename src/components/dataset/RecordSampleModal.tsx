/**
 * SpeakTwin AI — Record / Upload Sample Modal
 * Allows recording via microphone or uploading audio files (WAV, MP3, WebM),
 * inspecting audio before saving, running speech recognition, and assigning metadata.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  Sparkles,
} from 'lucide-react';

import {
  AlignmentLabelRecord,
  ErrorCategory,
  SampleCategory,
  VerificationStatus,
} from '../../types/dataset';

interface RecordSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSampleCreated: () => void;
  initialData?: {
    transcript?: string;
    audioBlob?: Blob | null;
    duration?: number;
    wrongWords?: any[];
    category?: SampleCategory;
  };
}

export const RecordSampleModal: React.FC<RecordSampleModalProps> = ({
  isOpen,
  onClose,
  onSampleCreated,
  initialData,
}) => {
  const [sampleId, setSampleId] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [speakerId, setSpeakerId] = useState('SPK_001');
  const [category, setCategory] = useState<SampleCategory>('Good Speech');
  const [referencePairId, setReferencePairId] = useState('');

  // Audio Recording & Upload State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);

  // Transcript Fields
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [verifiedTranscript, setVerifiedTranscript] = useState('');
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [hasUncertainty, setHasUncertainty] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Recorded');
  const [notes, setNotes] = useState('');

  // Pre-configured alignment labels to import
  const [pendingLabels, setPendingLabels] = useState<
    Omit<AlignmentLabelRecord, 'label_id' | 'sample_id'>[]
  >([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio & Mic Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const defaultCategory = initialData?.category || 'Good Speech';
    const catCode = defaultCategory === 'Good Speech' ? 'GOOD' : 'ERROR';
    setSampleId(`SMP_${randomSuffix}_${catCode}`);
    setSampleName(`Candidate Speech ${randomSuffix}`);
    setCategory(defaultCategory);

    if (initialData?.transcript) {
      setOriginalTranscript(initialData.transcript);
      setVerifiedTranscript(initialData.transcript);
      setCorrectedTranscript(initialData.transcript);
    } else {
      setOriginalTranscript('');
      setVerifiedTranscript('');
      setCorrectedTranscript('');
    }

    if (initialData?.audioBlob) {
      setRecordedBlob(initialData.audioBlob);
      const url = URL.createObjectURL(initialData.audioBlob);
      setAudioUrl(url);
      setAudioDuration(initialData.duration || 0);
      setVerificationStatus('Recorded');
    } else {
      setRecordedBlob(null);
      setAudioUrl(null);
      setAudioDuration(0);
      setVerificationStatus('Pending Recording');
    }

    // Convert wrong words into initial labels if available
    if (initialData?.wrongWords && initialData.wrongWords.length > 0) {
      const generated = initialData.wrongWords.map((ww: any) => ({
        reference_pair_id: '',
        start_time: ww.timestamp ?? null,
        end_time: ww.timestamp ? ww.timestamp + 0.6 : null,
        reference_text: ww.rightAlternative || ww.word,
        spoken_text: ww.word,
        error_category: (ww.issue === 'Grammar'
          ? 'Grammar Error'
          : ww.issue === 'Stutter'
          ? 'Repeated Word'
          : 'Incorrect Word Choice') as ErrorCategory,
        corrected_text: ww.rightAlternative || ww.word,
        severity: 'Medium' as const,
        confidence: 'High' as const,
        alignment_type: 'Grammar Annotation' as const,
        annotation_notes: ww.suggestion || 'Imported from speech telemetry analyzer',
      }));
      setPendingLabels(generated);
    } else {
      setPendingLabels([]);
    }

    setErrorMessage(null);
  }, [isOpen, initialData]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsRecording(false);
    setIsPlayingAudio(false);
  };

  // Start in-modal microphone recording
  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setVerificationStatus('Recorded');
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Attempt Speech Recognition in parallel
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = 'en-US';
        reco.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          const clean = text.trim();
          setOriginalTranscript(clean);
          setVerifiedTranscript(clean);
          setCorrectedTranscript(clean);
        };
        reco.start();
        recognitionRef.current = reco;
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage(`Could not access microphone: ${err?.message || 'Permission denied'}`);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setAudioDuration(recordingSeconds);
  };

  // Handle local audio file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Audio file exceeds maximum allowed size of 50 MB.');
      return;
    }

    // Validate format
    const validTypes = [
      'audio/webm',
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/mpeg',
      'audio/mp3',
      'audio/m4a',
      'audio/mp4',
      'audio/ogg',
    ];
    if (!validTypes.some((t) => file.type.includes(t.replace('audio/', '')) || file.type === t)) {
      setErrorMessage(
        `Unsupported audio container "${file.type}". Please use WAV, MP3, WebM, or M4A.`
      );
      return;
    }

    setErrorMessage(null);
    setRecordedBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setVerificationStatus('Recorded');

    // Get duration via Audio element
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setAudioDuration(tempAudio.duration || 0);
    };
  };

  // Toggle playback of recorded/uploaded audio
  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlayingAudio(false);
        });
    }
  };

  // Discard current audio
  const discardAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setRecordedBlob(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setRecordingSeconds(0);
    setIsPlayingAudio(false);
    setVerificationStatus('Pending Recording');
  };

  // Submit and save to dataset
  const handleSaveSample = async () => {
    if (!sampleId.trim()) {
      setErrorMessage('Sample ID cannot be empty (e.g. SMP_001_GOOD).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let audioBase64: string | undefined = undefined;
      let audio_format = 'webm';

      if (recordedBlob) {
        if (recordedBlob.type.includes('wav')) audio_format = 'wav';
        else if (recordedBlob.type.includes('mp3') || recordedBlob.type.includes('mpeg')) audio_format = 'mp3';
        else if (recordedBlob.type.includes('m4a') || recordedBlob.type.includes('mp4')) audio_format = 'm4a';

        audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(recordedBlob);
        });
      }

      const payload = {
        sample_id: sampleId.trim(),
        sample_name: sampleName.trim() || sampleId.trim(),
        speaker_id: speakerId.trim() || 'SPK_001',
        sample_category: category,
        reference_pair_id: referencePairId.trim() || undefined,
        duration_seconds: audioDuration || recordingSeconds || 0,
        audio_format,
        original_transcript: originalTranscript,
        verified_transcript: verifiedTranscript || originalTranscript,
        corrected_transcript: correctedTranscript || originalTranscript,
        language: 'en-US',
        verification_status: verificationStatus,
        notes,
        has_uncertainty: hasUncertainty,
        audioBase64,
        labels: pendingLabels,
      };

      const res = await fetch('/api/dataset/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      onSampleCreated();
      onClose();
    } catch (err: any) {
      console.error('Save sample error:', err);
      setErrorMessage(err.message || 'Failed to save sample to dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Add Sample to Custom Speech Dataset</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record microphone audio or upload WAV/MP3 to register a ground-truth speech record
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-md text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Identification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sample ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                placeholder="e.g. SMP_003_GOOD"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">Unique identifier in metadata.csv</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sample Title / Context</label>
              <input
                type="text"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                placeholder="e.g. Self Introduction Clean"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* 2. Category Selection (Zero-Pill, clear interactive segmented tabs) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Sample Category <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCategory('Good Speech');
                  if (!sampleId.includes('_GOOD') && !sampleId.includes('_ERROR')) {
                    setSampleId(`${sampleId}_GOOD`);
                  } else {
                    setSampleId(sampleId.replace('_ERROR', '_GOOD'));
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  category === 'Good Speech'
                    ? 'border-emerald-500/80 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-400">A. Good Speech</span>
                  {category === 'Good Speech' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Standard grammar, controlled cadence (125-155 WPM), natural pauses, zero awkward stumbles.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('Speech with Identified Errors');
                  if (!sampleId.includes('_GOOD') && !sampleId.includes('_ERROR')) {
                    setSampleId(`${sampleId}_ERROR`);
                  } else {
                    setSampleId(sampleId.replace('_GOOD', '_ERROR'));
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  category === 'Speech with Identified Errors'
                    ? 'border-rose-500/80 bg-rose-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-rose-400">B. Speech with Identified Errors</span>
                  {category === 'Speech with Identified Errors' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Contains grammatical slips, extraneous articles, stutters, fillers, or awkward pauses.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Audio Recording & Upload Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">Audio Recording / File</span>
              <span className="text-xs font-mono text-slate-400">
                {audioDuration > 0
                  ? `${audioDuration.toFixed(1)}s recorded`
                  : isRecording
                  ? `Recording: ${recordingSeconds}s`
                  : 'No audio attached yet'}
              </span>
            </div>

            {/* Audio Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record from Mic</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-medium border border-rose-800 rounded-md transition-colors animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-400" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/wav,audio/mp3,audio/mpeg,audio/webm,audio/m4a,audio/ogg"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 rounded-md transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload WAV / MP3</span>
              </button>

              {audioUrl && (
                <>
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium border border-slate-700 rounded-md transition-colors"
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingAudio ? 'Pause' : 'Play Audio'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={discardAudio}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-medium rounded-md transition-colors"
                    title="Discard audio recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                </>
              )}
            </div>

            {/* Hidden audio element for preview */}
            {audioUrl && (
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            )}
          </div>

          {/* 4. Transcripts Management (Tripartite Architecture) */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Original Recognized Transcript (Immutable ASR Baseline)
                </label>
                <span className="text-[11px] text-slate-500 font-mono">original_transcript</span>
              </div>
              <textarea
                rows={2}
                value={originalTranscript}
                onChange={(e) => setOriginalTranscript(e.target.value)}
                placeholder="Verbatim text from speech recognition engine or phonetic capture..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Verified Spoken Transcript (Human Reviewed Spoken Truth)
                </label>
                <span className="text-[11px] text-cyan-400 font-mono">verified_transcript</span>
              </div>
              <textarea
                rows={2}
                value={verifiedTranscript}
                onChange={(e) => setVerifiedTranscript(e.target.value)}
                placeholder="Verbatim text confirmed by annotator (correcting ASR errors, but keeping speaker slips)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Corrected Reference Target (Target Polish)
                </label>
                <span className="text-[11px] text-emerald-400 font-mono">corrected_transcript</span>
              </div>
              <textarea
                rows={2}
                value={correctedTranscript}
                onChange={(e) => setCorrectedTranscript(e.target.value)}
                placeholder="Expected grammatically correct target sentence..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Transcription Uncertainty Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasUncertainty}
                onChange={(e) => setHasUncertainty(e.target.checked)}
                className="rounded border-slate-800 text-cyan-500 focus:ring-0 bg-slate-950"
              />
              <span className="text-xs text-slate-400">
                Flag speech recognition uncertainty (muffled audio, unclear phonemes, or low confidence)
              </span>
            </label>
          </div>

          {/* 5. Additional Metadata & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Associated Pair ID</label>
              <input
                type="text"
                value={referencePairId}
                onChange={(e) => setReferencePairId(e.target.value)}
                placeholder="e.g. PAIR_001"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Speaker ID</label>
              <input
                type="text"
                value={speakerId}
                onChange={(e) => setSpeakerId(e.target.value)}
                placeholder="SPK_001"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Verification Status</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Pending Recording">Pending Recording</option>
                <option value="Recorded">Recorded</option>
                <option value="Pending Transcription Review">Pending Transcription Review</option>
                <option value="Pending Annotation">Pending Annotation</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* 6. Annotator Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Annotation Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Technical interview scenario with candidate introduction stutters"
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <div className="text-xs text-slate-400">
            {recordedBlob ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audio verified on disk</span>
              </span>
            ) : (
              <span className="text-amber-400">Audio pending recording/upload</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSample}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors disabled:opacity-50 shadow-sm shadow-cyan-950"
            >
              {isSubmitting ? 'Saving Sample...' : 'Save to Dataset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
