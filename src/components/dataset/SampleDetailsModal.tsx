/**
 * SpeakTwin AI — Sample Details & Annotation Inspector Modal
 * Allows viewing/editing tripartite transcripts, audio playback,
 * adding/editing alignment labels across all 13 categories, and updating verification status.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Upload,
  Mic,
  Clock,
  Tag,
  ShieldCheck,
} from 'lucide-react';

import {
  AlignmentLabelRecord,
  AlignmentType,
  Confidence,
  DatasetSampleComposite,
  ErrorCategory,
  SampleCategory,
  Severity,
  VerificationStatus,
} from '../../types/dataset';

interface SampleDetailsModalProps {
  isOpen: boolean;
  sampleId: string | null;
  onClose: () => void;
  onSampleUpdated: () => void;
}

const ERROR_CATEGORIES: ErrorCategory[] = [
  'Grammar Error',
  'Incorrect Word Choice',
  'Unnecessary Word',
  'Missing Word',
  'Repeated Word',
  'Incorrect Verb Form',
  'Incorrect Article',
  'Incorrect Word Order',
  'Filler Word',
  'Long Pause',
  'Pronunciation Deviation',
  'Speech Recognition Uncertainty',
  'Correct Speech',
];

export const SampleDetailsModal: React.FC<SampleDetailsModalProps> = ({
  isOpen,
  sampleId,
  onClose,
  onSampleUpdated,
}) => {
  const [sample, setSample] = useState<DatasetSampleComposite | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [verifiedTranscript, setVerifiedTranscript] = useState('');
  const [correctedTranscript, setCorrectedTranscript] = useState('');
  const [sampleCategory, setSampleCategory] = useState<SampleCategory>('Good Speech');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Recorded');
  const [hasUncertainty, setHasUncertainty] = useState(false);
  const [notes, setNotes] = useState('');

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add Label Form State
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [labelStartTime, setLabelStartTime] = useState<string>('');
  const [labelEndTime, setLabelEndTime] = useState<string>('');
  const [labelRefText, setLabelRefText] = useState('');
  const [labelSpokenText, setLabelSpokenText] = useState('');
  const [labelCategory, setLabelCategory] = useState<ErrorCategory>('Grammar Error');
  const [labelCorrectedText, setLabelCorrectedText] = useState('');
  const [labelSeverity, setLabelSeverity] = useState<Severity>('Medium');
  const [labelConfidence, setLabelConfidence] = useState<Confidence>('High');
  const [labelAlignmentType, setLabelAlignmentType] = useState<AlignmentType>('Grammar Annotation');
  const [labelNotes, setLabelNotes] = useState('');

  // Recording / Upload Replacement for Pending Audio
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen || !sampleId) {
      setSample(null);
      return;
    }
    loadSampleData(sampleId);
  }, [isOpen, sampleId]);

  const loadSampleData = async (id: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/dataset/samples/${id}`);
      if (!res.ok) throw new Error(`Could not load sample ${id}`);
      const data: DatasetSampleComposite = await res.json();
      setSample(data);

      setVerifiedTranscript(data.transcript?.verified_transcript || '');
      setCorrectedTranscript(data.transcript?.corrected_transcript || '');
      setSampleCategory(data.metadata.sample_category);
      setVerificationStatus(data.metadata.verification_status);
      setHasUncertainty(data.transcript?.has_uncertainty || false);
      setNotes(data.metadata.notes || '');
      setDuration(data.metadata.duration_seconds || 0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading sample');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || duration);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Upload audio to satisfy a pending recording
  const handleUploadAudioReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sample) return;

    try {
      setIsUploadingAudio(true);
      setErrorMessage(null);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ext = file.name.split('.').pop() || 'webm';

      const res = await fetch(`/api/dataset/samples/${sample.metadata.sample_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          audio_format: ext,
          verification_status: 'Recorded',
        }),
      });

      if (!res.ok) throw new Error('Failed to upload audio file');
      setSuccessMessage('Audio file attached and saved to disk.');
      loadSampleData(sample.metadata.sample_id);
      onSampleUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Audio upload failed');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Save changes to transcripts and status
  const handleSaveChanges = async () => {
    if (!sample) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/dataset/samples/${sample.metadata.sample_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified_transcript: verifiedTranscript,
          corrected_transcript: correctedTranscript,
          sample_category: sampleCategory,
          verification_status: verificationStatus,
          has_uncertainty: hasUncertainty,
          notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update sample');
      setSuccessMessage('Sample metadata and transcripts updated successfully.');
      onSampleUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes');
    }
  };

  // Add alignment label
  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sample) return;

    try {
      const start = labelStartTime.trim() ? parseFloat(labelStartTime) : null;
      const end = labelEndTime.trim() ? parseFloat(labelEndTime) : null;

      const payload = {
        sample_id: sample.metadata.sample_id,
        reference_pair_id: sample.transcript?.reference_pair_id || '',
        start_time: start,
        end_time: end,
        reference_text: labelRefText.trim(),
        spoken_text: labelSpokenText.trim(),
        error_category: labelCategory,
        corrected_text: labelCorrectedText.trim(),
        severity: labelSeverity,
        confidence: labelConfidence,
        alignment_type: labelAlignmentType,
        annotation_notes: labelNotes.trim(),
      };

      const res = await fetch('/api/dataset/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to add alignment label');

      // Reset form
      setIsAddingLabel(false);
      setLabelRefText('');
      setLabelSpokenText('');
      setLabelCorrectedText('');
      setLabelStartTime('');
      setLabelEndTime('');
      setLabelNotes('');
      loadSampleData(sample.metadata.sample_id);
      onSampleUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add label');
    }
  };

  // Delete label
  const handleDeleteLabel = async (labelId: string) => {
    if (!sample) return;
    try {
      const res = await fetch(`/api/dataset/labels/${labelId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete label');
      loadSampleData(sample.metadata.sample_id);
      onSampleUpdated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete label');
    }
  };

  // Delete entire sample
  const handleDeleteSample = async () => {
    if (!sample) return;
    if (!confirm(`Are you sure you want to permanently delete sample "${sample.metadata.sample_id}" and its audio from disk?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/dataset/samples/${sample.metadata.sample_id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete sample');
      onSampleUpdated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Delete failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <FileAudio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono">{sampleId}</h2>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300 font-medium">
                  {sample?.metadata.sample_name || 'Speech Sample Details'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Inspect tripartite transcripts, acoustic playback, and alignment labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-md text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-md text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading sample data...</div>
          ) : !sample ? (
            <div className="py-12 text-center text-xs text-slate-400">Sample could not be found.</div>
          ) : (
            <>
              {/* 1. Acoustic Audio Player Bar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {sample.hasAudioOnDisk && sample.audioUrl ? (
                      <button
                        onClick={toggleAudio}
                        className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-colors shadow-sm shadow-cyan-950 shrink-0"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-950/50 border border-amber-800/60 text-amber-400 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {sample.hasAudioOnDisk ? 'Verified Physical Audio' : 'Audio Pending Capture'}
                        </span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs font-mono text-cyan-400">
                          {sample.hasAudioOnDisk
                            ? `${currentTime.toFixed(1)}s / ${(duration || sample.metadata.duration_seconds).toFixed(1)}s`
                            : '0.0s'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sample.hasAudioOnDisk
                          ? `File: ${sample.metadata.audio_file} (${(sample.metadata.file_size_bytes / 1024).toFixed(1)} KB)`
                          : 'No recording on disk yet. You can attach a WAV/MP3 recording below.'}
                      </p>
                    </div>
                  </div>

                  {/* If audio is missing, allow direct attach */}
                  {!sample.hasAudioOnDisk && (
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileUploadRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleUploadAudioReplacement}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileUploadRef.current?.click()}
                        disabled={isUploadingAudio}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/40 hover:bg-cyan-800/40 border border-cyan-700/60 text-cyan-200 text-xs font-medium rounded-md transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingAudio ? 'Uploading...' : 'Attach Audio File'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {sample.hasAudioOnDisk && sample.audioUrl && (
                  <audio
                    ref={audioRef}
                    src={sample.audioUrl}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                )}
              </div>

              {/* 2. Tripartite Transcripts Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tripartite Transcript Structure
                </h3>

                {/* Original Transcript (Immutable) */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-300">
                      1. Original Recognized Transcript (Immutable ASR)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">original_transcript</span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/50">
                    {sample.transcript?.original_transcript || '(No ASR transcript recorded)'}
                  </p>
                </div>

                {/* Verified Transcript */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-cyan-400">
                      2. Verified Spoken Transcript (Human Reviewed Truth)
                    </span>
                    <span className="text-[11px] text-cyan-500/80 font-mono">verified_transcript</span>
                  </div>
                  <textarea
                    rows={2}
                    value={verifiedTranscript}
                    onChange={(e) => setVerifiedTranscript(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Verbatim text verified by human annotator..."
                  />
                </div>

                {/* Corrected Reference Target */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-emerald-400">
                      3. Corrected Reference Target (Ideal Ground Truth)
                    </span>
                    <span className="text-[11px] text-emerald-500/80 font-mono">corrected_transcript</span>
                  </div>
                  <textarea
                    rows={2}
                    value={correctedTranscript}
                    onChange={(e) => setCorrectedTranscript(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Grammatically polished reference target sentence..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasUncertainty}
                      onChange={(e) => setHasUncertainty(e.target.checked)}
                      className="rounded border-slate-800 text-cyan-500 focus:ring-0 bg-slate-950"
                    />
                    <span className="text-xs text-slate-400">Flag ASR Uncertainty</span>
                  </label>
                </div>
              </div>

              {/* 3. Category & Verification Status Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sample Category</label>
                  <select
                    value={sampleCategory}
                    onChange={(e) => setSampleCategory(e.target.value as SampleCategory)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Good Speech">Good Speech</option>
                    <option value="Speech with Identified Errors">Speech with Identified Errors</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Status</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
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

              {/* 4. Alignment Labels Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Alignment Labels ({sample.labels.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Word-level and sentence-level error alignments with acoustic timing
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingLabel(!isAddingLabel)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Label</span>
                  </button>
                </div>

                {/* Add Label Form Inline */}
                {isAddingLabel && (
                  <form
                    onSubmit={handleAddLabel}
                    className="bg-slate-950 border border-cyan-800/60 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-semibold text-cyan-400">New Alignment Label</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingLabel(false)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Error Taxonomy Category
                        </label>
                        <select
                          value={labelCategory}
                          onChange={(e) => setLabelCategory(e.target.value as ErrorCategory)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          {ERROR_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Alignment Modality
                        </label>
                        <select
                          value={labelAlignmentType}
                          onChange={(e) => setLabelAlignmentType(e.target.value as AlignmentType)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Grammar Annotation">Grammar Annotation</option>
                          <option value="Acoustic Delivery Annotation">Acoustic Delivery Annotation</option>
                          <option value="Text Alignment">Text Alignment</option>
                          <option value="Audio Timing Alignment">Audio Timing Alignment</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Actual Spoken Text
                        </label>
                        <input
                          type="text"
                          value={labelSpokenText}
                          onChange={(e) => setLabelSpokenText(e.target.value)}
                          placeholder="e.g. the Urvashi is"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Corrected / Reference Text
                        </label>
                        <input
                          type="text"
                          value={labelCorrectedText}
                          onChange={(e) => setLabelCorrectedText(e.target.value)}
                          placeholder="e.g. Urvashi"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Start Time (s)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={labelStartTime}
                          onChange={(e) => setLabelStartTime(e.target.value)}
                          placeholder="Optional"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">End Time (s)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={labelEndTime}
                          onChange={(e) => setLabelEndTime(e.target.value)}
                          placeholder="Optional"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Severity</label>
                        <select
                          value={labelSeverity}
                          onChange={(e) => setLabelSeverity(e.target.value as Severity)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Confidence</label>
                        <select
                          value={labelConfidence}
                          onChange={(e) => setLabelConfidence(e.target.value as Confidence)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Annotation Notes</label>
                      <input
                        type="text"
                        value={labelNotes}
                        onChange={(e) => setLabelNotes(e.target.value)}
                        placeholder="e.g. Unnecessary definite article before personal noun"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Commit Label
                      </button>
                    </div>
                  </form>
                )}

                {/* Labels List Table */}
                {sample.labels.length === 0 ? (
                  <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded text-center text-xs text-slate-500">
                    No alignment labels registered for this sample yet.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2 font-medium">Category</th>
                            <th className="px-3 py-2 font-medium">Spoken &rarr; Target</th>
                            <th className="px-3 py-2 font-medium">Timing</th>
                            <th className="px-3 py-2 font-medium">Severity</th>
                            <th className="px-3 py-2 font-medium">Notes</th>
                            <th className="px-3 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                          {sample.labels.map((lbl) => (
                            <tr key={lbl.label_id} className="hover:bg-slate-800/40">
                              <td className="px-3 py-2 text-slate-200 font-medium">
                                {lbl.error_category}
                              </td>
                              <td className="px-3 py-2 text-slate-300">
                                <span className="text-rose-400 font-mono">{lbl.spoken_text}</span>
                                {lbl.corrected_text && (
                                  <>
                                    <span className="text-slate-500 mx-1">&rarr;</span>
                                    <span className="text-emerald-400 font-mono">{lbl.corrected_text}</span>
                                  </>
                                )}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-400">
                                {lbl.start_time !== null && lbl.end_time !== null
                                  ? `${lbl.start_time.toFixed(2)}s - ${lbl.end_time.toFixed(2)}s`
                                  : 'Pending'}
                              </td>
                              <td className="px-3 py-2 text-slate-300">{lbl.severity}</td>
                              <td className="px-3 py-2 text-slate-400 text-[11px] max-w-xs truncate">
                                {lbl.annotation_notes || '-'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => handleDeleteLabel(lbl.label_id)}
                                  className="text-slate-500 hover:text-rose-400 p-1"
                                  title="Delete label"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={handleDeleteSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs font-medium rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Sample</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors shadow-sm shadow-cyan-950"
            >
              Save Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
