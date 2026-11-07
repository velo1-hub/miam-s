import { ArrowRight } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/** Text link — brief §3.8: --text, arrow slides 4 px right on hover. */
export function ArrowLink({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link className={cn("group inline-flex items-center gap-1.5 font-medium text-text", className)} {...props}>
      <span>{children}</span>
      <ArrowRight className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
    </Link>
  );
}
