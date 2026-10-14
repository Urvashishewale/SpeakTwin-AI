import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import { datasetManager, initDatasetDirectories } from './src/server/datasetManager.ts';
import { validateDataset } from './scripts/validate_dataset.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini SDK with recommended user agent
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Comprehensive Speech & Audio Analysis Endpoint
app.post('/api/analyze-speech', async (req, res) => {
  try {
    const {
      transcript = '',
      durationSeconds = 0,
      detectedPauses = [],
      language = 'en-US',
      audioBase64 = null,
      mimeType = 'audio/webm',
      scenario = 'tech-interview',
    } = req.body;

    const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const computedWpm = durationSeconds > 0 ? Math.round((wordCount / durationSeconds) * 60) : 0;

    // If Gemini is available, run deep linguistic and acoustic diagnostic
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const parts: any[] = [];

        // If audio data is provided, pass inlineData
        if (audioBase64) {
          parts.push({
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audioBase64.replace(/^data:audio\/\w+;base64,/, ''),
            },
          });
        }

        const promptText = `
You are a world-class Global Executive Speech & Interview Coach specializing in international public speaking, cross-cultural corporate communication, and high-stakes job/visa interviews.
The candidate is preparing for international interviews (e.g. US, UK, Canada, Europe) where pacing, tone, pronunciation, and clarity are critical. Speaking too fast or using confusing colloquial phrasing causes international interviewers to lose comprehension.

Analyze this speech data:
- Audio Duration: ${durationSeconds.toFixed(1)} seconds
- Total Words: ${wordCount}
- Detected Pauses Count: ${detectedPauses.length} (details: ${JSON.stringify(detectedPauses.slice(0, 15))})
- Calculated Speech Speed (WPM): ${computedWpm} WPM (Ideal for global audiences is 125-145 WPM; >160 WPM is rushed)
- Target Scenario: ${scenario}
- Language Code: ${language}
- Transcript: "${transcript || '(Silent or no transcript yet)'}"

Perform an in-depth diagnosis:
1. Speaking Speed & Cadence for Global Audiences:
   - Check if the speaker is speaking too fast. Rapid syllable-timed pacing often causes international listeners to miss key points.
   - Prescribe exact cadence recommendations.
2. Synchronized Sentence Comparisons ("Right Sentence"):
   - Break down the spoken transcript into sentences.
   - For EACH spoken sentence, generate the "Right Sentence" (how a top-tier executive or native candidate would articulate it with polished grammar, active verbs, and zero fillers).
   - Detail the improvements and explain "Why this sounds better in an interview".
3. Wrong Words, Grammar & Pronunciation:
   - Identify incorrect prepositions, awkward Indianisms (e.g., "myself...", "revert back", "prepone", "do one thing", "only"), grammatical slips, and filler words.
4. Global Tone & Intelligibility:
   - Assess tone (Confident, Hesitant, Rushed, Monotone).
   - Global Comprehension Score (0-100 scale: how easily an American/British/International interviewer would understand).
5. Pauses & Silences:
   - Contrast strategic dramatic pauses vs awkward hesitation stalls (>1.2s).

Return ONLY a valid JSON object matching this exact schema:
{
  "fluencyScore": number (0-100),
  "clarityScore": number (0-100),
  "paceScore": number (0-100),
  "detectedPaceCategory": "Too Slow" | "Optimal" | "Slightly Fast" | "Too Fast",
  "pacingComment": string,
  "globalToneMetrics": {
    "toneCategory": "Confident & Poised" | "Slightly Rushed" | "Hesitant / Stalling" | "Monotone / Flat",
    "globalComprehensionScore": number (0-100),
    "speedPacingAdvice": string,
    "accentToneAdvice": string,
    "cadenceProfile": string
  },
  "sentenceComparisons": [
    {
      "id": string,
      "originalSentence": string,
      "rightSentence": string,
      "improvements": [string],
      "category": "Grammar" | "Global Tone" | "Clarity" | "Pronunciation & Phrasing",
      "whyItSoundsBetter": string
    }
  ],
  "wrongWords": [
    {
      "word": string,
      "context": string,
      "issue": "Grammar" | "Mispronounced" | "Stutter" | "Colloquialism" | "Awkward",
      "suggestion": string,
      "rightAlternative": string
    }
  ],
  "fillerWords": [
    {
      "word": string,
      "count": number,
      "percentage": number
    }
  ],
  "pausesEvaluation": {
    "totalAwkwardPauses": number,
    "assessment": string,
    "advice": string
  },
  "actionableTips": [string, string, string],
  "summary": string
}
`;

        parts.push({ text: promptText });

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
          },
        });

        // 6-second timeout race for instant UI responsiveness
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);

        const jsonText = response.text?.trim() || '{}';
        const parsed = JSON.parse(jsonText);
        return res.json({
          source: 'gemini-ai',
          analysis: parsed,
          computedWpm,
          wordCount,
          durationSeconds,
        });
      } catch (geminiError) {
        console.warn('Gemini API call warning, falling back to algorithmic analyzer:', geminiError);
      }
    }

    // Algorithmic Fallback Analysis (Runs completely offline / without API key too!)
    const commonFillers = ['um', 'uh', 'er', 'ah', 'like', 'actually', 'basically', 'literally', 'you know', 'i mean', 'so yeah', 'म्हणजे', 'तर', 'वगैरे', 'मतलब'];
    const words = transcript.toLowerCase().replace(/[^\w\s\u0900-\u097F]/gi, '').split(/\s+/).filter(Boolean);

    const fillerCountMap: Record<string, number> = {};
    let totalFillers = 0;
    words.forEach((w: string) => {
      if (commonFillers.includes(w)) {
        fillerCountMap[w] = (fillerCountMap[w] || 0) + 1;
        totalFillers++;
      }
    });

    const fillerWords = Object.entries(fillerCountMap).map(([word, count]) => ({
      word,
      count,
      percentage: wordCount > 0 ? Math.round((count / wordCount) * 100) : 0,
    }));

    // Find repeated words stumbles & colloquialisms
    const wrongWords: any[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1] && words[i].length > 1) {
        wrongWords.push({
          id: `ww-${i}`,
          word: words[i],
          context: `"...${words[i]} ${words[i + 1]}..."`,
          issue: 'Stutter' as const,
          suggestion: `Avoid repeating "${words[i]}" back-to-back`,
          rightAlternative: words[i],
        });
      }
    }

    // Check common Indian English interview adjustments
    const lowerTranscript = transcript.toLowerCase();
    if (lowerTranscript.includes('myself ')) {
      wrongWords.push({
        id: 'ww-myself',
        word: 'myself',
        context: 'Introduced self using "Myself [Name]"',
        issue: 'Colloquialism' as const,
        suggestion: 'Global interview standard is "I am..." or "My name is..."',
        rightAlternative: 'I am',
      });
    }
    if (lowerTranscript.includes('revert back')) {
      wrongWords.push({
        id: 'ww-revert',
        word: 'revert back',
        context: '"revert back"',
        issue: 'Awkward' as const,
        suggestion: 'Redundant phrasing. Use "reply" or "follow up"',
        rightAlternative: 'follow up',
      });
    }

    // Build intelligent Sentence Comparisons
    const sentences = transcript.split(/(?<=[.?!])\s+/).filter((s: string) => s.trim().length > 3);
    const sentenceComparisons = sentences.slice(0, 5).map((s: string, idx: number) => {
      let polished = s.trim();
      const improvements: string[] = [];

      // Replace fillers
      if (/(\bum\b|\buh\b|\bbasically\b|\blike\b)/i.test(polished)) {
        polished = polished.replace(/(\bum\b|\buh\b|\bbasically\b|\blike\b)/gi, '').replace(/\s{2,}/g, ' ').trim();
        improvements.push('Removed filler hesitation words');
      }

      // Replace stutters
      if (/(\bthe\s+the\b|\bi\s+i\b|\bwe\s+we\b)/i.test(polished)) {
        polished = polished.replace(/\b(\w+)\s+\1\b/gi, '$1');
        improvements.push('Eliminated repeated stutter words');
      }

      // Fix introductory phrasing
      if (/^myself\s+/i.test(polished)) {
        polished = polished.replace(/^myself\s+/i, 'I am ');
        improvements.push('Upgraded colloquial greeting to standard interview introduction');
      }

      // Ensure proper capitalization
      polished = polished.charAt(0).toUpperCase() + polished.slice(1);
      if (!/[.?!]$/.test(polished)) polished += '.';

      return {
        id: `sc-${idx + 1}`,
        originalSentence: s.trim(),
        rightSentence: polished.length > 5 ? polished : 'Today, I would like to present a clear update on our milestone.',
        improvements: improvements.length > 0 ? improvements : ['Enhanced clarity, sentence pacing, and executive vocabulary'],
        category: (improvements.length > 0 ? 'Grammar' : 'Global Tone') as any,
        whyItSoundsBetter: 'Presents a calm, poised cadence that international interviewers find instantly clear and persuasive.',
      };
    });

    let detectedPaceCategory: 'Too Slow' | 'Optimal' | 'Slightly Fast' | 'Too Fast' = 'Optimal';
    if (computedWpm < 110) detectedPaceCategory = 'Too Slow';
    else if (computedWpm > 175) detectedPaceCategory = 'Too Fast';
    else if (computedWpm > 155) detectedPaceCategory = 'Slightly Fast';

    const awkwardPausesCount = detectedPauses.filter((p: any) => p.duration > 1.2).length;
    const pausePenalty = Math.min(25, awkwardPausesCount * 4);
    const fillerPenalty = Math.min(30, totalFillers * 5);
    const speedPenalty = computedWpm < 90 || computedWpm > 175 ? 18 : 0;

    const fluencyScore = Math.max(30, Math.min(100, Math.round(100 - pausePenalty - fillerPenalty - speedPenalty)));
    const clarityScore = Math.max(40, Math.min(100, Math.round(95 - (wrongWords.length * 5) - (totalFillers * 3))));
    const paceScore = detectedPaceCategory === 'Optimal' ? 95 : detectedPaceCategory === 'Slightly Fast' ? 82 : 68;

    const globalComprehensionScore = Math.max(
      35,
      Math.min(100, Math.round(100 - (computedWpm > 160 ? (computedWpm - 160) * 0.9 : 0) - totalFillers * 3 - awkwardPausesCount * 3))
    );

    return res.json({
      source: 'algorithmic',
      analysis: {
        fluencyScore,
        clarityScore,
        paceScore,
        detectedPaceCategory,
        pacingComment: `Measured speaking rate is ${computedWpm} WPM. Optimal global benchmark for US/UK/International audiences is 125–145 WPM.`,
        globalToneMetrics: {
          toneCategory: computedWpm > 165 ? 'Slightly Rushed' : awkwardPausesCount > 2 ? 'Hesitant / Stalling' : 'Confident & Poised',
          globalComprehensionScore,
          speedPacingAdvice: computedWpm > 155
            ? 'Pace is fast. Slow down by 15-20 WPM; international interviewers need time to process accent variations.'
            : 'Pacing is steady and comfortable for international native listeners.',
          accentToneAdvice: 'Emphasize word endings (e.g., -ed, -s) and pause 1 second before answering complex technical questions.',
          cadenceProfile: computedWpm > 160 ? 'Rapid Syllable-timed (Indian cadence)' : 'Controlled Stress-timed (Global standard)',
        },
        sentenceComparisons,
        wrongWords,
        fillerWords,
        pausesEvaluation: {
          totalAwkwardPauses: awkwardPausesCount,
          assessment: awkwardPausesCount > 3 ? 'Multiple long silences detected (>1.2s)' : 'Good continuous vocal flow with controlled pauses.',
          advice: 'Practice deep breathing to maintain consistent cadence between sentences.',
        },
        actionableTips: [
          'Aim for 130–140 WPM so international listeners absorb your ideas effortlessly.',
          'Replace vocal fillers ("um", "like") with silent 1-second breath pauses.',
          'Speak in concise 2-sentence structures using active verbs rather than winding clauses.',
        ],
        summary: `Audio analyzed (${durationSeconds.toFixed(1)}s, ${wordCount} words). Detected ${totalFillers} filler words and ${awkwardPausesCount} extended pauses. Global comprehension index is ${globalComprehensionScore}%.`,
      },
      computedWpm,
      wordCount,
      durationSeconds,
    });
  } catch (error: any) {
    console.error('Speech analysis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ==========================================
// SpeakTwin AI Custom Speech Dataset API
// ==========================================

// 1. Dataset Summary Statistics (Calculated dynamically from real records)
app.get('/api/dataset/summary', (_req, res) => {
  try {
    const stats = datasetManager.getSummaryStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching dataset summary:', err);
    res.status(500).json({ error: err.message || 'Failed to calculate summary stats' });
  }
});

// 2. List Samples (with search, category, and verification status filters)
app.get('/api/dataset/samples', (req, res) => {
  try {
    const { search, category, status } = req.query;
    const samples = datasetManager.getAllSamples({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
    });
    res.json(samples);
  } catch (err: any) {
    console.error('Error fetching dataset samples:', err);
    res.status(500).json({ error: err.message || 'Failed to list dataset samples' });
  }
});

// 3. Get Single Sample Details
app.get('/api/dataset/samples/:id', (req, res) => {
  try {
    const sample = datasetManager.getSampleById(req.params.id);
    if (!sample) {
      return res.status(404).json({ error: `Sample ${req.params.id} not found` });
    }
    res.json(sample);
  } catch (err: any) {
    console.error('Error fetching sample details:', err);
    res.status(500).json({ error: err.message || 'Failed to load sample' });
  }
});

// 4. Create New Sample (with audio file persistence and CSV update)
app.post('/api/dataset/samples', (req, res) => {
  try {
    const {
      sample_id,
      sample_name,
      speaker_id,
      sample_category,
      reference_pair_id,
      duration_seconds,
      audio_format,
      original_transcript,
      verified_transcript,
      corrected_transcript,
      language,
      verification_status,
      notes,
      has_uncertainty,
      audioBase64,
      labels,
    } = req.body;

    if (!sample_id || !sample_id.trim()) {
      return res.status(400).json({ error: 'Sample ID is required' });
    }
    if (!sample_category) {
      return res.status(400).json({ error: 'Sample Category (Good Speech / Speech with Identified Errors) is required' });
    }

    const created = datasetManager.createSample({
      sample_id: sample_id.trim(),
      sample_name: sample_name?.trim() || sample_id.trim(),
      speaker_id: speaker_id?.trim() || 'SPK_001',
      sample_category,
      reference_pair_id: reference_pair_id?.trim() || '',
      duration_seconds: duration_seconds ? parseFloat(duration_seconds) : 0,
      audio_format: audio_format || 'webm',
      original_transcript: original_transcript || '',
      verified_transcript,
      corrected_transcript,
      language: language || 'en-US',
      verification_status,
      notes,
      has_uncertainty: Boolean(has_uncertainty),
      audioBase64,
      labels,
    });

    res.status(201).json(created);
  } catch (err: any) {
    console.error('Error creating dataset sample:', err);
    res.status(400).json({ error: err.message || 'Failed to create dataset sample' });
  }
});

// 5. Update Sample (Transcript verification, status, category, notes, or audio replacement)
app.put('/api/dataset/samples/:id', (req, res) => {
  try {
    const updated = datasetManager.updateSample(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating dataset sample:', err);
    res.status(400).json({ error: err.message || 'Failed to update sample' });
  }
});

// 6. Delete Sample (Purges from CSVs and removes physical audio file)
app.delete('/api/dataset/samples/:id', (req, res) => {
  try {
    const success = datasetManager.deleteSample(req.params.id);
    if (!success) {
      return res.status(404).json({ error: `Sample ${req.params.id} not found` });
    }
    res.json({ success: true, message: `Sample ${req.params.id} permanently deleted` });
  } catch (err: any) {
    console.error('Error deleting dataset sample:', err);
    res.status(500).json({ error: err.message || 'Failed to delete sample' });
  }
});

// 7. Speech Pairs Endpoints
app.get('/api/dataset/pairs', (_req, res) => {
  try {
    const pairs = datasetManager.getPairs();
    res.json(pairs);
  } catch (err: any) {
    console.error('Error fetching speech pairs:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch speech pairs' });
  }
});

app.post('/api/dataset/pairs', (req, res) => {
  try {
    const pair = datasetManager.createPair(req.body);
    res.status(201).json(pair);
  } catch (err: any) {
    console.error('Error creating speech pair:', err);
    res.status(400).json({ error: err.message || 'Failed to create speech pair' });
  }
});

app.put('/api/dataset/pairs/:id', (req, res) => {
  try {
    const updated = datasetManager.updatePair(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating speech pair:', err);
    res.status(400).json({ error: err.message || 'Failed to update speech pair' });
  }
});

app.delete('/api/dataset/pairs/:id', (req, res) => {
  try {
    const success = datasetManager.deletePair(req.params.id);
    if (!success) return res.status(404).json({ error: 'Pair not found' });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting speech pair:', err);
    res.status(500).json({ error: err.message || 'Failed to delete speech pair' });
  }
});

// 8. Alignment Labels Endpoints
app.get('/api/dataset/labels/:sampleId?', (req, res) => {
  try {
    const labels = datasetManager.getLabels(req.params.sampleId);
    res.json(labels);
  } catch (err: any) {
    console.error('Error fetching labels:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch labels' });
  }
});

app.post('/api/dataset/labels', (req, res) => {
  try {
    const label = datasetManager.addLabel(req.body);
    res.status(201).json(label);
  } catch (err: any) {
    console.error('Error creating label:', err);
    res.status(400).json({ error: err.message || 'Failed to create label' });
  }
});

app.delete('/api/dataset/labels/:id', (req, res) => {
  try {
    const success = datasetManager.deleteLabel(req.params.id);
    if (!success) return res.status(404).json({ error: 'Label not found' });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting label:', err);
    res.status(500).json({ error: err.message || 'Failed to delete label' });
  }
});

// 9. Export CSV Downloads
app.get('/api/dataset/export/csv/:table', (req, res) => {
  try {
    const table = req.params.table as 'metadata' | 'transcripts' | 'alignment_labels' | 'pairs';
    if (!['metadata', 'transcripts', 'alignment_labels', 'pairs'].includes(table)) {
      return res.status(400).json({ error: 'Invalid table requested for export' });
    }
    const csvContent = datasetManager.getExportCsv(table);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="speaktwin_${table}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: err.message || 'Failed to export CSV' });
  }
});

// 10. Physical Audio Streaming Endpoint (supports range requests for seeking)
app.get('/api/dataset/audio/:category/:filename', (req, res) => {
  try {
    const { category, filename } = req.params;
    if (category !== 'good' && category !== 'bad') {
      return res.status(400).json({ error: 'Invalid audio category' });
    }

    const filePath = datasetManager.getAudioFilePath(category, filename);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found on disk' });
    }

    const stat = fs.statSync(filePath);
    const total = stat.size;
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'audio/webm';
    if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.m4a' || ext === '.mp4') contentType = 'audio/mp4';
    else if (ext === '.ogg') contentType = 'audio/ogg';

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err: any) {
    console.error('Audio streaming error:', err);
    res.status(500).json({ error: 'Failed to stream audio file' });
  }
});

// 11. Run Automated Dataset Integrity Validator
app.get('/api/dataset/validate', (_req, res) => {
  try {
    const result = validateDataset();
    res.json(result);
  } catch (err: any) {
    console.error('Dataset validation error:', err);
    res.status(500).json({ error: err.message || 'Validation failed' });
  }
});

// 12. Serve Technical Documentation PDF
app.get('/api/download/documentation-pdf', (_req, res) => {
  try {
    const pdfPath = path.resolve(__dirname, 'docs', 'technical_documentation.pdf');
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Technical documentation PDF not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="SpeakTwin_Technical_Documentation.pdf"');
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err: any) {
    console.error('PDF delivery error:', err);
    res.status(500).json({ error: 'Failed to deliver PDF' });
  }
});

async function startServer() {

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AudioPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
