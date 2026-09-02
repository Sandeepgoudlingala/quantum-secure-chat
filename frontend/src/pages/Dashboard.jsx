import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCrypto } from '../context/CryptoContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  KeyIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon
} from '../components/ui/Icons';
import {
  Cpu,
  Lock,
  Fingerprint,
  MessageSquare,
  FolderLock,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { AppIcon } from '../components/ui/AppIcon';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const { keys, generateAndBindKeys } = useCrypto();
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsersList(res.data);
      } catch (err) {
        console.error('Failed to load users directory:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await generateAndBindKeys();
    } catch (err) {
      console.error('Failed to re-key identity:', err);
    } finally {
      setTimeout(() => setRegenerating(false), 500);
    }
  };

  const handleCopyPublicKey = () => {
    if (keys.publicKey) {
      navigator.clipboard.writeText(keys.publicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Sleek Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Welcome back, {user?.username}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ML-KEM-768 Post-Quantum Session Active</span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          isLoading={regenerating}
          icon={KeyIcon}
          className="rounded-lg text-xs"
        >
          Re-Key Identity
        </Button>
      </div>

      {/* Mobbin UX + Godly Telemetry Ribbon */}
      <div className="p-3.5 rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-md border border-white/30 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-500 shadow-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Handshake Latency: <strong className="text-zinc-800 dark:text-zinc-200">&lt; 12ms</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Post-Quantum Security: <strong className="text-zinc-800 dark:text-zinc-200">192-bit (NIST Level 3)</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span>Active Peers: <strong className="text-zinc-800 dark:text-zinc-200">{usersList.length} Online</strong></span>
        </div>
      </div>

      {/* 3 Clean Minimal Stat Cards with Awwwards Spring Hover */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ML-KEM Card */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card hover className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                KEM Algorithm
              </span>
              <AppIcon variant="app" icon={Cpu} size="sm" glow={false} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-mono tracking-tight">ML-KEM-768</h3>
              <span className="inline-block mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-medium">NIST Level 3 Security</span>
            </div>
          </Card>
        </motion.div>

        {/* Symmetric Cipher Card */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card hover className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                Cipher
              </span>
              <AppIcon variant="crypto" icon={Lock} size="sm" glow={false} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-mono tracking-tight">AES-256-GCM</h3>
              <span className="inline-block mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-medium">Authenticated Encryption</span>
            </div>
          </Card>
        </motion.div>

        {/* Public Key Card */}
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <Card hover className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                Public Key
              </span>
              <AppIcon variant="crypto" icon={Fingerprint} size="sm" glow={false} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate bg-white/30 dark:bg-black/25 px-3 py-1.5 rounded-xl border border-white/30 dark:border-white/10 flex-1 backdrop-blur-md">
                {keys.publicKey ? `${keys.publicKey.substring(0, 22)}...` : 'Generating...'}
              </p>
              <button
                onClick={handleCopyPublicKey}
                title="Copy Key"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors backdrop-blur-md"
              >
                {copiedKey ? <CheckIcon className="w-4 h-4 text-emerald-600" /> : <CopyIcon className="w-4 h-4" />}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Directory & Quick Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Peers */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/10">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Active Peers
            </h3>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-medium">
              {usersList.length} Connected
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {loadingUsers ? (
              <p className="text-xs text-zinc-400 font-mono py-4 text-center">Loading peers...</p>
            ) : usersList.length === 0 ? (
              <p className="text-xs text-zinc-400 font-mono py-4 text-center">No other peers online.</p>
            ) : (
              usersList.map((peer) => (
                <div
                  key={peer.id}
                  className="p-3 rounded-xl bg-white/20 dark:bg-white/[0.025] border border-white/30 dark:border-white/[0.06] hover:border-cyan-500/40 dark:hover:border-cyan-400/30 hover:bg-white/30 dark:hover:bg-white/[0.05] backdrop-blur-md transition-all flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white/40 dark:bg-white/[0.08] flex items-center justify-center font-bold text-zinc-800 dark:text-zinc-100 text-xs shadow-xs border border-white/40 dark:border-white/10">
                      {peer.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                        {peer.username}
                      </h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                        {peer.public_key ? 'ML-KEM Ready' : 'Key Pending'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/chat?recipient=${peer.id}`}
                    className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/[0.08] hover:bg-cyan-500 hover:text-white dark:hover:bg-cyan-500 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all border border-white/40 dark:border-white/10 shadow-xs"
                  >
                    <span>Chat</span>
                    <ArrowUpRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Shortcuts */}
        <Card className="p-6 space-y-4">
          <div className="pb-3 border-b border-slate-200/50 dark:border-white/10">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Shortcuts
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/chat"
              className="p-3.5 rounded-xl bg-white/20 dark:bg-white/[0.025] border border-white/30 dark:border-white/[0.06] hover:border-cyan-500/40 dark:hover:border-cyan-400/30 hover:bg-white/30 dark:hover:bg-white/[0.05] backdrop-blur-md transition-all space-y-2 group shadow-xs"
            >
              <AppIcon variant="chat" icon={MessageSquare} size="sm" glow={false} />
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white text-xs flex items-center gap-1">
                  <span>Encrypted Chat</span>
                  <ArrowRightIcon className="w-3 h-3 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Quantum messaging.
                </p>
              </div>
            </Link>

            <Link
              to="/files"
              className="p-3.5 rounded-xl bg-white/20 dark:bg-white/[0.025] border border-white/30 dark:border-white/[0.06] hover:border-emerald-500/40 dark:hover:border-emerald-400/30 hover:bg-white/30 dark:hover:bg-white/[0.05] backdrop-blur-md transition-all space-y-2 group shadow-xs"
            >
              <AppIcon variant="vault" icon={FolderLock} size="sm" glow={false} />
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white text-xs flex items-center gap-1">
                  <span>File Vault</span>
                  <ArrowRightIcon className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Encrypted storage.
                </p>
              </div>
            </Link>

            <Link
              to="/audit-logs"
              className="p-3.5 rounded-xl bg-white/20 dark:bg-white/[0.025] border border-white/30 dark:border-white/[0.06] hover:border-violet-500/40 dark:hover:border-violet-400/30 hover:bg-white/30 dark:hover:bg-white/[0.05] backdrop-blur-md transition-all space-y-2 group shadow-xs"
            >
              <AppIcon variant="audit" icon={Activity} size="sm" glow={false} />
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white text-xs flex items-center gap-1">
                  <span>Security Logs</span>
                  <ArrowRightIcon className="w-3 h-3 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Audit events & trail.
                </p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
