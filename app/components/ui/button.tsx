"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = ({
  variant = "default",
  size = "default",
}: {
  variant?: "default" | "iconButton" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-xl";
} = {}) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-md";
  const variants: Record<string, string> = {
    default: "bg-neutral-900 text-white hover:bg-neutral-800",
    iconButton: "rounded-full bg-neutral-900 text-white hover:bg-neutral-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-neutral-200 bg-transparent hover:bg-neutral-100",
    ghost: "hover:bg-neutral-100",
    link: "text-neutral-900 underline-offset-4 hover:underline",
  };
  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-base",
    icon: "h-10 w-10",
    "icon-xl": "h-12 w-12",
  };
  return cn(base, variants[variant] ?? variants.default, sizes[size] ?? sizes.default);
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "iconButton" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-xl";
  shine?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", shine, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        shine && "relative overflow-hidden after:absolute after:inset-0 after:animate-shine after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
