import React from "react";
import { motion } from "framer-motion";
import { SpinnerIcon } from "./Icons";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "md",
  isLoading = false,
  disabled = false,
  children,
  icon: Icon,
  type = "button",
  onClick,
  ...props
}, ref) => {
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 disabled:opacity-50 disabled:pointer-events-none select-none rounded-lg tracking-tight overflow-hidden";

  const sizeStyles = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-xs gap-2",
    lg: "h-11 px-5 text-sm gap-2.5",
    icon: "h-8 w-8 p-0 text-xs justify-center",
  };

  const variantStyles = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-xs border border-transparent font-semibold",
    quantum: "bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white dark:from-cyan-400 dark:via-teal-400 dark:to-emerald-400 dark:text-zinc-950 shadow-xs border border-white/20 hover:brightness-105 font-semibold",
    aurora: "bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-500 text-white shadow-xs border border-white/20 hover:brightness-110 font-semibold",
    glass: "bg-white hover:bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-white border border-zinc-200/90 dark:border-zinc-800 shadow-xs",
    secondary: "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800",
    outline: "bg-white hover:bg-zinc-50 text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs",
    ghost: "bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/80",
    destructive: "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40",
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={!disabled && !isLoading ? { scale: 1.01, y: -0.5 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {/* Top Glass Edge Specular Reflection */}
      <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {isLoading ? (
        <>
          <SpinnerIcon className="h-4 w-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={cn("h-4 w-4 shrink-0", size === "sm" ? "h-3.5 w-3.5" : "")} />}
          {children}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = "Button";
