import React, { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../../services/api';
import { Package, Clock, AlertTriangle, CheckCircle, RefreshCw, Layers } from 'lucide-react';

export default function LotTracker({ materialId, materialName, onInventoryUpdated }) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consumeLoading, setConsumeLoading] = useState(false);

  const fetchLots = useCallback(async () => {
    if (!materialId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryAPI.getByMaterial(materialId);
      const rawLots = res.data?.data || res.data || [];
      // Sort ASC by expiryDate (FEFO: First Expired, First Out)
      const sorted = [...rawLots].sort((a, b) => {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return dateA - dateB;
      });
      setLots(sorted);
    } catch (err) {
      console.error('Error fetching inventory lots:', err);
      setError(err.response?.data?.message || 'Failed to load inventory lots.');
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  const handleConsume = async (lot) => {
    const available = Number(lot.quantity) || 0;
    const input = window.prompt(
      `Consume stock from Lot: ${lot.lotNumber || lot.batchCode || 'N/A'}\nAvailable: ${available}\nEnter quantity to consume:`
    );
    if (!input) return;

    const qty = Number(input);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive number.');
      return;
    }
    if (qty > available) {
      alert(`Cannot consume more than available stock (${available}).`);
      return;
    }

    try {
      setConsumeLoading(true);
      await inventoryAPI.consume({
        materialId,
        lotId: lot._id || lot.id,
        lotNumber: lot.lotNumber,
        quantity: qty,
      });
      await fetchLots();
      if (onInventoryUpdated) {
        onInventoryUpdated();
      }
    } catch (err) {
      console.error('Failed to consume stock:', err);
      alert(err.response?.data?.message || 'Error consuming stock.');
    } finally {
      setConsumeLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const exp = new Date(expiryDate);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (expiryDate) => {
    if (!expiryDate) return <span className="text-slate-400 font-mono text-xs">N/A</span>;
    const days = getDaysUntilExpiry(expiryDate);
    const dateFormatted = new Date(expiryDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (days < 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
          Expired ({dateFormatted})
        </span>
      );
    } else if (days < 3) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
          {dateFormatted} ({days}d left)
        </span>
      );
    } else if (days < 7) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
          {dateFormatted} ({days}d left)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
          {dateFormatted} ({days}d left)
        </span>
      );
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'active').toLowerCase();
    switch (s) {
      case 'active':
        return <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">Active</span>;
      case 'expired':
        return <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold rounded bg-rose-500/10 text-rose-700 border border-rose-500/20">Expired</span>;
      case 'depleted':
        return <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">Depleted</span>;
      case 'quarantine':
        return <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">Quarantine</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  // Calculations for summary bar
  const totalQuantity = lots.reduce((acc, lot) => acc + (Number(lot.quantity) || 0), 0);
  const earliestExpiryLot = lots.find((l) => l.expiryDate && (Number(l.quantity) || 0) > 0);

  if (!materialId) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
            Batch & Lot Telemetry: <span className="font-mono text-emerald-700 font-bold">{materialName}</span>
          </h4>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded">
            FEFO Active
          </span>
        </div>
        <button
          type="button"
          onClick={fetchLots}
          disabled={loading}
          className="inline-flex items-center px-2.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Lots
        </button>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/80">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Total Tracked Stock</span>
          <span className="text-lg font-mono font-bold text-slate-900">{totalQuantity.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Active FEFO Lots</span>
          <span className="text-lg font-mono font-bold text-slate-900">{lots.length}</span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Next Expiry Event</span>
          <span className="text-sm font-mono font-semibold text-slate-900">
            {earliestExpiryLot?.expiryDate
              ? new Date(earliestExpiryLot.expiryDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'None recorded'}
          </span>
        </div>
      </div>

      {/* Lots Table */}
      {loading && lots.length === 0 ? (
        <div className="py-8 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span className="text-xs font-mono">Querying lot telemetry...</span>
        </div>
      ) : error ? (
        <div className="p-3 bg-rose-50 text-rose-700 text-xs font-mono rounded-lg border border-rose-200">
          {error}
        </div>
      ) : lots.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-mono">
          No inventory lots found for this material specification.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50/70 text-slate-500 text-[10px] font-mono font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Lot #</th>
                <th className="px-3 py-2.5">Batch Code</th>
                <th className="px-3 py-2.5">Quantity</th>
                <th className="px-3 py-2.5">Received Date</th>
                <th className="px-3 py-2.5">Expiry Date (FEFO)</th>
                <th className="px-3 py-2.5">Supplier</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {lots.map((lot) => (
                <tr key={lot._id || lot.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                    {lot.lotNumber || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px]">
                    {lot.batchCode || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                    {Number(lot.quantity || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px]">
                    {lot.receivedDate
                      ? new Date(lot.receivedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {getExpiryBadge(lot.expiryDate)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    {lot.supplier || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {getStatusBadge(lot.status)}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={consumeLoading || Number(lot.quantity) <= 0}
                      onClick={() => handleConsume(lot)}
                      className="px-2.5 py-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition disabled:opacity-40"
                    >
                      Consume
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
