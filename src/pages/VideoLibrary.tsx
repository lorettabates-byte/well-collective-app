import { ArrowUpRight } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { VIDEO_CATEGORIES } from "../data/videoLibrary";

export default function VideoLibrary() {
  const featuredCategory = VIDEO_CATEGORIES[0];
  const otherCategories = VIDEO_CATEGORIES.slice(1);

  return (
    <div>
      <TopBar title="Classes" subtitle="WELL Collective on-demand classes" showBack />
      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Featured Trending Class */}
        {featuredCategory && (
          <a
            href={featuredCategory.url}
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-brand p-[2px] rounded-card animate-fade-in-up"
          >
            <div
              className="rounded-card p-4 flex flex-col gap-3 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${featuredCategory.color}15 0%, ${featuredCategory.color}08 100%)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-light">Trending Now</span>
                  <h2 className="text-lg font-bold text-text mt-1">{featuredCategory.title}</h2>
                  <p className="text-sm text-text-muted mt-1.5">{featuredCategory.description}</p>
                </div>
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 ml-3"
                  style={{ backgroundColor: `${featuredCategory.color}22` }}
                >
                  <featuredCategory.icon size={28} className="text-brand-light" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-brand-light text-xs font-semibold">
                Join Now <ArrowUpRight size={14} />
              </div>
            </div>
          </a>
        )}

        {/* Category Buttons */}
        <div>
          <h3 className="text-sm font-bold text-text mb-3">Browse Classes</h3>
          <div className="flex flex-col gap-2">
            {otherCategories.map(({ id, title, description, url, icon: Icon, color }) => (
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
      </div>
    </div>
  );
}
