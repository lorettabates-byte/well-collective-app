import { useEffect, useRef } from "react";
import type { MemberDirectoryEntry } from "../../store/AppContext";

interface Member extends MemberDirectoryEntry {
  id: string;
}

interface MentionAutocompleteProps {
  query: string;
  members: Member[];
  onSelect: (username: string) => void;
  position: { top: number; left: number } | null;
}

export default function MentionAutocomplete({ query, members, onSelect, position }: MentionAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (position && containerRef.current) {
      containerRef.current.style.top = `${position.top}px`;
      containerRef.current.style.left = `${position.left}px`;
    }
  }, [position]);

  if (!position) return null;

  // Filter members by query (case-insensitive) — search both username and name
  // If query is empty, show all members; otherwise filter
  const filtered = query.length === 0
    ? members.slice(0, 8)
    : members
        .filter((m) => {
          const username = (m.username || m.name || "").toLowerCase();
          return username.includes(query.toLowerCase());
        })
        .slice(0, 8);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[1000] bg-surface border border-border rounded-card shadow-lg overflow-hidden"
      style={{ maxWidth: "250px" }}
    >
      <div className="flex flex-col gap-0">
        {filtered.map((member) => {
          const displayName = member.username || member.name || "User";
          return (
            <button
              key={member.id}
              onClick={() => onSelect(displayName)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text hover:bg-surface-2 transition-colors text-left w-full border-b border-border last:border-b-0"
            >
              {member.avatar ? (
                <img src={member.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs">@{displayName}</p>
                {member.name && member.name !== displayName && (
                  <p className="text-[10px] text-text-muted truncate">{member.name}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
