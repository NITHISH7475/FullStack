import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function BatchTable({ batches = [], onEdit, onDelete }) {
  const getStatusBadge = (status) => {
    const s = (status || 'planned').toLowerCase();
    switch (s) {
      case 'planned':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-700 border border-sky-500/20">
            Planned
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200/90 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
        <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-mono font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200/80">
          <tr>
            <th className="px-4 py-3.5">Batch #</th>
            <th className="px-4 py-3.5">Product & SKU</th>
            <th className="px-4 py-3.5">Target Qty</th>
            <th className="px-4 py-3.5">Actual Qty</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">Scheduled Date</th>
            <th className="px-4 py-3.5">Production Line</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {batches.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                No manufacturing batch records currently scheduled.
              </td>
            </tr>
          ) : (
            batches.map((batch) => (
              <tr key={batch._id || batch.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900">
                  {batch.batchNumber}
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-900 text-sm">{batch.productName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{batch.productSku}</div>
                </td>
                <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">
                  {Number(batch.targetQuantity || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3.5 font-mono font-medium text-slate-700">
                  {batch.actualQuantity !== undefined && batch.actualQuantity !== null
                    ? Number(batch.actualQuantity).toLocaleString()
                    : '—'}
                </td>
                <td className="px-4 py-3.5">
                  {getStatusBadge(batch.status)}
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                  {formatDate(batch.scheduledDate)}
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                    {batch.productionLine || 'Line A'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="inline-flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => onEdit(batch)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                      title="Edit Batch"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(batch)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
