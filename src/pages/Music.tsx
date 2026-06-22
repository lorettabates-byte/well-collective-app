import { Music as MusicIcon, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TopBar from "../components/layout/TopBar";
import type { Song } from "../types";
import { AMBIENT_SOUNDS, playAmbientSound, type AmbientSoundHandle, type AmbientSoundId } from "../utils/ambientSounds";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

type Tab = "soundtrack" | "sounds";

export default function Music() {
  const [tab, setTab] = useState<Tab>("soundtrack");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeSound, setActiveSound] = useState<AmbientSoundId | null>(null);
  const [volume, setVolume] = useState(0.6);
  const handleRef = useRef<AmbientSoundHandle | null>(null);

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
    };
  }, []);

  const togglePlay = (song: Song) => {
    if (playingId === song.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setPlayingId(null);
    }
    audioRef.current.src = song.url;
    audioRef.current.play();
    setPlayingId(song.id);
  };

  const toggleSound = (id: AmbientSoundId) => {
    if (activeSound === id) {
      handleRef.current?.stop();
      handleRef.current = null;
      setActiveSound(null);
      return;
    }
    handleRef.current?.stop();
    const handle = playAmbientSound(id);
    handle.setVolume(volume);
    handleRef.current = handle;
    setActiveSound(id);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    handleRef.current?.setVolume(v);
  };

  return (
    <div>
      <TopBar title="Music" subtitle="Soundtrack & peaceful sounds" icon={MusicIcon} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setTab("soundtrack")}
            className={`text-sm font-semibold rounded-pill py-2.5 border ${
              tab === "soundtrack" ? "gradient-brand text-white border-transparent shadow-glow" : "border-border text-text-muted"
            }`}
          >
            Soundtrack
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

        {tab === "soundtrack" && (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-text-muted mb-1">
              Motivational music curated by Loretta — the WELL Collective Soundtrack.
            </p>
            {loading ? (
              <p className="text-sm text-text-muted text-center py-8">Loading songs...</p>
            ) : songs.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">
                No songs uploaded yet — check back soon.
              </p>
            ) : (
              songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => togglePlay(song)}
                  className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5 text-left"
                >
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center shrink-0">
                    {playingId === song.id ? (
                      <Pause size={16} className="text-white" />
                    ) : (
                      <Play size={16} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{song.title}</p>
                    {song.artist && <p className="text-xs text-text-muted truncate">{song.artist}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === "sounds" && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-muted mb-1">
              Looping ambient sounds to help you relax, focus, or fall asleep.
            </p>

            {activeSound && (
              <div className="glass-card rounded-card p-3 flex items-center gap-3">
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
