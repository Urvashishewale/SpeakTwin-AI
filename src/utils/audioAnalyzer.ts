import { DetectedPause } from '../types/audio';

export interface RealtimeAudioStats {
  rms: number;
  decibels: number;
  isSilent: boolean;
  frequencyData: Uint8Array;
  timeData: Uint8Array;
}

export class RealtimeAudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  // Silence & Pause Detection State
  private silenceThreshold = 0.018; // RMS below this is considered silence
  private minPauseDuration = 0.45; // seconds
  private isCurrentlySilent = false;
  private silenceStartTime = 0;
  private recordingStartTime = 0;
  private onPauseDetected?: (pause: DetectedPause) => void;
  private onStatsUpdate?: (stats: RealtimeAudioStats, currentDuration: number) => void;

  public async startMicrophone(
    onStats: (stats: RealtimeAudioStats, currentDuration: number) => void,
    onPause: (pause: DetectedPause) => void
  ): Promise<MediaStream> {
    this.stop();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });

    this.mediaStream = stream;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
    this.sourceNode.connect(this.analyser);

    this.onStatsUpdate = onStats;
    this.onPauseDetected = onPause;
    this.recordingStartTime = performance.now();
    this.isCurrentlySilent = false;
    this.silenceStartTime = 0;

    this.processLoop();
    return stream;
  }

  private processLoop = () => {
    if (!this.analyser || !this.audioCtx) return;

    const timeData = new Uint8Array(this.analyser.fftSize);
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.analyser.getByteTimeDomainData(timeData);
    this.analyser.getByteFrequencyData(freqData);

    // Compute RMS amplitude
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / timeData.length);
    const decibels = rms > 0 ? Math.max(-60, 20 * Math.log10(rms)) : -60;

    const now = performance.now();
    const currentDuration = (now - this.recordingStartTime) / 1000;

    // Silence detection logic
    const isSilent = rms < this.silenceThreshold;

    if (isSilent) {
      if (!this.isCurrentlySilent) {
        this.isCurrentlySilent = true;
        this.silenceStartTime = now;
      }
    } else {
      if (this.isCurrentlySilent) {
        const pauseDuration = (now - this.silenceStartTime) / 1000;
        if (pauseDuration >= this.minPauseDuration) {
          const startTime = (this.silenceStartTime - this.recordingStartTime) / 1000;
          const endTime = (now - this.recordingStartTime) / 1000;

          let type: 'breath' | 'noticeable' | 'awkward' = 'noticeable';
          if (pauseDuration < 0.8) type = 'breath';
          else if (pauseDuration > 1.3) type = 'awkward';

          this.onPauseDetected?.({
            id: `pause-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            startTime: Math.max(0, startTime),
            endTime,
            duration: pauseDuration,
            type,
          });
        }
        this.isCurrentlySilent = false;
      }
    }

    this.onStatsUpdate?.(
      {
        rms,
        decibels,
        isSilent,
        frequencyData: freqData,
        timeData,
      },
      currentDuration
    );

    this.animFrameId = requestAnimationFrame(this.processLoop);
  };

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.isCurrentlySilent = false;
  }
}

/**
 * Decodes any duration audio file (MP3, WAV, WEBM, M4A, etc.) in the browser
 * Extracts normalized peak waveform data and scans for pauses.
 */
export async function analyzeAudioFile(file: File): Promise<{
  audioBuffer: AudioBuffer;
  duration: number;
  peaks: number[];
  pauses: DetectedPause[];
  totalSilenceSeconds: number;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const duration = audioBuffer.duration;
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // 1. Generate waveform peaks (400 sample points for smooth rendering)
  const numberOfPeaks = 400;
  const step = Math.max(1, Math.floor(channelData.length / numberOfPeaks));
  const peaks: number[] = [];

  for (let i = 0; i < numberOfPeaks; i++) {
    const start = i * step;
    let max = 0;
    for (let j = 0; j < step && start + j < channelData.length; j++) {
      const val = Math.abs(channelData[start + j]);
      if (val > max) max = val;
    }
    peaks.push(max);
  }

  // 2. Offline Silence & Pause Detection across the full duration
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms window
  const silenceThreshold = 0.015;
  const minPauseSeconds = 0.45;

  const pauses: DetectedPause[] = [];
  let inSilence = false;
  let silenceStartSec = 0;
  let totalSilenceSeconds = 0;

  for (let i = 0; i < channelData.length; i += windowSize) {
    let sumSq = 0;
    const windowEnd = Math.min(i + windowSize, channelData.length);
    for (let j = i; j < windowEnd; j++) {
      sumSq += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sumSq / (windowEnd - i));
    const currentSec = i / sampleRate;

    if (rms < silenceThreshold) {
      if (!inSilence) {
        inSilence = true;
        silenceStartSec = currentSec;
      }
    } else {
      if (inSilence) {
        const pauseDuration = currentSec - silenceStartSec;
        if (pauseDuration >= minPauseSeconds) {
          let type: 'breath' | 'noticeable' | 'awkward' = 'noticeable';
          if (pauseDuration < 0.8) type = 'breath';
          else if (pauseDuration > 1.3) type = 'awkward';

          pauses.push({
            id: `p-${pauses.length + 1}`,
            startTime: silenceStartSec,
            endTime: currentSec,
            duration: pauseDuration,
            type,
          });
          totalSilenceSeconds += pauseDuration;
        }
        inSilence = false;
      }
    }
  }

  // Handle trailing silence
  if (inSilence) {
    const pauseDuration = duration - silenceStartSec;
    if (pauseDuration >= minPauseSeconds) {
      pauses.push({
        id: `p-${pauses.length + 1}`,
        startTime: silenceStartSec,
        endTime: duration,
        duration: pauseDuration,
        type: pauseDuration > 1.3 ? 'awkward' : 'noticeable',
      });
      totalSilenceSeconds += pauseDuration;
    }
  }

  await audioCtx.close();

  return {
    audioBuffer,
    duration,
    peaks,
    pauses,
    totalSilenceSeconds,
  };
}

/**
 * Creates a synthetic speech demonstration buffer for immediate 1-click test
 */
export function createSyntheticDemoAudio(): {
  peaks: number[];
  duration: number;
  sampleTranscript: string;
  samplePauses: DetectedPause[];
} {
  const duration = 24.5; // seconds
  const peaks: number[] = [];
  for (let i = 0; i < 400; i++) {
    // simulate speech blocks and silence intervals
    const t = (i / 400) * duration;
    const isPause1 = t > 4.2 && t < 5.8; // awkward pause
    const isPause2 = t > 11.0 && t < 12.3; // noticeable pause
    const isPause3 = t > 18.5 && t < 20.2; // awkward pause

    if (isPause1 || isPause2 || isPause3) {
      peaks.push(0.02 + Math.random() * 0.02);
    } else {
      const envelope = Math.sin((i / 400) * Math.PI * 8) * 0.4 + 0.5;
      peaks.push(Math.max(0.1, Math.min(0.95, envelope * (0.6 + Math.random() * 0.4))));
    }
  }

  const samplePauses: DetectedPause[] = [
    { id: 'dp-1', startTime: 4.2, endTime: 5.8, duration: 1.6, type: 'awkward' },
    { id: 'dp-2', startTime: 11.0, endTime: 12.3, duration: 1.3, type: 'noticeable' },
    { id: 'dp-3', startTime: 18.5, endTime: 20.2, duration: 1.7, type: 'awkward' },
  ];

  const sampleTranscript =
    "Hello team, um today I want to give an update on our quarterly release. Uh we have finished the the core audio architecture and basically all real time analytics are functioning. Like you know our latency is under 20 milliseconds, but we we should verify the memory footprint before production deployment.";

  return {
    peaks,
    duration,
    sampleTranscript,
    samplePauses,
  };
}
