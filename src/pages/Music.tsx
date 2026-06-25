import { Clock, Music as MusicIcon, Pause, Play, Volume2, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

type Tab = "playlist" | "sounds" | "breathwork";

interface Breathwork {
  title: string;
  description: string;
  script: string;
  duration: number;
  backgroundSound?: string;
}

interface StoredSession {
  id: number;
  duration_minutes: number;
  title: string;
  description: string;
  audio_url: string;
}

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

  const [tab, setTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("tab") as Tab) || "playlist";
  });
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

  const [todayBreathwork, setTodayBreathwork] = useState<Breathwork | null>(null);
  const [breathworkSessions, setBreathworkSessions] = useState<StoredSession[]>([]);
  const [breathworkLoading, setBreathworkLoading] = useState(true);
  const [playingSession, setPlayingSession] = useState<number | null>(null);
  const [dailyPlaying, setDailyPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const dailyAudioRef = useRef<HTMLAudioElement>(null);
  const sessionAudioRef = useRef<HTMLAudioElement>(null);

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

  // Load breathwork data when tab changes
  useEffect(() => {
    if (tab !== "breathwork" || !API_URL) return;

    setBreathworkLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/breathwork/today`).then((res) => (res.ok ? res.json() : null)),
      fetch(`${API_URL}/api/breathwork/sessions`).then((res) => (res.ok ? res.json() : { sessions: [] })),
    ])
      .then(([breathworkData, sessionsData]) => {
        if (breathworkData) setTodayBreathwork(breathworkData);
        if (sessionsData.sessions) setBreathworkSessions(sessionsData.sessions);
      })
      .catch((err) => console.error("Failed to load breathwork:", err))
      .finally(() => setBreathworkLoading(false));
  }, [tab]);

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

  const handleDailyPlayPause = () => {
    if (dailyAudioRef.current) {
      if (dailyPlaying) {
        dailyAudioRef.current.pause();
      } else {
        dailyAudioRef.current.play();
      }
      setDailyPlaying(!dailyPlaying);
    }
  };

  const handleSessionPlayPause = (sessionId: number) => {
    if (sessionAudioRef.current) {
      if (playingSession === sessionId) {
        sessionAudioRef.current.pause();
        setPlayingSession(null);
      } else {
        setPlayingSession(sessionId);
        sessionAudioRef.current.loop = true;
        sessionAudioRef.current.play();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
            onClick={() => setTab("breathwork")}
            className={`text-xs font-semibold rounded-pill py-2 border flex items-center justify-center gap-1 ${
              tab === "breathwork" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            <Wind size={14} />
            Breathwork
          </button>
        </div>

        {tab === "playlist" && <Playlist songs={songs} loading={loading} downloadsLocked={isTrialUser} />}

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

        {tab === "breathwork" && (
          <div className="flex flex-col gap-4 pb-6">
            {breathworkLoading ? (
              <p className="text-sm text-text-muted text-center py-8">Loading breathwork...</p>
            ) : (
              <>
                {todayBreathwork && (
                  <div className="glass-card rounded-card p-4 flex flex-col gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-light">Today's 5-Min Session</span>
                      <h3 className="text-sm font-bold text-text mt-1">{todayBreathwork.title}</h3>
                      <p className="text-xs text-text-muted mt-1">{todayBreathwork.description}</p>
                      {todayBreathwork.backgroundSound && (
                        <p className="text-[11px] text-brand-light mt-2">🎵 Background: {todayBreathwork.backgroundSound}</p>
                      )}
                    </div>

                    <div className="bg-surface rounded-card p-3">
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{todayBreathwork.script}</p>
                    </div>

                    <div className="bg-surface-2 rounded-card p-3 flex flex-col gap-2">
                      <audio
                        ref={dailyAudioRef}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        onEnded={() => setDailyPlaying(false)}
                      >
                        <source src={`${API_URL}/api/breathwork/audio/daily`} type="audio/mpeg" />
                      </audio>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDailyPlayPause}
                          className="gradient-brand text-white p-2 rounded-full hover:opacity-90 flex-shrink-0"
                        >
                          {dailyPlaying ? <Pause size={14} className="fill-white" /> : <Play size={14} className="fill-white" />}
                        </button>
                        <div className="flex-1">
                          <div className="h-1 bg-surface rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-brand transition-all"
                              style={{ width: `${(currentTime / (todayBreathwork.duration * 60)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-text-muted w-7 text-right">{formatTime(currentTime)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {breathworkSessions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-text mb-3">Deeper Sessions</h4>
                    <div className="flex flex-col gap-2">
                      {breathworkSessions.map((session) => (
                        <div key={session.id} className={`glass-card rounded-card p-3 ${playingSession === session.id ? "ring-2 ring-brand-light" : ""}`}>
                          <div className="mb-2">
                            <h5 className="text-xs font-semibold text-text">{session.title}</h5>
                            <p className="text-[11px] text-text-muted mt-0.5">{session.description}</p>
                          </div>
                          <audio
                            ref={playingSession === session.id ? sessionAudioRef : undefined}
                            onEnded={() => setPlayingSession(null)}
                            src={session.audio_url}
                          />
                          <button
                            onClick={() => handleSessionPlayPause(session.id)}
                            className="w-full flex items-center gap-1.5 text-xs font-semibold text-white gradient-brand rounded-pill py-2 px-2 hover:opacity-90"
                          >
                            {playingSession === session.id ? (
                              <>
                                <Pause size={12} className="fill-white" />
                                Playing
                              </>
                            ) : (
                              <>
                                <Play size={12} className="fill-white" />
                                Play {session.duration_minutes}m
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
