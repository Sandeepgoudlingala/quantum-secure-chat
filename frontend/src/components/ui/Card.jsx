import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function Card({
  className,
  children,
  hover = false,
  ...props
}) {
  const Component = hover ? motion.div : "div";
  const motionProps = hover
    ? {
        whileHover: { y: -2, transition: { duration: 0.2 } },
      }
    : {};

  return (
    <Component
      className={cn(
        "relative rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_0_rgba(0,0,0,0.3)] overflow-hidden text-slate-900 dark:text-slate-100",
        hover && "transition-all duration-300 hover:bg-white/30 dark:hover:bg-white/[0.06] hover:border-cyan-500/40 dark:hover:border-cyan-400/35 hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.12)] hover:-translate-y-0.5",
        className
      )}
      {...motionProps}
      {...props}
    >
      {/* Specular Top Glass Edge Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 dark:via-white/20 to-transparent pointer-events-none" />

      {children}
    </Component>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-base font-bold leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn("text-xs text-slate-500 dark:text-slate-300 leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center p-6 pt-0 border-t border-slate-200/80 dark:border-white/[0.08]", className)} {...props}>
      {children}
    </div>
  );
}
