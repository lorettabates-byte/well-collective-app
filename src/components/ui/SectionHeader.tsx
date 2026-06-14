import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  to?: string;
}

export default function SectionHeader({ title, to }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-text">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center gap-0.5 text-xs font-medium text-brand-light">
          See all
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
