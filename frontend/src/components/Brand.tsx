import { cn } from "@/lib/utils";

/** The InterviewAI mark: a rounded "answer card" with a dialogue glyph and a gold merit spark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} role="img" aria-label="InterviewAI">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="hsl(var(--primary))" />
      {/* interviewer line */}
      <rect x="8" y="11" width="13" height="2.6" rx="1.3" fill="hsl(var(--primary-foreground))" opacity="0.95" />
      {/* candidate line (shorter) */}
      <rect x="8" y="17" width="9" height="2.6" rx="1.3" fill="hsl(var(--primary-foreground))" opacity="0.6" />
      {/* merit spark */}
      <circle cx="23" cy="21.5" r="3" fill="hsl(var(--gold))" />
    </svg>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 whitespace-nowrap", className)}>
      <BrandMark />
      <span className="font-display text-lg font-semibold tracking-tight">
        Interview<span className="text-primary">AI</span>
      </span>
    </span>
  );
}
