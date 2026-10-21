import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  Factory,
  Bell,
  X,
  ArrowRight,
  Loader2,
  Command,
  CornerDownLeft,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import AlertBell from '../alerts/AlertBell';
import { materialAPI, productionAPI, alertAPI } from '../../services/api';

const pageMetadata = {
  '/': {
    title: 'Operations Dashboard',
    category: 'TELEMETRY & CONTROL',
    description: 'Real-time plant telemetry, FEFO inventory, and automated waste mitigation',
  },
  '/inventory': {
    title: 'Inventory & Raw Materials',
    category: 'MATERIAL RESOURCE PLANNING',
    description: 'Active lots, FEFO expiration queues, and safety stock levels',
  },
  '/production': {
    title: 'Production Batches',
    category: 'MANUFACTURING EXECUTION',
    description: 'Scheduled batch runs, yield ratios, and material allocation',
  },
  '/forecasting': {
    title: 'AI Demand Forecasting',
    category: 'PREDICTIVE INTELLIGENCE',
    description: 'Multi-variable demand models, safety thresholds, and SKU projections',
  },
  '/waste': {
    title: 'Waste & Spoilage Analytics',
    category: 'LOSS MITIGATION',
    description: 'Root-cause attribution, financial impact, and waste reduction KPIs',
  },
  '/alerts': {
    title: 'Plant Alerts & System Logs',
    category: 'FACILITY SAFETY',
    description: 'Critical thresholds, expiry warnings, and equipment notifications',
  },
};

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // Command Palette State
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({ materials: [], batches: [], alerts: [] });
  const inputRef = useRef(null);

  // Global Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when command palette opens
  useEffect(() => {
    if (isCommandOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setResults({ materials: [], batches: [], alerts: [] });
    }
  }, [isCommandOpen]);

  // Debounced live search
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setResults({ materials: [], batches: [], alerts: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [matRes, batchRes, alertRes] = await Promise.allSettled([
          materialAPI.getAll(),
          productionAPI.getAll(),
          alertAPI.getAll(),
        ]);

        const rawMaterials = matRes.status === 'fulfilled' ? (matRes.value.data?.data || matRes.value.data || []) : [];
        const rawBatches = batchRes.status === 'fulfilled' ? (batchRes.value.data?.data || batchRes.value.data || []) : [];
        const rawAlerts = alertRes.status === 'fulfilled' ? (alertRes.value.data?.data || alertRes.value.data || []) : [];

        const matchedMaterials = rawMaterials
          .filter(
            (m) =>
              (m.name && m.name.toLowerCase().includes(query)) ||
              (m.sku && m.sku.toLowerCase().includes(query)) ||
              (m.category && m.category.toLowerCase().includes(query))
          )
          .slice(0, 4);

        const matchedBatches = rawBatches
          .filter(
            (b) =>
              (b.batchNumber && b.batchNumber.toLowerCase().includes(query)) ||
              (b.productName && b.productName.toLowerCase().includes(query)) ||
              (b.productSku && b.productSku.toLowerCase().includes(query))
          )
          .slice(0, 4);

        const matchedAlerts = rawAlerts
          .filter(
            (a) =>
              (a.title && a.title.toLowerCase().includes(query)) ||
              (a.message && a.message.toLowerCase().includes(query)) ||
              (a.type && a.type.toLowerCase().includes(query))
          )
          .slice(0, 3);

        setResults({
          materials: matchedMaterials,
          batches: matchedBatches,
          alerts: matchedAlerts,
        });
      } catch (err) {
        console.error('Command search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (path) => {
    setIsCommandOpen(false);
    navigate(path);
  };

  const hasResults =
    results.materials.length > 0 || results.batches.length > 0 || results.alerts.length > 0;

  // Resolve current active route title
  const matchedPath = Object.keys(pageMetadata).find(
    (path) => path === location.pathname || (path !== '/' && location.pathname.startsWith(path))
  );
  const activeMeta = pageMetadata[matchedPath] || {
    title: 'Plant Operations',
    category: 'SUPPLY CHAIN OPERATIONS',
    description: 'Industrial food manufacturing and supply chain control',
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Left: Section Context & Title (No Wrapping Bug) */}
        <div className="flex items-center gap-4 min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-slate-500">
                {activeMeta.category}
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono font-semibold text-emerald-700">LIVE SYNC</span>
              </div>
            </div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none mt-0.5 truncate">
              {activeMeta.title}
            </h1>
          </div>
        </div>

        {/* Right Controls: Command Palette Pill & Alert Center */}
        <div className="flex items-center gap-3">
          {/* Linear-Style Command Bar Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-lg text-xs text-slate-500 hover:text-slate-800 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] group cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span className="hidden sm:inline font-normal">Search materials, batches, SKUs...</span>
            <span className="inline sm:hidden font-normal">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          {/* Plant Alert Bell with Unread Count */}
          <div className="pl-2 border-l border-slate-200 flex items-center">
            <AlertBell />
          </div>

          {/* Operator Badge */}
          <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center border border-emerald-800/50 shadow-xs">
              OP
            </div>
            <div className="leading-tight text-left">
              <div className="text-xs font-semibold text-slate-800">Shift A Lead</div>
              <div className="text-[10px] font-mono text-slate-500">FACILITY-01</div>
            </div>
          </div>
        </div>
      </header>

      {/* Centered Spotlight Command Modal (Linear / Raycast Experience) */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Search Input */}
            <div className="p-3.5 flex items-center gap-3 bg-white">
              <Search className="w-5 h-5 text-emerald-600 shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a material, SKU, batch #, or alert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results Body */}
            <div className="overflow-y-auto p-2 divide-y divide-slate-100 flex-1">
              {searchQuery.trim().length < 2 && (
                <div className="p-8 text-center text-slate-400">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Command className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">Quick Supply Chain Jump</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Search materials by SKU, production batches by lot number, or active plant alerts.
                  </p>
                </div>
              )}

              {!isSearching && searchQuery.trim().length >= 2 && !hasResults && (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs font-semibold text-slate-700">No matching telemetry records</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    No raw materials, batches, or alerts matched "{searchQuery}".
                  </p>
                </div>
              )}

              {/* Group: Materials */}
              {results.materials.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Raw Materials & Lots ({results.materials.length})</span>
                  </div>
                  {results.materials.map((m) => (
                    <button
                      key={m._id || m.id}
                      type="button"
                      onClick={() => handleSelectResult('/inventory')}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono text-xs font-bold border border-emerald-100">
                          {m.name ? m.name.charAt(0) : 'M'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {m.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            SKU: {m.sku} • {m.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {m.currentStock ?? 0} {m.unit || 'kg'}
                        </span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Group: Production Batches */}
              {results.batches.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-amber-600" />
                    <span>Production Batches ({results.batches.length})</span>
                  </div>
                  {results.batches.map((b) => (
                    <button
                      key={b._id || b.id}
                      type="button"
                      onClick={() => handleSelectResult('/production')}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-amber-50 text-amber-700 flex items-center justify-center font-mono text-xs font-bold border border-amber-100">
                          #
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                            {b.batchNumber}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.productName} • {b.productionLine || 'Line A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          {b.status || 'planned'}
                        </span>
                        <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Group: Alerts */}
              {results.alerts.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Active Notifications ({results.alerts.length})</span>
                  </div>
                  {results.alerts.map((a) => (
                    <button
                      key={a._id || a.id}
                      type="button"
                      onClick={() => handleSelectResult('/alerts')}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition flex items-center justify-between group"
                    >
                      <div className="max-w-[75%]">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-rose-700 transition-colors truncate">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{a.message}</div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                        {a.severity || 'info'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Keyboard Shortcuts Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↵</kbd> Select
                </span>
                <span>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px]">esc</kbd> Dismiss
                </span>
              </div>
              <span className="text-[10px] text-slate-500">FOODFLOW TELEMETRY SEARCH</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;