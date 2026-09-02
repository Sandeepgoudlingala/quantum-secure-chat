import React from 'react';
import { motion } from 'framer-motion';

/**
 * High-fidelity iOS App Icon component inspired by https://recent.design/app-icons
 * Features:
 * - Precise continuous squircle curvature
 * - Dual-layer specular reflection (top rim highlight + inset bevel)
 * - Deep chromatic ambient glow matching the icon's palette
 * - Crafted vector artwork with subtle 3D depth and drop shadows
 */
import {
  ShieldCheck,
  MessageSquare,
  FolderLock,
  Activity,
  KeyRound
} from 'lucide-react';

export function AppIcon({
  variant = 'app',
  icon: CustomIcon,
  size = 'md',
  className = '',
  interactive = false,
  glow = true,
  onClick,
}) {
  const sizeMap = {
    xs: 'w-6 h-6 rounded-[7px]',
    sm: 'w-8 h-8 rounded-[9px]',
    md: 'w-10 h-10 rounded-[12px]',
    lg: 'w-12 h-12 rounded-[14px]',
    xl: 'w-16 h-16 rounded-[18px]',
    hero: 'w-20 h-20 sm:w-24 sm:h-24 rounded-[22px]',
  };

  const config = {
    app: {
      gradient: 'bg-gradient-to-tr from-cyan-500 to-teal-400',
      border: 'border-white/30 dark:border-white/20',
      glowColor: 'shadow-[0_8px_24px_-4px_rgba(6,182,212,0.35)]',
      icon: ShieldCheck,
      iconClass: 'text-white',
    },
    chat: {
      gradient: 'bg-gradient-to-tr from-blue-500 to-cyan-400',
      border: 'border-white/30 dark:border-white/20',
      glowColor: 'shadow-[0_8px_24px_-4px_rgba(14,165,233,0.35)]',
      icon: MessageSquare,
      iconClass: 'text-white',
    },
    vault: {
      gradient: 'bg-gradient-to-tr from-emerald-500 to-teal-400',
      border: 'border-white/30 dark:border-white/20',
      glowColor: 'shadow-[0_8px_24px_-4px_rgba(16,185,129,0.35)]',
      icon: FolderLock,
      iconClass: 'text-white',
    },
    audit: {
      gradient: 'bg-gradient-to-tr from-violet-500 to-purple-500',
      border: 'border-white/30 dark:border-white/20',
      glowColor: 'shadow-[0_8px_24px_-4px_rgba(139,92,246,0.35)]',
      icon: Activity,
      iconClass: 'text-white',
    },
    crypto: {
      gradient: 'bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400',
      border: 'border-white/30 dark:border-white/20',
      glowColor: 'shadow-[0_8px_24px_-4px_rgba(99,102,241,0.35)]',
      icon: KeyRound,
      iconClass: 'text-white',
    },
  };

  const item = config[variant] || config.app;
  const sizeClasses = sizeMap[size] || sizeMap.md;
  const ActiveIcon = CustomIcon || item.icon;

  const content = (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none overflow-hidden shrink-0 border ${
        item.gradient
      } ${item.border} ${sizeClasses} ${glow ? item.glowColor : ''} ${className}`}
    >
      {/* Top Specular Curved Bevel Highlight (Signature recent.design iOS effect) */}
      <span className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[inherit]" />

      {/* Inset Sub-Pixel Highlight Border */}
      <span className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20 pointer-events-none" />

      {/* Center Lucide Icon Artwork */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <ActiveIcon className={`w-[56%] h-[56%] ${item.iconClass} drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]`} strokeWidth={2.25} />
      </div>
    </div>
  );

  if (interactive) {
    return (
      <motion.div
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 24 }}
        className="cursor-pointer inline-flex"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

