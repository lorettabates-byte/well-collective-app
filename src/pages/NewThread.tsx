import { Image as ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { compressImage, MAX_PHOTO_BYTES } from "../utils/compressImage";
import MentionAutocomplete from "../components/community/MentionAutocomplete";
import { getCurrentMention, replaceMention } from "../utils/mentions";

export default function NewThread() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { categories, addThread, memberBadges } = useApp();
  const navigate = useNavigate();
  const category = categories.find((c) => c.id === categoryId);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [photoError, setPhotoError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentMention, setCurrentMention] = useState<{ query: string; start: number; end: number } | null>(null);

  const allMembers = Object.entries(memberBadges).map(([id, entry]) => ({
    id,
    ...entry,
  }));

  if (!category || !categoryId) return <Navigate to="/community" replace />;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is too large — please choose an image smaller than 15MB.");
      e.target.value = "";
      return;
    }
    setPhotoError("");
    setImage(await compressImage(file, 640, 0.6));
    e.target.value = "";
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Detect mention being typed
    const cursorPos = e.target.selectionStart;
    const mention = getCurrentMention(newText, cursorPos);

    if (mention && mention.query.length >= 0) {
      setCurrentMention(mention);

      // Calculate position for autocomplete dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const lines = newText.substring(0, mention.start).split("\n");
        const lineIndex = lines.length - 1;
        const lineStart = newText.substring(0, mention.start).lastIndexOf("\n") + 1;
        const charInLine = mention.start - lineStart;

        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const top = rect.top + (lineIndex + 1) * lineHeight + 10;
        const left = rect.left + charInLine * 8;

        setMentionPosition({ top, left });
      }
    } else {
      setCurrentMention(null);
      setMentionPosition(null);
    }
  };

  const handleMentionSelect = (username: string) => {
    if (!currentMention) return;
    const newText = replaceMention(text, currentMention, username);
    setText(newText);
    setCurrentMention(null);
    setMentionPosition(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    const thread = addThread(categoryId, title.trim(), text.trim(), image);
    navigate(`/community/${categoryId}/${thread.id}`, { replace: true });
  };

  return (
    <div>
      <TopBar title="New Post" subtitle={`Posting in ${category.name}`} showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a title..."
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue"
          />
        </div>
        <div className="relative">
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Message</label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder="Share what's on your mind... (use @username to mention someone)"
            rows={6}
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
          />
          {currentMention && (
            <MentionAutocomplete
              query={currentMention.query}
              members={allMembers}
              onSelect={handleMentionSelect}
              position={mentionPosition}
            />
          )}
        </div>
        <div>
          {image ? (
            <div className="relative w-full">
              <img src={image} alt="" className="w-full max-h-56 object-cover rounded-card" />
              <button
                type="button"
                onClick={() => setImage(undefined)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 w-full bg-surface-2 border border-dashed border-border rounded-card px-4 py-3 text-sm text-text-muted cursor-pointer">
              <ImageIcon size={16} />
              Add a photo (optional)
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          )}
          {photoError && <p className="text-xs text-red-400 mt-1.5">{photoError}</p>}
        </div>
        <button
          type="submit"
          disabled={!title.trim() || !text.trim()}
          className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow disabled:opacity-50"
        >
          Post to {category.name}
        </button>
      </form>
    </div>
  );
}
