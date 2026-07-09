import { Info, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getExerciseDemoVideo } from "../data/exerciseDemoVideos";

interface ExerciseInfoModalProps {
  name: string;
  meta: string;
  description: string;
  onClose: () => void;
}

function durationToSeconds(value: number, unit: string): number {
  return unit.startsWith("min") ? value * 60 : value;
}

function getTimedSeconds(meta: string): number | null {
  const normalized = meta.toLowerCase();
  const rangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)\s*(sec|second|seconds|min|minute|minutes)/);
  if (rangeMatch) {
    return durationToSeconds(Math.max(Number(rangeMatch[1]), Number(rangeMatch[2])), rangeMatch[3]);
  }

  const timedSetMatch = normalized.match(/x\s*(\d+)\s*(sec|second|seconds|min|minute|minutes)/);
  if (timedSetMatch) {
    return durationToSeconds(Number(timedSetMatch[1]), timedSetMatch[2]);
  }

  const durationMatch = normalized.match(/(\d+)\s*(sec|second|seconds|min|minute|minutes)/);
  if (durationMatch) {
    return durationToSeconds(Number(durationMatch[1]), durationMatch[2]);
  }

  return null;
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function ExerciseTimer({ meta }: { meta: string }) {
  const timerSeconds = getTimedSeconds(meta);
  const [remaining, setRemaining] = useState(timerSeconds ?? 0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(timerSeconds ?? 0);
    setRunning(false);
  }, [timerSeconds, meta]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = window.setInterval(() => {
      setRemaining((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [remaining, running]);

  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);

  if (!timerSeconds) return null;

  const elapsedPercent = ((timerSeconds - remaining) / timerSeconds) * 100;
  const isComplete = remaining === 0;

  return (
    <div className="mt-3 rounded-card border border-border bg-surface-2/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-surface border border-border shrink-0">
            <Timer size={14} className="text-brand-light" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Timer</p>
            <p className="text-xs text-text-muted truncate">{meta}</p>
          </div>
        </div>

        <div
          className="w-16 h-16 rounded-full p-[3px] shrink-0"
          style={{
            background: `conic-gradient(#84D8FD ${elapsedPercent}%, rgba(132,216,253,0.13) ${elapsedPercent}% 100%)`,
          }}
        >
          <div className="w-full h-full rounded-full bg-surface flex items-center justify-center border border-border">
            <span className="text-sm font-extrabold text-brand-light tabular-nums">{formatTimer(remaining)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2 mt-3">
        <button
          onClick={() => {
            if (isComplete) setRemaining(timerSeconds);
            setRunning((current) => !current || isComplete);
          }}
          className="flex items-center justify-center gap-2 gradient-brand text-white text-xs font-bold rounded-pill py-2.5"
        >
          {running ? <Pause size={13} /> : <Play size={13} />}
          {running ? "Pause" : isComplete ? "Start Again" : "Start"}
        </button>
        <button
          onClick={() => {
            setRemaining(timerSeconds);
            setRunning(false);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-border text-text-muted"
          aria-label="Reset timer"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ExerciseInfoModal({ name, meta, description, onClose }: ExerciseInfoModalProps) {
  const [videoError, setVideoError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const demoVideo = getExerciseDemoVideo(name);
  const videoUrl = demoVideo ? `/exercise-videos/${demoVideo.file}` : null;

  const handleWatch = () => {
    setVideoError(false);
    if (!videoUrl) {
      setVideoError(true);
      return;
    }
    setShowVideo(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 animate-fade-in-up"
      onClick={onClose}
    >
      <div className="relative w-full max-w-sm gradient-brand p-[1px] rounded-card" onClick={(e) => e.stopPropagation()}>
        <div className="bg-surface rounded-card p-6 animate-pop-in">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          <div className="w-11 h-11 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3">
            <Info size={20} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
          </div>

          <h2 className="text-lg font-bold text-text mb-0.5">{name}</h2>
          <p className="text-xs font-semibold text-brand-light mb-3">{meta}</p>
          <p className="text-sm text-text-muted leading-relaxed mb-4">{description}</p>

          {/* Video section */}
          {showVideo && videoUrl ? (
            <div className="rounded-card overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full max-h-52 object-cover"
              />
            </div>
          ) : (
            <button
              onClick={handleWatch}
              className="flex items-center justify-center gap-2 w-full text-xs font-semibold gradient-brand text-white rounded-pill py-2.5 disabled:opacity-60"
            >
              <Play size={13} /> Watch Demo
            </button>
          )}

          <ExerciseTimer meta={meta} />

          {videoError && (
            <p className="text-[11px] text-text-muted text-center mt-2">No video found for this exercise.</p>
          )}
        </div>
      </div>
    </div>
  );
}
