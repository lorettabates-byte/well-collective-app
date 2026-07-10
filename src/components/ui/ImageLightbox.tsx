import { Download, X } from "lucide-react";
import { useEffect } from "react";

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `well-photo-${Date.now()}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleSave}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
          title="Save image"
        >
          <Download size={18} />
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt="Full size"
        className="max-w-full max-h-full object-contain"
        style={{ maxHeight: "90vh", maxWidth: "95vw" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
