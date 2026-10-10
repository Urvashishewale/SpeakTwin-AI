import React, { useEffect, useRef } from 'react';
import { RealtimeAudioStats } from '../utils/audioAnalyzer';
import { Volume2, VolumeX, Mic } from 'lucide-react';

interface AudioVisualizerProps {
  stats: RealtimeAudioStats | null;
  isRecording: boolean;
  isPausedSilence: boolean;
  pauseDurationActive: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  stats,
  isRecording,
  isPausedSilence,
  pauseDurationActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (!isRecording || !stats) {
      // Draw idle gentle wave
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const time = performance.now() * 0.002;
      for (let x = 0; x < width; x++) {
        const y = height / 2 + Math.sin(x * 0.04 + time) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      return;
    }

    const { frequencyData, timeData } = stats;

    // Draw frequency spectrum bars
    const barCount = 48;
    const barWidth = (width / barCount) - 2;
    const step = Math.floor(frequencyData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const freqVal = frequencyData[i * step] || 0;
      const barHeight = (freqVal / 255) * (height * 0.75);
      const x = i * (barWidth + 2);
      const y = height - barHeight;

      // Color based on active speech vs pause
      const gradient = ctx.createLinearGradient(0, y, 0, height);
      if (isPausedSilence) {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
      } else {
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.25)');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Overlay time-domain oscilloscope line
    ctx.strokeStyle = isPausedSilence ? 'rgba(248, 113, 113, 0.8)' : 'rgba(165, 243, 252, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }
    ctx.stroke();
  }, [stats, isRecording, isPausedSilence]);

  const decibels = stats ? Math.round(stats.decibels) : -60;
  const rmsPercentage = stats ? Math.min(100, Math.round(stats.rms * 400)) : 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Live Acoustic Oscilloscope</span>
        </div>

        {/* Real-time Silence / Pause indicator */}
        <div className="flex items-center gap-2">
          {isRecording ? (
            isPausedSilence ? (
              <span className="text-xs font-mono font-medium text-amber-400 flex items-center gap-1.5 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Pause ({pauseDurationActive.toFixed(1)}s)</span>
              </span>
            ) : (
              <span className="text-xs font-mono font-medium text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-800/50 px-2 py-0.5 rounded">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vocal Stream</span>
              </span>
            )
          ) : (
            <span className="text-xs font-mono text-slate-500">Standby</span>
          )}
        </div>
      </div>

      <div className="relative w-full h-28 bg-slate-950/70 border border-slate-800/80 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={112}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span>Signal RMS</span>
          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                isPausedSilence ? 'bg-amber-500' : 'bg-cyan-400'
              }`}
              style={{ width: `${rmsPercentage}%` }}
            />
          </div>
          <span className="tabular-nums">{rmsPercentage}%</span>
        </div>

        <div className="flex items-center gap-1">
          <span>Level</span>
          <span className="text-slate-200 tabular-nums">{decibels} dBFS</span>
        </div>
      </div>
    </div>
  );
};
