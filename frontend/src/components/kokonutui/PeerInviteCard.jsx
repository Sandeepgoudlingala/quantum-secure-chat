import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CopyIcon, CheckIcon, ArrowRightIcon } from '../ui/Icons';
import { AppIcon } from '../ui/AppIcon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/**
 * Kokonut UI Peer Invite & Identity Card
 * Inspired by KokonutUI Team Invitation Card: https://kokonutui.pro/docs/components/team-invite-card
 */
export default function PeerInviteCard({
  username,
  publicKey,
  onRotateKey,
  isRotating = false,
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/chat?invite=${encodeURIComponent(username || '')}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`relative rounded-3xl bg-white dark:bg-white/[0.06] border border-slate-200/90 dark:border-white/[0.18] p-6 shadow-xs dark:shadow-glass-card overflow-hidden ${className}`}
    >
      {/* Specular Top Rim */}
      <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 dark:via-cyan-400/60 to-transparent pointer-events-none" />

      {/* Ambient Glow (Dark Mode Only) */}
      <div className="hidden dark:block absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.08] relative z-10">
        <div className="flex items-center space-x-3.5">
          <AppIcon variant="app" size="md" glow interactive />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {username ? `${username}'s Quantum Identity` : 'Post-Quantum Node'}
              </h3>
              <Badge variant="quantum" dot pulse className="text-[10px]">
                FIPS 203 READY
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              Share your verified PQC endpoint or invite peers to establish an encrypted channel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRotateKey && (
            <Button
              variant="outline"
              size="sm"
              isLoading={isRotating}
              onClick={onRotateKey}
              className="text-xs font-mono"
            >
              Rotate Keypair
            </Button>
          )}
        </div>
      </div>

      <div className="pt-4 space-y-3 relative z-10">
        <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-300 uppercase font-semibold">
          Public Quantum Handshake Endpoint
        </label>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 px-3.5 rounded-2xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.14] flex items-center justify-between font-mono text-xs text-cyan-700 dark:text-cyan-200 overflow-hidden shadow-xs dark:shadow-inner backdrop-blur-md">
            <span className="truncate">
              {publicKey ? `${publicKey.substring(0, 36)}...` : 'Generating Module-Lattice Key...'}
            </span>
            <span className="text-[10px] text-slate-400 shrink-0 ml-2">1184B (ML-KEM-768)</span>
          </div>

          <Button
            variant={copied ? "quantum" : "glass"}
            size="md"
            onClick={handleCopyLink}
            icon={copied ? CheckIcon : CopyIcon}
            className="h-10 px-4 text-xs font-semibold shrink-0"
          >
            {copied ? 'Link Copied!' : 'Copy Invite'}
          </Button>
        </div>
      </div>
    </div>
  );
}

