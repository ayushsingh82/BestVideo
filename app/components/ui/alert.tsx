"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const variantClasses: Record<string, string> = {
  default: "bg-neutral-100 text-neutral-900",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function alertVariants({ variant = "default" }: { variant?: "default" | "success" | "destructive" }) {
  return cn(
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
    variantClasses[variant] ?? variantClasses.default
  );
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "destructive";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("font-medium leading-none", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

export { Alert, AlertTitle };
