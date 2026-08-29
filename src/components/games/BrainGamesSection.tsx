import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Brain, ChevronDown, ChevronUp, Eye, Grid, Heart, LayoutGrid, Shuffle, Trophy, Users, X } from "lucide-react";
import confetti from "canvas-confetti";
import WordWell from "./WordWell";
import CalmFocus from "./CalmFocus";
import GratitudeMatch from "./GratitudeMatch";
import MindGardenPuzzle from "./MindGardenPuzzle";
import AnagramGame from "./AnagramGame";
import WordHunt from "./WordHunt";
import ChallengePickerModal from "./ChallengePickerModal";
import { logActivity } from "../../utils/wellCup";
import { useApp } from "../../store/AppContext";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const GAMES = [
  {
    id: "wordwell",
    title: "WordWell",
    tagline: "Guess the daily 5-letter wellness word",
    color: "#3b9eff", bg: "from-blue-900/40 to-indigo-900/30", border: "border-blue-700/30",
    Icon: BookOpen,
  },
  {
    id: "calmfocus",
    title: "Calm Focus",
    tagline: "Memorize the symbol sequence. Stay present.",
    color: "#f472b6", bg: "from-pink-900/30 to-purple-900/30", border: "border-pink-700/30",
    Icon: Eye,
  },
  {
    id: "gratitude",
    title: "Gratitude Match",
    tagline: "Find pairs. Reflect on each gift.",
    color: "#34d399", bg: "from-emerald-900/30 to-teal-900/30", border: "border-emerald-700/30",
    Icon: Heart,
  },
  {
    id: "mindgarden",
    title: "Mind Garden",
    tagline: "Slide tiles to complete the garden.",
    color: "#fbbf24", bg: "from-amber-900/30 to-yellow-900/30", border: "border-amber-700/30",
    Icon: LayoutGrid,
  },
  {
    id: "anagram",
    title: "Anagram",
    tagline: "Unscramble the letters. Find as many words as you can.",
    color: "#a78bfa", bg: "from-violet-900/30 to-purple-900/30", border: "border-violet-700/30",
    Icon: Shuffle,
  },
  {
    id: "wordhunt",
    title: "Word Hunt",
    tagline: "Trace a path through the grid to find hidden words.",
    color: "#fb923c", bg: "from-orange-900/30 to-red-900/30", border: "border-orange-700/30",
    Icon: Grid,
  },
];

function todayGameIdx(): number {
  const start = new Date("2024-01-01").getTime();
  const day = Math.floor((Date.now() - start) / 86400000);
  return day % GAMES.length;
}

interface GameChallenge {
  id: string;
  gameId: string;
  direction: "incoming" | "outgoing";
  challengerName: string;
  challengerAvatar?: string;
  opponentName: string;
  opponentAvatar?: string;
  challengerScore: number;
  opponentScore?: number;
  status: "pending" | "completed" | "expired";
  winnerEmail?: string;
  isWinner?: boolean;
  expiresAt: string;
}

interface Props { initialOpen?: string }

export default function BrainGamesSection({ initialOpen }: Props) {
  const { user } = useApp();
  const [searchParams] = useSearchParams();
  const todayKey = todayISO();
  const [openGame, setOpenGame] = useState<string | null>(initialOpen ?? null);
  const [doneTodaySet, setDoneTodaySet] = useState<Set<string>>(() => {
    const raw = localStorage.getItem(`brain-game-done-${todayKey}`) ?? "";
    return new Set(raw ? raw.split(",") : []);
  });
  const [winningGame, setWinningGame] = useState<string | null>(null);
  const [showChallengePicker, setShowChallengePicker] = useState<{ gameId: string; gameName: string; score: number } | null>(null);
  const [challenges, setChallenges] = useState<GameChallenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<GameChallenge | null>(null);
  const celebratedRef = useRef<Set<string>>(new Set());

  const todayIdx = todayGameIdx();

  const loadChallenges = useCallback(async () => {
    if (!user.email || !API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/game-challenges?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setChallenges((data.challenges ?? []).filter((c: GameChallenge) => c.status !== "expired"));
      }
    } catch { /* silent */ }
  }, [user.email]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  // Auto-activate challenge from notification URL (?challenge=id)
  useEffect(() => {
    const challengeId = searchParams.get("challenge");
    if (challengeId && challenges.length > 0) {
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge && challenge.direction === "incoming" && challenge.status === "pending") {
        setActiveChallenge(challenge);
        setOpenGame(challenge.gameId);
      }
    }
  }, [searchParams, challenges]);

  useEffect(() => {
    return () => { confetti.reset(); };
  }, []);

  const cancelChallenge = async (challengeId: string) => {
    if (!user.email || !API_URL) return;
    try {
      await fetch(`${API_URL}/api/game-challenges/${challengeId}?email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      await loadChallenges();
    } catch { /* silent */ }
  };

  const acceptChallenge = (challenge: GameChallenge) => {
    setActiveChallenge(challenge);
    setOpenGame(challenge.gameId);
    // Scroll to game
    setTimeout(() => {
      document.getElementById(`game-${challenge.gameId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const markDone = async (gameId: string, score?: number) => {
    const raw = localStorage.getItem(`brain-game-done-${todayKey}`) ?? "";
    const existingSet = new Set(raw ? raw.split(",") : []);
    if (existingSet.has(gameId) || celebratedRef.current.has(gameId)) return;
    celebratedRef.current.add(gameId);
    const isFirstToday = existingSet.size === 0;
    const newSet = new Set(existingSet).add(gameId);
    setDoneTodaySet(newSet);
    localStorage.setItem(`brain-game-done-${todayKey}`, [...newSet].join(","));

    const g = GAMES.find(x => x.id === gameId);
    confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 }, colors: [g?.color ?? "#84D8FD", "#84D8FD", "#FFFFFF", "#34d399"] });
    if (isFirstToday) {
      setWinningGame(gameId);
      setTimeout(() => setWinningGame(null), 2200);
    }

    if (user.email) {
      await logActivity(user.email, "brain_game", { game: gameId }).catch(() => {});
    }

    // If this was played in response to an incoming challenge, submit score automatically
    if (activeChallenge && activeChallenge.gameId === gameId && activeChallenge.direction === "incoming") {
      if (API_URL && user.email && score != null) {
        await fetch(`${API_URL}/api/game-challenges/${activeChallenge.id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, score }),
        }).catch(() => {});
        setActiveChallenge(null);
        await loadChallenges();
      }
    } else if (score != null && score > 0) {
      // Offer to challenge someone after playing solo
      const gameName = g?.title ?? gameId;
      setShowChallengePicker({ gameId, gameName, score });
    }
  };

  const incoming = challenges.filter(c => c.direction === "incoming" && c.status === "pending");
  const outgoing = challenges.filter(c => c.direction === "outgoing" && c.status === "pending");
  const recentCompleted = challenges
    .filter(c => c.status === "completed")
    .sort((a, b) => b.expiresAt.localeCompare(a.expiresAt))
    .slice(0, 5);

  return (
    <div className="glass-card rounded-card p-4 mt-4" id="brain-games">
      <div className="flex items-center gap-2 mb-1 pb-2 border-b border-border">
        <Brain size={15} className="text-brand-light shrink-0" />
        <h3 className="text-sm font-bold text-text">Brain Games</h3>
        <span className="ml-auto text-[10px] text-text-dim">+20 pts · once daily</span>
      </div>
      <p className="text-xs text-text-muted mb-3 mt-2">Daily mind challenges that sharpen focus, reduce stress, and earn WELL Cup points.</p>

      {/* ── INCOMING CHALLENGES ── */}
      {incoming.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
            <Users size={10} className="text-brand-light" /> Tribe challenges waiting for you
          </p>
          {incoming.map(c => {
            const game = GAMES.find(g => g.id === c.gameId);
            const isActive = activeChallenge?.id === c.id;
            return (
              <div
                key={c.id}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: isActive ? (game?.color ?? "#0191CE") + "60" : "rgba(255,255,255,0.1)", background: isActive ? `${game?.color ?? "#0191CE"}15` : "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {c.challengerAvatar ? (
                    <img src={c.challengerAvatar} alt={c.challengerName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-text-dim">{c.challengerName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text truncate">{c.challengerName}</p>
                    <p className="text-[10px] text-text-dim">
                      challenged you to <span className="font-semibold" style={{ color: game?.color }}>{game?.title ?? c.gameId}</span>
                      {c.challengerScore > 0 && <span className="text-text-muted"> · their score: {c.challengerScore}</span>}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: `${game?.color}22`, color: game?.color }}>
                      Playing...
                    </span>
                  ) : (
                    <button
                      onClick={() => acceptChallenge(c)}
                      className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white"
                      style={{ background: game?.color ?? "#0191CE" }}
                    >
                      Accept
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SENT CHALLENGES (pending) ── */}
      {outgoing.length > 0 && (
        <div className="mb-3 flex flex-col gap-1.5 p-3 rounded-xl border border-border/40" style={{ background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
            <Trophy size={10} className="text-brand-light" /> Challenges sent — waiting for response
          </p>
          {outgoing.map(c => {
            const game = GAMES.find(g => g.id === c.gameId);
            return (
              <div key={c.id} className="flex items-center gap-2.5 py-1.5">
                {c.opponentAvatar ? (
                  <img src={c.opponentAvatar} alt={c.opponentName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center shrink-0 text-[9px] font-bold text-text-dim">
                    {c.opponentName.charAt(0)}
                  </div>
                )}
                <span className="text-[11px] font-semibold text-text truncate flex-1">{c.opponentName}</span>
                <span className="text-[10px] text-text-muted shrink-0" style={{ color: game?.color }}>{game?.title}</span>
                <span className="text-[9px] text-text-dim shrink-0">Waiting...</span>
                <button
                  onClick={() => cancelChallenge(c.id)}
                  className="shrink-0 text-text-dim hover:text-red-400 transition-colors p-0.5"
                  title="Cancel invite"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── GAME LIST ── */}
      <div className="flex flex-col gap-2">
        {GAMES.map((game, i) => {
          const isToday = i === todayIdx;
          const isOpen = openGame === game.id;
          const done = doneTodaySet.has(game.id);
          const GameIcon = game.Icon;
          const challengeForThisGame = activeChallenge?.gameId === game.id ? activeChallenge : null;
          const props = { onComplete: (score?: number) => markDone(game.id, score), alreadyDone: done };

          return (
            <div key={game.id} id={`game-${game.id}`} className={`rounded-card border overflow-hidden ${game.border} bg-gradient-to-r ${game.bg} relative`}>
              {winningGame === game.id && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  style={{ animation: "brainWinFloat 2.2s ease-out forwards" }}
                >
                  <span className="text-2xl font-bold text-emerald-400 drop-shadow-lg" style={{ textShadow: "0 0 20px rgba(52,211,153,0.6)" }}>
                    +20 pts
                  </span>
                </div>
              )}

              <button
                onClick={() => setOpenGame(isOpen ? null : game.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left"
              >
                <GameIcon size={14} style={{ color: game.color }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-text">{game.title}</span>
                    {isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${game.color}22`, color: game.color }}>
                        Today
                      </span>
                    )}
                    {challengeForThisGame && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-light/20 text-brand-light">
                        vs {challengeForThisGame.direction === "incoming" ? challengeForThisGame.challengerName.split(" ")[0] : challengeForThisGame.opponentName.split(" ")[0]}
                      </span>
                    )}
                    {done && !challengeForThisGame && (
                      <span className="text-[9px] font-semibold text-emerald-400">Done</span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-dim mt-0.5">{game.tagline}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Challenge button — always available */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowChallengePicker({ gameId: game.id, gameName: game.title, score: done ? 0 : 0 });
                    }}
                    className="text-[9px] font-semibold px-2 py-1 rounded-full border border-border/60 text-text-dim hover:text-brand-light hover:border-brand-light/40 transition-colors"
                  >
                    Challenge
                  </button>
                  {isOpen ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/5">
                  {/* Challenge context banner — shown inside the open game */}
                  {challengeForThisGame && (
                    <div
                      className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs"
                      style={{ background: `${game.color}18`, border: `1px solid ${game.color}40` }}
                    >
                      <Users size={12} style={{ color: game.color }} className="shrink-0" />
                      <span className="font-semibold" style={{ color: game.color }}>
                        {challengeForThisGame.direction === "incoming"
                          ? `Playing vs ${challengeForThisGame.challengerName.split(" ")[0]}`
                          : `Challenged by ${challengeForThisGame.opponentName.split(" ")[0]}`}
                      </span>
                      {challengeForThisGame.challengerScore > 0 && (
                        <span className="text-text-muted ml-auto">Their score: <span className="font-bold text-text">{challengeForThisGame.challengerScore}</span></span>
                      )}
                      <button onClick={() => setActiveChallenge(null)} className="ml-2 text-text-dim hover:text-text">
                        <X size={11} />
                      </button>
                    </div>
                  )}
                  <div className="px-3 pb-4 mt-3">
                    {game.id === "wordwell"   && <WordWell {...props} />}
                    {game.id === "calmfocus"  && <CalmFocus {...props} />}
                    {game.id === "gratitude"  && <GratitudeMatch {...props} />}
                    {game.id === "mindgarden" && <MindGardenPuzzle {...props} />}
                    {game.id === "anagram"    && <AnagramGame {...props} />}
                    {game.id === "wordhunt"   && <WordHunt {...props} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── RECENT RESULTS ── */}
      {recentCompleted.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/40">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-dim mb-2 flex items-center gap-1.5">
            <Trophy size={10} /> Recent tribe results
          </p>
          {recentCompleted.map(c => {
            const game = GAMES.find(g => g.id === c.gameId);
            const youWon = c.isWinner;
            const tie = !c.winnerEmail;
            const otherName = c.direction === "incoming" ? c.challengerName.split(" ")[0] : c.opponentName.split(" ")[0];
            const myScore = c.direction === "incoming" ? (c.opponentScore ?? "?") : c.challengerScore;
            const theirScore = c.direction === "incoming" ? c.challengerScore : (c.opponentScore ?? "?");
            return (
              <div key={c.id} className="flex items-center gap-2 py-1.5 text-[11px]">
                <span style={{ color: game?.color }} className="shrink-0 font-semibold">{game?.title}</span>
                <span className="text-text-dim truncate flex-1">vs {otherName}</span>
                <span className="tabular-nums text-text-muted shrink-0 font-variant-numeric">
                  {myScore} – {theirScore}
                </span>
                <span className={`text-[10px] font-bold shrink-0 ${tie ? "text-text-muted" : youWon ? "text-emerald-400" : "text-red-400/70"}`}>
                  {tie ? "Tie" : youWon ? "You won" : `${otherName} won`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Challenge picker modal */}
      {showChallengePicker && (
        <ChallengePickerModal
          gameId={showChallengePicker.gameId}
          gameName={showChallengePicker.gameName}
          score={showChallengePicker.score}
          onClose={() => setShowChallengePicker(null)}
          onSent={loadChallenges}
        />
      )}
    </div>
  );
}
