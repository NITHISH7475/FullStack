import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Trash2 } from 'lucide-react';

const PALETTE = ['#f43f5e', '#f97316', '#f59e0b', '#06b6d4', '#8b5cf6', '#64748b'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs font-mono">
        <p className="font-bold text-slate-200 mb-1 border-b border-slate-700 pb-1">{data.name}</p>
        <p className="text-slate-300">
          Loss: <span className="font-bold text-rose-400">{data.value}</span> kg
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = (props) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 px-2 pt-2">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600">
          <span
            className="block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          ></span>
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

function WasteChart({ data = [] }) {
  const totalLoss = data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-slate-200/90 p-6 flex flex-col h-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            ROOT-CAUSE BREAKDOWN
          </span>
          <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
            Manufacturing Loss Attribution
          </h3>
          <p className="text-xs text-slate-500">Distribution by operational cause</p>
        </div>
        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
          <Trash2 className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px] relative">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || PALETTE[index % PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend />}
              verticalAlign="bottom"
              height={70}
              wrapperStyle={{ bottom: 0 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default WasteChart;