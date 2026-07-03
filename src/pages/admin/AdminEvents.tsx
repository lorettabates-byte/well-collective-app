import { AlertTriangle, ChevronDown, ChevronUp, ImagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useEventsFeed } from "../../hooks/useEventsFeed";
import { useApp } from "../../store/AppContext";
import type { CommunityEvent } from "../../types";
import { formatDateLong } from "../../utils/format";

const COLOR_OPTIONS = ["#01519D", "#0191CE", "#84D8FD"];
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

type EventFormValues = Pick<
  CommunityEvent,
  "title" | "description" | "date" | "time" | "location" | "color" | "image" | "soldOut"
>;

interface EventFormProps {
  initial?: EventFormValues;
  onSubmit: (values: EventFormValues, recurrence?: { frequency: "weekly" }) => void;
  onCancel?: () => void;
  submitLabel: string;
  allowRecurrence?: boolean;
}

function EventForm({ initial, onSubmit, onCancel, submitLabel, allowRecurrence }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);
  const [repeatsWeekly, setRepeatsWeekly] = useState(false);
  const [image, setImage] = useState(initial?.image ?? "");
  const [imageError, setImageError] = useState("");
  const [soldOut, setSoldOut] = useState(initial?.soldOut ?? false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      setImageError("That photo is too large — please choose an image smaller than 15MB.");
      e.target.value = "";
      return;
    }
    setImageError("");

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setImage(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time.trim() || !location.trim()) return;
    onSubmit(
      {
        title: title.trim(),
        description: description.trim(),
        date,
        time: time.trim(),
        location: location.trim(),
        color,
        image,
        soldOut,
      },
      repeatsWeekly ? { frequency: "weekly" } : undefined
    );
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-4">
      <div>
        <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue resize-none"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Time</label>
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="6:00 PM - 7:00 PM"
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Image</label>
        {image ? (
          <div className="relative">
            <img src={image} alt="" className="w-full h-32 object-cover rounded-card" />
            <button
              type="button"
              onClick={() => setImage("")}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 w-full h-20 border border-dashed border-border rounded-card text-sm text-text-muted cursor-pointer hover:border-brand-blue">
            <ImagePlus size={16} />
            Upload an image
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}
        {imageError && <p className="text-[11px] text-red-400 mt-1">{imageError}</p>}
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Color</label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              className={`w-8 h-8 rounded-full ${color === option ? "ring-2 ring-offset-2 ring-offset-surface ring-white" : ""}`}
              style={{ backgroundColor: option }}
            />
          ))}
        </div>
      </div>
      {allowRecurrence && (
        <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
          <input
            type="checkbox"
            checked={repeatsWeekly}
            onChange={(e) => setRepeatsWeekly(e.target.checked)}
            className="w-4 h-4 accent-brand-blue"
          />
          Repeat weekly (e.g. every Tuesday at 9:00am) for the next 12 months
        </label>
      )}
      <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
        <input
          type="checkbox"
          checked={soldOut}
          onChange={(e) => setSoldOut(e.target.checked)}
          className="w-4 h-4 accent-red-500"
        />
        Mark as sold out
      </label>
      <div className="flex gap-2 mt-1">
        <button type="submit" className="flex-1 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 text-sm font-semibold text-text-muted border border-border rounded-pill">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function AdminEvents() {
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    setFeaturedEvent,
    featuredEventId,
    soldOutEventIds,
    toggleLiveEventSoldOut,
  } = useApp();

  const toggleSoldOut = (event: CommunityEvent) => {
    updateEvent(event.id, { ...event, soldOut: !event.soldOut });
  };
  const { events: liveEvents, loading: liveLoading } = useEventsFeed();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventsExpanded, setEventsExpanded] = useState(true);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const sortedLive = [...liveEvents].sort((a, b) => a.date.localeCompare(b.date));

  const toggleFeatured = (id: string) => {
    setFeaturedEvent(featuredEventId === id ? null : id);
  };

  return (
    <div>
      <TopBar title="Events" subtitle="Manage the community calendar" showBack />
      <div className="px-4 pt-4">
        {showCreate ? (
          <EventForm
            submitLabel="Create Event"
            allowRecurrence
            onCancel={() => setShowCreate(false)}
            onSubmit={(values, recurrence) => {
              addEvent(values, recurrence);
              setShowCreate(false);
            }}
          />
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 mb-4 shadow-glow"
          >
            <Plus size={16} />
            New Event
          </button>
        )}

        <button
          onClick={() => setEventsExpanded((v) => !v)}
          className="flex items-center justify-between w-full text-sm font-bold text-text mb-3"
        >
          <span>Current Events ({sorted.length})</span>
          {eventsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {eventsExpanded && <div className="flex flex-col gap-3">
          {sorted.map((event) =>
            editingId === event.id ? (
              <EventForm
                key={event.id}
                initial={event}
                submitLabel="Save Changes"
                onCancel={() => setEditingId(null)}
                onSubmit={(values) => {
                  updateEvent(event.id, values);
                  setEditingId(null);
                }}
              />
            ) : (
              <div key={event.id} className="flex items-center gap-3 glass-card rounded-card p-4">
                <div className="w-2 h-12 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-text">{event.title}</h3>
                    {event.id === featuredEventId && (
                      <span className="text-[10px] font-bold uppercase tracking-wide gradient-brand text-white rounded-pill px-2 py-0.5">
                        Featured
                      </span>
                    )}
                    {event.recurrenceGroupId && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-surface-2 border border-border text-text-muted rounded-pill px-2 py-0.5">
                        Recurring
                      </span>
                    )}
                    {event.soldOut && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-red-500/15 text-red-400 rounded-pill px-2 py-0.5">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{formatDateLong(event.date)} · {event.time}</p>
                  <p className="text-[11px] text-text-dim mt-0.5">{event.rsvps.length} RSVPs</p>
                </div>
                <button
                  onClick={() => toggleSoldOut(event)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border border-border shrink-0 ${
                    event.soldOut ? "bg-red-500 text-white" : "bg-surface-2 text-text-muted"
                  }`}
                  aria-label={event.soldOut ? "Mark as not sold out" : "Mark as sold out"}
                >
                  <AlertTriangle size={14} className={event.soldOut ? "fill-red-500" : ""} />
                </button>
                <button
                  onClick={() => toggleFeatured(event.id)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border border-border shrink-0 ${
                    event.id === featuredEventId ? "gradient-brand text-white" : "bg-surface-2 text-text-muted"
                  }`}
                  aria-label={event.id === featuredEventId ? "Remove highlight" : "Highlight event"}
                >
                  <Star size={14} className={event.id === featuredEventId ? "fill-white" : ""} />
                </button>
                <button
                  onClick={() => setEditingId(event.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0"
                  aria-label="Edit event"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (event.recurrenceGroupId) {
                      const deleteSeries = window.confirm(
                        "This is a recurring event. Click OK to delete the entire series, or Cancel to delete just this occurrence."
                      );
                      deleteEvent(event.id, { series: deleteSeries });
                    } else {
                      deleteEvent(event.id);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-red-400"
                  aria-label="Delete event"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          )}
        </div>}

        <h2 className="text-sm font-bold text-text mt-6 mb-3">From lorettabates.com</h2>
        <p className="text-xs text-text-muted mb-3">
          Synced live from your website's events calendar. Pick the star to highlight one as the featured event.
        </p>
        <div className="flex flex-col gap-3">
          {liveLoading && <p className="text-sm text-text-muted">Loading live events…</p>}
          {!liveLoading && sortedLive.length === 0 && (
            <p className="text-sm text-text-muted">No upcoming events found on lorettabates.com.</p>
          )}
          {sortedLive.map((event) => (
            <div key={event.id} className="flex items-center gap-3 glass-card rounded-card p-4">
              <div className="w-2 h-12 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-text">{event.title}</h3>
                  {event.id === featuredEventId && (
                    <span className="text-[10px] font-bold uppercase tracking-wide gradient-brand text-white rounded-pill px-2 py-0.5">
                      Featured
                    </span>
                  )}
                  {soldOutEventIds.includes(event.id) && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-red-500/15 text-red-400 rounded-pill px-2 py-0.5">
                      Sold Out
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{formatDateLong(event.date)} · {event.time}</p>
                <p className="text-[11px] text-text-dim mt-0.5 truncate">{event.location}</p>
              </div>
              <button
                onClick={() => toggleLiveEventSoldOut(event.id)}
                className={`w-8 h-8 flex items-center justify-center rounded-full border border-border shrink-0 ${
                  soldOutEventIds.includes(event.id) ? "bg-red-500 text-white" : "bg-surface-2 text-text-muted"
                }`}
                aria-label={soldOutEventIds.includes(event.id) ? "Mark as not sold out" : "Mark as sold out"}
              >
                <AlertTriangle size={14} className={soldOutEventIds.includes(event.id) ? "fill-red-500" : ""} />
              </button>
              <button
                onClick={() => toggleFeatured(event.id)}
                className={`w-8 h-8 flex items-center justify-center rounded-full border border-border shrink-0 ${
                  event.id === featuredEventId ? "gradient-brand text-white" : "bg-surface-2 text-text-muted"
                }`}
                aria-label={event.id === featuredEventId ? "Remove highlight" : "Highlight event"}
              >
                <Star size={14} className={event.id === featuredEventId ? "fill-white" : ""} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
