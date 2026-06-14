import { ArrowUpRight } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { VIDEO_CATEGORIES } from "../data/videoLibrary";

export default function VideoLibrary() {
  return (
    <div>
      <TopBar title="Video Library" subtitle="WELL Collective on-demand classes" showBack />
      <div className="px-4 pt-4 flex flex-col gap-3">
        {VIDEO_CATEGORIES.map(({ id, title, description, url, icon: Icon, color }) => (
          <a
            key={id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 glass-card rounded-card p-4 animate-fade-in-up"
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
              style={{ backgroundColor: `${color}22` }}
            >
              <Icon size={22} className="text-brand-light drop-shadow-[0_2px_6px_rgba(132,216,253,0.55)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-text">{title}</h3>
              <p className="text-xs text-text-muted line-clamp-2">{description}</p>
            </div>
            <ArrowUpRight size={18} className="text-text-dim shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
