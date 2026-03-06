"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function inputVariants(className?: string) {
  return cn(
    "flex h-10 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-500",
    "focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "transition-colors",
    className
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(inputVariants(), className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
