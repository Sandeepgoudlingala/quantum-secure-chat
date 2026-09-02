import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCrypto } from '../context/CryptoContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import {
  LogoMark,
  LockIcon,
  UnlockIcon,
  KeyIcon,
  SearchIcon,
  SendIcon,
  RefreshIcon,
  CopyIcon,
  CheckIcon,
  CheckCheckIcon,
  EyeIcon,
  EyeOffIcon,
  UsersIcon,
  ChevronLeftIcon,
  TrashIcon,
  ShareIcon,
  CloseIcon
} from '../components/ui/Icons';
import { AppIcon } from '../components/ui/AppIcon';
import ActionToolbar from '../components/kokonutui/ActionToolbar';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export default function ChatPage() {
  const { user } = useAuth();
  const {
    sessionKeys,
    inboundKeys,
    outboundKeys,
    initiatePQCKeyExchange,
    generateOutboundKey,
    saveInboundKey,
    saveOutboundKey,
    saveSessionKey,
    keys
  } = useCrypto();

  const {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    sharedKeyOffer,
    keyRequest,
    setSharedKeyOffer,
    setKeyRequest,
    sendWSMessage,
    messages: wsMessages,
    clearPeerMessages,
    markKeyAccepted,
  } = useSocket();

  const [searchParams] = useSearchParams();

  const [peers, setPeers] = useState([]);
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [isChannelsOpen, setIsChannelsOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [handshaking, setHandshaking] = useState(false);
  const [showKeyInspector, setShowKeyInspector] = useState(false);
  const [showRawCiphertext, setShowRawCiphertext] = useState(false);
  const [customInboundKey, setCustomInboundKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKeyAuthModal, setShowKeyAuthModal] = useState(false);
  const [modalKeyInput, setModalKeyInput] = useState('');
  const [decryptedMap, setDecryptedMap] = useState({});
  const [notification, setNotification] = useState('');

  const messagesEndRef = useRef(null);

  // Active Keys for current recipient
  const myOutboundKey = activeRecipient
    ? outboundKeys[activeRecipient.id] || sessionKeys[activeRecipient.id]
    : null;

  const peerInboundKey = activeRecipient
    ? inboundKeys[activeRecipient.id] || sessionKeys[activeRecipient.id] || customInboundKey.trim()
    : null;

  // Auto-apply silent key updates (peer re-shared but we already accepted once)
  useEffect(() => {
    if (!sharedKeyOffer) return;
    if (sharedKeyOffer.silent) {
      // Silently update the stored key without showing any modal
      saveInboundKey(sharedKeyOffer.sender_id, sharedKeyOffer.session_key);
      saveSessionKey(sharedKeyOffer.sender_id, sharedKeyOffer.session_key);
      if (activeRecipient?.id === sharedKeyOffer.sender_id) {
        setCustomInboundKey(sharedKeyOffer.session_key);
      }
      setSharedKeyOffer(null);
    }
  }, [sharedKeyOffer]);

  useEffect(() => {
    fetchPeers();
  }, []);

  useEffect(() => {
    if (activeRecipient) {
      fetchChatHistory(activeRecipient.id);
      const currentInbound = inboundKeys[activeRecipient.id] || sessionKeys[activeRecipient.id] || '';
      setCustomInboundKey(currentInbound);
    }
  }, [activeRecipient]);

  // When session keys or inbound keys change, re-decrypt chat history
  useEffect(() => {
    if (activeRecipient && chatHistory.length > 0) {
      chatHistory.forEach((msg) => decryptMessage(msg));
    }
  }, [sessionKeys, inboundKeys, outboundKeys, customInboundKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, decryptedMap]);

  useEffect(() => {
    const recipientParam = searchParams.get('recipient');
    if (recipientParam && peers.length > 0) {
      const found = peers.find((p) => p.id === recipientParam);
      if (found) setActiveRecipient(found);
    }
  }, [searchParams, peers]);

  // Sync real-time messages received via SocketContext
  useEffect(() => {
    if (!activeRecipient || !wsMessages) return;
    const peerMsgs = wsMessages[activeRecipient.id];
    if (Array.isArray(peerMsgs) && peerMsgs.length > 0) {
      peerMsgs.forEach((msg) => {
        setChatHistory((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        decryptMessage(msg);
      });
    }
  }, [wsMessages, activeRecipient]);

  const fetchPeers = async () => {
    try {
      const res = await api.get('/users');
      setPeers(res.data);
      if (res.data.length > 0 && !activeRecipient) {
        const paramId = searchParams.get('recipient');
        const initial = paramId ? res.data.find((p) => p.id === paramId) || res.data[0] : res.data[0];
        setActiveRecipient(initial);
      }
    } catch (err) {
      console.error('Failed to load peers:', err);
    }
  };

  const fetchChatHistory = async (peerId) => {
    try {
      const res = await api.get(`/messages/conversation/${peerId}`);
      setChatHistory(res.data);
      res.data.forEach((msg) => decryptMessage(msg));
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  /**
   * Decrypts an individual message.
   * If sent by me -> uses my outbound encryption key.
   * If sent by peer -> uses peer's inbound decryption key.
   */
  const decryptMessage = async (msg, keyOverride = null) => {
    if (!msg || !msg.encrypted_content) return;
    if (msg.plaintext) {
      setDecryptedMap((prev) => ({ ...prev, [msg.id]: msg.plaintext }));
      return;
    }

    const isMe = msg.sender_id === user?.id;
    const peerId = isMe ? msg.receiver_id : msg.sender_id;

    let key = keyOverride;
    if (!key) {
      if (isMe) {
        key = outboundKeys[peerId] || sessionKeys[peerId];
      } else {
        key = inboundKeys[peerId] || sessionKeys[peerId] || customInboundKey.trim();
      }
    }

    if (!key) {
      setDecryptedMap((prev) => ({
        ...prev,
        [msg.id]: '__AWAITING_PEER_KEY__',
      }));
      return;
    }

    try {
      const res = await api.post('/crypto/aes/decrypt', {
        ciphertext: msg.encrypted_content,
        iv: msg.iv,
        auth_tag: msg.auth_tag,
        key: key,
      });
      setDecryptedMap((prev) => ({ ...prev, [msg.id]: res.data.plaintext }));
    } catch (err) {
      setDecryptedMap((prev) => ({
        ...prev,
        [msg.id]: '__KEY_MISMATCH__',
      }));
    }
  };

  /**
   * Share my current Outbound Encryption Key with the peer.
   */
  const handleShareMyKey = () => {
    if (!activeRecipient) return;
    let keyToShare = myOutboundKey;
    if (!keyToShare) {
      keyToShare = generateOutboundKey(activeRecipient.id);
    }

    if (sendWSMessage && keyToShare) {
      sendWSMessage('SHARE_SESSION_KEY', {
        recipient_id: activeRecipient.id,
        session_key: keyToShare,
      });
      setNotification(`📤 Session key shared with ${activeRecipient.username}!`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  /**
   * Request the peer to share their Session Key with us.
   */
  const handleRequestPeerKey = () => {
    if (!activeRecipient) return;
    if (sendWSMessage) {
      sendWSMessage('REQUEST_SESSION_KEY', {
        recipient_id: activeRecipient.id,
      });
      setNotification(`🔔 Requested session key from ${activeRecipient.username}.`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  /**
   * Accept an incoming Session Key Offer from a peer.
   */
  const handleAcceptKeyOffer = (offer, andShareBack = false) => {
    if (!offer) return;
    saveInboundKey(offer.sender_id, offer.session_key);
    saveSessionKey(offer.sender_id, offer.session_key);

    if (activeRecipient?.id === offer.sender_id) {
      setCustomInboundKey(offer.session_key);
    }

    // Mark this peer as accepted — no more key offer banners for them
    markKeyAccepted(offer.sender_id);

    // Re-decrypt messages with the accepted key
    chatHistory.forEach((msg) => decryptMessage(msg, offer.session_key));

    if (andShareBack) {
      let myKey = myOutboundKey || generateOutboundKey(offer.sender_id);
      if (sendWSMessage && myKey) {
        sendWSMessage('SHARE_SESSION_KEY', {
          recipient_id: offer.sender_id,
          session_key: myKey,
        });
      }
    }

    setSharedKeyOffer(null);
    setNotification(`✅ Key accepted from ${offer.username || 'peer'}! Messages decrypted.`);
    setTimeout(() => setNotification(''), 4000);
  };

  /**
   * Fulfill an incoming Session Key Request.
   */
  const handleFulfillKeyRequest = (req) => {
    if (!req) return;
    let myKey = myOutboundKey || generateOutboundKey(req.sender_id);
    if (sendWSMessage && myKey) {
      sendWSMessage('SHARE_SESSION_KEY', {
        recipient_id: req.sender_id,
        session_key: myKey,
      });
    }
    setKeyRequest(null);
    setNotification(`📤 Session key sent to ${req.username}!`);
    setTimeout(() => setNotification(''), 4000);
  };

  /**
   * Execute ML-KEM-768 Post-Quantum Handshake.
   */
  const handleInitiateKeyExchange = async () => {
    if (!activeRecipient) return;
    setHandshaking(true);
    try {
      const { shared_secret, kem_ciphertext } = await initiatePQCKeyExchange(activeRecipient.id);
      setCustomInboundKey(shared_secret);
      setNotification(`PQC Handshake Successful. Session Key active.`);
      setTimeout(() => setNotification(''), 4000);

      // Broadcast PQC Handshake & Key to peer
      if (sendWSMessage && kem_ciphertext) {
        sendWSMessage('PQC_HANDSHAKE_SIGNAL', {
          recipient_id: activeRecipient.id,
          kem_ciphertext: kem_ciphertext,
        });
        sendWSMessage('SHARE_SESSION_KEY', {
          recipient_id: activeRecipient.id,
          session_key: shared_secret,
        });
      }

      chatHistory.forEach((msg) => decryptMessage(msg, shared_secret));
    } catch (err) {
      alert(`Key Exchange failed: ${err.message}`);
    } finally {
      setHandshaking(false);
    }
  };

  /**
   * Apply manually pasted Inbound Decryption Key.
   */
  const handleApplyInboundKey = () => {
    if (!activeRecipient || !customInboundKey.trim()) return;
    saveInboundKey(activeRecipient.id, customInboundKey.trim());
    saveSessionKey(activeRecipient.id, customInboundKey.trim());
    setNotification(`Peer decryption key applied!`);
    setTimeout(() => setNotification(''), 4000);
    chatHistory.forEach((msg) => decryptMessage(msg, customInboundKey.trim()));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRecipient) return;

    let activeKey = myOutboundKey;
    if (!activeKey) {
      activeKey = generateOutboundKey(activeRecipient.id);
    }

    try {
      const encRes = await api.post('/crypto/aes/encrypt', {
        plaintext: inputText,
        key: activeKey,
      });

      const messagePayload = {
        receiver_id: activeRecipient.id,
        encrypted_content: encRes.data.ciphertext,
        iv: encRes.data.iv,
        auth_tag: encRes.data.auth_tag,
      };

      const res = await api.post('/messages', messagePayload);
      const savedMsg = { ...res.data, plaintext: inputText };

      setChatHistory((prev) => [...prev, savedMsg]);
      setDecryptedMap((prev) => ({ ...prev, [savedMsg.id]: inputText }));
      setInputText('');

      if (sendWSMessage) {
        sendWSMessage('SEND_MESSAGE', messagePayload);
      }
    } catch (err) {
      console.error('Message send failure:', err);
      const detail = err.response?.data?.detail || err.message;
      alert(`Message encryption/send failed: ${detail}`);
    }
  };

  const handleEndConversation = async () => {
    if (!activeRecipient) return;
    const confirm = window.confirm(
      `End secure session with ${activeRecipient.username}? This will purge conversation logs on both ends.`
    );
    if (!confirm) return;

    try {
      await api.delete(`/messages/conversation/${activeRecipient.id}`);

      if (sendWSMessage) {
        sendWSMessage('PQC_SESSION_END', {
          recipient_id: activeRecipient.id,
        });
      }

      const systemNotice = {
        id: `sys_${Date.now()}`,
        sender_id: 'SYSTEM',
        receiver_id: activeRecipient.id,
        plaintext: 'Conversation session ended. Messages cleared on both sides for forward secrecy.',
        created_at: new Date().toISOString(),
        is_system: true,
        is_session_end: true,
      };

      setChatHistory([systemNotice]);
      setDecryptedMap({});
      if (clearPeerMessages) {
        clearPeerMessages(activeRecipient.id);
      }
    } catch (err) {
      alert(`Failed to end session: ${err.message}`);
    }
  };

  const filteredPeers = peers.filter((p) =>
    p.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col md:flex-row bg-transparent overflow-hidden">
      {/* 1. PEERS SIDEBAR */}
      <div className={`transition-all duration-300 ease-in-out bg-white/15 dark:bg-[#07070c]/25 border-r border-white/30 dark:border-white/10 flex flex-col shrink-0 backdrop-blur-xl shadow-xs ${
        isChannelsOpen ? 'w-full md:w-80' : 'w-0 opacity-0 overflow-hidden border-none'
      }`}>
        <div className="p-4 border-b border-white/30 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Channels
            </h2>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] bg-white/20 dark:bg-white/[0.04] backdrop-blur-md">
                {peers.length} ACTIVE
              </Badge>
              <button
                onClick={() => setIsChannelsOpen(false)}
                title="Close Channels List"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/[0.08] transition-colors backdrop-blur-md"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Input
            icon={SearchIcon}
            placeholder="Search participant..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Peers List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/20 dark:divide-white/[0.04]">
          {filteredPeers.length === 0 ? (
            <p className="p-6 text-center text-zinc-400 text-xs font-mono">No active peers found.</p>
          ) : (
            filteredPeers.map((peer) => {
              const isSelected = activeRecipient?.id === peer.id;
              const hasInKey = !!inboundKeys[peer.id] || !!sessionKeys[peer.id];
              const isOnline = onlineUsers[peer.id] ?? peer.is_online;

              return (
                <button
                  key={peer.id}
                  onClick={() => setActiveRecipient(peer)}
                  className={`w-full p-3.5 flex items-center justify-between text-left transition-all backdrop-blur-md ${
                    isSelected
                      ? 'bg-white/40 dark:bg-white/[0.08] border-r-2 border-cyan-500 shadow-xs'
                      : 'hover:bg-white/20 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-white/[0.08] flex items-center justify-center font-bold text-zinc-800 dark:text-zinc-100 text-xs shadow-xs border border-white/40 dark:border-white/10">
                        {peer.username.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#09090b] ${
                          isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-zinc-400'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-zinc-950 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {peer.username}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate">
                        {hasInKey ? 'Key Shared • Ready' : 'Pending Key Share'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                    hasInKey
                      ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                      : 'bg-amber-500/15 border-amber-400/30 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                  }`}>
                    {hasInKey ? 'DECRYPTABLE' : 'LOCKED'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN CHAT WINDOW */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {activeRecipient ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-white/30 dark:border-white/10 flex items-center justify-between bg-white/15 dark:bg-[#07070c]/25 backdrop-blur-xl shadow-xs">
              <div className="flex items-center space-x-3">
                {!isChannelsOpen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChannelsOpen(true)}
                    icon={UsersIcon}
                    title="Open Channels List"
                    className="mr-1 h-8 px-2.5 text-xs rounded-lg"
                  >
                    Channels
                  </Button>
                )}
                <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-white/[0.08] flex items-center justify-center font-bold text-zinc-900 dark:text-white text-xs shadow-xs border border-white/40 dark:border-white/10">
                  {activeRecipient.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-sm tracking-tight">{activeRecipient.username}</h3>
                    <Badge variant={peerInboundKey ? "quantum" : "warning"} dot pulse={!!peerInboundKey} className="text-[10px]">
                      {peerInboundKey ? "KEY ACTIVE" : "KEYS NOT SHARED"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                    Bidirectional E2EE • ML-KEM-768 + AES-256
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleShareMyKey}
                  icon={ShareIcon}
                  className="h-8 px-3 text-xs rounded-xl font-semibold shadow-xs"
                >
                  Share My Key
                </Button>

                <ActionToolbar
                  items={[
                    {
                      id: 'key',
                      label: showKeyInspector ? 'Hide Drawer' : 'Session Keys',
                      icon: <KeyIcon className="w-3.5 h-3.5" />,
                      onClick: () => setShowKeyInspector(!showKeyInspector),
                    },
                    {
                      id: 'cipher',
                      label: showRawCiphertext ? 'Hide Cipher' : 'Ciphertext',
                      icon: showRawCiphertext ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />,
                      onClick: () => setShowRawCiphertext(!showRawCiphertext),
                    },
                    {
                      id: 'rotate',
                      label: handshaking ? 'PQC...' : 'Auto-Exchange',
                      icon: <RefreshIcon className={`w-3.5 h-3.5 ${handshaking ? 'animate-spin' : ''}`} />,
                      onClick: handleInitiateKeyExchange,
                    },
                    {
                      id: 'end',
                      label: 'End Session',
                      variant: 'destructive',
                      icon: <TrashIcon className="w-3.5 h-3.5" />,
                      onClick: handleEndConversation,
                    },
                  ]}
                  activeId={showKeyInspector ? 'key' : (showRawCiphertext ? 'cipher' : null)}
                />
              </div>
            </div>

            {/* Expandable Dual Key Management Drawer */}
            <AnimatePresence>
              {showKeyInspector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-4 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md border-b border-white/30 dark:border-white/10 space-y-3.5 text-xs font-mono"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Outbound Encryption Key Box */}
                    <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 space-y-2.5 backdrop-blur-md shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <LockIcon className="w-3.5 h-3.5" />
                          My Outgoing Encryption Key
                        </span>
                        <Badge variant="outline" className="text-[9px]">ENCRYPTION</Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-zinc-800 dark:text-zinc-200 font-mono text-[11px] bg-white/50 dark:bg-black/40 px-3 py-1.5 rounded-xl border border-white/30 dark:border-white/[0.1] truncate font-semibold">
                          {myOutboundKey || 'Generating fresh key...'}
                        </span>
                        <button
                          onClick={() => {
                            if (myOutboundKey) {
                              navigator.clipboard.writeText(myOutboundKey);
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                            }
                          }}
                          disabled={!myOutboundKey}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors backdrop-blur-md"
                          title="Copy Key"
                        >
                          {copiedKey ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleShareMyKey}
                          icon={ShareIcon}
                          className="flex-1 h-8 text-[11px] rounded-xl"
                        >
                          Share Key with {activeRecipient.username}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            generateOutboundKey(activeRecipient.id);
                            setNotification('New Outbound Key generated.');
                            setTimeout(() => setNotification(''), 3000);
                          }}
                          icon={RefreshIcon}
                          className="h-8 px-2.5 text-[11px] rounded-xl"
                          title="Generate fresh random key"
                        >
                          Regen
                        </Button>
                      </div>
                    </div>

                    {/* Inbound Decryption Key Box */}
                    <div className="p-3.5 rounded-2xl bg-white/30 dark:bg-black/30 border border-white/40 dark:border-white/10 space-y-2.5 backdrop-blur-md shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <UnlockIcon className="w-3.5 h-3.5" />
                          {activeRecipient.username}'s Decryption Key
                        </span>
                        <Badge variant={peerInboundKey ? "success" : "warning"} className="text-[9px]">
                          {peerInboundKey ? "ACTIVE" : "MISSING"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customInboundKey}
                          onChange={(e) => setCustomInboundKey(e.target.value)}
                          placeholder={`Paste ${activeRecipient.username}'s 32-byte key...`}
                          className="flex-1 h-9 bg-white/50 dark:bg-black/40 border border-white/30 dark:border-white/[0.1] px-3 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:border-cyan-500 backdrop-blur-md"
                        />
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleApplyInboundKey}
                          disabled={!customInboundKey.trim()}
                          className="h-9 px-3 text-xs rounded-xl"
                        >
                          Apply
                        </Button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-zinc-400">
                          {peerInboundKey ? 'Decryption key ready' : 'Key required to decrypt messages'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRequestPeerKey}
                          className="h-7 text-[10px] text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 px-2 rounded-lg"
                        >
                          📥 Request Key from {activeRecipient.username}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Key Offer Notification Banner (Interactive Modal/Banner) */}
            <AnimatePresence>
              {sharedKeyOffer && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mx-5 mt-3 p-4 rounded-3xl bg-cyan-500/20 border border-cyan-400/50 backdrop-blur-xl shadow-2xl space-y-2.5 z-20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        <KeyIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                          🔑 Session Key Received from {sharedKeyOffer.username}!
                        </h4>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-mono">
                          {sharedKeyOffer.username} shared their AES-256 session key so you can decrypt their messages.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSharedKeyOffer(null)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAcceptKeyOffer(sharedKeyOffer, false)}
                      icon={CheckIcon}
                      className="rounded-xl text-xs h-8"
                    >
                      Accept & Decrypt Messages
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptKeyOffer(sharedKeyOffer, true)}
                      icon={ShareIcon}
                      className="rounded-xl text-xs h-8"
                    >
                      Accept & Share My Key Back
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Key Request Notification Banner */}
            <AnimatePresence>
              {keyRequest && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mx-5 mt-3 p-4 rounded-3xl bg-amber-500/20 border border-amber-400/50 backdrop-blur-xl shadow-2xl flex items-center justify-between z-20"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      <LockIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                        🔔 Key Request from {keyRequest.username}
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-mono">
                        {keyRequest.username} requested your session key to decrypt your messages.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleFulfillKeyRequest(keyRequest)}
                      icon={ShareIcon}
                      className="rounded-xl text-xs h-8 bg-amber-600 hover:bg-amber-500"
                    >
                      Share My Key
                    </Button>
                    <button
                      onClick={() => setKeyRequest(null)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mx-5 mt-2.5 p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-xl"
                >
                  <CheckCheckIcon className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>{notification}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Key Sharing Prompt Banner (if no inbound key is active) */}
            {!peerInboundKey && !showKeyInspector && !sharedKeyOffer && (
              <div className="mx-5 mt-2.5 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-between backdrop-blur-xl shadow-xs">
                <p className="text-amber-800 dark:text-amber-200 text-xs font-medium font-mono">
                  🔑 Share session keys with {activeRecipient.username} to decrypt conversations.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareMyKey}
                    icon={ShareIcon}
                    className="border-amber-400/40 text-amber-900 dark:text-amber-200 hover:bg-amber-400/20 rounded-xl text-xs h-8"
                  >
                    Share My Key
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRequestPeerKey}
                    className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs h-8"
                  >
                    Request Key
                  </Button>
                </div>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
              {Array.isArray(chatHistory) &&
                chatHistory.map((msg, idx) => {
                  if (!msg) return null;
                  if (msg.is_system) {
                    return (
                      <div key={msg.id || idx} className="flex justify-center my-3">
                        <span className="px-4 py-1.5 rounded-full bg-white/30 dark:bg-white/[0.04] border border-white/40 dark:border-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-mono shadow-xs backdrop-blur-md">
                          {msg.plaintext}
                        </span>
                      </div>
                    );
                  }
                  const isMe = msg.sender_id === user?.id;
                  const rawDecrypted = msg.plaintext || decryptedMap[msg.id];
                  const isAwaitingKey = rawDecrypted === '__AWAITING_PEER_KEY__';
                  const isKeyMismatch = rawDecrypted === '__KEY_MISMATCH__';
                  const displayText = rawDecrypted && !isAwaitingKey && !isKeyMismatch ? rawDecrypted : '[Encrypted Message]';

                  const formattedTime =
                    msg.created_at && !isNaN(new Date(msg.created_at).getTime())
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md md:max-w-lg p-3.5 rounded-2xl text-sm space-y-1.5 backdrop-blur-md ${
                          isMe
                            ? 'bg-gradient-to-r from-cyan-600/75 to-teal-600/75 text-white font-normal rounded-br-xs shadow-[0_4px_20px_rgba(6,182,212,0.2)] border border-cyan-400/30'
                            : isAwaitingKey
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-bl-xs shadow-xs'
                            : isKeyMismatch
                            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-bl-xs shadow-xs'
                            : 'bg-white/30 dark:bg-white/[0.05] border border-white/40 dark:border-white/10 text-zinc-900 dark:text-white rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {/* Awaiting Key State */}
                        {isAwaitingKey && !isMe ? (
                          <div className="space-y-2 font-mono text-xs">
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                              <LockIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>🔒 Locked: Awaiting {activeRecipient.username}'s session key</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {activeRecipient.username} must share their session key to decrypt this message.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={handleRequestPeerKey}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium transition-colors"
                              >
                                📥 Request Key from {activeRecipient.username}
                              </button>
                              <button
                                onClick={() => setShowKeyInspector(true)}
                                className="px-2.5 py-1 rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium transition-colors"
                              >
                                ✏️ Enter Key
                              </button>
                            </div>
                          </div>
                        ) : isKeyMismatch && !isMe ? (
                          <div className="space-y-2 font-mono text-xs">
                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                              <LockIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>⚠️ Key Mismatch / Decryption Failed</span>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={handleShareMyKey}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-medium transition-colors"
                              >
                                📤 Share My Key
                              </button>
                              <button
                                onClick={handleRequestPeerKey}
                                className="px-2.5 py-1 rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white/60 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium transition-colors"
                              >
                                📥 Request Key
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed text-[13px]">{displayText}</p>
                        )}

                        {/* Raw Ciphertext Inspection View */}
                        {showRawCiphertext && (
                          <div className="p-2.5 rounded-xl bg-white/40 dark:bg-black/35 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] break-all space-y-0.5 border border-white/30 dark:border-white/10 backdrop-blur-md">
                            <p><strong>Ciphertext:</strong> {msg.encrypted_content}</p>
                            <p><strong>IV (96b):</strong> {msg.iv}</p>
                            <p><strong>Tag (128b):</strong> {msg.auth_tag}</p>
                          </div>
                        )}

                        {/* Metadata Footer */}
                        <div className={`flex items-center justify-end space-x-1 text-[10px] font-mono pt-0.5 ${
                          isMe ? 'text-cyan-100/80' : 'text-zinc-400'
                        }`}>
                          {formattedTime && <span>{formattedTime}</span>}
                          {isMe && (
                            msg.status === 'READ' ? (
                              <CheckCheckIcon className="w-3.5 h-3.5 text-cyan-200" />
                            ) : (
                              <CheckIcon className="w-3.5 h-3.5 text-cyan-200/70" />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

              {/* Animated Typing Waveform */}
              {typingUsers?.[activeRecipient.id] && (
                <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 italic py-1">
                  <span>{activeRecipient.username} is typing</span>
                  <span className="flex space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-white/30 dark:border-white/10 bg-white/15 dark:bg-[#07070c]/25 backdrop-blur-xl flex items-center gap-2 shadow-sm">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a quantum-encrypted message..."
                className="flex-1 h-10 text-xs rounded-xl"
              />
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={!inputText.trim()}
                icon={SendIcon}
                className="h-10 px-5 rounded-xl font-medium text-xs"
              >
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs font-mono space-y-4">
            <AppIcon variant="chat" size="xl" glow />
            <p>Select a channel from the sidebar to begin quantum-secure chat.</p>
          </div>
        )}
      </div>

      {/* Modal Key Authentication */}
      <Modal
        isOpen={showKeyAuthModal}
        onClose={() => setShowKeyAuthModal(false)}
        title="Authenticate Session Key"
        description={`Enter the 32-byte Base64 AES session key for ${activeRecipient?.username}`}
      >
        <div className="space-y-4 pt-2">
          <Input
            mono
            value={modalKeyInput}
            onChange={(e) => setModalKeyInput(e.target.value)}
            placeholder="Paste 32-byte Base64 AES Session Key..."
            className="h-10"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowKeyAuthModal(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (modalKeyInput.trim() && activeRecipient) {
                  saveInboundKey(activeRecipient.id, modalKeyInput.trim());
                  saveSessionKey(activeRecipient.id, modalKeyInput.trim());
                  setCustomInboundKey(modalKeyInput.trim());
                  setShowKeyAuthModal(false);
                  chatHistory.forEach((msg) => decryptMessage(msg, modalKeyInput.trim()));
                }
              }}
              disabled={!modalKeyInput.trim()}
              icon={CheckCheckIcon}
            >
              Verify & Decrypt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
