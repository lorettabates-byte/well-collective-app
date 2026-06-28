import { Image as ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import { useApp } from "../store/AppContext";
import { compressImage, MAX_PHOTO_BYTES } from "../utils/compressImage";

export default function NewThread() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { categories, addThread } = useApp();
  const navigate = useNavigate();
  const category = categories.find((c) => c.id === categoryId);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [photoError, setPhotoError] = useState("");

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
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Message</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share what's on your mind..."
            rows={6}
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-brand-blue resize-none"
          />
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
