"use client";
export function AssistantOpen({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("gnm:assistant", { detail: { open: true } }))}>{children}</button>;
}
