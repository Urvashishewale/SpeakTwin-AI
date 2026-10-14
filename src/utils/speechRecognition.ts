import { SupportedLanguage, TranscriptWord } from '../types/audio';

// Standard filler word lexicons (exact tokens or multi-word phrases)
const FILLER_SINGLE_WORDS: Record<string, string[]> = {
  'en-US': ['um', 'uh', 'er', 'ah', 'basically', 'actually', 'literally'],
  'mr-IN': ['म्हणजे', 'तर', 'वगैरे', 'असं', 'मग', 'ना', 'बरोबर', 'काय', 'बघूया', 'आणि', 'हो ना'],
  'hi-IN': ['मतलब', 'यानि', 'जैसे', 'तो', 'फिर', 'वगैरह', 'हाँ', 'ना', 'बोले तो', 'अरे'],
};

const FILLER_PHRASES: Record<string, string[][]> = {
  'en-US': [
    ['you', 'know'],
    ['i', 'mean'],
    ['so', 'yeah'],
    ['sort', 'of'],
    ['kind', 'of'],
  ],
  'mr-IN': [],
  'hi-IN': [],
};

// Verbs/pronouns that indicate "like" is being used as a normal verb/preposition, NOT a filler
const LIKE_NORMAL_PRECEDING_WORDS = new Set([
  'i',
  'we',
  'they',
  'you',
  'he',
  'she',
  'it',
  'would',
  'could',
  'should',
  'look',
  'looks',
  'looked',
  'sound',
  'sounds',
  'sounded',
  'feel',
  'feels',
  'felt',
  'seem',
  'seems',
  'seemed',
  'something',
  'nothing',
  'anything',
  'someone',
  'anyone',
]);

export class SpeechRecognitionEngine {
  private recognition: any = null;
  private isListening = false;
  private wordsHistory: TranscriptWord[] = [];
  private fullTranscript = '';
  private startTime = 0;
  private lang: SupportedLanguage = 'en-US';

  private onTranscriptUpdate?: (fullText: string, words: TranscriptWord[]) => void;
  private onWpmUpdate?: (wpm: number) => void;
  private onErrorCallback?: (err: string) => void;

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }

  public setLanguage(lang: SupportedLanguage) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(
    lang: SupportedLanguage,
    onTranscript: (fullText: string, words: TranscriptWord[]) => void,
    onWpm: (wpm: number) => void,
    onError?: (err: string) => void
  ) {
    this.stop();
    this.lang = lang;
    this.onTranscriptUpdate = onTranscript;
    this.onWpmUpdate = onWpm;
    this.onErrorCallback = onError;
    this.wordsHistory = [];
    this.fullTranscript = '';
    this.startTime = performance.now();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) {
        onError(
          'Speech Recognition is not natively supported in this browser. You can still upload any audio file or use the built-in demo.'
        );
      }
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Safely iterate through all cumulative results up to event.results.length
        // to avoid duplicating phrases during interim-to-final transitions.
        for (let i = 0; i < event.results.length; ++i) {
          const piece = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalTranscript += piece + ' ';
          } else {
            interimTranscript += piece;
          }
        }

        const consolidated = (finalTranscript + interimTranscript).trim();

        if (consolidated) {
          this.fullTranscript = consolidated;
          this.processWords(this.fullTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        // Ignore normal aborted or no-speech events
        if (event.error === 'aborted' || event.error === 'no-speech') return;
        this.onErrorCallback?.(`Speech recognition notice: ${event.error}`);
      };

      this.recognition.onend = () => {
        // Auto-restart if listening was not explicitly stopped (browser silence timeout handling)
        if (this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch {
            // Already active or restarting
          }
        }
      };

      this.isListening = true;
      this.recognition.start();
    } catch (err: any) {
      this.onErrorCallback?.(err?.message || 'Failed to start speech recognition');
    }
  }

  /**
   * Processes the verbatim recognized text into TranscriptWord tokens without
   * fabricating timestamps or inventing words not uttered by the user.
   */
  public processWords(text: string): TranscriptWord[] {
    if (!text.trim()) {
      this.wordsHistory = [];
      this.onTranscriptUpdate?.('', []);
      this.onWpmUpdate?.(0);
      return [];
    }

    const rawTokens = text.split(/\s+/).filter(Boolean);
    const singleFillers = new Set(FILLER_SINGLE_WORDS[this.lang] || FILLER_SINGLE_WORDS['en-US']);
    const phraseFillers = FILLER_PHRASES[this.lang] || FILLER_PHRASES['en-US'];

    const words: TranscriptWord[] = [];
    const cleanTokens = rawTokens.map((t) =>
      t.toLowerCase().replace(/^[^\w\u0900-\u097F]+|[^\w\u0900-\u097F]+$/g, '')
    );

    // Track which token indices belong to detected multi-word filler phrases
    const fillerIndices = new Set<number>();

    for (let i = 0; i < cleanTokens.length; i++) {
      // 1. Check multi-word phrase fillers (e.g. "you know", "i mean", "so yeah")
      for (const phrase of phraseFillers) {
        if (i + phrase.length <= cleanTokens.length) {
          let match = true;
          for (let p = 0; p < phrase.length; p++) {
            if (cleanTokens[i + p] !== phrase[p]) {
              match = false;
              break;
            }
          }
          if (match) {
            for (let p = 0; p < phrase.length; p++) {
              fillerIndices.add(i + p);
            }
          }
        }
      }

      // 2. Check single-word fillers with exact token matching (no substring matching!)
      if (singleFillers.has(cleanTokens[i])) {
        fillerIndices.add(i);
      }

      // 3. Contextual evaluation for "like":
      // Distinguish when "like" is a verb/preposition vs a filler
      if (cleanTokens[i] === 'like') {
        const prevClean = i > 0 ? cleanTokens[i - 1] : '';
        const isOrdinaryUsage = LIKE_NORMAL_PRECEDING_WORDS.has(prevClean);
        if (!isOrdinaryUsage) {
          // Used as hesitation filler
          fillerIndices.add(i);
        }
      }
    }

    // Now construct TranscriptWord array and check for potential speech slips
    for (let i = 0; i < rawTokens.length; i++) {
      const clean = cleanTokens[i];
      const isFiller = fillerIndices.has(i);

      // Check for immediate word repetition (stutter slip)
      const prevClean = i > 0 ? cleanTokens[i - 1] : '';
      const isRepetition = i > 0 && clean === prevClean && clean.length > 1;

      // Check for potential colloquial transfers (labeled as potential issues, not definitive errors)
      let isPotentialIssue = isRepetition;
      let issueType: string | undefined = isRepetition ? 'Repeated Word Stumble' : undefined;
      let suggestionText: string | undefined = isRepetition
        ? `Consecutive repetition of "${clean}". Consider pausing cleanly.`
        : undefined;

      // Note on introductory "myself [Name]"
      if (i === 0 && clean === 'myself' && rawTokens.length > 1) {
        isPotentialIssue = true;
        issueType = 'Potential Colloquial Phrasing';
        suggestionText = 'Introductory "Myself [Name]". International standard prefers "My name is" or "I am".';
      }

      // Note on redundant "revert back"
      if (clean === 'revert' && i + 1 < cleanTokens.length && cleanTokens[i + 1] === 'back') {
        isPotentialIssue = true;
        issueType = 'Potential Redundant Phrasing';
        suggestionText = '"revert back" is redundant. Use "reply" or "follow up".';
      }

      // Note on auxiliary verb discord ("did not got")
      if (clean === 'got' && i >= 2 && cleanTokens[i - 1] === 'not' && cleanTokens[i - 2] === 'did') {
        isPotentialIssue = true;
        issueType = 'Potential Auxiliary Verb Discord';
        suggestionText = '"did not got" typically uses the base verb form ("did not get" or "did not encounter").';
      }

      words.push({
        id: `w-${i}-${clean}-${Date.now() % 10000}`,
        word: rawTokens[i], // Preserves exact recognized word verbatim
        timestamp: undefined, // Real timestamps are only populated when verified acoustic/timeline data exists
        isFiller,
        isWrong: isPotentialIssue,
        isPotentialIssue,
        issue: issueType,
        suggestion: suggestionText,
      });
    }

    this.wordsHistory = words;
    this.onTranscriptUpdate?.(text, words);

    // Calculate real-time speed in Words Per Minute
    const elapsedSeconds = Math.max(0.5, (performance.now() - this.startTime) / 1000);
    const wpm = Math.round((rawTokens.length / elapsedSeconds) * 60);
    this.onWpmUpdate?.(wpm);

    return words;
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
  }
}
