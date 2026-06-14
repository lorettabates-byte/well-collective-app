import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import TopBar from "../../components/layout/TopBar";
import { useApp } from "../../store/AppContext";
import type { ForumCategory } from "../../types";

const COLOR_OPTIONS = ["#01519D", "#0191CE", "#84D8FD"];

interface CategoryFormProps {
  initial?: Pick<ForumCategory, "name" | "description" | "icon" | "color">;
  onSubmit: (values: Pick<ForumCategory, "name" | "description" | "icon" | "color">) => void;
  onCancel?: () => void;
  submitLabel: string;
}

function CategoryForm({ initial, onSubmit, onCancel, submitLabel }: CategoryFormProps) {
  const [icon, setIcon] = useState(initial?.icon ?? "✨");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    onSubmit({ icon: icon.trim() || "✨", name: name.trim(), description: description.trim(), color });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-card p-4 flex flex-col gap-3 mb-4">
      <div className="flex gap-3">
        <div className="w-16">
          <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Icon</label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-center text-lg text-text focus:outline-none focus:border-brand-blue"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-card px-3 py-2.5 text-sm text-text focus:outline-none focus:border-brand-blue"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-text-muted mb-1.5">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

export default function AdminCategories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <TopBar title="Categories" subtitle="Manage forum categories" showBack />
      <div className="px-4 pt-4">
        {showCreate ? (
          <CategoryForm
            submitLabel="Create Category"
            onCancel={() => setShowCreate(false)}
            onSubmit={(values) => {
              addCategory(values);
              setShowCreate(false);
            }}
          />
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 gradient-brand text-white text-sm font-semibold rounded-pill py-2.5 mb-4 shadow-glow"
          >
            <Plus size={16} />
            New Category
          </button>
        )}

        <div className="flex flex-col gap-3">
          {categories.map((category) =>
            editingId === category.id ? (
              <CategoryForm
                key={category.id}
                initial={category}
                submitLabel="Save Changes"
                onCancel={() => setEditingId(null)}
                onSubmit={(values) => {
                  updateCategory(category.id, values);
                  setEditingId(null);
                }}
              />
            ) : (
              <div key={category.id} className="flex items-center gap-3 glass-card rounded-card p-4">
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-2xl text-xl shrink-0"
                  style={{ backgroundColor: `${category.color}22` }}
                >
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-text">{category.name}</h3>
                  <p className="text-xs text-text-muted line-clamp-1">{category.description}</p>
                </div>
                <button
                  onClick={() => setEditingId(category.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0"
                  aria-label="Edit category"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border shrink-0 text-red-400"
                  aria-label="Delete category"
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
