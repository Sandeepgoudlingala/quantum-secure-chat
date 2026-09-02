import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef(({
  className,
  type = "text",
  icon: Icon,
  endIcon: EndIcon,
  error,
  mono = false,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-2xl border border-slate-200/90 dark:border-white/[0.18] bg-white/90 dark:bg-white/[0.08] px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400",
          "focus-visible:outline-none focus-visible:border-cyan-500 dark:focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/25",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-xl shadow-xs dark:shadow-inner",
          Icon && "pl-10",
          EndIcon && "pr-10",
          mono && "font-mono text-xs tracking-tight",
          error && "border-rose-500/80 focus-visible:border-rose-500 focus-visible:ring-rose-500/30",
          className
        )}
        {...props}
      />
      {EndIcon && (
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
          {EndIcon}
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";
