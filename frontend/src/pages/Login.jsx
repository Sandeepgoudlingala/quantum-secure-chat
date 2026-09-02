import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  Cpu,
  Fingerprint
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LatticeBackground } from '../components/ui/LatticeBackground';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setError('');
    setSubmitting(true);
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg || JSON.stringify(item)).join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else if (err.message && (err.message.includes('Network Error') || !err.response)) {
        setError('Cannot reach authentication server. If backend was asleep, please retry in 10-15 seconds.');
      } else {
        setError(err.response?.data?.message || err.message || 'Authentication failed. Check credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 relative overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-900 dark:selection:text-cyan-100 transition-colors duration-200">
      <LatticeBackground />

      {/* Floating Minimal Theme Switcher */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="absolute top-6 right-6 z-20 p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.8} /> : <Moon className="w-4 h-4 text-zinc-700" strokeWidth={1.8} />}
      </button>

      {/* Main SaaS Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/20 dark:bg-white/[0.03] backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-7 md:p-8 shadow-2xl relative">
          {/* Header Brand Emblem */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" strokeWidth={2.2} />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/30 dark:bg-white/[0.05] border border-white/40 dark:border-white/10 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 mb-1 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>ML-KEM-768 • FIPS 203 Active</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Sign in to Quantum
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Post-quantum end-to-end encrypted communication terminal.
            </p>
          </div>

          {/* Awwwards-style Sliding Tab Switcher */}
          <div className="p-1 rounded-xl bg-white/20 dark:bg-white/[0.04] border border-white/30 dark:border-white/10 grid grid-cols-2 gap-1 text-xs font-medium relative mb-5 backdrop-blur-md">
            <div className="relative py-1.5 text-center text-zinc-900 dark:text-white font-semibold select-none">
              <motion.div
                layoutId="authTabIndicator"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
                className="absolute inset-0 rounded-lg bg-white/50 dark:bg-white/[0.1] border border-white/60 dark:border-white/20 shadow-xs backdrop-blur-md"
              />
              <span className="relative z-10">Sign In</span>
            </div>
            <Link
              to="/register"
              className="relative py-1.5 text-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white select-none transition-colors"
            >
              Create Account
            </Link>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase font-semibold">
                Email or Username
              </label>
              <Input
                icon={User}
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                className="h-9 text-xs rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase font-semibold">
                Password
              </label>
              <Input
                icon={Lock}
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-9 text-xs rounded-lg"
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="md"
              isLoading={submitting}
              icon={ArrowRight}
              className="w-full text-xs font-semibold h-9 mt-4"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </Button>

          </form>

          <div className="text-center pt-4 border-t border-zinc-200/80 dark:border-zinc-800 mt-5">
            <p className="text-xs text-zinc-500">
              Need a fresh cryptographic identity?{' '}
              <Link to="/register" className="text-zinc-900 dark:text-white hover:underline font-medium">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Lapa Ninja / Land-book Value Strip */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            ML-KEM-768
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            AES-256-GCM
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5" />
            SHA-256 Digest
          </span>
        </div>
      </motion.div>
    </div>
  );
}
