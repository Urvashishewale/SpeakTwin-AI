/**
 * SpeakTwin AI — Custom Speech Dataset Dashboard
 * Comprehensive dataset management module:
 * - Dynamic summary KPI metrics calculated from real records
 * - Filtering & searching by Sample ID, Name, Category, and Verification Status
 * - Inline audio playback
 * - Detailed sample inspection and tripartite transcript verification
 * - Contrastive speech pairs management
 * - Alignment labels taxonomy browser
 * - CSV export
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  Upload,
  Mic,
  GitCompare,
  FileDown,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Volume2,
  ShieldCheck,
  Tag,
  ListFilter,
} from 'lucide-react';

import {
  AlignmentLabelRecord,
  DatasetSampleComposite,
  DatasetSummaryStats,
  SampleCategory,
  SpeechPairRecord,
  VerificationStatus,
} from '../../types/dataset';

import { RecordSampleModal } from './RecordSampleModal';
import { SampleDetailsModal } from './SampleDetailsModal';
import { CreatePairModal } from './CreatePairModal';
import { ExportDatasetModal } from './ExportDatasetModal';

interface DatasetDashboardProps {
  onBackToTelemetry?: () => void;
}

export const DatasetDashboard: React.FC<DatasetDashboardProps> = ({ onBackToTelemetry }) => {
  // Data State
  const [summary, setSummary] = useState<DatasetSummaryStats | null>(null);
  const [samples, setSamples] = useState<DatasetSampleComposite[]>([]);
  const [pairs, setPairs] = useState<SpeechPairRecord[]>([]);
  const [allLabels, setAllLabels] = useState<AlignmentLabelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Sub-tab inside dataset module
  const [activeTab, setActiveTab] = useState<'samples' | 'pairs' | 'labels' | 'review'>('samples');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [labelCategoryFilter, setLabelCategoryFilter] = useState<string>('all');

  // Audio Playback State for table rows
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreatePairModalOpen, setIsCreatePairModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Load all dataset records
  const fetchDatasetData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [sumRes, sampRes, pairRes, labelRes] = await Promise.all([
        fetch('/api/dataset/summary'),
        fetch('/api/dataset/samples'),
        fetch('/api/dataset/pairs'),
        fetch('/api/dataset/labels'),
      ]);

      if (!sumRes.ok || !sampRes.ok) {
        throw new Error('Failed to load dataset records from server');
      }

      const sumData: DatasetSummaryStats = await sumRes.json();
      const sampData: DatasetSampleComposite[] = await sampRes.json();
      const pairData: SpeechPairRecord[] = pairRes.ok ? await pairRes.json() : [];
      const labelData: AlignmentLabelRecord[] = labelRes.ok ? await labelRes.json() : [];

      setSummary(sumData);
      setSamples(sampData);
      setPairs(pairData);
      setAllLabels(labelData);
    } catch (err: any) {
      console.error('Error fetching dataset:', err);
      setErrorMessage(err.message || 'Error connecting to dataset store');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetData();
  }, []);

  // Handle row audio play/pause
  const handlePlayRowAudio = (sample: DatasetSampleComposite) => {
    if (!sample.audioUrl) return;

    if (activePlayingId === sample.metadata.sample_id) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      setActivePlayingId(null);
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      const audio = new Audio(sample.audioUrl);
      activeAudioRef.current = audio;
      audio.onended = () => setActivePlayingId(null);
      audio.onerror = () => {
        setActivePlayingId(null);
        alert('Could not stream audio file.');
      };
      audio.play().then(() => setActivePlayingId(sample.metadata.sample_id));
    }
  };

  // Delete sample directly from row
  const handleDeleteSample = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete sample "${id}"?`)) return;

    try {
      const res = await fetch(`/api/dataset/samples/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete sample');
      fetchDatasetData();
    } catch (err: any) {
      alert(`Delete error: ${err?.message || 'Failed'}`);
    }
  };

  // Delete pair
  const handleDeletePair = async (pairId: string) => {
    if (!confirm(`Are you sure you want to remove speech pair "${pairId}"?`)) return;
    try {
      const res = await fetch(`/api/dataset/pairs/${pairId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete pair');
      fetchDatasetData();
    } catch (err: any) {
      alert(`Delete error: ${err?.message || 'Failed'}`);
    }
  };

  // Filtered samples
  const filteredSamples = samples.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idMatch = s.metadata.sample_id.toLowerCase().includes(q);
      const nameMatch = s.metadata.sample_name.toLowerCase().includes(q);
      const origMatch = s.transcript?.original_transcript.toLowerCase().includes(q);
      const verMatch = s.transcript?.verified_transcript.toLowerCase().includes(q);
      if (!idMatch && !nameMatch && !origMatch && !verMatch) return false;
    }
    if (categoryFilter !== 'all' && s.metadata.sample_category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && s.metadata.verification_status !== statusFilter) {
      return false;
    }
    if (activeTab === 'review') {
      if (s.metadata.verification_status === 'Verified' || s.metadata.verification_status === 'Rejected') {
        return false;
      }
    }
    return true;
  });

  // Filtered labels
  const filteredLabels = allLabels.filter((l) => {
    if (labelCategoryFilter !== 'all' && l.error_category !== labelCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const spokenMatch = l.spoken_text.toLowerCase().includes(q);
      const refMatch = l.reference_text.toLowerCase().includes(q);
      const notesMatch = l.annotation_notes.toLowerCase().includes(q);
      const sampMatch = l.sample_id.toLowerCase().includes(q);
      if (!spokenMatch && !refMatch && !notesMatch && !sampMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Module Header Banner */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Custom Speech Dataset Management
              </h1>
              <p className="text-xs text-slate-400">
                SpeakTwin AI Research Corpus · Paired speech examples, tripartite transcripts, &amp; alignment labels
              </p>
            </div>
          </div>
        </div>

        {/* Global Dataset Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-md transition-colors shadow-sm shadow-rose-950"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record / Upload Sample</span>
          </button>

          <button
            onClick={() => setIsCreatePairModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors shadow-sm shadow-indigo-950"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Create Audio Pair</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSVs</span>
          </button>

          <button
            onClick={fetchDatasetData}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Refresh dataset from disk"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Dynamically Calculated Metric KPI Strip */}
      <section aria-label="Dataset core metrics">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Total Registered */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 block truncate">Total Samples</span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {summary?.totalSamples ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">All registered</span>
          </div>

          {/* Good Speech */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-emerald-400 block truncate">Good Speech</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {summary?.goodSpeechCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Clean baseline</span>
          </div>

          {/* Speech with Errors */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-rose-400 block truncate">Error Speech</span>
            <div className="text-lg font-bold font-mono text-rose-400 mt-1">
              {summary?.errorSpeechCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Identified errors</span>
          </div>

          {/* Audio Pairs */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-purple-400 block truncate">Audio Pairs</span>
            <div className="text-lg font-bold font-mono text-purple-400 mt-1">
              {summary?.audioPairsCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Contrastive sets</span>
          </div>

          {/* Unreviewed */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-amber-400 block truncate">Unreviewed</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {summary?.unreviewedCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Awaiting review</span>
          </div>

          {/* Verified */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-cyan-400 block truncate">Verified</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
              {summary?.verifiedCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Ground truth</span>
          </div>

          {/* Missing Audio */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-orange-400 block truncate">Pending Audio</span>
            <div className="text-lg font-bold font-mono text-orange-400 mt-1">
              {summary?.missingAudioCount ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Uncollected</span>
          </div>

          {/* Completion Status */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-indigo-400 block truncate">Completion</span>
            <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
              {summary?.completionPercentage ?? 0}%
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Verified ratio</span>
          </div>
        </div>
      </section>

      {/* 3. Sub-Navigation Tabs & Search / Filter Toolbar */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
        {/* Sub-Tabs (Interactive buttons with clear active state) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('samples')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'samples'
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Speech Samples ({samples.length})
            </button>

            <button
              onClick={() => setActiveTab('pairs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'pairs'
                  ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Paired Speech Corpus ({pairs.length})
            </button>

            <button
              onClick={() => setActiveTab('labels')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'labels'
                  ? 'bg-purple-950/60 text-purple-400 border border-purple-800/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Alignment Labels ({allLabels.length})
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'review'
                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quality Review Queue ({summary?.unreviewedCount || 0})
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            Storage: dataset/ audio/ metadata.csv
          </span>
        </div>

        {/* Search & Filtering Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Sample ID, title, or transcript text..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab !== 'labels' ? (
              <>
                {/* Category Filter */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="w-3 h-3 text-slate-500" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Good Speech">Good Speech</option>
                    <option value="Speech with Identified Errors">Speech with Errors</option>
                  </select>
                </div>

                {/* Status Filter */}
                {activeTab !== 'review' && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending Recording">Pending Recording</option>
                      <option value="Recorded">Recorded</option>
                      <option value="Pending Transcription Review">Pending Review</option>
                      <option value="Pending Annotation">Pending Annotation</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Tag className="w-3 h-3 text-purple-400" />
                <select
                  value={labelCategoryFilter}
                  onChange={(e) => setLabelCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Error Categories</option>
                  <option value="Grammar Error">Grammar Error</option>
                  <option value="Incorrect Article">Incorrect Article</option>
                  <option value="Incorrect Verb Form">Incorrect Verb Form</option>
                  <option value="Incorrect Word Order">Incorrect Word Order</option>
                  <option value="Filler Word">Filler Word</option>
                  <option value="Long Pause">Long Pause</option>
                  <option value="Repeated Word">Repeated Word</option>
                  <option value="Correct Speech">Correct Speech</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Tab Content Views */}

      {/* VIEW A & D: Samples Table (All Samples / Quality Review Queue) */}
      {(activeTab === 'samples' || activeTab === 'review') && (
        <section className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200">
              {activeTab === 'review' ? 'Samples Requiring Verification' : 'Catalog of Registered Speech Samples'}
              <span className="text-slate-500 font-normal ml-2">({filteredSamples.length} matching)</span>
            </div>
            {filteredSamples.length > 0 && (
              <span className="text-[11px] text-slate-500">
                Click any row or Inspect button to edit tripartite transcripts &amp; alignment labels
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading samples...</div>
          ) : filteredSamples.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FolderOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No samples found matching the current filters.</p>
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded transition-colors"
              >
                Record or Upload First Sample
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="px-4 py-3">Sample ID &amp; Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Audio Source</th>
                    <th className="px-4 py-3">Verified Spoken Transcript</th>
                    <th className="px-4 py-3">Labels</th>
                    <th className="px-4 py-3">Verification Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-slate-900/30">
                  {filteredSamples.map((s) => {
                    const isGood = s.metadata.sample_category === 'Good Speech';
                    const hasAudio = s.hasAudioOnDisk && s.audioUrl;
                    const isPlaying = activePlayingId === s.metadata.sample_id;

                    return (
                      <tr
                        key={s.metadata.sample_id}
                        onClick={() => {
                          setSelectedSampleId(s.metadata.sample_id);
                          setIsDetailsModalOpen(true);
                        }}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        {/* Sample ID & Name */}
                        <td className="px-4 py-3">
                          <div className="font-mono font-semibold text-white">
                            {s.metadata.sample_id}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                            {s.metadata.sample_name}
                          </div>
                        </td>

                        {/* Category (Zero-pill clean typography with color indicator) */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isGood ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            <span
                              className={`font-medium ${
                                isGood ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              {s.metadata.sample_category}
                            </span>
                          </div>
                        </td>

                        {/* Audio Source & Player */}
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {hasAudio ? (
                            <button
                              onClick={() => handlePlayRowAudio(s)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                                isPlaying
                                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              {isPlaying ? (
                                <Pause className="w-3 h-3 text-cyan-400" />
                              ) : (
                                <Play className="w-3 h-3 text-cyan-400" />
                              )}
                              <span className="font-mono text-[11px]">
                                {s.metadata.duration_seconds.toFixed(1)}s
                              </span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-mono">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Pending Recording</span>
                            </div>
                          )}
                        </td>

                        {/* Transcript */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-slate-200 line-clamp-1">
                            {s.transcript?.verified_transcript || s.transcript?.original_transcript || '-'}
                          </div>
                          {s.transcript?.corrected_transcript && (
                            <div className="text-[11px] text-emerald-400/80 line-clamp-1 mt-0.5">
                              Ref: {s.transcript.corrected_transcript}
                            </div>
                          )}
                        </td>

                        {/* Alignment Labels count */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-slate-300">
                            {s.labels.length} {s.labels.length === 1 ? 'label' : 'labels'}
                          </span>
                        </td>

                        {/* Verification Status (Zero-pill text representation) */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                s.metadata.verification_status === 'Verified'
                                  ? 'bg-cyan-400'
                                  : s.metadata.verification_status === 'Recorded'
                                  ? 'bg-blue-400'
                                  : s.metadata.verification_status === 'Rejected'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span
                              className={`${
                                s.metadata.verification_status === 'Verified'
                                  ? 'text-cyan-400 font-semibold'
                                  : s.metadata.verification_status === 'Rejected'
                                  ? 'text-rose-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              {s.metadata.verification_status}
                            </span>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedSampleId(s.metadata.sample_id);
                                setIsDetailsModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors text-[11px] font-medium"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={(e) => handleDeleteSample(s.metadata.sample_id, e)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete sample"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* VIEW B: Paired Speech Corpus View */}
      {activeTab === 'pairs' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contrastive Speech Pairs Corpus ({pairs.length})
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Couples identical communication targets: Good Speech vs Speech with Identified Errors
              </p>
            </div>
            <button
              onClick={() => setIsCreatePairModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Pair</span>
            </button>
          </div>

          {pairs.length === 0 ? (
            <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-lg text-center space-y-3">
              <GitCompare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No speech pairs registered yet.</p>
              <button
                onClick={() => setIsCreatePairModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded"
              >
                Create Pair (PAIR_001)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pairs.map((p) => {
                const goodSample = samples.find((s) => s.metadata.sample_id === p.good_sample_id);
                const badSample = samples.find((s) => s.metadata.sample_id === p.comparison_sample_id);

                return (
                  <div
                    key={p.pair_id}
                    className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm"
                  >
                    {/* Pair Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-400 text-sm">
                            {p.pair_id}
                          </span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs font-semibold text-slate-200">
                            {p.intended_goal || 'Candidate Speech Communication Goal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Primary Error: <span className="text-rose-400 font-medium">{p.primary_error_category}</span> · Target: <span className="text-cyan-300 font-mono">{p.reference_transcript}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeletePair(p.pair_id)}
                          className="text-xs text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Delete pair"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Side-by-Side Contrast Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Good Speech Card */}
                      <div className="bg-slate-950/80 border border-emerald-900/40 rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Good Speech Sample</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {p.good_sample_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-100 font-mono bg-slate-900/80 p-2.5 rounded border border-emerald-900/20">
                          "{p.actual_good_transcript || goodSample?.transcript?.verified_transcript || '-'}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Audio: {goodSample?.hasAudioOnDisk ? 'Recorded' : 'Pending Capture'}</span>
                          {goodSample?.audioUrl && (
                            <button
                              onClick={() => handlePlayRowAudio(goodSample)}
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Play Audio</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Error Speech Card */}
                      <div className="bg-slate-950/80 border border-rose-900/40 rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Speech with Identified Errors</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400">
                            {p.comparison_sample_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-100 font-mono bg-slate-900/80 p-2.5 rounded border border-rose-900/20">
                          "{p.actual_comparison_transcript || badSample?.transcript?.verified_transcript || '-'}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Audio: {badSample?.hasAudioOnDisk ? 'Recorded' : 'Pending Capture'}</span>
                          {badSample?.audioUrl && (
                            <button
                              onClick={() => handlePlayRowAudio(badSample)}
                              className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Play Audio</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pedagogical Correction Notes */}
                    {p.annotation_notes && (
                      <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
                        <span className="font-semibold text-slate-300">Pedagogical Annotation Notes: </span>
                        {p.annotation_notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* VIEW C: Alignment Labels Catalog */}
      {activeTab === 'labels' && (
        <section className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Alignment Labels &amp; Error Taxonomy Browser
              </div>
              <p className="text-[11px] text-slate-500">
                {filteredLabels.length} alignment records across 13 error categories
              </p>
            </div>
          </div>

          {filteredLabels.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No alignment labels match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="px-4 py-3">Label ID</th>
                    <th className="px-4 py-3">Sample ID</th>
                    <th className="px-4 py-3">Error Category</th>
                    <th className="px-4 py-3">Actual Spoken Segment</th>
                    <th className="px-4 py-3">Corrected Reference</th>
                    <th className="px-4 py-3">Timing</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-slate-900/30">
                  {filteredLabels.map((lbl) => (
                    <tr key={lbl.label_id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono font-semibold text-purple-400">
                        {lbl.label_id}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {lbl.sample_id}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {lbl.error_category}
                      </td>
                      <td className="px-4 py-3 font-mono text-rose-400">
                        {lbl.spoken_text}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400">
                        {lbl.corrected_text || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {lbl.start_time !== null && lbl.end_time !== null
                          ? `${lbl.start_time.toFixed(2)}s - ${lbl.end_time.toFixed(2)}s`
                          : 'Pending'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{lbl.severity}</td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] max-w-xs truncate">
                        {lbl.annotation_notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 5. Modals */}
      <RecordSampleModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSampleCreated={fetchDatasetData}
      />

      <SampleDetailsModal
        isOpen={isDetailsModalOpen}
        sampleId={selectedSampleId}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedSampleId(null);
        }}
        onSampleUpdated={fetchDatasetData}
      />

      <CreatePairModal
        isOpen={isCreatePairModalOpen}
        onClose={() => setIsCreatePairModalOpen(false)}
        onPairCreated={fetchDatasetData}
        existingSamples={samples}
      />

      <ExportDatasetModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        summary={summary}
      />
    </div>
  );
};
