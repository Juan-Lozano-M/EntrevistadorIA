import RLSkeleton from "react-loading-skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder rendered with the `react-loading-skeleton` shimmer.
 * Keeps the old `className` height/width API (e.g. `h-28`, `w-40`) so every
 * existing call site just works — the container takes the size classes and the
 * shimmer fills it. Colors adapt to the theme via CSS vars (see index.css).
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <RLSkeleton
      containerClassName={cn("block leading-none", className)}
      className="block! h-full!"
      height="100%"
      borderRadius="0.5rem"
    />
  );
}

export { Skeleton };
