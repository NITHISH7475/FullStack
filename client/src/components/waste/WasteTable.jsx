import React from 'react';
import { RefreshCw, FileText } from 'lucide-react';

export default function WasteTable({ events = [], loading = false }) {
  const getCauseBadge = (cause) => {
    const c = (cause || 'other').toLowerCase();
    switch (c) {
      case 'spoilage':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-rose-500/10 text-rose-700 border border-rose-500/20">Spoilage</span>;
      case 'equipment-failure':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-700 border border-orange-500/20">Equipment Failure</span>;
      case 'over-production':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">Over Production</span>;
      case 'quality-rejection':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-700 border border-sky-500/20">Quality Rejection</span>;
      case 'handling-damage':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-700 border border-purple-500/20">Handling Damage</span>;
      case 'other':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">Other</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.toString().split('T')[0].split('-');
    if (year && month && day) {
      return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
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
            <th className="px-4 py-3.5">Date</th>
            <th className="px-4 py-3.5">Material & Lot</th>
            <th className="px-4 py-3.5">Loss Cause</th>
            <th className="px-4 py-3.5">Scrap Volume</th>
            <th className="px-4 py-3.5">Cost Impact</th>
            <th className="px-4 py-3.5">Production Line</th>
            <th className="px-4 py-3.5">Logged By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                <span className="text-xs font-mono">Synchronizing scrap telemetry...</span>
              </td>
            </tr>
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-mono text-xs">
                Zero waste or yield degradation incidents recorded in this interval.
              </td>
            </tr>
          ) : (
            events.map((evt, idx) => {
              const matName = evt.material?.name || evt.materialName || 'Unspecified Item';
              const costImpact = evt.costImpact !== undefined && evt.costImpact !== null
                ? Number(evt.costImpact)
                : (Number(evt.quantity || 0) * Number(evt.material?.costPerUnit || 0));

              return (
                <tr key={evt._id || evt.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {formatDate(evt.eventDate || evt.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900" title={evt.description || undefined}>
                      <span>{matName}</span>
                      {evt.description && (
                        <FileText className="w-3.5 h-3.5 text-slate-400 inline" />
                      )}
                    </div>
                    {evt.productionBatch && (
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        Batch: {typeof evt.productionBatch === 'object'
                          ? (evt.productionBatch.batchNumber || evt.productionBatch._id)
                          : evt.productionBatch}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getCauseBadge(evt.cause)}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">
                    {Number(evt.quantity || 0).toLocaleString()} <span className="text-[11px] font-normal text-slate-500 font-sans">{evt.unit || 'kg'}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-rose-600 whitespace-nowrap">
                    ${costImpact.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                      {evt.productionLine || 'Line A'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">
                    {evt.reportedBy || 'System Audit'}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}