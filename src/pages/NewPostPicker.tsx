import { LayoutTemplate, PenSquare } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomCardModal from "../components/CustomCardModal";
import TopBar from "../components/layout/TopBar";
import { CategoryIcon } from "../data/iconMap";
import { useApp } from "../store/AppContext";

export default function NewPostPicker() {
  const { categories } = useApp();
  const navigate = useNavigate();
  const [showCardModal, setShowCardModal] = useState(false);

  return (
    <div>
      <TopBar title="New Post" subtitle="Choose a category" icon={PenSquare} iconColor="#0191CE" showBack />
      <div className="px-4 pt-4">
        <p className="text-xs text-text-muted mb-4">Where would you like to post?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowCardModal(true)}
            className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5 text-left w-full border border-brand-light/20"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(1,145,206,0.15)", border: "1px solid rgba(1,145,206,0.35)" }}
            >
              <LayoutTemplate size={18} className="text-brand-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">Custom Card</p>
              <p className="text-xs text-text-muted">Design a card with a title, message, icon, and animation</p>
            </div>
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/community/${category.id}/new`)}
              className="flex items-center gap-3 glass-card rounded-card px-4 py-3.5 text-left w-full"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${category.color}22`, border: `1px solid ${category.color}44` }}
              >
                <CategoryIcon icon={category.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{category.name}</p>
                <p className="text-xs text-text-muted line-clamp-1">{category.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showCardModal && <CustomCardModal onClose={() => setShowCardModal(false)} />}
    </div>
  );
}
