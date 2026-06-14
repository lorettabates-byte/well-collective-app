import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { CommunityEvent } from "../../types";
import { formatDateLong } from "../../utils/format";

const COLOR_OPTIONS = ["#01519D", "#0191CE", "#84D8FD"];

type EventFormValues = Pick<CommunityEvent, "title" | "description" | "date" | "time" | "location" | "color">;

interface EventFormProps {
  initial?: EventFormValues;
  onSubmit: (values: EventFormValues) => void;
  onCancel?: () => void;
  submitLabel: string;
}

function EventForm({ initial, onSubmit, onCancel, submitLabel }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time.trim() || !location.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), date, time: time.trim(), location: location.trim(), color });
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
  const { events, addEvent, updateEvent, deleteEvent, setFeaturedEvent } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <TopBar title="Events" subtitle="Manage the community calendar" showBack />
      <div className="px-4 pt-4">
        {showCreate ? (
          <EventForm
            submitLabel="Create Event"
            onCancel={() => setShowCreate(false)}
            onSubmit={(values) => {
              addEvent(values);
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

        <div className="flex flex-col gap-3">
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-text">{event.title}</h3>
                    {event.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-wide gradient-brand text-white rounded-pill px-2 py-0.5">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{formatDateLong(event.date)} · {event.time}</p>
                  <p className="text-[11px] text-text-dim mt-0.5">{event.rsvps.length} RSVPs</p>
                </div>
                <button
                  onClick={() => setFeaturedEvent(event.featured ? null : event.id)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border border-border shrink-0 ${
                    event.featured ? "gradient-brand text-white" : "bg-surface-2 text-text-muted"
                  }`}
                  aria-label={event.featured ? "Remove highlight" : "Highlight event"}
                >
                  <Star size={14} className={event.featured ? "fill-white" : ""} />
                </button>
                <button
                  onClick={() => setEditingId(event.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0"
                  aria-label="Edit event"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-red-400"
                  aria-label="Delete event"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
