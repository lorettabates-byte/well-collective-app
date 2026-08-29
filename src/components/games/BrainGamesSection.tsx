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
  const [challengeResult, setChallengeResult] = useState<{
    gameId: string;
    gameName: string;
    myScore: number;
    theirScore: number;
    opponentName: string;
    youWon: boolean;
    tie: boolean;
    awardedPoints: boolean;
  } | null>(null);
  const [challengePointsWin, setChallengePointsWin] = useState<string | null>(null);
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
    const isRespondingToChallenge = activeChallenge?.gameId === gameId && activeChallenge?.direction === "incoming";
    // Allow score submission for a challenge response even if already played today
    if (!isRespondingToChallenge && (existingSet.has(gameId) || celebratedRef.current.has(gameId))) return;
    const isFirstToday = !isRespondingToChallenge && existingSet.size === 0;
    if (!isRespondingToChallenge) {
      celebratedRef.current.add(gameId);
      const newSet = new Set(existingSet).add(gameId);
      setDoneTodaySet(newSet);
      localStorage.setItem(`brain-game-done-${todayKey}`, [...newSet].join(","));
    }

    const g = GAMES.find(x => x.id === gameId);

    if (!isRespondingToChallenge) {
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 }, colors: [g?.color ?? "#84D8FD", "#84D8FD", "#FFFFFF", "#34d399"] });
      if (isFirstToday) {
        setWinningGame(gameId);
        setTimeout(() => setWinningGame(null), 2200);
      }
      if (user.email) {
        await logActivity(user.email, "brain_game", { game: gameId }).catch(() => {});
      }
    }

    // If this was played in response to an incoming challenge, submit score automatically
    if (isRespondingToChallenge && activeChallenge && activeChallenge.gameId === gameId && activeChallenge.direction === "incoming") {
      if (API_URL && user.email && score != null) {
        const respondRes = await fetch(`${API_URL}/api/game-challenges/${activeChallenge.id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, score }),
        }).catch(() => null);

        const respondData = respondRes?.ok ? await respondRes.json().catch(() => null) : null;
        const awardedPoints: boolean = respondData?.opponentPointsAwarded ?? false;
        const theirScore: number = respondData?.challengerScore ?? activeChallenge.challengerScore;
        const winnerEmail: string | null = respondData?.winnerEmail ?? null;
        const youWon = winnerEmail === user.email;
        const tie = winnerEmail === null;
        const g = GAMES.find(x => x.id === gameId);

        // Always fire confetti for a challenge completion
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 }, colors: [g?.color ?? "#84D8FD", "#84D8FD", "#FFFFFF", "#34d399"] });

        // Show +25 pts float if points were awarded (first challenge of day)
        if (awardedPoints) {
          setChallengePointsWin(gameId);
          setTimeout(() => setChallengePointsWin(null), 2200);
        }

        setChallengeResult({
          gameId,
          gameName: g?.title ?? gameId,
          myScore: score,
          theirScore,
          opponentName: activeChallenge.challengerName,
          youWon,
          tie,
          awardedPoints,
        });

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
            <Users size={10} className="text-brand-light" /> Tribe invites waiting for you
          </p>
          {incoming.map(c => {
            const game = GAMES.find(g => g.id === c.gameId);
            const isActive = activeChallenge?.id === c.id;
            return (
              <div
                key={c.id}
                className="rounded-xl border"
                style={{ borderColor: isActive ? (game?.color ?? "#0191CE") + "60" : "rgba(255,255,255,0.1)", background: isActive ? `${game?.color ?? "#0191CE"}15` : "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  {c.challengerAvatar ? (
                    <img src={c.challengerAvatar} alt={c.challengerName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-text-dim">{c.challengerName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text truncate">{c.challengerName}</p>
                    <p className="text-[10px] text-text-dim">
                      invited you to play <span className="font-semibold" style={{ color: game?.color }}>{game?.title ?? c.gameId}</span>
                      {c.challengerScore > 0 && <span className="text-text-muted"> · their score: {c.challengerScore}</span>}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] font-bold px-3 py-2 rounded-full" style={{ background: `${game?.color}22`, color: game?.color }}>
                      Playing...
                    </span>
                  ) : (
                    <button
                      onClick={() => acceptChallenge(c)}
                      className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl text-white"
                      style={{ background: game?.color ?? "#0191CE", minWidth: "72px", minHeight: "36px" }}
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
            <Trophy size={10} className="text-brand-light" /> Invites sent — waiting for response
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
          // When playing in response to a challenge, always allow play even if already done today
          const playingAsChallenge = challengeForThisGame?.direction === "incoming";
          const props = { onComplete: (score?: number) => markDone(game.id, score), alreadyDone: playingAsChallenge ? false : done };

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
              {challengePointsWin === game.id && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                  style={{ animation: "brainWinFloat 2.2s ease-out forwards" }}
                >
                  <span className="text-2xl font-bold drop-shadow-lg" style={{ color: game.color, textShadow: `0 0 20px ${game.color}80` }}>
                    +25 pts
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
                        with {challengeForThisGame.direction === "incoming" ? challengeForThisGame.challengerName.split(" ")[0] : challengeForThisGame.opponentName.split(" ")[0]}
                      </span>
                    )}
                    {done && !challengeForThisGame && (
                      <span className="text-[9px] font-semibold text-emerald-400">Done</span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-dim mt-0.5">{game.tagline}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Invite button — always available */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowChallengePicker({ gameId: game.id, gameName: game.title, score: done ? 0 : 0 });
                    }}
                    className="text-[9px] font-semibold px-2 py-1 rounded-full border border-border/60 text-text-dim hover:text-brand-light hover:border-brand-light/40 transition-colors"
                  >
                    Invite
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
                          ? `Playing with ${challengeForThisGame.challengerName.split(" ")[0]}`
                          : `Playing with ${challengeForThisGame.opponentName.split(" ")[0]}`}
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
            const otherName = c.direction === "incoming" ? c.challengerName.split(" ")[0] : c.opponentName.split(" ")[0];
            const myScore = c.direction === "incoming" ? (c.opponentScore ?? "?") : c.challengerScore;
            const theirScore = c.direction === "incoming" ? c.challengerScore : (c.opponentScore ?? "?");
            return (
              <div key={c.id} className="flex items-center gap-2 py-1.5 text-[11px]">
                <span style={{ color: game?.color }} className="shrink-0 font-semibold">{game?.title}</span>
                <span className="text-text-dim truncate flex-1">with {otherName}</span>
                <span className="tabular-nums text-text-muted shrink-0 font-variant-numeric">
                  You {myScore} · {otherName} {theirScore}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Challenge result overlay */}
      {challengeResult && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div
            className="w-full max-w-md rounded-t-2xl border border-border px-6 pt-6 pb-8"
            style={{ background: "var(--color-surface)", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 2rem)" }}
          >
            <div className="flex flex-col items-center gap-1 mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-dim">Playing Together</p>
              <h3 className="text-lg font-bold text-text">{challengeResult.gameName}</h3>
            </div>

            {/* Scores */}
            <div className="flex items-center justify-center gap-6 mb-5">
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold tabular-nums text-text">{challengeResult.myScore}</span>
                <span className="text-[10px] text-text-dim font-semibold uppercase tracking-wider">You</span>
              </div>
              <span className="text-text-dim text-lg font-light">&</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold tabular-nums text-text">{challengeResult.theirScore}</span>
                <span className="text-[10px] text-text-dim font-semibold uppercase tracking-wider">{challengeResult.opponentName.split(" ")[0]}</span>
              </div>
            </div>

            {/* Points message */}
            <p className="text-center text-xs text-text-muted mb-6">
              {challengeResult.awardedPoints
                ? <><span className="text-emerald-400 font-bold">+25 pts</span> added to your WELL Cup score. You both earned points for playing together.</>
                : "You both earn points for playing together — well done!"}
            </p>

            <button
              onClick={() => setChallengeResult(null)}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white gradient-brand"
            >
              Done
            </button>
          </div>
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
