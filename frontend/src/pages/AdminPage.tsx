import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAnalytics, getAuditLogs } from '../api/admin';
import type { AnalyticsData, AuditLogEntry } from '../types';

type PageState = 'loading' | 'ready' | 'forbidden' | 'error';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 border" style={{ backgroundColor: '#161C29', borderColor: '#2A3346' }}>
      <p
        className="text-[11px] uppercase tracking-wide"
        style={{ color: '#8791A8', fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {label}
      </p>
      <p
        className="text-2xl mt-1"
        style={{ color: '#ECEEF3', fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}
      >
        {value}
      </p>
    </div>
  );
}

function BreakdownList({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data);
  return (
    <div className="p-4 border" style={{ backgroundColor: '#161C29', borderColor: '#2A3346' }}>
      <p
        className="text-[11px] uppercase tracking-wide mb-2"
        style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {title}
      </p>
      {entries.length === 0 ? (
        <p className="text-sm" style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}>
          No data yet
        </p>
      ) : (
        entries.map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm py-1">
            <span style={{ color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}>{key}</span>
            <span style={{ color: '#5FB8B0', fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
          </div>
        ))
      )}
    </div>
  );
}

function AdminPage() {
  const [state, setState] = useState<PageState>('loading');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [analyticsRes, logsRes] = await Promise.all([getAnalytics(), getAuditLogs(50)]);
        setAnalytics(analyticsRes.data);
        setLogs(logsRes.data);
        setState('ready');
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setState('forbidden');
        } else {
          setState('error');
        }
      }
    };
    fetchAdminData();
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#10151F' }}>
        <p style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}>Loading…</p>
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#10151F' }}>
        <div className="text-center">
          <p
            className="text-[11px] tracking-[0.2em] uppercase mb-2"
            style={{ color: '#C1523A', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Access Restricted
          </p>
          <h1 style={{ color: '#ECEEF3', fontFamily: "'Source Serif 4', serif", fontWeight: 600 }} className="text-2xl">
            Administrator privileges required
          </h1>
        </div>
      </div>
    );
  }

  if (state === 'error' || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#10151F' }}>
        <p style={{ color: '#C1523A', fontFamily: "'Inter', sans-serif" }}>Failed to load admin data.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#10151F' }}>
      <div className="max-w-3xl mx-auto">
        <p
          className="text-[11px] tracking-[0.2em] uppercase mb-1"
          style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Administrator Console
        </p>
        <h1
          className="text-3xl mb-6"
          style={{ color: '#ECEEF3', fontFamily: "'Source Serif 4', serif", fontWeight: 600 }}
        >
          Platform overview
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Users" value={analytics.total_users} />
          <StatCard label="Total Documents" value={analytics.total_documents} />
          <StatCard label="PII Flagged" value={analytics.pii_detected_count} />
          <StatCard label="Chat Sessions" value={analytics.total_chat_sessions} />
          <StatCard label="Searches Performed" value={analytics.total_searches_performed} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <BreakdownList title="Documents by Status" data={analytics.documents_by_status} />
          <BreakdownList title="Documents by Classification" data={analytics.documents_by_classification} />
        </div>

        <p
          className="text-[11px] tracking-[0.2em] uppercase mb-2"
          style={{ color: '#C9A24B', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Recent Activity
        </p>
        <div className="border overflow-x-auto" style={{ borderColor: '#2A3346' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A3346' }}>
                {['Action', 'Resource', 'User ID', 'IP', 'Time'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs uppercase tracking-wide"
                    style={{ color: '#8791A8', fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #2A3346' }}>
                  <td className="px-3 py-2" style={{ color: '#ECEEF3', fontFamily: "'Inter', sans-serif" }}>
                    {log.action}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#8791A8', fontFamily: "'Inter', sans-serif" }}>
                    {log.resource_type ?? '—'} {log.resource_id ?? ''}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#8791A8', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {log.user_id ?? '—'}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#8791A8', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {log.ip_address ?? '—'}
                  </td>
                  <td className="px-3 py-2" style={{ color: '#8791A8', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;