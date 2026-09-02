import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn("relative flex items-center p-1 rounded-2xl bg-white/[0.08] border border-white/[0.16] backdrop-blur-xl", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors select-none",
              isActive ? "text-white" : "text-slate-300 hover:text-white"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                className="absolute inset-0 rounded-xl bg-white/[0.18] border border-white/[0.3] shadow-glass-card backdrop-blur-md"
              />
            )}
            {Icon && <Icon className="h-3.5 w-3.5 relative z-10" />}
            <span className="relative z-10">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={cn(
                "relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                isActive ? "bg-cyan-500/25 text-cyan-200 font-bold" : "bg-white/[0.1] text-slate-300"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
