import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSidebar } from '../context/SidebarContext';
import {
  LayoutDashboard,
  MessageSquare,
  FolderLock,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Cpu,
  KeyRound,
  Lock,
  Network,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Badge } from './ui/Badge';

export default function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      activeColor: 'text-cyan-600 dark:text-cyan-300',
      activeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-400/30',
    },
    {
      path: '/chat',
      label: 'Encrypted Chat',
      icon: MessageSquare,
      activeColor: 'text-cyan-600 dark:text-cyan-300',
      activeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-400/30',
    },
    {
      path: '/files',
      label: 'Vault & Files',
      icon: FolderLock,
      activeColor: 'text-emerald-600 dark:text-emerald-300',
      activeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-400/30',
    },
    {
      path: '/audit-logs',
      label: 'Security Logs',
      icon: Activity,
      activeColor: 'text-violet-600 dark:text-violet-300',
      activeBg: 'bg-violet-500/10 dark:bg-violet-500/20 border-violet-400/30',
    },
  ];

  return (
    <aside
      className={`bg-white/15 dark:bg-[#07070c]/30 backdrop-blur-xl border-r border-white/30 dark:border-white/10 p-3 flex flex-col justify-between hidden md:flex relative z-20 transition-all duration-250 ease-in-out shadow-[4px_0_24px_-2px_rgba(0,0,0,0.02)] dark:shadow-[8px_0_32px_0_rgba(0,0,0,0.3)] ${
        isCollapsed ? 'w-18' : 'w-56'
      }`}
    >
      <div className="space-y-4">
        {/* Sidebar Header with Lucide Panel Toggle */}
        <div className={`flex items-center px-2 py-1 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
              Menu
            </span>
          )}
          <button
            onClick={toggleCollapsed}
            title={isCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.08] backdrop-blur-md transition-colors focus:outline-none"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" strokeWidth={2} />
            ) : (
              <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className="relative block group"
              >
                <div
                  className={`relative flex items-center rounded-xl font-medium text-xs transition-all duration-200 select-none ${
                    isCollapsed
                      ? 'justify-center p-2'
                      : 'justify-start px-2.5 py-2'
                  } ${
                    isActive
                      ? 'text-zinc-950 dark:text-white font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/[0.06] backdrop-blur-sm'
                  }`}
                >
                  {/* Sliding active glass indicator with glow */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-white/40 dark:bg-white/[0.1] border border-white/50 dark:border-white/20 shadow-[0_4px_16px_0_rgba(6,182,212,0.12)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.3)] backdrop-blur-md"
                    />
                  )}

                  <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'}`}>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.75} />
                    </div>

                    {!isCollapsed && <span className="tracking-tight text-xs">{item.label}</span>}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Minimal Status Pill with Glassmorphism */}
      {!isCollapsed ? (
        <div className="px-3 py-2.5 rounded-xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 font-medium">ML-KEM-768</span>
          </div>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold">FIPS 203</span>
        </div>
      ) : (
        <div className="flex justify-center">
          <div
            title="ML-KEM-768 Active"
            className="w-8 h-8 rounded-xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 flex items-center justify-center cursor-pointer shadow-xs hover:border-cyan-500/40 transition-colors"
            onClick={toggleCollapsed}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={2} />
          </div>
        </div>
      )}
    </aside>
  );
}
