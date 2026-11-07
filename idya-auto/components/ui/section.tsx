import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SectionProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  children?: ReactNode;
  className?: string;
  raised?: boolean;
  id?: string;
  action?: ReactNode;
  headingLevel?: "h1" | "h2";
}

/** Standard section rhythm — brief §3.5: clamp(96px, 14vw, 200px) vertical padding, one idea per section. */
export function Section({ eyebrow, title, intro, children, className, raised, id, action, headingLevel = "h2" }: SectionProps) {
  const Heading = headingLevel;
  return (
    <section id={id} className={cn("section-y", raised && "bg-bg-raised", className)}>
      <div className="container-content">
        {(eyebrow || title) && (
          <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[720px]">
              {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
              {title ? <Heading className={headingLevel === "h1" ? "text-h1" : "text-h2"}>{title}</Heading> : null}
              {intro ? <p className="mt-4 text-body-lg text-text-2">{intro}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
