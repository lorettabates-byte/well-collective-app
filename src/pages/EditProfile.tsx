import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Avatar from "../components/ui/Avatar";
import { AVATAR_OPTIONS } from "../data/avatarOptions";
import { ALL_BADGES, resolveFeaturedBadge } from "../data/badges";
import { useApp } from "../store/AppContext";
import { logActivity } from "../utils/wellCup";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Year doesn't matter for a recurring birthday, so use a leap year as the
// reference so Feb 29 is always a selectable day.
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInMonth(month: string): number {
  if (!month) return 31;
  return DAYS_IN_MONTH[parseInt(month, 10) - 1] ?? 31;
}

export default function EditProfile() {
  const { user, updateProfile, setFeaturedBadge } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [birthday, setBirthday] = useState(user.birthday ?? "");
  const [showBirthdayOnCalendar, setShowBirthdayOnCalendar] = useState(user.showBirthdayOnCalendar ?? false);
  const [heightCm, setHeightCm] = useState(user.heightCm?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(user.weightKg?.toString() ?? "");
  const [age, setAge] = useState(user.age?.toString() ?? "");
  const [gender, setGender] = useState<"female" | "male" | "other" | "">(user.gender ?? "");

  const earnedBadgeIds = new Set(
    [user.levelBadge, ...(user.bonusBadges ?? []), ...(user.grantedBadges ?? [])].filter(Boolean) as string[]
  );
  const earnedBadges = ALL_BADGES.filter((b) => earnedBadgeIds.has(b.id));
  const currentFeaturedBadge = resolveFeaturedBadge(user);

  const [photoError, setPhotoError] = useState("");

  const [birthMonth, birthDay] = birthday ? birthday.split("-") : ["", ""];

  const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

  const handleMonthChange = (month: string) => {
    if (!month) {
      setBirthday("");
      return;
    }
    const day = birthDay && parseInt(birthDay, 10) <= daysInMonth(month) ? birthDay : "01";
    setBirthday(`${month}-${day}`);
  };

  const handleDayChange = (day: string) => {
    setBirthday(birthMonth ? `${birthMonth}-${day}` : "");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is too large — please choose an image smaller than 15MB.");
      e.target.value = "";
      return;
    }
    setPhotoError("");

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
    const hadAvatar = !!user.avatar;
    const addedAvatar = !hadAvatar && !!avatar;
    updateProfile({
      name: name.trim() || user.name,
      bio: bio.trim(),
      avatar,
      birthday: birthday || undefined,
      showBirthdayOnCalendar: birthday ? showBirthdayOnCalendar : false,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      age: age ? parseInt(age, 10) : undefined,
      gender: (gender as "female" | "male" | "other") || undefined,
    });
    if (addedAvatar && user.email) {
      logActivity(user.email, "well_activity", { reason: "profile_photo" }).catch(() => {});
    }
    navigate("/profile");
  };

  return (
    <div>
      <TopBar title="Edit Profile" showBack />
      <form onSubmit={handleSubmit} className="px-4 pt-4 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatar} alt={name} size={84} ring badgeId={currentFeaturedBadge} />
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
          {photoError && <p className="text-xs text-red-400 text-center">{photoError}</p>}
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

        {earnedBadges.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-2">Featured Badge</label>
            <p className="text-[11px] text-text-dim mb-2">
              Choose one earned badge to show on your avatar.
            </p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setFeaturedBadge(currentFeaturedBadge === badge.id ? null : badge.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold rounded-pill px-3 py-2 ${
                    currentFeaturedBadge === badge.id
                      ? "gradient-brand text-white"
                      : "bg-surface-2 border border-border text-text-muted"
                  }`}
                >
                  <span>{badge.icon}</span>
                  {badge.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-2 gap-3">
            <select
              value={birthMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text focus:outline-none focus:border-brand-blue"
            >
              <option value="">Month</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => handleDayChange(e.target.value)}
              disabled={!birthMonth}
              className="w-full bg-surface-2 border border-border rounded-card px-4 py-3 text-sm text-text focus:outline-none focus:border-brand-blue disabled:opacity-50"
            >
              <option value="">Day</option>
              {Array.from({ length: daysInMonth(birthMonth) }, (_, i) => {
                const day = String(i + 1).padStart(2, "0");
                return (
                  <option key={day} value={day}>
                    {i + 1}
                  </option>
                );
              })}
            </select>
          </div>
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

        {/* Body metrics — used for energy balance in WELL Check */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5">Body Metrics <span className="font-normal text-text-dim">(optional — for energy balance)</span></label>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-text-dim mb-1">Height (cm)</p>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 165"
                min={100}
                max={250}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <p className="text-[10px] text-text-dim mb-1">Weight (kg)</p>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 65"
                min={30}
                max={300}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <p className="text-[10px] text-text-dim mb-1">Age</p>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 32"
                min={13}
                max={120}
                className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["female", "male", "other"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(gender === g ? "" : g)}
                className={`py-2 text-xs font-semibold rounded-card border transition-colors capitalize ${
                  gender === g
                    ? "gradient-brand text-white border-transparent"
                    : "bg-surface-2 text-text-muted border-border"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-text-dim mt-1.5">Used only to estimate energy expenditure in your daily WELL Check.</p>
        </div>

        <button type="submit" className="gradient-brand text-white text-sm font-semibold rounded-pill py-3 shadow-glow">
          Save Changes
        </button>
      </form>
    </div>
  );
}
