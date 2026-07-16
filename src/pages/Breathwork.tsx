import { CheckCircle2, Lock, Pause, Play, RotateCcw, RotateCw, Square, Volume2, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import StreakCelebrationModal from "../components/StreakCelebrationModal";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { computeStreak, getStreakMilestone } from "../utils/streaks";
import { getTrialStatus, isActiveMember } from "../utils/trial";
import { formatSeconds, todayISO } from "../utils/format";
import { logActivity, unlogActivity } from "../utils/wellCup";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

// Background music sits under the voice — low enough that guidance is always
// clearly on top, high enough to stay present during the quiet stretches.
const MUSIC_VOLUME = 0.22;
// Seconds over which the music fades to silence at the end of a track.
const FADE_SECONDS = 12;

interface Breathwork {
  title: string;
  description: string;
  script: string;
  duration: number;
  audioUrl?: string;
  backgroundSound?: string;
  backgroundSoundUrl?: string;
}

interface StoredSession {
  id: number;
  duration_minutes: number;
  title: string;
  description: string;
  audio_url: string;
}

const BACKGROUND_SOUNDS = [
  { day: 0, name: "Soothing Tones", url: "https://WELLCOLLECTIVESOUNDTRACK.b-cdn.net/Peaceful%20Sounds/mp3/main%20track.mp3" },
  { day: 1, name: "Dreamers", url: "https://WELLCOLLECTIVESOUNDTRACK.b-cdn.net/Peaceful%20Sounds/Dreamers%20(MP3).mp3" },
  { day: 2, name: "Peaceful Singing Bowls", url: "https://WELLCOLLECTIVESOUNDTRACK.b-cdn.net/Peaceful%20Sounds/Singing%20Bowl%20Meditation.mp3" },
  { day: 3, name: "Meditation", url: "https://WELLCOLLECTIVESOUNDTRACK.b-cdn.net/Peaceful%20Sounds/Meditation.mp3" },
  { day: 4, name: "Sleep Tones", url: "https://WELLCOLLECTIVESOUNDTRACK.b-cdn.net/Peaceful%20Sounds/Soothing%20Sleep%20Music.wav" },
  { day: 5, name: "Forest Breeze", url: "https://WELLCOLLECTIVESOUNDTRACK.b-cdn.net/Peaceful%20Sounds/LDj_Audio_ForestLightBreezeAmbience_V1.wav" },
  { day: 6, name: "Soothing Tones", url: "https://WELLCOLLECTIVESOUNDTRACK.b-cdn.net/Peaceful%20Sounds/mp3/main%20track.mp3" },
];

// As the voice track approaches its end (which includes trailing quiet built
// in server-side), ease the music down to silence instead of cutting it off.
function fadedMusicVolume(currentTime: number, duration: number): number {
  if (!duration) return MUSIC_VOLUME;
  const remaining = duration - currentTime;
  return MUSIC_VOLUME * Math.min(1, Math.max(0, remaining / FADE_SECONDS));
}

export default function Breathwork() {
  const { user, logBreathworkCompletion, unlogBreathworkCompletion } = useApp();
  const navigate = useNavigate();
  const trialStatus = getTrialStatus(user.trialEndsAt);
  const isTrialUser = trialStatus.isActive && !isActiveMember() && !user.isAdmin;

  const today = todayISO();
  const breathworkLog = user.breathworkLog ?? [];
  const completedToday = breathworkLog.includes(today);
  const [celebration, setCelebration] = useState<number | null>(null);

  const handleComplete = () => {
    if (completedToday) return;
    const milestone = getStreakMilestone(computeStreak([...breathworkLog, today]));
    if (milestone) setCelebration(milestone);
    logBreathworkCompletion();
    confetti({ particleCount: 100, spread: 70 });
  };

  const handleUnmark = () => {
    if (!completedToday) return;
    unlogBreathworkCompletion();
    if (user.email) unlogActivity(user.email, "breathwork").catch(() => {});
  };

  // Award points whenever completedToday becomes true — covers new completions,
  // extended-session completions, and retroactive recovery for members who marked
  // complete before the points fix was deployed. Server caps at 1 per day so
  // this is safe to call from multiple paths.
  useEffect(() => {
    if (completedToday && user.email) {
      logActivity(user.email, "breathwork").catch(() => {});
    }
  }, [completedToday, user.email]);

  const [todayBreathwork, setTodayBreathwork] = useState<Breathwork | null>(null);
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily session player state
  const [dailyPlaying, setDailyPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dailyDuration, setDailyDuration] = useState(0);

  // Deeper Session player state
  const [playing, setPlaying] = useState<number | null>(null);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  const dailyAudioRef = useRef<HTMLAudioElement>(null);
  const dailyMusicRef = useRef<HTMLAudioElement>(null);
  const sessionAudioRef = useRef<HTMLAudioElement>(null);
  const sessionGuideRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!API_URL) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_URL}/api/breathwork/today`).then((res) => (res.ok ? res.json() : null)),
      fetch(`${API_URL}/api/breathwork/sessions`).then((res) => (res.ok ? res.json() : { sessions: [] })),
    ])
      .then(([breathworkData, sessionsData]) => {
        if (breathworkData) {
          const dayOfWeek = new Date().getDay();
          const bgSound = BACKGROUND_SOUNDS[dayOfWeek];
          setTodayBreathwork({ ...breathworkData, backgroundSound: bgSound.name, backgroundSoundUrl: breathworkData.backgroundSoundUrl || bgSound.url });
        }
        if (sessionsData.sessions) setStoredSessions(sessionsData.sessions);
      })
      .catch((err) => console.error("Failed to load breathwork:", err))
      .finally(() => setLoading(false));
  }, []);

  // ── Daily session controls ──────────────────────────────────────────────
  const handleDailyPlayPause = () => {
    if (!dailyAudioRef.current) return;
    if (dailyPlaying) {
      dailyAudioRef.current.pause();
      dailyMusicRef.current?.pause();
    } else {
      dailyAudioRef.current.play().catch((err) => console.error("Daily voice play failed:", err));
      if (dailyMusicRef.current) {
        dailyMusicRef.current.loop = true;
        dailyMusicRef.current.volume = fadedMusicVolume(dailyAudioRef.current.currentTime, dailyDuration);
        dailyMusicRef.current.play().catch((err) => console.error("Daily background music play failed:", err));
      }
    }
    setDailyPlaying(!dailyPlaying);
  };

  const dailySeekTo = (seconds: number) => {
    if (!dailyAudioRef.current) return;
    const clamped = Math.min(Math.max(seconds, 0), dailyDuration || 0);
    dailyAudioRef.current.currentTime = clamped;
    setCurrentTime(clamped);
    if (dailyMusicRef.current) dailyMusicRef.current.volume = fadedMusicVolume(clamped, dailyDuration);
  };

  const handleDailyTimeUpdate = () => {
    if (!dailyAudioRef.current) return;
    const t = dailyAudioRef.current.currentTime;
    setCurrentTime(t);
    if (dailyMusicRef.current) dailyMusicRef.current.volume = fadedMusicVolume(t, dailyDuration);
  };

  // ── Deeper Session controls ─────────────────────────────────────────────
  const playingSession = storedSessions.find((s) => s.id === playing) ?? null;

  // Runs after React has committed the new `src` for the shared session
  // audio elements, so .play() always targets the right session's audio
  // instead of racing the DOM update.
  useEffect(() => {
    if (playing == null) {
      sessionAudioRef.current?.pause();
      sessionGuideRef.current?.pause();
      setSessionPaused(false);
      setSessionTime(0);
      setSessionDuration(0);
      return;
    }
    if (sessionAudioRef.current) {
      sessionAudioRef.current.loop = true;
      sessionAudioRef.current.volume = MUSIC_VOLUME;
      sessionAudioRef.current.currentTime = 0;
      sessionAudioRef.current.play().catch((err) => console.error("Session background play failed:", err));
    }
    if (sessionGuideRef.current) {
      // The guide track is generated server-side to span the session's full
      // duration (wrap-up + trailing quiet included) — never loop it.
      sessionGuideRef.current.loop = false;
      sessionGuideRef.current.volume = 1;
      sessionGuideRef.current.currentTime = 0;
      sessionGuideRef.current.play().catch((err) => console.error("Guide audio play failed:", err));
    }
    setSessionPaused(false);
    setSessionTime(0);
  }, [playing]);

  const handleSessionButton = (sessionId: number) => {
    if (isTrialUser) return;
    if (playing !== sessionId) {
      setPlaying(sessionId);
      // Mark breathwork complete and award points when a deeper session starts.
      // logBreathworkCompletion is a no-op if already completed today;
      // logActivity is capped at 1/day server-side so no double-award risk.
      logBreathworkCompletion();
      return;
    }
    // Same session: toggle pause/resume so members don't lose their place.
    if (sessionPaused) {
      sessionGuideRef.current?.play().catch(() => {});
      sessionAudioRef.current?.play().catch(() => {});
      setSessionPaused(false);
    } else {
      sessionGuideRef.current?.pause();
      sessionAudioRef.current?.pause();
      setSessionPaused(true);
    }
  };

  const sessionSeekTo = (seconds: number) => {
    if (!sessionGuideRef.current) return;
    const clamped = Math.min(Math.max(seconds, 0), sessionDuration || 0);
    sessionGuideRef.current.currentTime = clamped;
    setSessionTime(clamped);
    if (sessionAudioRef.current) sessionAudioRef.current.volume = fadedMusicVolume(clamped, sessionDuration);
  };

  const handleSessionTimeUpdate = () => {
    if (!sessionGuideRef.current) return;
    const t = sessionGuideRef.current.currentTime;
    setSessionTime(t);
    if (sessionAudioRef.current) sessionAudioRef.current.volume = fadedMusicVolume(t, sessionDuration);
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Breathwork" subtitle="Guided breathing exercises" icon={Volume2} iconColor="#0191CE" showBack />
        <div className="px-4 pt-4 flex items-center justify-center py-16">
          <p className="text-sm text-text-muted">Loading breathwork sessions...</p>
        </div>
      </div>
    );
  }

  // Group stored sessions by duration
  const durations = [10, 15, 30] as const;

  return (
    <div>
      <TopBar title="Breathwork" subtitle="Guided breathing exercises" icon={Volume2} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4 pb-24">
        {/* Today's 5-Minute Session */}
        {todayBreathwork && (
          <div className="glass-card rounded-card p-6 mb-6 flex flex-col gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-light">Today's Session</span>
              <h2 className="text-lg font-bold text-text mt-1">{todayBreathwork.title}</h2>
              <p className="text-xs text-text-muted mt-1">{todayBreathwork.description}</p>
              {todayBreathwork.backgroundSound && (
                <p className="text-[11px] text-brand-light mt-2">🎵 Background: {todayBreathwork.backgroundSound}</p>
              )}
            </div>

            <div className="bg-surface rounded-card p-4">
              <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{todayBreathwork.script}</p>
            </div>

            {/* Audio Player */}
            <div className="bg-surface-2 rounded-card p-4 flex flex-col gap-3">
              <audio
                ref={dailyAudioRef}
                onTimeUpdate={handleDailyTimeUpdate}
                onLoadedMetadata={(e) => setDailyDuration(e.currentTarget.duration || 0)}
                onEnded={() => {
                  setDailyPlaying(false);
                  dailyMusicRef.current?.pause();
                }}
              >
                {/* ?v=4 busts the browser cache from earlier audio builds */}
                <source src={`${API_URL}/api/breathwork/audio/daily?v=4`} type="audio/mpeg" />
              </audio>
              {todayBreathwork.backgroundSoundUrl && (
                <audio ref={dailyMusicRef} src={todayBreathwork.backgroundSoundUrl} />
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDailyPlayPause}
                  className="gradient-brand text-white p-2.5 rounded-full hover:opacity-90 flex-shrink-0"
                >
                  {dailyPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white" />}
                </button>
                <button
                  onClick={() => dailySeekTo(currentTime - 15)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-text-muted shrink-0"
                  aria-label="Back 15 seconds"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => dailySeekTo(currentTime + 15)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-border text-text-muted shrink-0"
                  aria-label="Forward 15 seconds"
                >
                  <RotateCw size={14} />
                </button>
                <span className="text-xs text-text-muted flex-1 text-right">
                  {formatSeconds(currentTime)} / {dailyDuration ? formatSeconds(dailyDuration) : "–:––"}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={dailyDuration || todayBreathwork.duration * 60}
                step={1}
                value={currentTime}
                onChange={(e) => dailySeekTo(Number(e.target.value))}
                onPointerDown={(e) => e.currentTarget.focus()}
                className="w-full h-2 cursor-pointer accent-[#5ba3f5]"
                style={{
                  WebkitAppearance: "slider-horizontal",
                  WebkitTouchCallout: "none",
                  touchAction: "manipulation",
                }}
                aria-label="Seek"
              />
              <p className="text-xs text-text-muted text-center">5 minutes with {todayBreathwork.backgroundSound}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleComplete}
            disabled={completedToday}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold rounded-pill py-2 transition-colors ${
              completedToday
                ? "bg-surface-2 border border-border text-brand-light"
                : "gradient-brand text-white"
            }`}
          >
            <CheckCircle2 size={14} />
            {completedToday ? "Breathwork Completed ✓" : "Mark Complete"}
          </button>
          {completedToday && (
            <button
              onClick={handleUnmark}
              className="text-[11px] text-text-dim border border-border rounded-pill px-3 py-2 shrink-0 hover:text-text-muted transition-colors"
            >
              Undo
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5 mb-6">
          <Wind size={14} className="text-brand-light shrink-0" />
          <p className="text-[11px] text-text-muted">
            Prefer to breathe at your own pace without a spoken guide? Head over to{" "}
            <button onClick={() => navigate("/music?tab=sounds")} className="font-semibold text-brand-light underline">
              Peaceful Sounds
            </button>{" "}
            and breathe along to the ambient track on your own.
          </p>
        </div>

        {/* Shared audio elements for whichever Deeper Session is currently playing */}
        <audio
          ref={sessionAudioRef}
          src={playingSession?.audio_url || ""}
        />
        <audio
          ref={sessionGuideRef}
          src={playing ? `${API_URL}/api/breathwork/audio/session-guide/${playing}?v=4` : ""}
          onTimeUpdate={handleSessionTimeUpdate}
          onLoadedMetadata={(e) => setSessionDuration(e.currentTarget.duration || 0)}
          onEnded={() => setPlaying(null)}
        />

        {/* Deeper Sessions */}
        <h3 className="text-sm font-bold text-text mb-4">Deeper Sessions</h3>
        {isTrialUser && (
          <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5 mb-4">
            <Lock size={14} className="text-brand-light shrink-0" />
            <p className="text-xs text-text-muted">
              Deeper Sessions are available to full members — upgrade to unlock.
            </p>
          </div>
        )}

        {durations.map((mins) => {
          const sessions = storedSessions.filter((s) => s.duration_minutes === mins);
          if (sessions.length === 0) return null;
          return (
            <div key={mins} className="mb-6">
              <p className="text-xs font-semibold text-text-muted mb-3">{mins} Minutes</p>
              <div className="flex flex-col gap-3">
                {sessions.map((session) => {
                  const isActive = playing === session.id;
                  return (
                    <div key={session.id} className={`glass-card rounded-card p-4 transition-colors ${isActive ? "ring-2 ring-brand-light" : ""} ${isTrialUser ? "opacity-40" : ""}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-text">{session.title}</h4>
                          <p className="text-xs text-text-muted mt-0.5">{session.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSessionButton(session.id)}
                        disabled={isTrialUser}
                        className={`w-full flex items-center gap-2 text-xs font-semibold rounded-pill py-2 px-3 ${
                          isTrialUser ? "bg-surface-2 border border-border text-text-dim" : "text-white gradient-brand hover:opacity-90"
                        }`}
                      >
                        {isTrialUser ? (
                          <>
                            <Lock size={14} />
                            Locked
                          </>
                        ) : isActive && !sessionPaused ? (
                          <>
                            <Pause size={14} className="fill-white" />
                            Pause
                          </>
                        ) : isActive && sessionPaused ? (
                          <>
                            <Play size={14} className="fill-white" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Play size={14} className="fill-white" />
                            Play Session
                          </>
                        )}
                      </button>

                      {isActive && (
                        <div className="mt-3 flex flex-col gap-2">
                          <input
                            type="range"
                            min={0}
                            max={sessionDuration || mins * 60}
                            step={1}
                            value={sessionTime}
                            onChange={(e) => sessionSeekTo(Number(e.target.value))}
                            onPointerDown={(e) => e.currentTarget.focus()}
                            className="w-full h-2 cursor-pointer accent-[#5ba3f5]"
                            style={{
                              WebkitAppearance: "slider-horizontal",
                              WebkitTouchCallout: "none",
                              touchAction: "manipulation",
                            }}
                            aria-label="Seek"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => sessionSeekTo(sessionTime - 15)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted shrink-0"
                              aria-label="Back 15 seconds"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              onClick={() => sessionSeekTo(sessionTime + 15)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-muted shrink-0"
                              aria-label="Forward 15 seconds"
                            >
                              <RotateCw size={14} />
                            </button>
                            <span className="text-xs text-text-muted flex-1 text-right">
                              {formatSeconds(sessionTime)} / {sessionDuration ? formatSeconds(sessionDuration) : `${mins}:00`}
                            </span>
                            <button
                              onClick={() => setPlaying(null)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-text-muted bg-surface-2 border border-border rounded-pill px-2.5 py-1.5 shrink-0"
                              aria-label="End session"
                            >
                              <Square size={10} />
                              End
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {storedSessions.length === 0 && todayBreathwork && (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">Longer session options coming soon</p>
          </div>
        )}
      </div>

      {celebration && (
        <StreakCelebrationModal days={celebration} label="Breathwork" onClose={() => setCelebration(null)} />
      )}
    </div>
  );
}
