import { Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../components/layout/TopBar";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

interface Breathwork {
  title: string;
  description: string;
  script: string;
  duration: number;
}

interface StoredSession {
  id: number;
  duration_minutes: number;
  title: string;
  description: string;
}

export default function Breathwork() {
  const [todayBreathwork, setTodayBreathwork] = useState<Breathwork | null>(null);
  const [storedSessions, setStoredSessions] = useState<StoredSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<number | null>(null);

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
        if (breathworkData) setTodayBreathwork(breathworkData);
        if (sessionsData.sessions) setStoredSessions(sessionsData.sessions);
      })
      .catch((err) => console.error("Failed to load breathwork:", err))
      .finally(() => setLoading(false));
  }, []);

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
            </div>

            <div className="bg-surface rounded-card p-4">
              <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{todayBreathwork.script}</p>
            </div>

            <button className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 flex items-center justify-center gap-2 hover:opacity-90">
              <Play size={16} className="fill-white" />
              Start 5-Minute Session
            </button>
          </div>
        )}

        {/* Longer Sessions */}
        <h3 className="text-sm font-bold text-text mb-4">Longer Sessions</h3>

        {/* 10 Minute Sessions */}
        {sessionsByDuration[10].length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-text-muted mb-3">10 Minutes</p>
            <div className="flex flex-col gap-3">
              {sessionsByDuration[10].map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setPlaying(session.id);
                  }}
                  className={`glass-card rounded-card p-4 text-left transition-colors ${
                    playing === session.id ? "ring-2 ring-brand-light" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-text">{session.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{session.description}</p>
                    </div>
                    {playing === session.id ? (
                      <div className="text-brand-light ml-2 animate-pulse">▶</div>
                    ) : (
                      <Play size={16} className="text-text-dim ml-2 flex-shrink-0" />
                    )}
                  </div>
                </button>
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
                <button
                  key={session.id}
                  onClick={() => {
                    setPlaying(session.id);
                  }}
                  className={`glass-card rounded-card p-4 text-left transition-colors ${
                    playing === session.id ? "ring-2 ring-brand-light" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-text">{session.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{session.description}</p>
                    </div>
                    {playing === session.id ? (
                      <div className="text-brand-light ml-2 animate-pulse">▶</div>
                    ) : (
                      <Play size={16} className="text-text-dim ml-2 flex-shrink-0" />
                    )}
                  </div>
                </button>
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
                <button
                  key={session.id}
                  onClick={() => {
                    setPlaying(session.id);
                  }}
                  className={`glass-card rounded-card p-4 text-left transition-colors ${
                    playing === session.id ? "ring-2 ring-brand-light" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-text">{session.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{session.description}</p>
                    </div>
                    {playing === session.id ? (
                      <div className="text-brand-light ml-2 animate-pulse">▶</div>
                    ) : (
                      <Play size={16} className="text-text-dim ml-2 flex-shrink-0" />
                    )}
                  </div>
                </button>
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
