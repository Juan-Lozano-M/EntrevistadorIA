import { scoreBand } from "@/lib/dimensions";

const bandStroke: Record<string, string> = {
  low: "stroke-destructive", mid: "stroke-amber-500", high: "stroke-green-500",
};

export function ScoreRing({ value, label }: { value: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} className="fill-none stroke-muted" strokeWidth="8" />
        <circle cx="48" cy="48" r={radius}
          className={`fill-none ${bandStroke[scoreBand(value)]}`} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="-mt-14 text-2xl font-bold">{value}</span>
      <span className="mt-8 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
