import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import MiniPlayer from "../music/MiniPlayer";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";

const LOGO_URL = "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2025/04/WELL-2048-x-2048-px.png";

export default function MobileShell({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="w-full bg-bg min-h-screen sm:flex sm:items-center sm:justify-center sm:py-6 landscape:py-0">
      <div
        id="mobile-shell-frame"
        className="relative w-full sm:max-w-[430px] md:max-w-[720px] h-screen sm:h-[900px] sm:max-h-[94vh] landscape:sm:max-w-full landscape:sm:max-h-full landscape:sm:h-screen landscape:sm:rounded-none sm:rounded-[36px] overflow-hidden sm:border sm:border-border landscape:sm:border-0 bg-bg sm:shadow-2xl landscape:sm:shadow-none flex flex-col"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 gradient-glow z-0" />
        {!isOnline && (
          <div className="relative z-30 flex items-center justify-center gap-2 bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2">
            <WifiOff size={13} className="text-yellow-400 shrink-0" />
            <span className="text-[11px] font-semibold text-yellow-300">You're offline — showing saved content</span>
          </div>
        )}
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
        <MiniPlayer />
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

export { LOGO_URL };
