import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

const LOGO_URL = "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2025/04/WELL-2048-x-2048-px.png";

export default function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full bg-bg min-h-screen sm:flex sm:items-center sm:justify-center sm:py-6 landscape:py-0">
      <div
        id="mobile-shell-frame"
        className="relative w-full sm:max-w-[430px] md:max-w-[720px] h-screen sm:h-[900px] sm:max-h-[94vh] landscape:sm:max-w-full landscape:sm:max-h-full landscape:sm:h-screen landscape:sm:rounded-none sm:rounded-[36px] overflow-hidden sm:border sm:border-border landscape:sm:border-0 bg-bg sm:shadow-2xl landscape:sm:shadow-none flex flex-col"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 gradient-glow z-0" />
        <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide pb-24">{children}</div>
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}

export { LOGO_URL };
