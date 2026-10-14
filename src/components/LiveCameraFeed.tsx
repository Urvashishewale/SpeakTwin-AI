import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Video, Eye, Shield, Sparkles, UserCheck } from 'lucide-react';

interface LiveCameraFeedProps {
  stream: MediaStream | null;
  isCameraEnabled: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  onToggleCamera: () => void;
  clarityScore: number;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  stream,
  isCameraEnabled,
  isRecording,
  isSpeaking,
  onToggleCamera,
  clarityScore,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream && isCameraEnabled) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream, isCameraEnabled]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Live Interview Camera</span>
          {isRecording && isCameraEnabled && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCameraEnabled && (
            <button
              onClick={() => setShowGuidelines((prev) => !prev)}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 transition-colors"
              title="Toggle eye-level framing guidelines"
            >
              {showGuidelines ? 'Hide Framing' : 'Show Framing'}
            </button>
          )}

          <button
            onClick={onToggleCamera}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
              isCameraEnabled
                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 hover:bg-cyan-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isCameraEnabled ? (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Cam On</span>
              </>
            ) : (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>Cam Off</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative w-full h-48 bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 flex items-center justify-center">
        {isCameraEnabled && stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 transition-all duration-300 ${
                isSpeaking && isRecording ? 'ring-2 ring-cyan-500/80' : ''
              }`}
            />

            {/* Speaking Aura Effect */}
            {isSpeaking && isRecording && (
              <div className="absolute inset-0 border-2 border-cyan-400/70 pointer-events-none rounded-lg animate-pulse" />
            )}

            {/* Eye-level framing grid guideline */}
            {showGuidelines && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 opacity-40">
                {/* Horizontal eye-level line */}
                <div className="w-full border-b border-dashed border-cyan-400/70 top-1/3 relative" />
                <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300 bg-slate-950/70 px-2 py-0.5 rounded self-center">
                  <Eye className="w-3 h-3 mr-1" />
                  <span>Maintain Eye Contact Here</span>
                </div>
              </div>
            )}

            {/* Live Clarity Counter Badge floating on camera */}
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded font-mono text-xs">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-400 text-[10px]">Speech Clarity:</span>
              <span className="text-cyan-300 font-bold tabular-nums">{clarityScore}%</span>
            </div>

            {/* Active Speaker status badge */}
            <div className="absolute top-2 right-2 z-10">
              {isSpeaking ? (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                  Active Speaker
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                  Listening / Paused
                </span>
              )}
            </div>
          </>
        ) : (
          /* Idle / Cam Off Placeholder */
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <CameraOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">Camera Feed is Offline</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                Enable your camera to practice professional posture, eye contact, and facial composure for your interview.
              </p>
            </div>
            <button
              onClick={onToggleCamera}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium transition-colors"
            >
              Turn On Interview Cam
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Eye-Level Framing</span>
        </div>
        <div className="text-[11px] text-slate-500">
          {isCameraEnabled ? 'Webcam Active' : 'Audio-Only Mode'}
        </div>
      </div>
    </div>
  );
};
