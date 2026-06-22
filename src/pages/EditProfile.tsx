import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { AVATAR_OPTIONS } from "../data/avatarOptions";
import { useApp } from "../store/AppContext";

export default function EditProfile() {
  const { user, updateProfile } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [birthday, setBirthday] = useState(user.birthday ?? "");
  const [showBirthdayOnCalendar, setShowBirthdayOnCalendar] = useState(user.showBirthdayOnCalendar ?? false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const img = new Image();
      img.onload = () => {
        const size = 300;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setAvatar(reader.result as string);
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const sw = size / scale;
        const sh = size / scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        setAvatar(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
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
      showBirthdayOnCalendar: birthday ? showBirthdayOnCalendar : false,
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

          {birthday && (
            <label className="flex items-center gap-2.5 mt-3 glass-card rounded-card px-3.5 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showBirthdayOnCalendar}
                onChange={(e) => setShowBirthdayOnCalendar(e.target.checked)}
                className="w-4 h-4 accent-brand-blue"
              />
              <span className="text-xs text-text-muted">
                Show my birthday 🎂 on the Events calendar
              </span>
            </label>
          )}
        </div>

        <button type="submit" className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow">
          Save Changes
        </button>
      </form>
    </div>
  );
}
