import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import MiniPlayer from "../music/MiniPlayer";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";

const LOGO_URL = "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2025/04/WELL-2048-x-2048-px.png";

const isAndroid = Capacitor.getPlatform() === "android";

// Measure the real status bar height from CSS env() — falls back to 56px if
// the WebView doesn't report safe-area-inset-top (common on some Android builds).
function measureStatusBarHeight(): number {
  try {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;width:1px;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
    const h = probe.getBoundingClientRect().height || 0;
    document.body.removeChild(probe);
    return h > 0 ? h : 56;
  } catch {
    return 56;
  }
}

export default function MobileShell({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const isOnline = useNetworkStatus();
  const [statusBarH, setStatusBarH] = useState(56);

  useEffect(() => {
    if (isAndroid) setStatusBarH(measureStatusBarHeight());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="w-full bg-bg min-h-screen sm:flex sm:items-center sm:justify-center sm:py-6 landscape:py-0">
      {/* Solid status-bar cap for Android — sits above everything so the
          gradient-glow can't bleed into the transparent status bar zone */}
      {isAndroid && (
        <div
          className="fixed inset-x-0 top-0 z-[999] pointer-events-none"
          style={{ height: statusBarH, background: "#050b14" }}
        />
      )}
      <div
        id="mobile-shell-frame"
        className="relative w-full sm:max-w-[430px] md:max-w-[720px] h-screen sm:h-[900px] sm:max-h-[94vh] landscape:sm:max-w-full landscape:sm:max-h-full landscape:sm:h-screen landscape:sm:rounded-none sm:rounded-[36px] overflow-hidden sm:border sm:border-border landscape:sm:border-0 bg-bg sm:shadow-2xl landscape:sm:shadow-none flex flex-col"
        style={isAndroid ? { paddingTop: statusBarH } : undefined}
      >
        <div
          className="pointer-events-none absolute inset-x-0 h-64 gradient-glow z-0"
          style={{ top: isAndroid ? statusBarH : 0 }}
        />
        {!isOnline && (
          <div className="relative z-30 flex items-center justify-center gap-2 bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2">
            <WifiOff size={13} className="text-yellow-400 shrink-0" />
            <span className="text-[11px] font-semibold text-yellow-300">You're offline — showing saved content</span>
          </div>
        )}
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: isAndroid ? "max(calc(6rem + env(safe-area-inset-bottom, 0px)), calc(6rem + 48px))" : "calc(6rem + env(safe-area-inset-bottom, 0px))" }}>{children}</div>
        <MiniPlayer />
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

export { LOGO_URL };
