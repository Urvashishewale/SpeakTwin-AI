/**
 * SpeakTwin AI — Dataset Storage and Persistence Engine
 * Interacts directly with dataset/ directory, CSV tables, and physical audio files.
 */

import fs from 'fs';
import path from 'path';
import {
  AlignmentLabelRecord,
  DatasetMetadata,
  DatasetSampleComposite,
  DatasetSummaryStats,
  SampleCategory,
  SpeechPairRecord,
  TranscriptRecord,
  VerificationStatus,
} from '../types/dataset';

const BASE_DIR = process.cwd();
const DATASET_DIR = path.resolve(BASE_DIR, 'dataset');
const AUDIO_GOOD_DIR = path.resolve(DATASET_DIR, 'audio', 'good');
const AUDIO_BAD_DIR = path.resolve(DATASET_DIR, 'audio', 'bad');

const METADATA_FILE = path.join(DATASET_DIR, 'metadata.csv');
const TRANSCRIPTS_FILE = path.join(DATASET_DIR, 'transcripts.csv');
const LABELS_FILE = path.join(DATASET_DIR, 'alignment_labels.csv');
const PAIRS_FILE = path.join(DATASET_DIR, 'pairs.csv');

// Ensure necessary directories exist
export function initDatasetDirectories() {
  [DATASET_DIR, AUDIO_GOOD_DIR, AUDIO_BAD_DIR, path.join(DATASET_DIR, 'annotations')].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// RFC 4180 CSV Parser
function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    fields.push(cur.trim());
    return fields;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

// RFC 4180 CSV Serializer
function serializeCsv(headers: string[], rows: Record<string, any>[]): string {
  const escapeField = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.join(',');
  const rowLines = rows.map((r) => headers.map((h) => escapeField(r[h])).join(','));
  return [headerLine, ...rowLines].join('\n') + '\n';
}

const METADATA_HEADERS = [
  'sample_id',
  'sample_name',
  'speaker_id',
  'audio_file',
  'audio_format',
  'sample_rate_hz',
  'channels',
  'duration_seconds',
  'file_size_bytes',
  'sample_category',
  'recording_date',
  'verification_status',
  'created_at',
  'notes',
];

const TRANSCRIPT_HEADERS = [
  'sample_id',
  'reference_pair_id',
  'speaker_id',
  'audio_file',
  'original_transcript',
  'verified_transcript',
  'corrected_transcript',
  'language',
  'sample_category',
  'recording_date',
  'verification_status',
  'has_uncertainty',
];

const LABELS_HEADERS = [
  'label_id',
  'sample_id',
  'reference_pair_id',
  'start_time',
  'end_time',
  'reference_text',
  'spoken_text',
  'error_category',
  'corrected_text',
  'severity',
  'confidence',
  'alignment_type',
  'annotation_notes',
];

const PAIRS_HEADERS = [
  'pair_id',
  'good_sample_id',
  'comparison_sample_id',
  'intended_goal',
  'reference_transcript',
  'actual_good_transcript',
  'actual_comparison_transcript',
  'primary_error_category',
  'corrected_sentence',
  'annotation_notes',
  'created_date',
];

function readMetadata(): DatasetMetadata[] {
  if (!fs.existsSync(METADATA_FILE)) return [];
  const rows = parseCsv(fs.readFileSync(METADATA_FILE, 'utf-8'));
  return rows.map((r) => ({
    sample_id: r['sample_id'],
    sample_name: r['sample_name'],
    speaker_id: r['speaker_id'] || 'SPK_001',
    audio_file: r['audio_file'] || '',
    audio_format: r['audio_format'] || '',
    sample_rate_hz: parseInt(r['sample_rate_hz'] || '0', 10),
    channels: parseInt(r['channels'] || '1', 10),
    duration_seconds: parseFloat(r['duration_seconds'] || '0'),
    file_size_bytes: parseInt(r['file_size_bytes'] || '0', 10),
    sample_category: (r['sample_category'] as SampleCategory) || 'Good Speech',
    recording_date: r['recording_date'] || '',
    verification_status: (r['verification_status'] as VerificationStatus) || 'Pending Recording',
    created_at: r['created_at'] || '',
    notes: r['notes'] || '',
  }));
}

function writeMetadata(data: DatasetMetadata[]) {
  fs.writeFileSync(METADATA_FILE, serializeCsv(METADATA_HEADERS, data), 'utf-8');
}

function readTranscripts(): TranscriptRecord[] {
  if (!fs.existsSync(TRANSCRIPTS_FILE)) return [];
  const rows = parseCsv(fs.readFileSync(TRANSCRIPTS_FILE, 'utf-8'));
  return rows.map((r) => ({
    sample_id: r['sample_id'],
    reference_pair_id: r['reference_pair_id'] || '',
    speaker_id: r['speaker_id'] || 'SPK_001',
    audio_file: r['audio_file'] || '',
    original_transcript: r['original_transcript'] || '',
    verified_transcript: r['verified_transcript'] || '',
    corrected_transcript: r['corrected_transcript'] || '',
    language: r['language'] || 'en-US',
    sample_category: (r['sample_category'] as SampleCategory) || 'Good Speech',
    recording_date: r['recording_date'] || '',
    verification_status: (r['verification_status'] as VerificationStatus) || 'Pending Recording',
    has_uncertainty: r['has_uncertainty'] === 'true',
  }));
}

function writeTranscripts(data: TranscriptRecord[]) {
  fs.writeFileSync(TRANSCRIPTS_FILE, serializeCsv(TRANSCRIPT_HEADERS, data), 'utf-8');
}

function readLabels(): AlignmentLabelRecord[] {
  if (!fs.existsSync(LABELS_FILE)) return [];
  const rows = parseCsv(fs.readFileSync(LABELS_FILE, 'utf-8'));
  return rows.map((r) => ({
    label_id: r['label_id'],
    sample_id: r['sample_id'],
    reference_pair_id: r['reference_pair_id'] || '',
    start_time: r['start_time'] ? parseFloat(r['start_time']) : null,
    end_time: r['end_time'] ? parseFloat(r['end_time']) : null,
    reference_text: r['reference_text'] || '',
    spoken_text: r['spoken_text'] || '',
    error_category: r['error_category'] as any,
    corrected_text: r['corrected_text'] || '',
    severity: (r['severity'] as any) || 'Medium',
    confidence: (r['confidence'] as any) || 'High',
    alignment_type: (r['alignment_type'] as any) || 'Grammar Annotation',
    annotation_notes: r['annotation_notes'] || '',
  }));
}

function writeLabels(data: AlignmentLabelRecord[]) {
  fs.writeFileSync(LABELS_FILE, serializeCsv(LABELS_HEADERS, data), 'utf-8');
}

function readPairs(): SpeechPairRecord[] {
  if (!fs.existsSync(PAIRS_FILE)) return [];
  const rows = parseCsv(fs.readFileSync(PAIRS_FILE, 'utf-8'));
  return rows.map((r) => ({
    pair_id: r['pair_id'],
    good_sample_id: r['good_sample_id'],
    comparison_sample_id: r['comparison_sample_id'],
    intended_goal: r['intended_goal'] || '',
    reference_transcript: r['reference_transcript'] || '',
    actual_good_transcript: r['actual_good_transcript'] || '',
    actual_comparison_transcript: r['actual_comparison_transcript'] || '',
    primary_error_category: r['primary_error_category'] || 'Grammar Error',
    corrected_sentence: r['corrected_sentence'] || '',
    annotation_notes: r['annotation_notes'] || '',
    created_date: r['created_date'] || '',
  }));
}

function writePairs(data: SpeechPairRecord[]) {
  fs.writeFileSync(PAIRS_FILE, serializeCsv(PAIRS_HEADERS, data), 'utf-8');
}

// Check if audio file physically exists on disk
function checkAudioExistsOnDisk(category: SampleCategory, filename: string): boolean {
  if (!filename || !filename.trim()) return false;
  const sub = category === 'Good Speech' ? AUDIO_GOOD_DIR : AUDIO_BAD_DIR;
  const filePath = path.join(sub, filename);
  return fs.existsSync(filePath);
}

export const datasetManager = {
  getSummaryStats(): DatasetSummaryStats {
    initDatasetDirectories();
    const metadata = readMetadata();
    const labels = readLabels();
    const pairs = readPairs();

    let goodSpeechCount = 0;
    let errorSpeechCount = 0;
    let unreviewedCount = 0;
    let verifiedCount = 0;
    let missingAudioCount = 0;
    let totalAudioDuration = 0;

    metadata.forEach((m) => {
      if (m.sample_category === 'Good Speech') goodSpeechCount++;
      else errorSpeechCount++;

      if (m.verification_status === 'Verified') verifiedCount++;
      else if (m.verification_status !== 'Rejected') unreviewedCount++;

      const hasDiskFile = checkAudioExistsOnDisk(m.sample_category, m.audio_file);
      if (!hasDiskFile) {
        missingAudioCount++;
      } else {
        totalAudioDuration += m.duration_seconds || 0;
      }
    });

    const completionPercentage =
      metadata.length > 0 ? Math.round((verifiedCount / metadata.length) * 100) : 0;

    return {
      totalSamples: metadata.length,
      goodSpeechCount,
      errorSpeechCount,
      unreviewedCount,
      verifiedCount,
      audioPairsCount: pairs.length,
      missingAudioCount,
      completionPercentage,
      totalAudioDuration,
      totalAlignmentLabels: labels.length,
    };
  },

  getAllSamples(filters?: { search?: string; category?: string; status?: string }): DatasetSampleComposite[] {
    initDatasetDirectories();
    const metadata = readMetadata();
    const transcripts = readTranscripts();
    const labels = readLabels();
    const pairs = readPairs();

    const transcriptMap = new Map<string, TranscriptRecord>();
    transcripts.forEach((t) => transcriptMap.set(t.sample_id, t));

    const labelsMap = new Map<string, AlignmentLabelRecord[]>();
    labels.forEach((l) => {
      if (!labelsMap.has(l.sample_id)) labelsMap.set(l.sample_id, []);
      labelsMap.get(l.sample_id)!.push(l);
    });

    const pairsMap = new Map<string, SpeechPairRecord>();
    pairs.forEach((p) => {
      pairsMap.set(p.good_sample_id, p);
      pairsMap.set(p.comparison_sample_id, p);
    });

    let results: DatasetSampleComposite[] = metadata.map((m) => {
      const hasAudio = checkAudioExistsOnDisk(m.sample_category, m.audio_file);
      const sub = m.sample_category === 'Good Speech' ? 'good' : 'bad';
      const audioUrl = hasAudio ? `/api/dataset/audio/${sub}/${encodeURIComponent(m.audio_file)}` : undefined;

      return {
        metadata: m,
        transcript: transcriptMap.get(m.sample_id),
        labels: labelsMap.get(m.sample_id) || [],
        pair: pairsMap.get(m.sample_id),
        hasAudioOnDisk: hasAudio,
        audioUrl,
      };
    });

    if (filters) {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        results = results.filter((r) => {
          const id = r.metadata.sample_id.toLowerCase();
          const name = r.metadata.sample_name.toLowerCase();
          const orig = r.transcript?.original_transcript.toLowerCase() || '';
          const ver = r.transcript?.verified_transcript.toLowerCase() || '';
          return id.includes(query) || name.includes(query) || orig.includes(query) || ver.includes(query);
        });
      }
      if (filters.category && filters.category !== 'all') {
        results = results.filter((r) => r.metadata.sample_category === filters.category);
      }
      if (filters.status && filters.status !== 'all') {
        results = results.filter((r) => r.metadata.verification_status === filters.status);
      }
    }

    return results;
  },

  getSampleById(sampleId: string): DatasetSampleComposite | null {
    initDatasetDirectories();
    const metadata = readMetadata();
    const meta = metadata.find((m) => m.sample_id === sampleId);
    if (!meta) return null;

    const transcript = readTranscripts().find((t) => t.sample_id === sampleId);
    const labels = readLabels().filter((l) => l.sample_id === sampleId);
    const pair = readPairs().find(
      (p) => p.good_sample_id === sampleId || p.comparison_sample_id === sampleId
    );

    const hasAudio = checkAudioExistsOnDisk(meta.sample_category, meta.audio_file);
    const sub = meta.sample_category === 'Good Speech' ? 'good' : 'bad';
    const audioUrl = hasAudio ? `/api/dataset/audio/${sub}/${encodeURIComponent(meta.audio_file)}` : undefined;

    return {
      metadata: meta,
      transcript,
      labels,
      pair,
      hasAudioOnDisk: hasAudio,
      audioUrl,
    };
  },

  createSample(data: {
    sample_id: string;
    sample_name: string;
    speaker_id?: string;
    sample_category: SampleCategory;
    reference_pair_id?: string;
    duration_seconds?: number;
    audio_format?: string;
    original_transcript: string;
    verified_transcript?: string;
    corrected_transcript?: string;
    language?: string;
    verification_status?: VerificationStatus;
    notes?: string;
    has_uncertainty?: boolean;
    audioBase64?: string;
    labels?: Omit<AlignmentLabelRecord, 'label_id' | 'sample_id'>[];
  }): DatasetSampleComposite {
    initDatasetDirectories();
    const metadata = readMetadata();
    const transcripts = readTranscripts();

    // Check duplicate
    if (metadata.some((m) => m.sample_id === data.sample_id)) {
      throw new Error(`Sample ID "${data.sample_id}" already exists. Sample IDs must be unique.`);
    }

    let audioFileName = '';
    let fileSize = 0;
    const now = new Date().toISOString();

    // Handle physical audio persistence
    if (data.audioBase64) {
      const ext = data.audio_format || 'webm';
      const safeId = data.sample_id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      audioFileName = `${safeId}.${ext}`;

      const targetDir = data.sample_category === 'Good Speech' ? AUDIO_GOOD_DIR : AUDIO_BAD_DIR;
      const targetPath = path.join(targetDir, audioFileName);

      const base64Clean = data.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Clean, 'base64');
      fs.writeFileSync(targetPath, audioBuffer);
      fileSize = audioBuffer.length;
    }

    const initialStatus: VerificationStatus = data.verification_status || (audioFileName ? 'Recorded' : 'Pending Recording');

    const newMeta: DatasetMetadata = {
      sample_id: data.sample_id,
      sample_name: data.sample_name || data.sample_id,
      speaker_id: data.speaker_id || 'SPK_001',
      audio_file: audioFileName,
      audio_format: data.audio_format || (audioFileName ? 'webm' : ''),
      sample_rate_hz: 48000,
      channels: 1,
      duration_seconds: data.duration_seconds || 0,
      file_size_bytes: fileSize,
      sample_category: data.sample_category,
      recording_date: now,
      verification_status: initialStatus,
      created_at: now,
      notes: data.notes || '',
    };

    const newTranscript: TranscriptRecord = {
      sample_id: data.sample_id,
      reference_pair_id: data.reference_pair_id || '',
      speaker_id: data.speaker_id || 'SPK_001',
      audio_file: audioFileName,
      original_transcript: data.original_transcript || '',
      verified_transcript: data.verified_transcript || data.original_transcript || '',
      corrected_transcript: data.corrected_transcript || data.original_transcript || '',
      language: data.language || 'en-US',
      sample_category: data.sample_category,
      recording_date: now.split('T')[0],
      verification_status: initialStatus,
      has_uncertainty: Boolean(data.has_uncertainty),
    };

    metadata.push(newMeta);
    transcripts.push(newTranscript);

    writeMetadata(metadata);
    writeTranscripts(transcripts);

    // Save labels if provided
    let savedLabels: AlignmentLabelRecord[] = [];
    if (data.labels && data.labels.length > 0) {
      const allLabels = readLabels();
      savedLabels = data.labels.map((l, idx) => ({
        label_id: `LBL_${Date.now().toString().slice(-4)}_${idx + 1}`,
        sample_id: data.sample_id,
        reference_pair_id: data.reference_pair_id || '',
        start_time: l.start_time ?? null,
        end_time: l.end_time ?? null,
        reference_text: l.reference_text || '',
        spoken_text: l.spoken_text || '',
        error_category: l.error_category,
        corrected_text: l.corrected_text || '',
        severity: l.severity || 'Medium',
        confidence: l.confidence || 'High',
        alignment_type: l.alignment_type || 'Grammar Annotation',
        annotation_notes: l.annotation_notes || '',
      }));
      allLabels.push(...savedLabels);
      writeLabels(allLabels);
    }

    const hasAudio = checkAudioExistsOnDisk(newMeta.sample_category, newMeta.audio_file);
    const sub = newMeta.sample_category === 'Good Speech' ? 'good' : 'bad';

    return {
      metadata: newMeta,
      transcript: newTranscript,
      labels: savedLabels,
      hasAudioOnDisk: hasAudio,
      audioUrl: hasAudio ? `/api/dataset/audio/${sub}/${encodeURIComponent(audioFileName)}` : undefined,
    };
  },

  updateSample(
    sampleId: string,
    updates: {
      sample_name?: string;
      sample_category?: SampleCategory;
      verification_status?: VerificationStatus;
      notes?: string;
      verified_transcript?: string;
      corrected_transcript?: string;
      has_uncertainty?: boolean;
      reference_pair_id?: string;
      audioBase64?: string;
      duration_seconds?: number;
      audio_format?: string;
    }
  ): DatasetSampleComposite {
    initDatasetDirectories();
    const metadata = readMetadata();
    const transcripts = readTranscripts();

    const mIdx = metadata.findIndex((m) => m.sample_id === sampleId);
    if (mIdx === -1) throw new Error(`Sample "${sampleId}" not found`);

    const tIdx = transcripts.findIndex((t) => t.sample_id === sampleId);

    const m = metadata[mIdx];
    const oldCategory = m.sample_category;

    if (updates.sample_name !== undefined) m.sample_name = updates.sample_name;
    if (updates.notes !== undefined) m.notes = updates.notes;
    if (updates.duration_seconds !== undefined) m.duration_seconds = updates.duration_seconds;

    // Handle new audio replacement or upload for pending sample
    if (updates.audioBase64) {
      const ext = updates.audio_format || m.audio_format || 'webm';
      const safeId = m.sample_id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const audioFileName = `${safeId}.${ext}`;
      const cat = updates.sample_category || m.sample_category;
      const targetDir = cat === 'Good Speech' ? AUDIO_GOOD_DIR : AUDIO_BAD_DIR;
      const targetPath = path.join(targetDir, audioFileName);

      const base64Clean = updates.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      const audioBuffer = Buffer.from(base64Clean, 'base64');
      fs.writeFileSync(targetPath, audioBuffer);

      m.audio_file = audioFileName;
      m.audio_format = ext;
      m.file_size_bytes = audioBuffer.length;
      if (m.verification_status === 'Pending Recording') {
        m.verification_status = 'Recorded';
      }
    }

    if (updates.sample_category && updates.sample_category !== oldCategory) {
      // If category changed and audio exists, move audio file
      if (m.audio_file && checkAudioExistsOnDisk(oldCategory, m.audio_file)) {
        const srcPath = path.join(
          oldCategory === 'Good Speech' ? AUDIO_GOOD_DIR : AUDIO_BAD_DIR,
          m.audio_file
        );
        const destDir = updates.sample_category === 'Good Speech' ? AUDIO_GOOD_DIR : AUDIO_BAD_DIR;
        const destPath = path.join(destDir, m.audio_file);
        fs.renameSync(srcPath, destPath);
      }
      m.sample_category = updates.sample_category;
    }

    if (updates.verification_status) {
      m.verification_status = updates.verification_status;
    }

    metadata[mIdx] = m;
    writeMetadata(metadata);

    let t = tIdx !== -1 ? transcripts[tIdx] : null;
    if (t) {
      if (updates.verified_transcript !== undefined) t.verified_transcript = updates.verified_transcript;
      if (updates.corrected_transcript !== undefined) t.corrected_transcript = updates.corrected_transcript;
      if (updates.has_uncertainty !== undefined) t.has_uncertainty = updates.has_uncertainty;
      if (updates.reference_pair_id !== undefined) t.reference_pair_id = updates.reference_pair_id;
      if (updates.sample_category) t.sample_category = updates.sample_category;
      if (updates.verification_status) t.verification_status = updates.verification_status;
      if (m.audio_file) t.audio_file = m.audio_file;
      transcripts[tIdx] = t;
      writeTranscripts(transcripts);
    }

    return this.getSampleById(sampleId)!;
  },

  deleteSample(sampleId: string): boolean {
    initDatasetDirectories();
    const metadata = readMetadata();
    const targetMeta = metadata.find((m) => m.sample_id === sampleId);
    if (!targetMeta) return false;

    // 1. Delete physical audio file if present
    if (targetMeta.audio_file) {
      const sub = targetMeta.sample_category === 'Good Speech' ? AUDIO_GOOD_DIR : AUDIO_BAD_DIR;
      const targetPath = path.join(sub, targetMeta.audio_file);
      if (fs.existsSync(targetPath)) {
        try {
          fs.unlinkSync(targetPath);
        } catch (e) {
          console.warn(`Could not delete audio file ${targetPath}:`, e);
        }
      }
    }

    // 2. Remove from metadata.csv
    const filteredMeta = metadata.filter((m) => m.sample_id !== sampleId);
    writeMetadata(filteredMeta);

    // 3. Remove from transcripts.csv
    const filteredTranscripts = readTranscripts().filter((t) => t.sample_id !== sampleId);
    writeTranscripts(filteredTranscripts);

    // 4. Remove from alignment_labels.csv
    const filteredLabels = readLabels().filter((l) => l.sample_id !== sampleId);
    writeLabels(filteredLabels);

    return true;
  },

  getPairs(): SpeechPairRecord[] {
    initDatasetDirectories();
    return readPairs();
  },

  createPair(pair: SpeechPairRecord): SpeechPairRecord {
    initDatasetDirectories();
    const pairs = readPairs();
    if (pairs.some((p) => p.pair_id === pair.pair_id)) {
      throw new Error(`Pair ID "${pair.pair_id}" already exists.`);
    }
    pairs.push(pair);
    writePairs(pairs);
    return pair;
  },

  updatePair(pairId: string, updates: Partial<SpeechPairRecord>): SpeechPairRecord {
    initDatasetDirectories();
    const pairs = readPairs();
    const idx = pairs.findIndex((p) => p.pair_id === pairId);
    if (idx === -1) throw new Error(`Pair "${pairId}" not found`);
    pairs[idx] = { ...pairs[idx], ...updates };
    writePairs(pairs);
    return pairs[idx];
  },

  deletePair(pairId: string): boolean {
    initDatasetDirectories();
    const pairs = readPairs();
    const filtered = pairs.filter((p) => p.pair_id !== pairId);
    if (filtered.length === pairs.length) return false;
    writePairs(filtered);
    return true;
  },

  getLabels(sampleId?: string): AlignmentLabelRecord[] {
    initDatasetDirectories();
    const labels = readLabels();
    if (sampleId) return labels.filter((l) => l.sample_id === sampleId);
    return labels;
  },

  addLabel(label: Omit<AlignmentLabelRecord, 'label_id'> & { label_id?: string }): AlignmentLabelRecord {
    initDatasetDirectories();
    const labels = readLabels();
    const newLabel: AlignmentLabelRecord = {
      ...label,
      label_id: label.label_id || `LBL_${Date.now().toString().slice(-5)}`,
    };
    labels.push(newLabel);
    writeLabels(labels);
    return newLabel;
  },

  deleteLabel(labelId: string): boolean {
    initDatasetDirectories();
    const labels = readLabels();
    const filtered = labels.filter((l) => l.label_id !== labelId);
    if (filtered.length === labels.length) return false;
    writeLabels(filtered);
    return true;
  },

  getExportCsv(table: 'metadata' | 'transcripts' | 'alignment_labels' | 'pairs'): string {
    const filePath = path.join(DATASET_DIR, `${table}.csv`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  },

  getAudioFilePath(category: string, filename: string): string | null {
    const cleanFilename = path.basename(filename);
    const subDir = category === 'good' ? AUDIO_GOOD_DIR : AUDIO_BAD_DIR;
    const fullPath = path.join(subDir, cleanFilename);
    if (fs.existsSync(fullPath)) return fullPath;
    return null;
  },
};
