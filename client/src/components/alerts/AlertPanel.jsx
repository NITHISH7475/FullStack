import React from 'react';
import { AlertTriangle, AlertCircle, Info, Check, CheckCircle2, Trash2 } from 'lucide-react';

function getRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const past = new Date(timestamp);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AlertPanel({ alerts = [], onMarkRead, onResolve, onDelete }) {
  const getSeverityIcon = (severity) => {
    const s = (severity || 'info').toLowerCase();
    switch (s) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />;
    }
  };

  const getSeverityBorder = (severity, isRead) => {
    if (isRead) return 'border-l-[3px] border-l-slate-300';
    const s = (severity || 'info').toLowerCase();
    switch (s) {
      case 'critical':
      case 'error':
        return 'border-l-[3px] border-l-rose-500 bg-rose-500/[0.03]';
      case 'warning':
        return 'border-l-[3px] border-l-amber-500 bg-amber-500/[0.03]';
      case 'info':
      default:
        return 'border-l-[3px] border-l-sky-500 bg-sky-500/[0.03]';
    }
  };

  const getTypeBadge = (type) => {
    const t = type || 'System';
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80">
        {t.replace(/_/g, ' ')}
      </span>
    );
  };

  if (alerts.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200/90 font-mono">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
        <p className="text-sm font-semibold text-slate-800">ALL SYSTEMS NOMINAL</p>
        <p className="text-xs text-slate-400 mt-0.5">Zero operational anomalies or safety violations active.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isRead = Boolean(alert.isRead || alert.read);
        const isResolved = Boolean(alert.isResolved || alert.resolved);

        return (
          <div
            key={alert._id || alert.id}
            className={`p-4 rounded-xl border border-slate-200/90 transition-all ${
              isRead ? 'bg-white' : 'bg-white shadow-sm'
            } ${getSeverityBorder(alert.severity, isRead)}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              {/* Left Details */}
              <div className="flex items-start space-x-3 flex-1">
                {getSeverityIcon(alert.severity)}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h4 className={`text-sm font-semibold tracking-tight ${isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                      {alert.title}
                    </h4>
                    {getTypeBadge(alert.type || alert.alertType)}
                    {isResolved && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        Resolved
                      </span>
                    )}
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" title="Unread Telemetry" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {alert.message || alert.description}
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 pt-1">
                    <span>{getRelativeTime(alert.createdAt || alert.timestamp)}</span>
                    {alert.source && (
                      <>
                        <span>•</span>
                        <span>Source: {alert.source}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                {!isRead && onMarkRead && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(alert._id || alert.id)}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Acknowledge
                  </button>
                )}

                {!isResolved && onResolve && (
                  <button
                    type="button"
                    onClick={() => onResolve(alert._id || alert.id)}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition"
                    title="Mark resolved"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Resolve
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(alert._id || alert.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
