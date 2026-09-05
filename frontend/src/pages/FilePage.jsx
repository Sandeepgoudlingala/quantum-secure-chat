import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCrypto } from '../context/CryptoContext';
import api from '../services/api';
import {
  VaultIcon,
  UploadIcon,
  DownloadIcon,
  LockIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon
} from '../components/ui/Icons';
import { FolderLock } from 'lucide-react';
import { AppIcon } from '../components/ui/AppIcon';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export default function FilePage() {
  const { user } = useAuth();
  const { sessionKeys, initiatePQCKeyExchange } = useCrypto();

  const [filesList, setFilesList] = useState([]);
  const [peers, setPeers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [customUploadKey, setCustomUploadKey] = useState('');
  const [downloadModalFile, setDownloadModalFile] = useState(null);
  const [decryptionKeyInput, setDecryptionKeyInput] = useState('');
  const [copiedHash, setCopiedHash] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRecipient && sessionKeys[selectedRecipient]) {
      setCustomUploadKey(sessionKeys[selectedRecipient]);
    } else {
      setCustomUploadKey('');
    }
  }, [selectedRecipient, sessionKeys]);

  const fetchData = async () => {
    try {
      const [filesRes, usersRes] = await Promise.all([
        api.get('/files'),
        api.get('/users'),
      ]);
      setFilesList(filesRes.data);
      const availablePeers = usersRes.data.length > 0 ? usersRes.data : [user].filter(Boolean);
      setPeers(availablePeers);
      if (availablePeers.length > 0 && !selectedRecipient) {
        setSelectedRecipient(availablePeers[0].id);
      }
    } catch (err) {
      console.error('Failed to load file sharing data:', err);
      setError('Failed to load file vault. Make sure backend is running.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload || !selectedRecipient) {
      setError('Please choose a file and recipient peer.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      let activeSessionKey = customUploadKey.trim() || sessionKeys[selectedRecipient];
      if (!activeSessionKey) {
        const { shared_secret } = await initiatePQCKeyExchange(selectedRecipient);
        activeSessionKey = shared_secret;
        setCustomUploadKey(shared_secret);
      }

      const formData = new FormData();
      formData.append('recipient_id', selectedRecipient);
      formData.append('session_key', activeSessionKey);
      formData.append('file', fileToUpload);

      await api.post('/files/upload', formData);

      setFileToUpload(null);
      await fetchData();
    } catch (err) {
      console.error('File encryption/upload failed:', err);
      setError(err.response?.data?.detail || 'File encryption failed.');
    } finally {
      setUploading(false);
    }
  };

  const openDownloadModal = (file) => {
    const defaultKey = sessionKeys[file.recipient_id] || sessionKeys[file.uploader_id] || '';
    setDecryptionKeyInput(defaultKey);
    setDownloadModalFile(file);
  };

  const executeDecryptedDownload = async () => {
    if (!downloadModalFile || !decryptionKeyInput.trim()) return;

    setDownloadingId(downloadModalFile.id);
    try {
      const res = await api.post(
        `/files/download/${downloadModalFile.id}`,
        { session_key: decryptionKeyInput.trim() },
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadModalFile.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadModalFile(null);
    } catch (err) {
      let errMsg = err.message;
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errMsg = parsed.detail || errMsg;
        } catch (e) {}
      } else if (err.response?.data?.detail) {
        errMsg = err.response.data.detail;
      }
      alert(`Decryption/Download failed: ${errMsg}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const copyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <AppIcon variant="vault" icon={FolderLock} size="sm" glow={false} />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              File Vault
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Client-side encrypted files with SHA-256 integrity.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-200/80 dark:border-zinc-800 self-start md:self-auto">
          {filesList.length} files stored
        </span>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-2"
        >
          <span>{error}</span>
        </motion.div>
      )}

      {/* Upload Bento Card */}
      <Card className="p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200/50 dark:border-white/10">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            Upload File
          </h3>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase font-semibold">
                Recipient Peer
              </label>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full h-10 bg-white/30 dark:bg-black/25 border border-white/30 dark:border-white/10 px-3 rounded-xl text-zinc-900 dark:text-white text-xs font-medium focus:border-cyan-500 focus:outline-none backdrop-blur-md"
              >
                {peers.map((peer) => (
                  <option key={peer.id} value={peer.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                    {peer.username}{peer.id === user?.id ? ' (Self Vault)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase font-semibold">
                File Payload
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    setFileToUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative border border-dashed rounded-xl p-2.5 text-center transition-all backdrop-blur-md ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-500/15'
                    : 'border-white/30 dark:border-white/15 hover:border-cyan-400/50 bg-white/20 dark:bg-white/[0.025]'
                }`}
              >
                <input
                  type="file"
                  id="vault-file"
                  className="hidden"
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                />
                <label
                  htmlFor="vault-file"
                  className="cursor-pointer flex items-center justify-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono font-medium py-1"
                >
                  <UploadIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    {fileToUpload ? fileToUpload.name : 'Choose file or drag & drop'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase font-semibold">
              Encryption Key
            </label>
            <div className="flex gap-2">
              <Input
                mono
                value={customUploadKey}
                onChange={(e) => setCustomUploadKey(e.target.value)}
                placeholder="Paste 32-byte Base64 key or Auto-Derive..."
                className="h-10 text-xs rounded-xl"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (selectedRecipient) {
                    const { shared_secret } = await initiatePQCKeyExchange(selectedRecipient);
                    setCustomUploadKey(shared_secret);
                  }
                }}
                icon={RefreshIcon}
                className="rounded-xl text-xs h-10 px-4"
              >
                Auto-Derive
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            size="md"
            isLoading={uploading}
            disabled={uploading || !fileToUpload}
            icon={LockIcon}
            className="w-full rounded-xl text-xs font-semibold h-10"
          >
            {uploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload to Vault'}
          </Button>
        </form>
      </Card>

      {/* Vault Directory Table */}
      <Card className="p-6 space-y-4">
        <div className="pb-3 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            Stored Files ({filesList.length})
          </h3>
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-medium">Encrypted at rest</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/20 dark:border-white/10">
          <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200 font-mono">
            <thead className="bg-white/30 dark:bg-white/[0.04] text-[11px] text-zinc-500 dark:text-zinc-400 uppercase border-b border-white/30 dark:border-white/10 backdrop-blur-md">
              <tr>
                <th className="p-3.5">Filename</th>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">SHA-256 Hash</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/[0.04]">
              {filesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs font-mono">
                    No files uploaded yet.
                  </td>
                </tr>
              ) : (
                filesList.map((file) => (
                  <tr key={file.id} className="hover:bg-white/25 dark:hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5 font-medium text-zinc-900 dark:text-white">
                      <span>{file.original_filename}</span>
                    </td>
                    <td className="p-3.5 text-zinc-500 dark:text-zinc-400">
                      {(file.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 font-semibold">
                        <span>{file.file_hash.substring(0, 16)}...</span>
                        <button
                          onClick={() => copyHash(file.file_hash, file.id)}
                          title="Copy Full SHA-256 Checksum"
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                          {copiedHash === file.id ? <CheckIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-zinc-500 dark:text-zinc-400">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => openDownloadModal(file)}
                        icon={DownloadIcon}
                        className="text-xs font-mono rounded-lg"
                      >
                        Decrypt & Save
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Decryption Modal */}
      <Modal
        isOpen={!!downloadModalFile}
        onClose={() => setDownloadModalFile(null)}
        title="File Decryption Credentials"
        description={`Decrypt and verify integrity for: ${downloadModalFile?.original_filename}`}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase font-semibold">
              AES-256 Decryption Session Key (Base64)
            </label>
            <Input
              mono
              value={decryptionKeyInput}
              onChange={(e) => setDecryptionKeyInput(e.target.value)}
              placeholder="Paste 32-byte Base64 AES Session Key..."
              className="h-10"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              The 256-bit symmetric session key negotiated via ML-KEM-768 for this file transmission.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDownloadModalFile(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={executeDecryptedDownload}
              isLoading={downloadingId === downloadModalFile?.id}
              disabled={!decryptionKeyInput.trim()}
              icon={DownloadIcon}
            >
              Verify SHA-256 & Download
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
