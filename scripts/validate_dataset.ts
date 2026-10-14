/**
 * SpeakTwin AI — Custom Speech Dataset Integrity Validator
 * Validates CSV schemas, duplicate keys, foreign references, audio file existence,
 * and timestamp sanity.
 */

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalMetadataRecords: number;
    totalTranscriptRecords: number;
    totalAlignmentLabels: number;
    totalSpeechPairs: number;
    goodSamples: number;
    errorSamples: number;
    verifiedSamples: number;
    pendingRecordings: number;
    physicalAudioFilesFound: number;
    missingPhysicalAudioFiles: number;
  };
}

function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Helper to split CSV row taking quotes into account
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, index) => {
      rowObj[h] = rawValues[index] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function validateDataset(baseDir = process.cwd()): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const datasetDir = path.resolve(baseDir, 'dataset');
  const metadataPath = path.join(datasetDir, 'metadata.csv');
  const transcriptsPath = path.join(datasetDir, 'transcripts.csv');
  const labelsPath = path.join(datasetDir, 'alignment_labels.csv');
  const pairsPath = path.join(datasetDir, 'pairs.csv');
  const audioGoodDir = path.join(datasetDir, 'audio', 'good');
  const audioBadDir = path.join(datasetDir, 'audio', 'bad');

  // 1. File existence checks
  [
    { name: 'metadata.csv', p: metadataPath },
    { name: 'transcripts.csv', p: transcriptsPath },
    { name: 'alignment_labels.csv', p: labelsPath },
    { name: 'pairs.csv', p: pairsPath },
  ].forEach((f) => {
    if (!fs.existsSync(f.p)) {
      errors.push(`Missing required dataset file: ${f.name}`);
    }
  });

  if (errors.length > 0) {
    return {
      passed: false,
      errors,
      warnings,
      stats: {
        totalMetadataRecords: 0,
        totalTranscriptRecords: 0,
        totalAlignmentLabels: 0,
        totalSpeechPairs: 0,
        goodSamples: 0,
        errorSamples: 0,
        verifiedSamples: 0,
        pendingRecordings: 0,
        physicalAudioFilesFound: 0,
        missingPhysicalAudioFiles: 0,
      },
    };
  }

  // Parse files
  const metadata = parseCSV(fs.readFileSync(metadataPath, 'utf-8'));
  const transcripts = parseCSV(fs.readFileSync(transcriptsPath, 'utf-8'));
  const labels = parseCSV(fs.readFileSync(labelsPath, 'utf-8'));
  const pairs = parseCSV(fs.readFileSync(pairsPath, 'utf-8'));

  // 2. Validate Headers
  const expectedMetadataHeaders = [
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
  expectedMetadataHeaders.forEach((h) => {
    if (!metadata.headers.includes(h)) {
      errors.push(`metadata.csv missing expected header column: "${h}"`);
    }
  });

  const expectedTranscriptHeaders = [
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
  expectedTranscriptHeaders.forEach((h) => {
    if (!transcripts.headers.includes(h)) {
      errors.push(`transcripts.csv missing expected header column: "${h}"`);
    }
  });

  // 3. Unique ID Validation
  const sampleIds = new Set<string>();
  metadata.rows.forEach((row, idx) => {
    const id = row['sample_id'];
    if (!id) {
      errors.push(`metadata.csv row ${idx + 2} has empty sample_id`);
      return;
    }
    if (sampleIds.has(id)) {
      errors.push(`Duplicate sample_id detected in metadata.csv: "${id}"`);
    }
    sampleIds.add(id);
  });

  const pairIds = new Set<string>();
  pairs.rows.forEach((row, idx) => {
    const id = row['pair_id'];
    if (!id) {
      errors.push(`pairs.csv row ${idx + 2} has empty pair_id`);
      return;
    }
    if (pairIds.has(id)) {
      errors.push(`Duplicate pair_id detected in pairs.csv: "${id}"`);
    }
    pairIds.add(id);
  });

  const labelIds = new Set<string>();
  labels.rows.forEach((row, idx) => {
    const id = row['label_id'];
    if (!id) {
      errors.push(`alignment_labels.csv row ${idx + 2} has empty label_id`);
      return;
    }
    if (labelIds.has(id)) {
      errors.push(`Duplicate label_id detected in alignment_labels.csv: "${id}"`);
    }
    labelIds.add(id);
  });

  // 4. Foreign Key Integrity
  transcripts.rows.forEach((row) => {
    const id = row['sample_id'];
    if (id && !sampleIds.has(id)) {
      errors.push(`transcripts.csv references unknown sample_id "${id}" (not in metadata.csv)`);
    }
    const pairId = row['reference_pair_id'];
    if (pairId && !pairIds.has(pairId)) {
      warnings.push(`transcripts.csv references pair_id "${pairId}" which is not defined in pairs.csv`);
    }
  });

  labels.rows.forEach((row) => {
    const id = row['sample_id'];
    if (id && !sampleIds.has(id)) {
      errors.push(`alignment_labels.csv references unknown sample_id "${id}" (not in metadata.csv)`);
    }
    const pairId = row['reference_pair_id'];
    if (pairId && !pairIds.has(pairId)) {
      warnings.push(`alignment_labels.csv references pair_id "${pairId}" which is not in pairs.csv`);
    }

    // Timestamp check
    const start = row['start_time'];
    const end = row['end_time'];
    if (start && isNaN(Number(start))) {
      errors.push(`Invalid start_time "${start}" for label "${row['label_id']}"`);
    }
    if (end && isNaN(Number(end))) {
      errors.push(`Invalid end_time "${end}" for label "${row['label_id']}"`);
    }
    if (start && end && Number(start) > Number(end)) {
      errors.push(`start_time (${start}) > end_time (${end}) for label "${row['label_id']}"`);
    }
  });

  pairs.rows.forEach((row) => {
    const goodId = row['good_sample_id'];
    const badId = row['comparison_sample_id'];
    if (goodId && !sampleIds.has(goodId)) {
      errors.push(`pairs.csv good_sample_id "${goodId}" not found in metadata.csv`);
    }
    if (badId && !sampleIds.has(badId)) {
      errors.push(`pairs.csv comparison_sample_id "${badId}" not found in metadata.csv`);
    }
  });

  // 5. Audio File Existence Verification
  let physicalAudioFilesFound = 0;
  let missingPhysicalAudioFiles = 0;

  metadata.rows.forEach((row) => {
    const audioFile = row['audio_file']?.trim();
    const status = row['verification_status'];
    const category = row['sample_category'];

    if (!audioFile || status === 'Pending Recording') {
      // Intentionally pending audio sample
      return;
    }

    const subDir = category === 'Good Speech' ? audioGoodDir : audioBadDir;
    const targetFile = path.join(subDir, audioFile);

    if (fs.existsSync(targetFile)) {
      physicalAudioFilesFound++;
    } else {
      missingPhysicalAudioFiles++;
      warnings.push(
        `Audio file "${audioFile}" marked in sample "${row['sample_id']}" does not exist on disk at "${targetFile}".`
      );
    }
  });

  const goodSamples = metadata.rows.filter((r) => r['sample_category'] === 'Good Speech').length;
  const errorSamples = metadata.rows.filter(
    (r) => r['sample_category'] === 'Speech with Identified Errors'
  ).length;
  const verifiedSamples = metadata.rows.filter((r) => r['verification_status'] === 'Verified').length;
  const pendingRecordings = metadata.rows.filter(
    (r) => r['verification_status'] === 'Pending Recording'
  ).length;

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalMetadataRecords: metadata.rows.length,
      totalTranscriptRecords: transcripts.rows.length,
      totalAlignmentLabels: labels.rows.length,
      totalSpeechPairs: pairs.rows.length,
      goodSamples,
      errorSamples,
      verifiedSamples,
      pendingRecordings,
      physicalAudioFilesFound,
      missingPhysicalAudioFiles,
    },
  };
}

// CLI runner
if (process.argv[1]?.endsWith('validate_dataset.ts')) {
  console.log('=== SpeakTwin AI Custom Speech Dataset Validator ===');
  const res = validateDataset();

  console.log('\nDataset Summary:');
  console.log(`- Total registered samples: ${res.stats.totalMetadataRecords}`);
  console.log(`  * Good speech samples: ${res.stats.goodSamples}`);
  console.log(`  * Speech with identified errors: ${res.stats.errorSamples}`);
  console.log(`- Transcripts registered: ${res.stats.totalTranscriptRecords}`);
  console.log(`- Alignment labels: ${res.stats.totalAlignmentLabels}`);
  console.log(`- Paired speech records: ${res.stats.totalSpeechPairs}`);
  console.log(`- Pending audio recordings: ${res.stats.pendingRecordings}`);
  console.log(`- Physical audio files present: ${res.stats.physicalAudioFilesFound}`);
  console.log(`- Verified samples: ${res.stats.verifiedSamples}`);

  if (res.warnings.length > 0) {
    console.log(`\nWarnings (${res.warnings.length}):`);
    res.warnings.forEach((w) => console.log(`  [!] ${w}`));
  }

  if (res.errors.length > 0) {
    console.error(`\nValidation Errors (${res.errors.length}):`);
    res.errors.forEach((e) => console.error(`  [X] ${e}`));
    console.error('\nSTATUS: FAILED');
    process.exit(1);
  } else {
    console.log('\nSTATUS: PASSED - All schema constraints and relations validated successfully.');
    process.exit(0);
  }
}
