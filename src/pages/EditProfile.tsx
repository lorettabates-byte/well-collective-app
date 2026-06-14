import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { useApp } from "../store/AppContext";

const AVATAR_OPTIONS = Array.from({ length: 12 }, (_, i) => `https://i.pravatar.cc/150?img=${i + 1}`);

export default function EditProfile() {
  const { user, updateProfile } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [birthday, setBirthday] = useState(user.birthday ?? "");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || user.name,
      bio: bio.trim(),
      avatar,
      birthday: birthday || undefined,
    });
    navigate("/profile");
  };

  return (
    <div>
      <TopBar title="Edit Profile" showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatar} alt={name} size={84} ring />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-light border border-brand-light/30 rounded-pill px-4 py-2"
          >
            <Upload size={14} />
            Upload Photo
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted mb-2">Or choose an avatar</label>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setAvatar(src)}
                className={`rounded-full overflow-hidden ${avatar === src ? "ring-2 ring-brand-light" : "ring-1 ring-border"}`}
              >
                <img src={src} alt="avatar option" className="w-full h-full object-cover aspect-square" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text focus:outline-none focus:border-brand-blue resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Birthday</label>
          <input
            type="date"
            value={birthday ? `2000-${birthday}` : ""}
            onChange={(e) => {
              const value = e.target.value; // yyyy-mm-dd
              setBirthday(value ? value.slice(5) : "");
            }}
            className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text focus:outline-none focus:border-brand-blue"
          />
          <p className="text-[11px] text-text-dim mt-1.5">
            We'll celebrate with you on this day every year 🎉 (year doesn't matter)
          </p>
        </div>

        <button type="submit" className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow">
          Save Changes
        </button>
      </form>
    </div>
  );
}
