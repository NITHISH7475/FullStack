import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { alertAPI } from '../services/api';
import AlertPanel from '../components/alerts/AlertPanel';
import {
  Bell,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
} from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Critical' | 'Warning' | 'Info'
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await alertAPI.getAll();
      const data = res.data?.data || res.data || [];
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Unable to fetch platform notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkRead = async (id) => {
    try {
      await alertAPI.markAsRead(id);
      setAlerts((prev) =>
        prev.map((a) => ((a._id || a.id) === id ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertAPI.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      alert('Error updating alerts.');
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertAPI.resolve(id);
      setAlerts((prev) =>
        prev.map((a) =>
          (a._id || a.id) === id ? { ...a, isResolved: true, isRead: true } : a
        )
      );
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await alertAPI.delete(id);
      setAlerts((prev) => prev.filter((a) => (a._id || a.id) !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  // KPI counts
  const totalCount = alerts.length;
  const unreadCount = alerts.filter((a) => !a.isRead && !a.read).length;
  const criticalCount = alerts.filter(
    (a) => (a.severity || '').toLowerCase() === 'critical' || (a.severity || '').toLowerCase() === 'error'
  ).length;

  // Filtered List
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const sev = (a.severity || 'info').toLowerCase();
      let matchTab = true;
      if (activeTab === 'Critical') matchTab = sev === 'critical' || sev === 'error';
      else if (activeTab === 'Warning') matchTab = sev === 'warning';
      else if (activeTab === 'Info') matchTab = sev === 'info';

      const matchUnread = !unreadOnly || (!a.isRead && !a.read);
      return matchTab && matchUnread;
    });
  }, [alerts, activeTab, unreadOnly]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              FACILITY SAFETY &amp; TELEMETRY LOGS
            </span>
            <span className="text-slate-300">•</span>
            {unreadCount > 0 ? (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {unreadCount} UNREAD
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ALL RESOLVED
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Plant Alerts &amp; Incident Feed</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time notifications for perishable batch risks, low raw material thresholds, and equipment variances.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchAlerts}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center px-3.5 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Summary Stat Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center space-x-3.5">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Unread Alerts</span>
            <span className="text-xl font-bold font-mono text-slate-900">{unreadCount}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center space-x-3.5">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Critical Issues</span>
            <span className="text-xl font-bold font-mono text-slate-900">{criticalCount}</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center space-x-3.5">
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Total Logged</span>
            <span className="text-xl font-bold font-mono text-slate-900">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Options */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-2 gap-4">
        <div className="flex space-x-1.5 w-full sm:w-auto font-mono text-xs">
          {['All', 'Critical', 'Warning', 'Info'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <label className="flex items-center space-x-2 text-xs font-mono font-medium text-slate-700 cursor-pointer select-none self-start sm:self-auto">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          <span>Unread Only</span>
        </label>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Alerts List or Empty State */}
      {loading && alerts.length === 0 ? (
        <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm">Fetching system notifications...</p>
        </div>
      ) : (
        <AlertPanel
          alerts={filteredAlerts}
          onMarkRead={handleMarkRead}
          onResolve={handleResolve}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
