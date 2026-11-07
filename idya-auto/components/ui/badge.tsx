import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Badges — brief §3.8: height 24, radius 999, 12/500. */
const badgeVariants = cva("inline-flex h-badge items-center rounded-pill px-2.5 text-caption font-medium leading-none", {
  variants: {
    variant: {
      newArrival: "bg-red text-white",
      certified: "bg-success/15 text-success border border-success/30",
      sold: "glass-1 text-red-text",
      new: "bg-white text-bg",
      pending: "glass-1 text-text-2",
      neutral: "glass-1 text-text",
      priceDrop: "glass-1 text-text",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ variant, className, children }: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}
