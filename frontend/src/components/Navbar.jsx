import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { Button } from './ui/Button';
import ActionSearchBar from './kokonutui/ActionSearchBar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const searchActions = [
    {
      id: 'dashboard',
      label: 'Security Matrix Overview',
      description: 'Quantum hardware metrics, active peers & ciphers',
      appVariant: 'app',
      category: 'Navigation',
      badge: 'DASHBOARD',
      shortcut: 'G D',
      perform: () => navigate('/dashboard'),
    },
    {
      id: 'chat',
      label: 'Encrypted Quantum Channels',
      description: 'End-to-end ML-KEM-768 messaging rooms',
      appVariant: 'chat',
      category: 'Messaging',
      badge: 'CHAT',
      shortcut: 'G C',
      perform: () => navigate('/chat'),
    },
    {
      id: 'files',
      label: 'Cryptographic File Vault',
      description: 'Pre-upload AES-GCM-256 authenticated file storage',
      appVariant: 'vault',
      category: 'Storage',
      badge: 'VAULT',
      shortcut: 'G F',
      perform: () => navigate('/files'),
    },
    {
      id: 'audit',
      label: 'Forensic Audit Ledger',
      description: 'Immutable SHA-256 signed compliance trail',
      appVariant: 'audit',
      category: 'Compliance',
      badge: 'AUDIT',
      shortcut: 'G A',
      perform: () => navigate('/audit-logs'),
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/15 dark:bg-[#07070c]/30 backdrop-blur-xl border-b border-white/30 dark:border-white/10 px-5 py-2.5 flex items-center justify-between transition-all gap-4 shadow-xs">
      {/* Brand & Side Navigation Toggle */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={toggleCollapsed}
          title={isCollapsed ? "Expand Sidebar (⌘B)" : "Collapse Sidebar (⌘B)"}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.08] backdrop-blur-md transition-colors focus:outline-none"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>

        {/* Minimal Monogram Mark */}
        <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
        </div>

        <span className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">
          Quantum
        </span>
      </div>

      {/* Kokonut UI Action Search Bar */}
      <div className="hidden md:block w-72 lg:w-96">
        <ActionSearchBar
          actions={searchActions}
          placeholder="Search or jump to... (⌘K)"
        />
      </div>

      {/* Essential Controls & User Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Minimal Theme Switcher */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.08] backdrop-blur-md transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.8} /> : <Moon className="w-4 h-4 text-zinc-700" strokeWidth={1.8} />}
        </button>

        {/* Connection Status Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-white/[0.04] backdrop-blur-md border border-white/30 dark:border-white/10 text-xs shadow-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
          <span className="text-zinc-700 dark:text-zinc-300 text-[11px] font-mono">
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* User Identity & Logout */}
        {user && (
          <div className="flex items-center space-x-2.5 border-l border-slate-200/60 dark:border-white/10 pl-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-white/40 dark:bg-white/[0.1] text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-xs backdrop-blur-md border border-white/40 dark:border-white/10">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {user.username}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign Out"
              className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 h-7 w-7 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
