import { Clock, Music as MusicIcon, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Playlist from "../components/music/Playlist";
import TopBar from "../components/layout/TopBar";
import type { Song } from "../types";
import { AMBIENT_SOUNDS, playAmbientSound, type AmbientSoundHandle, type AmbientSoundId } from "../utils/ambientSounds";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type Tab = "playlist" | "sounds";

const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: "No limit", minutes: null },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "60 min", minutes: 60 },
];

export default function Music() {
  const [tab, setTab] = useState<Tab>("playlist");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSound, setActiveSound] = useState<AmbientSoundId | null>(null);
  const [volume, setVolume] = useState(0.6);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const handleRef = useRef<AmbientSoundHandle | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setSecondsLeft(null);
  };

  useEffect(() => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/songs`)
      .then((res) => (res.ok ? res.json() : { songs: [] }))
      .then((data) => setSongs(data.songs || []))
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
      clearTimer();
    };
  }, []);

  const startTimer = (minutes: number | null) => {
    clearTimer();
    if (!minutes) return;

    let remaining = minutes * 60;
    setSecondsLeft(remaining);
    countdownRef.current = window.setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
    }, 1000);
    timerRef.current = window.setTimeout(() => {
      handleRef.current?.stop();
      handleRef.current = null;
      setActiveSound(null);
      clearTimer();
    }, minutes * 60 * 1000);
  };

  const toggleSound = (id: AmbientSoundId) => {
    if (activeSound === id) {
      handleRef.current?.stop();
      handleRef.current = null;
      setActiveSound(null);
      clearTimer();
      return;
    }
    handleRef.current?.stop();
    const handle = playAmbientSound(id);
    handle.setVolume(volume);
    handleRef.current = handle;
    setActiveSound(id);
    startTimer(timerMinutes);
  };

  const handleTimerChange = (minutes: number | null) => {
    setTimerMinutes(minutes);
    if (activeSound) startTimer(minutes);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    handleRef.current?.setVolume(v);
  };

  return (
    <div>
      <TopBar title="Music" subtitle="Playlist & peaceful sounds" icon={MusicIcon} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setTab("playlist")}
            className={`text-sm font-semibold rounded-pill py-2.5 border ${
              tab === "playlist" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            Playlist
          </button>
          <button
            onClick={() => setTab("sounds")}
            className={`text-sm font-semibold rounded-pill py-2.5 border ${
              tab === "sounds" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            Peaceful Sounds
          </button>
        </div>

        {tab === "playlist" && <Playlist songs={songs} loading={loading} />}

        {tab === "sounds" && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-muted mb-1">
              Looping ambient sounds to help you relax, focus, or fall asleep.
            </p>

            {activeSound && (
              <div className="glass-card rounded-card p-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Volume2 size={16} className="text-brand-light shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 accent-brand-blue"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-muted shrink-0" />
                  <div className="flex gap-1.5 flex-1">
                    {TIMER_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => handleTimerChange(opt.minutes)}
                        className={`flex-1 text-[11px] font-semibold rounded-pill py-1.5 ${
                          timerMinutes === opt.minutes
                            ? "gradient-brand text-white"
                            : "bg-surface-2 text-text-muted border border-border"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {secondsLeft !== null && (
                  <p className="text-[11px] text-text-dim text-center">
                    Stopping in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {AMBIENT_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => toggleSound(sound.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-card p-4 border ${
                    activeSound === sound.id
                      ? "gradient-brand border-transparent shadow-glow text-white"
                      : "glass-card border-border text-text"
                  }`}
                >
                  <span className="text-2xl">{sound.emoji}</span>
                  <span className="text-xs font-semibold">{sound.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
