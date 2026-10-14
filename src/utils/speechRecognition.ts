import { SupportedLanguage, TranscriptWord } from '../types/audio';

const FILLER_WORDS: Record<string, string[]> = {
  'en-US': ['um', 'uh', 'er', 'ah', 'like', 'actually', 'basically', 'literally', 'you know', 'i mean', 'so yeah', 'sort of', 'kind of', 'right', 'honestly'],
  'mr-IN': ['म्हणजे', 'तर', 'वगैरे', 'असं', 'मग', 'ना', 'बरोबर', 'काय', 'बघूया', 'आणि', 'हो ना'],
  'hi-IN': ['मतलब', 'यानि', 'जैसे', 'तो', 'फिर', 'वगैरह', 'हाँ', 'ना', 'बोले तो', 'अरे'],
};

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
    return typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Speech Recognition is not natively supported in this browser. You can still upload any audio file or use the built-in demo.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece + ' ';
          } else {
            interimTranscript += piece;
          }
        }

        if (finalTranscript.trim()) {
          this.fullTranscript = (this.fullTranscript + ' ' + finalTranscript).trim();
          this.processWords(this.fullTranscript);
        } else if (interimTranscript.trim()) {
          const combined = (this.fullTranscript + ' ' + interimTranscript).trim();
          this.processWords(combined);
        }
      };

      this.recognition.onerror = (event: any) => {
        // Ignore aborted error if intentional
        if (event.error === 'aborted' || event.error === 'no-speech') return;
        this.onErrorCallback?.(`Speech recognition notice: ${event.error}`);
      };

      this.recognition.onend = () => {
        // Auto restart if still supposed to be listening (Chrome often stops after silence)
        if (this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch {
            // Already started or restarting
          }
        }
      };

      this.isListening = true;
      this.recognition.start();
    } catch (err: any) {
      this.onErrorCallback?.(err?.message || 'Failed to start speech recognition');
    }
  }

  private processWords(text: string) {
    const rawTokens = text.split(/\s+/).filter(Boolean);
    const fillers = FILLER_WORDS[this.lang] || FILLER_WORDS['en-US'];

    const words: TranscriptWord[] = [];
    const elapsedSeconds = Math.max(0.5, (performance.now() - this.startTime) / 1000);

    for (let i = 0; i < rawTokens.length; i++) {
      const cleanToken = rawTokens[i].toLowerCase().replace(/[^\w\u0900-\u097F]/g, '');
      const isFiller = fillers.some((f) => cleanToken === f || cleanToken.includes(f));

      // Stutter or repetition check
      const prevWord = i > 0 ? rawTokens[i - 1].toLowerCase().replace(/[^\w\u0900-\u097F]/g, '') : '';
      const isRepetition = i > 0 && cleanToken === prevWord && cleanToken.length > 1;

      words.push({
        id: `w-${i}-${cleanToken}`,
        word: rawTokens[i],
        timestamp: (i / Math.max(1, rawTokens.length)) * elapsedSeconds,
        isFiller,
        isWrong: isRepetition,
        issue: isRepetition ? 'Repetition Stutter' : undefined,
        suggestion: isRepetition ? `Avoid saying "${cleanToken}" twice in a row` : undefined,
      });
    }

    this.wordsHistory = words;
    this.onTranscriptUpdate?.(text, words);

    // Calculate real-time speed in Words Per Minute
    const wpm = Math.round((rawTokens.length / elapsedSeconds) * 60);
    this.onWpmUpdate?.(wpm);
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
