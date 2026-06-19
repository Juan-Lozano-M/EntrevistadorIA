import { scoreBand } from "@/lib/dimensions";

const bandStroke: Record<string, string> = {
  low: "stroke-destructive", mid: "stroke-gold", high: "stroke-green-500",
};
const bandText: Record<string, string> = {
  low: "text-destructive", mid: "text-gold", high: "text-green-600 dark:text-green-400",
};

export function ScoreRing({ value, label }: { value: number; label: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  const band = scoreBand(value);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative grid place-items-center">
        <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90">
          <circle cx="54" cy="54" r={radius} className="fill-none stroke-secondary" strokeWidth="9" />
          <circle
            cx="54" cy="54" r={radius}
            className={`fill-none ${bandStroke[band]} transition-[stroke-dashoffset] duration-700 ease-out`}
            strokeWidth="9" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          />
        </svg>
        <span className={`absolute font-display text-3xl font-bold tabular ${bandText[band]}`}>{clamped}</span>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
