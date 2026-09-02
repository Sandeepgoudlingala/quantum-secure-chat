import React from "react";
import { cn } from "../../lib/utils";

export function Badge({
  className,
  variant = "default",
  pulse = false,
  dot = false,
  children,
  ...props
}) {
  const variantStyles = {
    default: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/40 shadow-xs",
    quantum: "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-teal-500/20 dark:text-cyan-200 dark:border-cyan-400/50 shadow-xs font-semibold",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/40 shadow-xs",
    warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/40 shadow-xs",
    danger: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/40 shadow-xs",
    outline: "bg-slate-100/80 text-slate-700 border-slate-200 dark:bg-white/[0.08] dark:text-slate-200 dark:border-white/[0.18] shadow-xs",
    secondary: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:border-white/[0.14]",
    violet: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/40 shadow-xs",
  };

  const dotColors = {
    default: "bg-cyan-500 dark:bg-cyan-400",
    quantum: "bg-cyan-500 dark:bg-cyan-400",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-rose-500 dark:bg-rose-400",
    outline: "bg-slate-500 dark:bg-slate-300",
    secondary: "bg-slate-500 dark:bg-slate-300",
    violet: "bg-violet-500 dark:bg-violet-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border tracking-wide select-none backdrop-blur-xl",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColors[variant])} />
          )}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
}
