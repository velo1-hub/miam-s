"use client";

import { AlertCircle } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/*
 * Form fields — brief §3.8. Height 52, radius 14, surface background, floating label,
 * focus border --text (forms are a no-red zone), error 14 px danger + icon linked by aria-describedby.
 */

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

const shell =
  "no-red peer w-full rounded-input border bg-surface px-4 text-body text-text placeholder:text-transparent outline-none transition-colors focus:border-text disabled:opacity-50";
const labelClass =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-3 transition-all peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-caption peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-caption";

function Messages({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-small text-danger">
        <AlertCircle className="size-4" strokeWidth={1.5} aria-hidden />
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-small text-text-3">
        {hint}
      </p>
    );
  return null;
}

export const TextField = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { label, error, hint, className, id: idProp, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(shell, "h-input pt-4", error && "border-danger")}
          {...props}
        />
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      </div>
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { label, error, hint, className, id: idProp, rows = 4, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(shell, "resize-y pt-6 pb-3 leading-snug", error && "border-danger")}
          {...props}
        />
        <label htmlFor={id} className={cn(labelClass, "top-6")}>
          {label}
        </label>
      </div>
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
});

export const SelectField = forwardRef<HTMLSelectElement, BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }>(
  function SelectField({ label, error, hint, className, id: idProp, children, ...props }, ref) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <div className={cn("w-full", className)}>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(shell, "h-input appearance-none pt-4 pr-10", error && "border-danger")}
            {...props}
          >
            {children}
          </select>
          <label htmlFor={id} className="pointer-events-none absolute left-4 top-2.5 text-caption text-text-3">
            {label}
          </label>
          <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-3">
            <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <Messages id={id} error={error} hint={hint} />
      </div>
    );
  },
);

export const CheckboxField = forwardRef<HTMLInputElement, { label: ReactNode; error?: string; className?: string } & InputHTMLAttributes<HTMLInputElement>>(
  function CheckboxField({ label, error, className, id: idProp, ...props }, ref) {
    const auto = useId();
    const id = idProp ?? auto;
    return (
      <div className={cn("w-full", className)}>
        <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-small text-text-2">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="no-red mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-[6px] border border-line-strong bg-surface checked:border-text checked:bg-text checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22><path d=%22M5 10.5l3.5 3.5L15 7%22 fill=%22none%22 stroke=%22%2308080a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-center bg-no-repeat"
            {...props}
          />
          <span>{label}</span>
        </label>
        <Messages id={id} error={error} />
      </div>
    );
  },
);
