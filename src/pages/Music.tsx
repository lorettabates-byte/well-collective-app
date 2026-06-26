import { Clock, Music as MusicIcon, Volume2, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Playlist from "../components/music/Playlist";
import TopBar from "../components/layout/TopBar";
import { SoundIcon } from "../data/soundIconMap";
import { useApp } from "../store/AppContext";
import type { CustomPeacefulSound, Song } from "../types";
import {
  AMBIENT_SOUNDS,
  playAmbientSound,
  playLoopingAudio,
  type AmbientSoundHandle,
} from "../utils/ambientSounds";
import { getTrialStatus, isActiveMember } from "../utils/trial";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type Tab = "playlist" | "sounds";

interface SoundTile {
  key: string;
  label: string;
  icon: string;
  play: () => AmbientSoundHandle;
}

const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: "No limit", minutes: null },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "60 min", minutes: 60 },
];

export default function Music() {
  const { user } = useApp();
  const trialStatus = getTrialStatus(user.trialEndsAt);
  const isTrialUser = trialStatus.isActive && !isActiveMember() && !user.isAdmin;

  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "sounds" ? "sounds" : "playlist";
  });
  const initialFavoritesOnly = new URLSearchParams(window.location.search).get("filter") === "favorites";
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [customSounds, setCustomSounds] = useState<CustomPeacefulSound[]>([]);
  const [hiddenSoundIds, setHiddenSoundIds] = useState<string[]>([]);

  const [activeSound, setActiveSound] = useState<string | null>(null);
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

    fetch(`${API_URL}/api/peaceful-sounds`)
      .then((res) => (res.ok ? res.json() : { sounds: [] }))
      .then((data) => setCustomSounds(data.sounds || []))
      .catch(() => setCustomSounds([]));

    fetch(`${API_URL}/api/settings/hidden-sounds`)
      .then((res) => (res.ok ? res.json() : { hidden: [] }))
      .then((data) => setHiddenSoundIds(data.hidden || []))
      .catch(() => setHiddenSoundIds([]));
  }, []);

  useEffect(() => {
    return () => {
      handleRef.current?.stop();
      clearTimer();
    };
  }, []);

  // Built-in procedurally-generated sounds (filtered by admin's hide list), plus admin-uploaded custom loops
  // — same tile grid, same volume/timer controls, regardless of which kind.
  const soundTiles: SoundTile[] = [
    ...AMBIENT_SOUNDS.filter((sound) => !hiddenSoundIds.includes(sound.id)).map((sound) => ({
      key: `builtin:${sound.id}`,
      label: sound.label,
      icon: sound.icon,
      play: () => playAmbientSound(sound.id),
    })),
    ...customSounds.map((sound) => ({
      key: `custom:${sound.id}`,
      label: sound.title,
      icon: sound.icon,
      play: () => playLoopingAudio(sound.url),
    })),
  ];

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

  const toggleSound = (tile: SoundTile) => {
    if (activeSound === tile.key) {
      handleRef.current?.stop();
      handleRef.current = null;
      setActiveSound(null);
      clearTimer();
      return;
    }
    handleRef.current?.stop();
    const handle = tile.play();
    handle.setVolume(volume);
    handleRef.current = handle;
    setActiveSound(tile.key);
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
      <TopBar title="Music" subtitle="Playlist, sounds & breathwork" icon={MusicIcon} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setTab("playlist")}
            className={`text-xs font-semibold rounded-pill py-2 border ${
              tab === "playlist" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            Playlist
          </button>
          <button
            onClick={() => setTab("sounds")}
            className={`text-xs font-semibold rounded-pill py-2 border ${
              tab === "sounds" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            Peaceful Sounds
          </button>
          <button
            onClick={() => navigate("/breathwork")}
            className="text-xs font-semibold rounded-pill py-2 border border-border text-text-muted flex items-center justify-center gap-1"
          >
            <Wind size={14} />
            Breathwork
          </button>
        </div>

        {tab === "playlist" && (
          <Playlist
            songs={songs}
            loading={loading}
            downloadsLocked={isTrialUser}
            initialFavoritesOnly={initialFavoritesOnly}
          />
        )}

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
              {soundTiles.map((tile) => {
                const isActive = activeSound === tile.key;
                return (
                  <button
                    key={tile.key}
                    onClick={() => toggleSound(tile)}
                    className={`flex flex-col items-center gap-2 rounded-card p-4 border ${
                      isActive ? "gradient-brand border-transparent shadow-glow text-white" : "glass-card border-border text-text"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center ${
                        isActive ? "bg-white/15" : "bg-surface-2 border border-border"
                      }`}
                    >
                      <SoundIcon icon={tile.icon} size={20} className={isActive ? "text-white" : "text-brand-light"} />
                    </div>
                    <span className="text-xs font-semibold">{tile.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
