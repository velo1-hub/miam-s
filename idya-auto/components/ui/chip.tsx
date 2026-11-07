import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  active?: boolean;
  className?: string;
}

/** Filter chip — brief §3.8: height 36, radius 8, glass-1, × to remove. */
export function Chip({ children, onRemove, removeLabel, active, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-chip items-center gap-1.5 rounded-chip pl-3 text-small text-text",
        active ? "red-edge glass-1" : "glass-1",
        onRemove ? "pr-1" : "pr-3",
        className,
      )}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="press inline-flex size-7 items-center justify-center rounded-[6px] text-text-2 hover:bg-white/10 hover:text-text"
        >
          <X className="size-3.5" strokeWidth={1.5} aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
