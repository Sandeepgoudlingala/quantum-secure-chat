import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, CloseIcon, ArrowRightIcon } from '../ui/Icons';
import { AppIcon } from '../ui/AppIcon';

/**
 * Kokonut UI Action Search Bar
 * Modeled after KokonutUI Pro: https://kokonutui.pro/docs/components/action-search-bar
 * Features:
 * - Live debounced search
 * - Global keyboard trigger (Cmd+K / Ctrl+K)
 * - Arrow key navigation + Enter to execute + Escape to close
 * - Category sections with action badges
 * - Liquid Frosted Glass styling
 */
export default function ActionSearchBar({
  actions = [],
  placeholder = "Type a command or search peers... (⌘K)",
  onSelect,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter actions by query
  const filteredActions = actions.filter((action) => {
    const term = query.toLowerCase();
    return (
      action.label.toLowerCase().includes(term) ||
      (action.description && action.description.toLowerCase().includes(term)) ||
      (action.category && action.category.toLowerCase().includes(term))
    );
  });

  // Handle keyboard navigation within results
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        executeAction(filteredActions[selectedIndex]);
      }
    }
  };

  const executeAction = (action) => {
    if (onSelect) onSelect(action);
    if (action.perform) action.perform();
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Bar Input Container */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`relative flex items-center h-10 px-3.5 rounded-2xl bg-white/90 dark:bg-white/[0.07] border transition-all duration-200 cursor-text backdrop-blur-xl shadow-xs ${
          isOpen
            ? 'border-cyan-500/80 dark:border-cyan-400/80 bg-white dark:bg-white/[0.12] ring-2 ring-cyan-500/20 dark:ring-cyan-400/20 shadow-glow-cyan'
            : 'border-slate-200/90 dark:border-white/[0.14] hover:border-cyan-400/50 dark:hover:border-white/[0.25] hover:bg-white'
        }`}
      >
        <SearchIcon className="w-4 h-4 text-slate-400 shrink-0 mr-2.5 transition-colors" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
        />

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {query && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.1] transition-colors"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.1] border border-slate-200 dark:border-white/[0.18] rounded-md shadow-xs select-none">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Animated Dropdown Suggestions List (Kokonut UI style) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute left-0 right-0 top-12 z-50 rounded-3xl bg-white/95 dark:bg-[#0b0c16]/95 border border-slate-200/90 dark:border-white/[0.2] p-2 shadow-2xl backdrop-blur-3xl overflow-hidden max-h-80 overflow-y-auto text-slate-900 dark:text-white"
          >
            {filteredActions.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                No commands or peers matching "{query}"
              </div>
            ) : (
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={action.id || idx}
                      onClick={() => executeAction(action)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-white/[0.14] border border-cyan-200 dark:border-white/[0.2] shadow-sm dark:shadow-glass-card text-slate-900 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {action.appVariant ? (
                          <AppIcon variant={action.appVariant} size="xs" glow={isSelected} />
                        ) : action.icon ? (
                          <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-600 dark:text-cyan-300 shrink-0">
                            {action.icon}
                          </div>
                        ) : null}

                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {action.label}
                          </p>
                          {action.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {action.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {action.badge && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.12]">
                            {action.badge}
                          </span>
                        )}
                        {action.shortcut && (
                          <kbd className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-black/40 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.1]">
                            {action.shortcut}
                          </kbd>
                        )}
                        <ArrowRightIcon className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? 'translate-x-0.5 text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Keyboard Hint Bar */}
            <div className="pt-2 mt-2 border-t border-slate-200/80 dark:border-white/[0.08] px-2 py-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span className="text-cyan-600 dark:text-cyan-400/80">Kokonut UI Pro</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

