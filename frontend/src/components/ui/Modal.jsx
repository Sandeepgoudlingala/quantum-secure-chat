import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloseIcon } from "./Icons";
import { cn } from "../../lib/utils";

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  className,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#060814]/70 backdrop-blur-md"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={cn(
              "relative w-full rounded-3xl bg-[#111427]/85 border border-white/[0.2] p-7 shadow-2xl z-10 overflow-hidden backdrop-blur-3xl text-slate-100",
              maxWidth,
              className
            )}
          >
            {/* Top Specular Line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {title && (
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-slate-300 mt-1">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
