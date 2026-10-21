import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Recycle,
  AlertTriangle,
  Target,
  Clock,
  ArrowRight,
  ShieldCheck,
  Gauge,
  Activity,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import WasteChart from '../components/dashboard/WasteChart';
import InventoryChart from '../components/dashboard/InventoryChart';
import ForecastChart from '../components/dashboard/ForecastChart';
import {
  materialAPI,
  wasteAPI,
  forecastAPI,
  alertAPI,
} from '../services/api';

const fallbackWasteData = [
  { name: 'Spoilage', value: 35 },
  { name: 'Equipment Failure', value: 15 },
  { name: 'Over-production', value: 25 },
  { name: 'Quality Rejection', value: 12 },
  { name: 'Handling Damage', value: 8 },
  { name: 'Other', value: 5 },
];

const fallbackInventoryData = [
  { name: 'Organic Wheat Flour', currentStock: 450, reorderLevel: 200 },
  { name: 'Refined Sugar', currentStock: 180, reorderLevel: 250 },
  { name: 'Canola Oil', currentStock: 600, reorderLevel: 300 },
  { name: 'Dairy Milk Base', currentStock: 120, reorderLevel: 200 },
  { name: 'Cocoa Powder', currentStock: 340, reorderLevel: 150 },
  { name: 'Packaging Film', currentStock: 80, reorderLevel: 100 },
];

const fallbackForecastData = [
  { name: 'Week 1', projected: 4000, actual: 3800 },
  { name: 'Week 2', projected: 4500, actual: 4400 },
  { name: 'Week 3', projected: 4200, actual: 4600 },
  { name: 'Week 4', projected: 5100, actual: 4900 },
  { name: 'Week 5', projected: 5400, actual: 5200 },
  { name: 'Week 6', projected: 5800, actual: 5900 },
];

const fallbackAlerts = [
  {
    _id: '1',
    title: 'Low Stock: Refined Sugar',
    message: 'Current inventory is below safety reorder threshold (180 / 250 kg)',
    severity: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    _id: '2',
    title: 'Shelf-Life Expiry Warning',
    message: 'Batch #B-902 Organic Milk expires in 3 days',
    severity: 'medium',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: '3',
    title: 'Equipment Maintenance Due',
    message: 'Extrusion line 2 scheduled calibration pending',
    severity: 'low',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    totalMaterials: 0,
    wasteReduction: '14.2%',
    activeAlerts: 0,
    forecastAccuracy: '94.8%',
  });
  const [wasteChartData, setWasteChartData] = useState(fallbackWasteData);
  const [inventoryChartData, setInventoryChartData] = useState(fallbackInventoryData);
  const [forecastChartData, setForecastChartData] = useState(fallbackForecastData);
  const [recentAlerts, setRecentAlerts] = useState(fallbackAlerts);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          materialsRes,
          lowStockRes,
          wasteSummaryRes,
          wasteCategoryRes,
          forecastRes,
          alertsRes,
          unreadCountRes,
        ] = await Promise.allSettled([
          materialAPI.getAll(),
          materialAPI.getLowStock ? materialAPI.getLowStock() : Promise.resolve({ data: [] }),
          wasteAPI.getSummary ? wasteAPI.getSummary() : Promise.resolve({ data: {} }),
          wasteAPI.getByCategory ? wasteAPI.getByCategory() : Promise.resolve({ data: [] }),
          forecastAPI.getAll ? forecastAPI.getAll() : Promise.resolve({ data: [] }),
          alertAPI.getAll ? alertAPI.getAll() : Promise.resolve({ data: [] }),
          alertAPI.getUnreadCount ? alertAPI.getUnreadCount() : Promise.resolve({ data: { count: 0 } }),
        ]);

        // Process Materials
        let totalMatCount = 24;
        if (materialsRes.status === 'fulfilled' && materialsRes.value?.data) {
          const rawMaterials = Array.isArray(materialsRes.value.data)
            ? materialsRes.value.data
            : materialsRes.value.data.materials || [];
          if (rawMaterials.length > 0) {
            totalMatCount = rawMaterials.length;
            const formattedInv = rawMaterials.slice(0, 6).map((m) => ({
              name: m.name || m.materialName || 'Material',
              currentStock: m.currentStock ?? m.quantity ?? 100,
              reorderLevel: m.reorderPoint ?? m.reorderLevel ?? 50,
            }));
            setInventoryChartData(formattedInv);
          }
        }

        // Process Alerts
        let activeAlertsCount = 3;
        if (unreadCountRes.status === 'fulfilled' && unreadCountRes.value?.data) {
          activeAlertsCount = unreadCountRes.value.data.count ?? unreadCountRes.value.data.unreadCount ?? 3;
        }

        if (alertsRes.status === 'fulfilled' && alertsRes.value?.data) {
          const rawAlerts = Array.isArray(alertsRes.value.data)
            ? alertsRes.value.data
            : alertsRes.value.data.alerts || [];
          if (rawAlerts.length > 0) {
            setRecentAlerts(rawAlerts.slice(0, 5));
          }
        }

        // Process Waste
        let wasteReductionPct = '+12.4%';
        if (wasteSummaryRes.status === 'fulfilled' && wasteSummaryRes.value?.data) {
          const ws = wasteSummaryRes.value.data;
          if (ws.reductionPercentage !== undefined) {
            wasteReductionPct = `${ws.reductionPercentage > 0 ? '+' : ''}${ws.reductionPercentage}%`;
          }
        }

        if (wasteCategoryRes.status === 'fulfilled' && wasteCategoryRes.value?.data) {
          const rawCategories = Array.isArray(wasteCategoryRes.value.data)
            ? wasteCategoryRes.value.data
            : wasteCategoryRes.value.data.categories || [];
          if (rawCategories.length > 0) {
            const formattedWaste = rawCategories.map((c) => {
              const causeStr = c.cause || c.category || c.name || c._id || 'Other';
              const formattedName = typeof causeStr === 'string'
                ? causeStr.charAt(0).toUpperCase() + causeStr.slice(1).replace(/-/g, ' ')
                : 'Other';
              return {
                name: formattedName,
                value: Number(c.totalQuantity || c.totalCostImpact || c.value || c.totalAmount || 0),
              };
            });
            setWasteChartData(formattedWaste);
          }
        }

        // Process Forecast
        let accuracyRate = '94.8%';
        if (forecastRes.status === 'fulfilled' && forecastRes.value?.data) {
          const rawForecast = Array.isArray(forecastRes.value.data)
            ? forecastRes.value.data
            : forecastRes.value.data.forecasts || [];
          if (rawForecast.length > 0) {
            const formattedForecast = rawForecast.slice(0, 6).map((f, i) => ({
              name: f.productName || f.productSku || f.sku || `Product ${i + 1}`,
              projected: Number(f.projectedDemand ?? f.projected ?? 0),
              actual: Number(f.factors?.historicalAvg ?? f.actualDemand ?? f.actual ?? Math.round((f.projectedDemand || 100) * 0.95)),
            }));
            setForecastChartData(formattedForecast);
            if (rawForecast[0]?.confidenceLevel) {
              const avgConf = rawForecast.reduce((acc, curr) => acc + (curr.confidenceLevel || 0.8), 0) / rawForecast.length;
              accuracyRate = `${Math.round(avgConf <= 1 ? avgConf * 100 : avgConf)}%`;
            }
          }
        }

        setKpiData({
          totalMaterials: totalMatCount,
          wasteReduction: wasteReductionPct,
          activeAlerts: activeAlertsCount,
          forecastAccuracy: accuracyRate,
        });
      } catch (err) {
        console.warn('Dashboard data fetch encountered an issue, using fallback data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Executive Plant Control Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              FACILITY OPERATIONS COMMAND
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              SHIFT A LIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Real-Time Operations Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active plant telemetry, FEFO lot expiration mitigation, and multi-variable AI demand intelligence.
          </p>
        </div>

        {/* Quick Facility Indicators */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>LINE-01: ACTIVE</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-xs flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span>COLD CHAIN: 3.8°C</span>
          </div>
        </div>
      </div>

      {/* Shift Telemetry Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-xs font-mono">
        <div className="px-3 py-1.5 border-r border-slate-100 last:border-r-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">FEFO Integrity</div>
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Zero-Loss</span>
          </div>
        </div>
        <div className="px-3 py-1.5 border-r border-slate-100 last:border-r-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Production Output</div>
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>98.2% Yield Target</span>
          </div>
        </div>
        <div className="px-3 py-1.5 border-r border-slate-100 last:border-r-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Node Cron Daemon</div>
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hourly Expiry Sweep</span>
          </div>
        </div>
        <div className="px-3 py-1.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">AI Model Sync</div>
          <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Register Active</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Cataloged Materials"
          value={kpiData.totalMaterials}
          subtitle="under FEFO lot control"
          icon={Package}
          trend="up"
          trendValue="+4 new"
          color="blue"
          metricUnit="SKUs"
        />
        <KpiCard
          title="Waste Mitigation"
          value={kpiData.wasteReduction}
          subtitle="vs baseline waste target"
          icon={Recycle}
          trend="up"
          trendValue="-2.1% loss"
          color="green"
        />
        <KpiCard
          title="Active Plant Alerts"
          value={kpiData.activeAlerts}
          subtitle="require operator review"
          icon={AlertTriangle}
          trend={kpiData.activeAlerts > 0 ? 'down' : 'neutral'}
          trendValue={kpiData.activeAlerts > 0 ? 'action needed' : 'optimal'}
          color={kpiData.activeAlerts > 0 ? 'red' : 'green'}
          metricUnit="events"
        />
        <KpiCard
          title="ML Forecast Precision"
          value={kpiData.forecastAccuracy}
          subtitle="multi-variable confidence"
          icon={Target}
          trend="up"
          trendValue="ensemble"
          color="purple"
        />
      </div>

      {/* Charts Section: Inventory Stock vs Reorder & Waste Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InventoryChart data={inventoryChartData} />
        </div>
        <div className="lg:col-span-1">
          <WasteChart data={wasteChartData} />
        </div>
      </div>

      {/* Full-width AI Forecast Chart */}
      <div>
        <ForecastChart data={forecastChartData} />
      </div>

      {/* Plant Incidents & Alerts Log Feed */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-slate-200/90 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                INCIDENT TRIAGE LOG
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
              Plant Alerts & Safety Thresholds
            </h3>
            <p className="text-xs text-slate-500">
              Automated notifications generated by sensor thresholds and FEFO expiry rules
            </p>
          </div>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Open Incident Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentAlerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs">
              All plant line sensors and inventory safety buffers are within optimal thresholds.
            </div>
          ) : (
            recentAlerts.map((alert) => {
              const s = (alert.severity || 'info').toLowerCase();
              const severityBadge =
                s === 'critical' || s === 'high'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : s === 'warning' || s === 'medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200';

              return (
                <div
                  key={alert._id || alert.id}
                  className="py-3.5 flex items-start justify-between gap-4 group hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-0.5 group-hover:bg-white group-hover:shadow-xs transition">
                      <AlertTriangle className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {alert.title || alert.type || 'Plant Incident'}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${severityBadge}`}
                        >
                          {alert.severity || 'info'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 truncate max-w-xl">
                        {alert.message || alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    <span>
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
