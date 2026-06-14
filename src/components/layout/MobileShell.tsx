import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

const LOGO_URL = "https://lorettabates.com/wp-content/uploads/2025/11/WELL-Logo-white.png";

export default function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-bg flex items-center justify-center sm:py-6">
      <div className="relative w-full sm:max-w-[430px] h-screen sm:h-[900px] sm:max-h-[94vh] sm:rounded-[36px] overflow-hidden sm:border sm:border-border bg-bg sm:shadow-2xl flex flex-col">
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
