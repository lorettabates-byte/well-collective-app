import { useEffect } from "react";
import { logEvent } from "../utils/analytics";
import { useApp } from "../store/AppContext";

export function useSectionTracking(section: string) {
  const { user } = useApp();
  useEffect(() => {
    if (user.email) logEvent(user.email, "section_visit", { section });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.email]);
}
