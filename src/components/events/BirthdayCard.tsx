import { formatDateLong } from "../../utils/format";

interface BirthdayCardProps {
  name: string;
  date: string;
}

export default function BirthdayCard({ name, date }: BirthdayCardProps) {
  return (
    <div className="glass-card rounded-card p-4 flex items-center gap-3 animate-fade-in-up">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 gradient-brand text-xl">
        🎂
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-text mb-0.5">{name.split(" ")[0]}'s Birthday</h3>
        <p className="text-xs text-text-muted">{formatDateLong(date)}</p>
      </div>
    </div>
  );
}
