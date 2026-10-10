import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Clock } from 'lucide-react';
import { DetectedPause } from '../types/audio';

interface WaveformTimelineProps {
  peaks: number[];
  durationSeconds: number;
  pauses: DetectedPause[];
  audioUrl: string | null;
  onSeek?: (seconds: number) => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  peaks,
  durationSeconds,
  pauses,
  audioUrl,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Canvas click to seek
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || durationSeconds <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = ratio * durationSeconds;

    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
    onSeek?.(seekTime);
  };

  // Draw waveform with pause highlights
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw pause zones in background
    if (durationSeconds > 0 && pauses.length > 0) {
      pauses.forEach((pause) => {
        const startX = (pause.startTime / durationSeconds) * width;
        const endX = (pause.endTime / durationSeconds) * width;
        const pauseW = Math.max(2, endX - startX);

        ctx.fillStyle =
          pause.type === 'awkward'
            ? 'rgba(239, 68, 68, 0.22)'
            : 'rgba(245, 158, 11, 0.16)';
        ctx.fillRect(startX, 0, pauseW, height);

        // Top marker stripe for pause
        ctx.fillStyle = pause.type === 'awkward' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.8)';
        ctx.fillRect(startX, 0, pauseW, 3);
      });
    }

    // Draw waveform bars
    const bars = peaks.length > 0 ? peaks : new Array(200).fill(0.1);
    const barWidth = Math.max(1.5, (width / bars.length) - 1.2);
    const halfHeight = height / 2;

    for (let i = 0; i < bars.length; i++) {
      const x = (i / bars.length) * width;
      const barH = Math.max(3, bars[i] * halfHeight * 0.9);
      const isPast = durationSeconds > 0 ? (i / bars.length) <= (currentTime / durationSeconds) : false;

      ctx.fillStyle = isPast ? '#06b6d4' : '#475569';
      ctx.fillRect(x, halfHeight - barH, barWidth, barH * 2);
    }

    // Playhead line
    if (durationSeconds > 0) {
      const playheadX = (currentTime / durationSeconds) * width;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Top playhead bead
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(playheadX, 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [peaks, durationSeconds, pauses, currentTime]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">
            Acoustic Timeline &amp; Pause Heatmap
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80 inline-block" />
            <span>Awkward Pause (&gt;1.2s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80 inline-block" />
            <span>Noticeable Pause</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {formatTime(currentTime)} / {formatTime(durationSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Waveform Canvas */}
      <div className="relative w-full h-24 bg-slate-950/80 border border-slate-800 rounded cursor-pointer overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={1000}
          height={96}
          onClick={handleCanvasClick}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Playback Controls & Audio Element */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {audioUrl ? (
            <>
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
              </button>
              <button
                onClick={handleRestart}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 font-mono">
              (Live recording or audio loaded — click waveform to scrub position)
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400">
          <span>Click on waveform or any pause to inspect timestamp</span>
        </div>
      </div>

      {/* Hidden audio element if URL exists */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
};
