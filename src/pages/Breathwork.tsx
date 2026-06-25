import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TopBar from "../components/layout/TopBar";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

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

export default function Breathwork() {
  const [todayBreathwork, setTodayBreathwork] = useState<Breathwork | null>(null);
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<number | null>(null);
  const [dailyPlaying, setDailyPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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

  const handleDailyPlayPause = () => {
    if (dailyAudioRef.current) {
      if (dailyPlaying) {
        dailyAudioRef.current.pause();
        dailyMusicRef.current?.pause();
      } else {
        dailyAudioRef.current.play();
        if (dailyMusicRef.current) {
          dailyMusicRef.current.loop = true;
          dailyMusicRef.current.volume = 0.25;
          dailyMusicRef.current.play().catch(() => {});
        }
      }
      setDailyPlaying(!dailyPlaying);
    }
  };

  const handleSessionPlayPause = (sessionId: number, _durationMinutes: number) => {
    if (sessionAudioRef.current) {
      if (playing === sessionId) {
        sessionAudioRef.current.pause();
        sessionGuideRef.current?.pause();
        setPlaying(null);
      } else {
        setPlaying(sessionId);
        // Set audio to loop so it fills the entire session duration
        sessionAudioRef.current.loop = true;
        sessionAudioRef.current.volume = 0.3;
        sessionAudioRef.current.play();
        if (sessionGuideRef.current) {
          sessionGuideRef.current.loop = true;
          sessionGuideRef.current.volume = 1;
          sessionGuideRef.current.play().catch((err) => console.error("Guide audio play failed:", err));
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
  const sessionsByDuration = {
    10: storedSessions.filter((s) => s.duration_minutes === 10),
    15: storedSessions.filter((s) => s.duration_minutes === 15),
    30: storedSessions.filter((s) => s.duration_minutes === 30),
  };

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
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => {
                  setDailyPlaying(false);
                  dailyMusicRef.current?.pause();
                }}
              >
                <source src={`${API_URL}/api/breathwork/audio/daily`} type="audio/mpeg" />
              </audio>
              {todayBreathwork.backgroundSoundUrl && (
                <audio ref={dailyMusicRef} src={todayBreathwork.backgroundSoundUrl} />
              )}
              <audio
                ref={sessionGuideRef}
                src={playing ? `${API_URL}/api/breathwork/audio/session-guide` : ""}
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDailyPlayPause}
                  className="gradient-brand text-white p-2.5 rounded-full hover:opacity-90 flex-shrink-0"
                >
                  {dailyPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white" />}
                </button>
                <div className="flex-1">
                  <div className="h-1 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-brand transition-all"
                      style={{ width: `${(currentTime / (todayBreathwork.duration * 60)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-text-muted w-8 text-right">{formatTime(currentTime)}</span>
              </div>
              <p className="text-xs text-text-muted text-center">5 minutes with {todayBreathwork.backgroundSound}</p>
            </div>
          </div>
        )}

        {/* Deeper Sessions */}
        <h3 className="text-sm font-bold text-text mb-4">Deeper Sessions</h3>

        {/* 10 Minute Sessions */}
        {sessionsByDuration[10].length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-text-muted mb-3">10 Minutes</p>
            <div className="flex flex-col gap-3">
              {sessionsByDuration[10].map((session) => (
                <div key={session.id} className={`glass-card rounded-card p-4 transition-colors ${playing === session.id ? "ring-2 ring-brand-light" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-text">{session.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{session.description}</p>
                    </div>
                  </div>
                  <audio
                    ref={playing === session.id ? sessionAudioRef : undefined}
                    onEnded={() => setPlaying(null)}
                    src={session.audio_url}
                  />
                  <button
                    onClick={() => handleSessionPlayPause(session.id, session.duration_minutes)}
                    className="w-full flex items-center gap-2 text-xs font-semibold text-white gradient-brand rounded-pill py-2 px-3 hover:opacity-90"
                  >
                    {playing === session.id ? (
                      <>
                        <Pause size={14} className="fill-white" />
                        Playing
                      </>
                    ) : (
                      <>
                        <Play size={14} className="fill-white" />
                        Play Session
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 15 Minute Sessions */}
        {sessionsByDuration[15].length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-text-muted mb-3">15 Minutes</p>
            <div className="flex flex-col gap-3">
              {sessionsByDuration[15].map((session) => (
                <div key={session.id} className={`glass-card rounded-card p-4 transition-colors ${playing === session.id ? "ring-2 ring-brand-light" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-text">{session.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{session.description}</p>
                    </div>
                  </div>
                  <audio
                    ref={playing === session.id ? sessionAudioRef : undefined}
                    onEnded={() => setPlaying(null)}
                    src={session.audio_url}
                  />
                  <button
                    onClick={() => handleSessionPlayPause(session.id, session.duration_minutes)}
                    className="w-full flex items-center gap-2 text-xs font-semibold text-white gradient-brand rounded-pill py-2 px-3 hover:opacity-90"
                  >
                    {playing === session.id ? (
                      <>
                        <Pause size={14} className="fill-white" />
                        Playing
                      </>
                    ) : (
                      <>
                        <Play size={14} className="fill-white" />
                        Play Session
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 30 Minute Sessions */}
        {sessionsByDuration[30].length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-text-muted mb-3">30 Minutes</p>
            <div className="flex flex-col gap-3">
              {sessionsByDuration[30].map((session) => (
                <div key={session.id} className={`glass-card rounded-card p-4 transition-colors ${playing === session.id ? "ring-2 ring-brand-light" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-text">{session.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{session.description}</p>
                    </div>
                  </div>
                  <audio
                    ref={playing === session.id ? sessionAudioRef : undefined}
                    onEnded={() => setPlaying(null)}
                    src={session.audio_url}
                  />
                  <button
                    onClick={() => handleSessionPlayPause(session.id, session.duration_minutes)}
                    className="w-full flex items-center gap-2 text-xs font-semibold text-white gradient-brand rounded-pill py-2 px-3 hover:opacity-90"
                  >
                    {playing === session.id ? (
                      <>
                        <Pause size={14} className="fill-white" />
                        Playing
                      </>
                    ) : (
                      <>
                        <Play size={14} className="fill-white" />
                        Play Session
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {storedSessions.length === 0 && todayBreathwork && (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">Longer session options coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
