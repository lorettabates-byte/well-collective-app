import type { MemberDirectoryEntry } from "../../store/AppContext";

interface Member extends MemberDirectoryEntry {
  id: string;
}

interface MentionAutocompleteProps {
  query: string;
  members: Member[];
  onSelect: (username: string) => void;
  // top/left = textarea's getBoundingClientRect() values
  position: { top: number; left: number } | null;
}

export default function MentionAutocomplete({ query, members, onSelect, position }: MentionAutocompleteProps) {
  if (!position) return null;

  const filtered = query.length === 0
    ? members.slice(0, 8)
    : members
        .filter((m) => (m.username || m.name || "").toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);

  if (filtered.length === 0) return null;

  // Position ABOVE the textarea — bottom anchor so it never goes off-screen
  // even when the keyboard is open. Clamp left so it doesn't overflow viewport.
  const bottomOffset = window.innerHeight - position.top + 8;
  const leftOffset = Math.min(position.left, window.innerWidth - 260);

  return (
    <div
      className="fixed z-[1000] bg-surface border border-border rounded-card shadow-lg overflow-hidden"
      style={{ bottom: bottomOffset, left: leftOffset, width: 250 }}
    >
      {filtered.map((member) => {
        const displayName = member.username || member.name || "User";
        return (
          <button
            key={member.id}
            onMouseDown={(e) => {
              // Prevent textarea blur before the click registers
              e.preventDefault();
              onSelect(displayName);
            }}
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
  );
}
