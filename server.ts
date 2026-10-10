import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

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
You are an expert speech pathologist, vocal coach, and real-time audio analytics engine.
Analyze the following speech data:
- Audio Duration: ${durationSeconds.toFixed(1)} seconds
- Total Words: ${wordCount}
- Detected Pauses Count: ${detectedPauses.length} (details: ${JSON.stringify(detectedPauses.slice(0, 15))})
- Calculated Speech Speed (WPM): ${computedWpm} WPM
- Language Code: ${language}
- Transcript: "${transcript || '(No transcript detected yet or silent audio)'}"

Perform an in-depth diagnosis of:
1. Pauses & Silences:
   - Identify if pauses were strategic/natural or awkward/hesitant.
   - Long pauses (>1.5s) analysis.
2. Wrong Words & Fillers:
   - Identify filler words (e.g., "um", "uh", "like", "actually", "basically", "you know", or Marathi/Hindi equivalents "म्हणजे", "तर", "वगैरे", "मतलब").
   - Identify "wrong words": grammatical errors, mispronunciations, awkward phrasing, repeated stutters, or malapropisms.
3. Speed & Pacing:
   - Assess speaking rate (${computedWpm} WPM). Optimal conversational speech is 130-160 WPM. Slow is <110 WPM. Fast is >170 WPM.
   - Rate pace consistency (steady, rushed, dragging, erratic).
4. Clarity & Scores (0-100 scale):
   - Overall Fluency Score
   - Speech Clarity Score
   - Pace Consistency Score
5. Actionable Feedback:
   - 3 specific, bulleted techniques to improve delivery.

Return ONLY a valid JSON object matching this exact schema:
{
  "fluencyScore": number (0-100),
  "clarityScore": number (0-100),
  "paceScore": number (0-100),
  "detectedPaceCategory": "Too Slow" | "Optimal" | "Slightly Fast" | "Too Fast",
  "pacingComment": string,
  "wrongWords": [
    {
      "word": string,
      "context": string,
      "issue": "Grammar" | "Mispronounced" | "Stutter" | "Colloquialism" | "Awkward",
      "suggestion": string
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

    // Find repeated words stumbles (e.g., "the the", "i i")
    const wrongWords: any[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] === words[i + 1] && words[i].length > 1) {
        wrongWords.push({
          word: words[i],
          context: `"...${words[i]} ${words[i + 1]}..."`,
          issue: 'Stutter' as const,
          suggestion: `Avoid repeating "${words[i]}" back-to-back`,
        });
      }
    }

    let detectedPaceCategory: 'Too Slow' | 'Optimal' | 'Slightly Fast' | 'Too Fast' = 'Optimal';
    if (computedWpm < 110) detectedPaceCategory = 'Too Slow';
    else if (computedWpm > 175) detectedPaceCategory = 'Too Fast';
    else if (computedWpm > 160) detectedPaceCategory = 'Slightly Fast';

    const awkwardPausesCount = detectedPauses.filter((p: any) => p.duration > 1.2).length;
    const pausePenalty = Math.min(25, awkwardPausesCount * 4);
    const fillerPenalty = Math.min(30, totalFillers * 5);
    const speedPenalty = computedWpm < 90 || computedWpm > 190 ? 15 : 0;

    const fluencyScore = Math.max(30, Math.min(100, Math.round(100 - pausePenalty - fillerPenalty - speedPenalty)));
    const clarityScore = Math.max(40, Math.min(100, Math.round(95 - (wrongWords.length * 5) - (totalFillers * 3))));
    const paceScore = detectedPaceCategory === 'Optimal' ? 95 : detectedPaceCategory === 'Slightly Fast' ? 82 : 70;

    return res.json({
      source: 'algorithmic',
      analysis: {
        fluencyScore,
        clarityScore,
        paceScore,
        detectedPaceCategory,
        pacingComment: `Measured speaking rate is ${computedWpm} WPM. Optimal conversational benchmark is 130–160 WPM.`,
        wrongWords,
        fillerWords,
        pausesEvaluation: {
          totalAwkwardPauses: awkwardPausesCount,
          assessment: awkwardPausesCount > 3 ? 'Multiple long silences detected (>1.2s)' : 'Good continuous vocal flow with controlled pauses.',
          advice: 'Practice deep breathing to maintain consistent cadence between sentences.',
        },
        actionableTips: [
          'Pause deliberately before key points rather than inserting hesitation sounds.',
          `Aim for a rhythmic pace around 140 WPM (current is ${computedWpm} WPM).`,
          'Speak in short, complete phrases to reduce sentence stumbles.',
        ],
        summary: `Audio analyzed (${durationSeconds.toFixed(1)}s, ${wordCount} words). Detected ${totalFillers} filler words and ${awkwardPausesCount} extended pauses.`,
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
