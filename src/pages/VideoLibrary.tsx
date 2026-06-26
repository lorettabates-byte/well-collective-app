import { ArrowUpRight, Lock, Play } from "lucide-react";
import { useEffect, useState } from "react";
import TopBar from "../components/layout/TopBar";
import { VIDEO_CATEGORIES } from "../data/videoLibrary";
import { useApp } from "../store/AppContext";
import { getTrialStatus, isActiveMember } from "../utils/trial";

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

const FEATURED_VIDEO_DEFAULTS = {
  title: "Video Library",
  description: "Browse all WELL Collective classes, workshops, and livestreams curated by Loretta",
  image: "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2025/04/WELL-2048-x-2048-px.png",
  url: "https://lorettabates.com/videolibrary.lorettabates.com/",
};

export default function VideoLibrary() {
  const { user, logClassCompletion } = useApp();
  const trialStatus = getTrialStatus(user.trialEndsAt);
  const isTrialUser = trialStatus.isActive && !isActiveMember() && !user.isAdmin;

  const [livestreamCoverUrl, setLivestreamCoverUrl] = useState<string | null>(null);
  const [lockedMessage, setLockedMessage] = useState(false);
  const otherCategories = VIDEO_CATEGORIES;

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/settings/livestream-cover`)
      .then((res) => (res.ok ? res.json() : { url: null }))
      .then((data) => setLivestreamCoverUrl(data.url || null))
      .catch(() => {});
  }, []);

  const FEATURED_VIDEO = {
    ...FEATURED_VIDEO_DEFAULTS,
    image: livestreamCoverUrl || FEATURED_VIDEO_DEFAULTS.image,
  };

  return (
    <div>
      <TopBar title="Classes" subtitle="WELL Collective on-demand classes" icon={Play} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Featured Video Library */}
        <a
          href={FEATURED_VIDEO.url}
          target="_blank"
          rel="noopener noreferrer"
          className="gradient-brand p-[2px] rounded-card animate-fade-in-up overflow-hidden"
        >
          <div
            className="rounded-card flex flex-col gap-0 relative overflow-hidden bg-surface h-64"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{
                backgroundImage: `url(${FEATURED_VIDEO.image})`,
              }}
            />

            {/* Content Overlay */}
            <div className="relative z-10 p-4 h-full flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-brand-light">Featured</span>
                <h2 className="text-xl font-bold text-white mt-2">{FEATURED_VIDEO.title}</h2>
              </div>

              <div className="flex items-end justify-between">
                <p className="text-sm text-gray-200 max-w-xs">{FEATURED_VIDEO.description}</p>
                <div className="flex items-center justify-center w-12 h-12 rounded-full gradient-brand shrink-0">
                  <Play size={20} className="text-white fill-white" />
                </div>
              </div>
            </div>
          </div>
        </a>

        {/* Category Buttons */}
        <div>
          <h3 className="text-sm font-bold text-text mb-3">Browse Classes</h3>

          {lockedMessage && (
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-card px-3 py-2.5 mb-2">
              <Lock size={14} className="text-brand-light shrink-0" />
              <p className="text-xs text-text-muted">
                This class is available to full members — upgrade to unlock.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {otherCategories.map(({ id, title, description, url, image, icon: Icon, color, trialLocked }) => {
              const locked = isTrialUser && trialLocked;
              if (locked) {
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setLockedMessage(true);
                      setTimeout(() => setLockedMessage(false), 3000);
                    }}
                    className="flex items-center gap-3 glass-card rounded-card p-4 animate-fade-in-up opacity-50 text-left"
                  >
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 overflow-hidden bg-surface-2 border border-border">
                      {image ? (
                        <img src={image} alt="" className="w-full h-full object-cover grayscale" />
                      ) : (
                        <Icon size={22} className="text-text-dim" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-text">{title}</h3>
                      <p className="text-xs text-text-muted line-clamp-2">{description}</p>
                    </div>
                    <Lock size={16} className="text-text-dim shrink-0" />
                  </button>
                );
              }
              return (
                <a
                  key={id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => logClassCompletion()}
                  className="flex items-center gap-3 glass-card rounded-card p-4 animate-fade-in-up"
                >
                  <div
                    className="relative flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 overflow-hidden"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={22} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text">{title}</h3>
                    <p className="text-xs text-text-muted line-clamp-2">{description}</p>
                  </div>
                  <ArrowUpRight size={18} className="text-text-dim shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
