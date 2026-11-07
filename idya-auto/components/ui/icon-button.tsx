import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "glass" | "solid" | "ghost";
  size?: "md" | "lg";
}

/** 44 px minimum tap target (brief §20). Always labelled. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "glass", size = "md", className, children, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-label={label}
      title={label}
      className={cn(
        "press inline-flex items-center justify-center rounded-pill text-text [&_svg]:size-5",
        size === "md" ? "size-tap" : "size-btn-lg",
        variant === "glass" && "glass-1 hover:bg-white/10",
        variant === "solid" && "bg-surface border border-line hover:bg-surface-hover",
        variant === "ghost" && "hover:bg-white/8",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
