import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Buttons — brief §3.8. `primary` is the single red action per view; `light` replaces it in
 * no-red zones (financing, trade-in, calculator); `secondary` is glass-1; `ghost` is a text link.
 */
export const buttonVariants = cva(
  "press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-red text-white hover:bg-red-hover hover:red-bloom active:bg-red-pressed",
        light: "bg-text text-bg hover:bg-white",
        secondary: "glass-1 text-text hover:bg-white/10",
        ghost: "text-text hover:text-white underline-offset-4 hover:underline px-2",
        danger: "bg-surface text-danger border border-line-strong hover:bg-surface-hover",
      },
      size: {
        lg: "h-btn-lg px-7 text-[16px]",
        md: "h-btn-md px-5 text-[15px]",
        sm: "h-9 px-4 text-small",
        icon: "size-btn-md",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp ref={ref} type={asChild ? undefined : (type ?? "button")} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
});
