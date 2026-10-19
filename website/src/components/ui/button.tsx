"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "accent" | "ghost" | "outline";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "accent", ...props }, ref) => {
    const variants = {
      accent:
        "bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/90 active:bg-accent/80 disabled:opacity-50 disabled:pointer-events-none shadow-none",
      ghost:
        "text-foreground hover:bg-surface px-4 py-2 text-sm font-medium transition-colors active:bg-surface/50 shadow-none",
      outline:
        "border border-border text-foreground hover:bg-surface px-4 py-2 text-sm font-medium transition-colors active:bg-surface/50 shadow-none",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border-transparent",
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
