import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../store/AppContext";
import type { CommunityEvent } from "../../types";
import { formatDateLong, getDayNumber } from "../../utils/format";
import { linkify } from "../../utils/linkify";
import { openMemberLink } from "../../utils/ssoLink";
import Avatar from "../ui/Avatar";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const API_URL = import.meta.env.VITE_PUSH_API_URL as string | undefined;

function monthAbbrev(dateStr: string): string {
  const month = Number(dateStr.split("-")[1]);
  return MONTHS[month - 1];
}

interface EventCardProps {
  event: CommunityEvent;
  compact?: boolean;
}

export default function EventCard({ event, compact }: EventCardProps) {
  const { user, toggleRsvp, memberBadges, soldOutEventIds } = useApp();
  const isGoing = event.rsvps.includes(user.id);
  const isLive = event.source === "live";
  const soldOut = !!event.soldOut || soldOutEventIds.includes(event.id);

  const [liveRsvps, setLiveRsvps] = useState<string[]>(event.rsvps);

  const toggleLiveGoing = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/live-events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiveRsvps(data.rsvps ?? []);
      }
    } catch (err) {
      console.error("Failed to toggle live event RSVP:", err);
    }
  };

  if (compact) {
    const compactRsvps = isLive ? liveRsvps : event.rsvps;
    return (
      <div className="relative glass-card rounded-card p-3 w-44 shrink-0 animate-fade-in-up overflow-hidden">
        {soldOut && (
          <span className="absolute top-2 right-2 z-10 text-[9px] font-bold uppercase tracking-wide bg-red-500 text-white rounded-pill px-2 py-0.5">
            Sold Out
          </span>
        )}
        {event.image && (
          <img src={event.image} alt="" className="w-full h-20 object-cover rounded-lg -mt-1 mb-2" />
        )}
        <div
          className="flex flex-col items-center justify-center w-10 h-10 rounded-xl mb-2 text-white"
          style={{ backgroundColor: event.color }}
        >
          <span className="text-[10px] font-semibold leading-none uppercase">{monthAbbrev(event.date)}</span>
          <span className="text-sm font-bold leading-none">{getDayNumber(event.date)}</span>
        </div>
        <h4 className="text-xs font-bold text-text line-clamp-2 mb-1">{event.title}</h4>
        <p className="text-[11px] text-text-dim">{event.time}</p>
        {compactRsvps.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-text-dim mt-1">
            <Users size={11} />
            <span>{compactRsvps.length}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative glass-card rounded-card p-4 animate-fade-in-up overflow-hidden">
      {event.image && (
        <div className="relative -mt-4 -mx-4 mb-3" style={{ width: "calc(100% + 2rem)" }}>
          <img src={event.image} alt="" className="w-full h-40 object-cover rounded-card" />
          {soldOut && (
            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide bg-red-500 text-white rounded-pill px-2.5 py-1 shadow">
              Sold Out
            </span>
          )}
        </div>
      )}
      {!event.image && soldOut && (
        <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wide bg-red-500/15 text-red-400 rounded-pill px-2.5 py-1">
          Sold Out
        </span>
      )}
      <div className="flex gap-3">
        <div
          className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 text-white"
          style={{ backgroundColor: event.color }}
        >
          <span className="text-[10px] font-semibold leading-none uppercase">{monthAbbrev(event.date)}</span>
          <span className="text-base font-bold leading-none">{getDayNumber(event.date)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-text mb-1">{event.title}</h3>
          <div className="flex items-center gap-1 text-xs text-text-muted mb-0.5">
            <Calendar size={13} />
            <span>{formatDateLong(event.date)} · {event.time}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin size={13} />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-text-muted leading-relaxed mt-3">{linkify(event.description)}</p>

      <div className="flex items-center justify-between mt-3">
        {isLive ? (
          <>
            <div className="flex items-center -space-x-2">
              {liveRsvps.slice(0, 4).map((rsvpId) => {
                const attendee = rsvpId === user.id ? user : memberBadges[rsvpId];
                return (
                  <Avatar
                    key={rsvpId}
                    src={attendee?.avatar || ""}
                    alt={attendee?.name || "Attendee"}
                    size={24}
                    ring
                  />
                );
              })}
              {liveRsvps.length > 0 && (
                <span className="ml-3 text-[11px] text-text-dim">
                  {liveRsvps.length} going
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLiveGoing}
                className={`text-xs font-semibold px-4 py-1.5 rounded-pill transition-colors ${
                  liveRsvps.includes(user.id) ? "bg-surface-3 text-brand-light border border-brand-light/30" : "bg-surface-2 text-text-muted border border-border"
                }`}
              >
                {liveRsvps.includes(user.id) ? "Going ✓" : "Going"}
              </button>
              <button
                type="button"
                onClick={() => event.url && openMemberLink(event.url, user.email)}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-pill gradient-brand text-white"
              >
                Info
                <ExternalLink size={12} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center -space-x-2">
              {event.rsvps.slice(0, 4).map((rsvpId) => {
                const attendee = rsvpId === user.id ? user : memberBadges[rsvpId];
                return (
                  <Avatar
                    key={rsvpId}
                    src={attendee?.avatar || ""}
                    alt={attendee?.name || "Attendee"}
                    size={24}
                    ring
                  />
                );
              })}
              {event.rsvps.length > 0 && (
                <span className="ml-3 text-[11px] text-text-dim">
                  {event.rsvps.length} going
                </span>
              )}
            </div>
            <button
              onClick={() => toggleRsvp(event.id)}
              disabled={soldOut && !isGoing}
              className={`text-xs font-semibold px-4 py-1.5 rounded-pill transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isGoing ? "bg-surface-3 text-brand-light border border-brand-light/30" : "gradient-brand text-white"
              }`}
            >
              {isGoing ? "Going ✓" : soldOut ? "Sold Out" : "Going"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
