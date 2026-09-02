import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import {
  AuditIcon,
  SearchIcon,
  FilterIcon,
  RefreshIcon
} from '../components/ui/Icons';
import { Activity } from 'lucide-react';
import { AppIcon } from '../components/ui/AppIcon';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [filterEvent]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAuditLogs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, filterEvent]);

  const fetchAuditLogs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const url = filterEvent ? `/audit-logs?event_type=${filterEvent}` : '/audit-logs';
      const res = await api.get(url);
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const getEventBadge = (eventType) => {
    if (eventType.includes('SUCCESS') || eventType.includes('COMPLETE')) {
      return <Badge variant="success" dot className="font-mono text-[10px]">{eventType}</Badge>;
    } else if (eventType.includes('FAILED') || eventType.includes('DENIED')) {
      return <Badge variant="danger" dot className="font-mono text-[10px]">{eventType}</Badge>;
    } else if (eventType.includes('KEY')) {
      return <Badge variant="quantum" dot pulse className="font-mono text-[10px]">{eventType}</Badge>;
    }
    return <Badge variant="outline" className="font-mono text-[10px]">{eventType}</Badge>;
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.event_type?.toLowerCase().includes(term) ||
      log.user_id?.toLowerCase().includes(term) ||
      log.ip_address?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <AppIcon variant="audit" icon={Activity} size="sm" glow={false} />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Security Logs
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Immutable event log for keys, logins, and file encryption.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            icon={AuditIcon}
            className="text-xs font-mono rounded-lg"
          >
            {autoRefresh ? "Live Stream Active" : "Live Stream"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAuditLogs(true)}
            isLoading={loading}
            icon={RefreshIcon}
            className="text-xs font-mono rounded-lg"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            icon={SearchIcon}
            placeholder="Search logs by event, IP, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <FilterIcon className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="h-10 bg-white/30 dark:bg-black/25 border border-white/30 dark:border-white/10 px-3 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:border-cyan-500 focus:outline-none w-full sm:w-52 font-medium backdrop-blur-md"
          >
            <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">ALL AUDIT EVENTS</option>
            <option value="LOGIN_SUCCESS" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">LOGIN_FAILED</option>
            <option value="KEY_EXCHANGE_COMPLETE" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">KEY_EXCHANGE_COMPLETE</option>
            <option value="MESSAGE_SENT" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">MESSAGE_SENT</option>
            <option value="FILE_UPLOADED" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">FILE_UPLOADED</option>
            <option value="FILE_DOWNLOADED" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">FILE_DOWNLOADED</option>
          </select>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/10">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            Audit Entries ({filteredLogs.length})
          </h3>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">Database: sqlite:///./pqc_app.db</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/20 dark:border-white/10">
          <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200 font-mono">
            <thead className="bg-white/30 dark:bg-white/[0.04] text-[11px] text-zinc-500 dark:text-zinc-400 uppercase border-b border-white/30 dark:border-white/10 backdrop-blur-md">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Event Signature</th>
                <th className="p-3.5">Principal / User UUID</th>
                <th className="p-3.5">Origin IP</th>
                <th className="p-3.5">Audit Telemetry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 dark:divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400 font-mono text-xs">
                    Loading audit trail entries...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400 font-mono text-xs">
                    No matching security audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-white/25 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {getEventBadge(log.event_type)}
                        </td>
                        <td className="p-3.5 text-zinc-900 dark:text-white font-medium truncate max-w-[140px]">
                          {log.user_id || 'SYSTEM_DAEMON'}
                        </td>
                        <td className="p-3.5 text-cyan-600 dark:text-cyan-400 font-medium whitespace-nowrap">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                        <td className="p-3.5 text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                          {log.details || '-'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-white/20 dark:bg-white/[0.02]">
                          <td colSpan={5} className="p-3.5 border-t border-white/20 dark:border-white/10 text-[11px]">
                            <div className="p-3.5 rounded-xl bg-white/40 dark:bg-black/30 border border-white/30 dark:border-white/10 space-y-1 font-mono text-zinc-800 dark:text-zinc-200 backdrop-blur-md shadow-xs">
                              <p className="text-cyan-600 dark:text-cyan-400 font-bold">AUDIT EVENT DETAILS:</p>
                              <p><span className="text-zinc-400">UUID:</span> {log.id}</p>
                              <p><span className="text-zinc-400">Event:</span> {log.event_type}</p>
                              <p><span className="text-zinc-400">User:</span> {log.user_id}</p>
                              <p><span className="text-zinc-400">Details:</span> {log.details}</p>
                              <p><span className="text-zinc-400">Time:</span> {log.created_at}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
