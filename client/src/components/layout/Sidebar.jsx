import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Factory,
  TrendingUp,
  Trash2,
  Bell,
  Cpu,
  Layers,
  ShieldCheck,
  Activity,
} from 'lucide-react';

const navSections = [
  {
    title: 'OPERATIONS & TELEMETRY',
    items: [
      { name: 'Dashboard Overview', path: '/', icon: LayoutDashboard },
      { name: 'Inventory & Lots', path: '/inventory', icon: Package, badge: 'FEFO' },
      { name: 'Production Batches', path: '/production', icon: Factory },
    ],
  },
  {
    title: 'INTELLIGENCE & QUALITY',
    items: [
      { name: 'AI Demand Forecast', path: '/forecasting', icon: TrendingUp, badge: 'AI' },
      { name: 'Waste & Spoilage', path: '/waste', icon: Trash2 },
      { name: 'System Alerts', path: '/alerts', icon: Bell },
    ],
  },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#070C09] text-slate-300 flex flex-col justify-between flex-shrink-0 select-none border-r border-emerald-950/60 shadow-[4px_0_24px_rgba(0,0,0,0.25)] z-30">
      <div>
        {/* Brand / OS Identity */}
        <div className="h-16 flex items-center px-5 border-b border-white/[0.06] bg-gradient-to-r from-emerald-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wider text-sm font-mono">FOODFLOW</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OS
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block leading-none mt-0.5">
                SUPPLY CHAIN ML
              </span>
            </div>
          </div>
        </div>

        {/* Facility & Plant Telemetry Pill */}
        <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-emerald-950/30 border border-emerald-800/30">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-emerald-200/90 font-medium">FAC-01 • LINE OPS</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-900/40 px-1 rounded">
              ONLINE
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5 mt-1">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-300">
                {section.title}
              </div>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-300 border-l-2 border-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            isActive
                              ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40'
                              : 'bg-white/[0.06] text-slate-400 border border-white/[0.06]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Telemetry Status */}
      <div className="p-3 border-t border-white/[0.06] bg-[#050806]">
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              FEFO COMPLIANCE
            </span>
            <span className="text-[10px] font-mono font-medium text-emerald-400">100% PASS</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
              <Activity className="w-3 h-3 text-emerald-400" />
              TELEMETRY SYNC
            </span>
            <span className="text-[10px] font-mono text-slate-400">0.4s</span>
          </div>
        </div>

        <div className="mt-2.5 px-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>SHIFT A • OPS MGR</span>
          <span className="text-emerald-500/70 font-semibold">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
