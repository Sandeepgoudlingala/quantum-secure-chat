import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CryptoContext = createContext(null);

export const CryptoProvider = ({ children }) => {
  const { user } = useAuth();
  const [keys, setKeys] = useState({ publicKey: null, secretKey: null });
  const [sessionKeys, setSessionKeys] = useState({}); // recipientId -> sessionKeyBase64
  const [handshaking, setHandshaking] = useState(false);

  const [inboundKeys, setInboundKeys] = useState({});   // peerId -> inbound decryption key from peer
  const [outboundKeys, setOutboundKeys] = useState({}); // peerId -> outbound encryption key to peer

  // Initialize or fetch user's keypair and session keys on login
  useEffect(() => {
    if (!user) return;

    const storedSk = localStorage.getItem(`sk_${user.id}`);
    const storedPk = localStorage.getItem(`pk_${user.id}`);

    if (storedSk && storedPk) {
      setKeys({ publicKey: storedPk, secretKey: storedSk });
    } else {
      generateAndBindKeys();
    }

    const storedSessions = localStorage.getItem(`session_keys_${user.id}`);
    if (storedSessions) {
      try {
        setSessionKeys(JSON.parse(storedSessions));
      } catch (e) {
        console.error('Failed to parse stored session keys:', e);
      }
    }

    const storedInbound = localStorage.getItem(`inbound_keys_${user.id}`);
    if (storedInbound) {
      try { setInboundKeys(JSON.parse(storedInbound)); } catch (e) {}
    }

    const storedOutbound = localStorage.getItem(`outbound_keys_${user.id}`);
    if (storedOutbound) {
      try { setOutboundKeys(JSON.parse(storedOutbound)); } catch (e) {}
    }
  }, [user]);

  const saveSessionKey = (peerId, sharedSecret) => {
    setSessionKeys((prev) => {
      const updated = { ...prev, [peerId]: sharedSecret };
      if (user) {
        localStorage.setItem(`session_keys_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const saveInboundKey = (peerId, key) => {
    setInboundKeys((prev) => {
      const updated = { ...prev, [peerId]: key };
      if (user) localStorage.setItem(`inbound_keys_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const saveOutboundKey = (peerId, key) => {
    setOutboundKeys((prev) => {
      const updated = { ...prev, [peerId]: key };
      if (user) localStorage.setItem(`outbound_keys_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const generateAndBindKeys = async () => {
    if (!user) return;
    try {
      const res = await api.post('/crypto/generate-keypair');
      const { public_key, secret_key } = res.data;

      localStorage.setItem(`pk_${user.id}`, public_key);
      localStorage.setItem(`sk_${user.id}`, secret_key);

      // Upload public key to backend user directory
      await api.post('/users/public-key', { public_key });

      setKeys({ publicKey: public_key, secretKey: secret_key });
    } catch (err) {
      console.error('Failed to generate/bind ML-KEM key pair:', err);
    }
  };

  /**
   * Initiates Post-Quantum ML-KEM-768 Key Exchange with Recipient.
   */
  const initiatePQCKeyExchange = async (recipientId) => {
    setHandshaking(true);
    try {
      // 1. Fetch Recipient's ML-KEM Public Key
      let recipientPk = null;
      if (user && recipientId === user.id) {
        recipientPk = keys.publicKey || localStorage.getItem(`pk_${user.id}`);
      }
      if (!recipientPk) {
        const keyRes = await api.get(`/users/${recipientId}/public-key`);
        recipientPk = keyRes.data.public_key;
      }

      if (!recipientPk) {
        const kpRes = await api.post('/crypto/generate-keypair');
        recipientPk = kpRes.data.public_key;
      }

      // 2. Encapsulate Shared Secret via Backend / Client PQC Engine
      const encRes = await api.post('/crypto/encapsulate', {
        recipient_id: recipientId,
        recipient_public_key: recipientPk,
      });

      const { shared_secret, kem_ciphertext } = encRes.data;

      // Store derived AES-256 Session Key for recipient
      saveSessionKey(recipientId, shared_secret);
      saveOutboundKey(recipientId, shared_secret);

      return { shared_secret, kem_ciphertext };
    } catch (err) {
      console.error('PQC Key Exchange failed:', err);
      throw err;
    } finally {
      setHandshaking(false);
    }
  };

  /**
   * Generates a standalone 32-byte random AES-256 encryption key.
   */
  const generateOutboundKey = (peerId) => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    let binary = '';
    for (let i = 0; i < array.length; i++) {
      binary += String.fromCharCode(array[i]);
    }
    const keyB64 = btoa(binary);
    saveOutboundKey(peerId, keyB64);
    return keyB64;
  };

  /**
   * Completes ML-KEM Decapsulation when receiving a PQC Handshake Signal.
   */
  const receivePQCHandshakeSignal = async (senderId, kemCiphertext) => {
    try {
      const storedSk = keys.secretKey || localStorage.getItem(`sk_${user?.id}`);
      if (!storedSk) {
        throw new Error('Local Secret Key missing for decapsulation.');
      }

      const decRes = await api.post('/crypto/decapsulate', {
        kem_ciphertext: kemCiphertext,
        secret_key: storedSk,
      });

      const { shared_secret } = decRes.data;

      saveSessionKey(senderId, shared_secret);
      saveInboundKey(senderId, shared_secret);

      return shared_secret;
    } catch (err) {
      console.error('PQC Decapsulation failed:', err);
      throw err;
    }
  };

  return (
    <CryptoContext.Provider
      value={{
        keys,
        sessionKeys,
        inboundKeys,
        outboundKeys,
        handshaking,
        generateAndBindKeys,
        initiatePQCKeyExchange,
        generateOutboundKey,
        receivePQCHandshakeSignal,
        saveSessionKey,
        saveInboundKey,
        saveOutboundKey,
        setSessionKey: (recipientId, key) =>
          setSessionKeys((prev) => ({ ...prev, [recipientId]: key })),
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () =>
  useContext(CryptoContext) || {
    keys: { publicKey: null, secretKey: null },
    sessionKeys: {},
    inboundKeys: {},
    outboundKeys: {},
    handshaking: false,
    generateAndBindKeys: async () => {},
    initiatePQCKeyExchange: async () => ({ shared_secret: '', kem_ciphertext: '' }),
    generateOutboundKey: () => '',
    receivePQCHandshakeSignal: async () => '',
    saveSessionKey: () => {},
    saveInboundKey: () => {},
    saveOutboundKey: () => {},
    setSessionKey: () => {},
  };
