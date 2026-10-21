import React, { useState, useEffect, useCallback } from 'react';
import { forecastAPI } from '../services/api';
import {
  RefreshCw,
  TrendingUp,
  BrainCircuit,
  Package,
  Layers,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Forecasting() {
  const [forecasts, setForecasts] = useState([]);
  const [demandVsInventory, setDemandVsInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fRes, dRes] = await Promise.allSettled([
        forecastAPI.getAll(),
        forecastAPI.getDemandVsInventory(),
      ]);

      if (fRes.status === 'fulfilled') {
        setForecasts(fRes.value.data?.data || fRes.value.data || []);
      }
      if (dRes.status === 'fulfilled') {
        setDemandVsInventory(dRes.value.data?.data || dRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load forecast data:', err);
      setError('Unable to fetch forecast data from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      await forecastAPI.generateAll();
      await fetchData();
    } catch (err) {
      console.error('Failed to generate AI forecasts:', err);
      alert(err.response?.data?.message || 'Error generating forecasts.');
    } finally {
      setGenerating(false);
    }
  };

  // Prepare chart data
  const chartData = forecasts.map((fc) => ({
    name: fc.productName || fc.productSku || fc.sku || 'Product',
    demand: Number(fc.projectedDemand || fc.forecastedDemand || 0),
  }));

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'sufficient' || s === 'safe' || s === 'optimal') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          Sufficient
        </span>
      );
    }
    if (s === 'at risk' || s === 'warning' || s === 'at_risk' || s === 'low') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          At Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
        Critical Gap
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              PREDICTIVE INTELLIGENCE
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ML ENGINE ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">AI Demand Forecasting</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Machine learning projections synthesized with historical sales, seasonal trends, and perishable safety stocks.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Calculating Forecasts...' : 'Generate All Forecasts'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 text-xs font-mono rounded-lg border border-rose-200">
          {error}
        </div>
      )}

      {/* Forecast Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
              PREDICTIVE MODEL INVENTORY
            </div>
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Projected Demand Models</h2>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded">{forecasts.length} active models</span>
        </div>

        {loading && forecasts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200/90 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p>Evaluating historical telemetry & generating ML projections...</p>
          </div>
        ) : forecasts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300 p-8">
            <BrainCircuit className="w-10 h-10 mx-auto mb-3 text-emerald-600 opacity-80" />
            <h3 className="text-base font-semibold text-slate-900">No Forecast Models Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Click 'Generate All Forecasts' to execute baseline predictive demand calculations for inventory items.
            </p>
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={generating}
              className="inline-flex items-center px-3 py-1.5 text-xs font-mono font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition shadow-sm shadow-emerald-600/20"
            >
              Generate Models
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {forecasts.map((fc) => {
              const rawConf = fc.confidenceLevel ?? fc.confidence ?? 0.85;
              const confidence = Math.min(
                Math.max(Number(rawConf <= 1 ? Math.round(rawConf * 100) : Math.round(rawConf)), 0),
                100
              );
              const factors = fc.factorsBreakdown || fc.factors || {};
              const histAvg = Number(factors.historicalAvg || factors.historical || 120);
              const seasonalIndex = Number(factors.seasonalIndex || factors.seasonal || 1.0);
              const promoLift = Number(factors.promotionLift || factors.promo || 0);
              const volatility = Number(factors.volatilityAdjustment || factors.volatility || 1.0);
              const skuDisplay = fc.productSku || fc.sku || 'N/A';

              return (
                <div
                  key={fc._id || fc.id || skuDisplay}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all"
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                          {fc.productName || 'Product Model'}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{skuDisplay}</p>
                      </div>
                      {fc.isPerishable ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          Perishable
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          Non-Perishable
                        </span>
                      )}
                    </div>

                    {/* Projected Demand Metric */}
                    <div className="my-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Projected Demand (Next 30D)</span>
                      <div className="flex items-baseline space-x-1.5 mt-0.5">
                        <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                          {Number(fc.projectedDemand || fc.forecastedDemand || 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-slate-400">units</span>
                      </div>
                    </div>

                    {/* Confidence Progress Bar */}
                    <div className="space-y-1.5 mb-4 font-mono">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Model Confidence</span>
                        <span className="font-bold text-slate-800 text-xs">{confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Factor Breakdown */}
                  <div className="pt-3 border-t border-slate-100 text-xs font-mono space-y-1.5 text-slate-600 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-xl">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                      Attribution Weights
                    </p>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Historical Avg:</span>
                      <span className="font-semibold text-slate-800">{histAvg} units</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Seasonal Index:</span>
                      <span className="font-semibold text-slate-800">{seasonalIndex}x</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Promotion Lift:</span>
                      <span className="font-semibold text-slate-800">
                        {promoLift > 0 ? `+${promoLift}%` : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Volatility Factor:</span>
                      <span className="font-semibold text-slate-800">{volatility}x</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart: Projected Demand Across Products */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="mb-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">PORTFOLIO DEMAND</span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">Projected Demand Across Portfolio</h3>
            <p className="text-xs text-slate-500">Comparative forecast volume across all products</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [`${Number(val).toLocaleString()} units`, 'Projected Demand']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Bar dataKey="demand" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Demand vs Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">MATERIAL RECONCILIATION</span>
          <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">Demand vs. Inventory Gap Analysis</h3>
          <p className="text-xs text-slate-500">
            Real-time reconciliation of current inventory on hand versus forecasted 30-day demand run rate.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200/80">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead className="bg-slate-50/90 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Product / SKU</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Forecasted 30D</th>
                <th className="px-4 py-3">Gap (Stock - Demand)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {demandVsInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-mono text-xs">
                    No demand vs inventory reconciliation data available.
                  </td>
                </tr>
              ) : (
                demandVsInventory.map((item, idx) => {
                  const stock = Number(item.currentStock || item.stock || 0);
                  const demand = Number(item.forecastedDemand || item.demand || 0);
                  const gap = item.gap !== undefined ? Number(item.gap) : stock - demand;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition text-xs font-mono">
                      <td className="px-4 py-3.5">
                        <div className="font-sans font-semibold text-slate-900 text-xs">{item.product || item.productName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {stock.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {demand.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        <span className={gap < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {gap > 0 ? `+${gap.toLocaleString()}` : gap.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(item.status || (gap < 0 ? 'Critical' : gap < demand * 0.2 ? 'At Risk' : 'Sufficient'))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
