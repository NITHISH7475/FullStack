import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const CAUSE_COLOR_MAP = {
  spoilage: '#f43f5e',          // rose-500
  'equipment-failure': '#f97316', // orange-500
  'over-production': '#f59e0b',   // amber-500
  'quality-rejection': '#38bdf8', // sky-500
  'handling-damage': '#a855f7',   // purple-500
  other: '#64748b',               // slate-500
};

const LINE_COLOR_MAP = {
  'Line A': '#0284c7', // sky-600
  'Line B': '#10b981', // emerald-500
  'Line C': '#f59e0b', // amber-500
  'Line D': '#8b5cf6', // violet-500
};

// Custom Legend Component to fix alignment and wrapping issues
const CustomLegend = (props) => {
  const { payload } = props;
  
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
          <span 
            className="block w-2 h-2 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          ></span>
          <span className="capitalize">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default function WasteAttributionChart({ categoryData = [], lineData = [] }) {
  // Normalize category/cause data
  const normalizedCategory = categoryData.map((item) => {
    const key = (item.cause || item.name || item._id || 'other').toLowerCase();
    return {
      name: item.name || item.cause || item._id || 'Other',
      value: Number(item.totalQuantity || item.value || item.count || 0),
      color: CAUSE_COLOR_MAP[key] || '#94a3b8',
    };
  });

  // Normalize line data
  const normalizedLine = lineData.map((item) => {
    const lineName = item.line || item.productionLine || item._id || item.name || 'Line A';
    return {
      line: lineName,
      quantity: Number(item.totalQuantity || item.quantity || item.value || 0),
      cost: Number(item.totalCost || item.cost || 0),
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Chart: Waste by Cause (Pie Chart) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
        <div className="mb-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 mb-0.5">
            ROOT-CAUSE TELEMETRY
          </div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">Waste by Root Cause</h3>
          <p className="text-xs text-slate-500">Distribution of losses across operational attribution categories</p>
        </div>
        <div className="h-80 w-full flex-1">
          {normalizedCategory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-400">
              No category attribution telemetry recorded.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalizedCategory}
                  cx="50%"
                  cy="40%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {normalizedCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${Number(val).toLocaleString()} units`, 'Loss Volume']}
                  contentStyle={{
                    backgroundColor: '#070C09',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend 
                  content={<CustomLegend />} 
                  verticalAlign="bottom" 
                  height={80} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Right Chart: Waste by Production Line (Bar Chart) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col">
        <div className="mb-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 mb-0.5">
            FACILITY SUB-SYSTEM BREAKDOWN
          </div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">Waste by Production Line</h3>
          <p className="text-xs text-slate-500">Comparative losses incurred across manufacturing lines</p>
        </div>
        <div className="h-80 w-full flex-1">
          {normalizedLine.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-400">
              No production line attribution telemetry recorded.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={normalizedLine}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="line"
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'quantity' ? `${Number(val).toLocaleString()} units` : `$${Number(val).toLocaleString()}`,
                    name === 'quantity' ? 'Waste Volume' : 'Cost Impact',
                  ]}
                  contentStyle={{
                    backgroundColor: '#070C09',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar
                  dataKey="quantity"
                  name="Waste Volume"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {normalizedLine.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={LINE_COLOR_MAP[entry.line] || '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}