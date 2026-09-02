import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Kokonut UI Action Toolbar Component
 * Inspired by https://kokonutui.pro/docs/components/action-toolbar
 * Features:
 * - Multi-action pill dock with spring physics
 * - Dynamic label expansion on hover / active state
 * - Specular liquid glass styling
 */
export default function ActionToolbar({
  items = [],
  activeId,
  onChange,
  className = "",
}) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div
      className={`inline-flex items-center p-1.5 rounded-3xl bg-white/80 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/[0.18] backdrop-blur-2xl shadow-sm dark:shadow-glass-card gap-1 ${className}`}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        const isHovered = hoveredId === item.id;
        const isExpanded = isActive || isHovered;

        return (
          <motion.button
            key={item.id}
            onClick={() => {
              if (item.onClick) item.onClick();
              if (onChange) onChange(item.id);
            }}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            layout
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`relative flex items-center h-8 px-3 rounded-2xl text-xs font-semibold select-none transition-colors duration-150 ${
              isActive
                ? 'text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            } ${item.variant === 'destructive' ? 'hover:text-rose-500' : ''}`}
          >
            {/* Sliding Active Pill Background */}
            {isActive && (
              <motion.div
                layoutId="actionToolbarActive"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className={`absolute inset-0 rounded-2xl shadow-glow-cyan ${
                  item.variant === 'destructive'
                    ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-500/40'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950'
                }`}
              />
            )}

            {/* Hover Indicator if not active */}
            {!isActive && isHovered && (
              <motion.div
                layoutId="actionToolbarHover"
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="absolute inset-0 rounded-2xl bg-slate-100 dark:bg-white/[0.12] border border-slate-200 dark:border-white/[0.15]"
              />
            )}

            {/* Icon & Animated Expanding Label */}
            <div className="relative z-10 flex items-center space-x-1.5">
              {item.icon && (
                <span className={`shrink-0 ${isActive ? (item.variant === 'destructive' ? 'text-white' : 'text-slate-950') : 'text-cyan-300'}`}>
                  {item.icon}
                </span>
              )}

              <motion.span
                animate={{
                  width: isExpanded || item.alwaysShowLabel ? 'auto' : 0,
                  opacity: isExpanded || item.alwaysShowLabel ? 1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

