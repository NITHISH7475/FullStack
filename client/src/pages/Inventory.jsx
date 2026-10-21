import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { materialAPI, inventoryAPI } from '../services/api';
import MaterialTable from '../components/inventory/MaterialTable';
import MaterialForm from '../components/inventory/MaterialForm';
import LotTracker from '../components/inventory/LotTracker';
import { Plus, Search, Filter, AlertTriangle, Package, RefreshCw, X } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Produce',
  'Dairy',
  'Grains',
  'Meat',
  'Spices',
  'Oils',
  'Packaging',
  'Other'
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'expiring'
  const [materials, setMaterials] = useState([]);
  const [expiringLots, setExpiringLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [perishableOnly, setPerishableOnly] = useState(false);

  // Selected Material for LotTracker
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Delete Confirmation Modal
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await materialAPI.getAll();
      const data = res.data?.data || res.data || [];
      setMaterials(data);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err.response?.data?.message || 'Failed to load materials.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExpiringLots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryAPI.getExpiring(7);
      const data = res.data?.data || res.data || [];
      setExpiringLots(data);
    } catch (err) {
      console.error('Error fetching expiring inventory lots:', err);
      setError(err.response?.data?.message || 'Failed to load expiring lots.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'materials') {
      fetchMaterials();
    } else {
      fetchExpiringLots();
    }
  }, [activeTab, fetchMaterials, fetchExpiringLots]);

  // Filtering materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchPerishable = !perishableOnly || Boolean(item.isPerishable);
      return matchSearch && matchCategory && matchPerishable;
    });
  }, [materials, searchTerm, selectedCategory, perishableOnly]);

  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (material) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingMaterial) {
        await materialAPI.update(editingMaterial._id || editingMaterial.id, formData);
      } else {
        await materialAPI.create(formData);
      }
      setIsFormOpen(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err) {
      console.error('Failed to save material:', err);
      alert(err.response?.data?.message || 'Error saving material.');
    }
  };

  const handleDeletePrompt = (material) => {
    setMaterialToDelete(material);
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    try {
      setIsDeleting(true);
      await materialAPI.delete(materialToDelete._id || materialToDelete.id);
      if (selectedMaterial && (selectedMaterial._id || selectedMaterial.id) === (materialToDelete._id || materialToDelete.id)) {
        setSelectedMaterial(null);
      }
      setMaterialToDelete(null);
      fetchMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      alert(err.response?.data?.message || 'Failed to delete material.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              MATERIAL RESOURCE PLANNING
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              FEFO ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track raw material inventory, safety reorder thresholds, and FEFO lot expirations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Material
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition -mb-px flex items-center space-x-2 ${
            activeTab === 'materials'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Raw Materials ({materials.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-2.5 font-semibold border-b-2 transition -mb-px flex items-center space-x-2 ${
            activeTab === 'expiring'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Expiring Lots (&lt; 7 Days)</span>
        </button>
      </div>

      {/* Tab: Materials */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-3 justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder:text-slate-400"
              />
            </div>

            {/* Category Dropdown & Perishable Toggle */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
              <div className="flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-700 font-mono"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer select-none px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={perishableOnly}
                  onChange={(e) => setPerishableOnly(e.target.checked)}
                  className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="font-mono text-[11px]">Perishable Only</span>
              </label>

              <button
                type="button"
                onClick={fetchMaterials}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                title="Refresh inventory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && materials.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              <p>Loading material registry...</p>
            </div>
          ) : (
            <>
              {/* Material Table */}
              <MaterialTable
                materials={filteredMaterials}
                onEdit={handleOpenEdit}
                onDelete={handleDeletePrompt}
                onSelectMaterial={(item) => setSelectedMaterial(item)}
                selectedMaterialId={selectedMaterial?._id || selectedMaterial?.id}
              />

              {/* Lot Tracker for selected material */}
              {selectedMaterial && (
                <div className="pt-2">
                  <LotTracker
                    materialId={selectedMaterial._id || selectedMaterial.id}
                    materialName={selectedMaterial.name}
                    onInventoryUpdated={fetchMaterials}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Expiring Lots */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Lots Expiring Within 7 Days
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Immediate FEFO priority required. Reallocate to scheduled production lines or mark for disposal.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchExpiringLots}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-red-600" />
              <p className="text-sm">Fetching expiring lot records...</p>
            </div>
          ) : expiringLots.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
              <p className="text-sm font-medium text-gray-700">No lots are expiring in the next 7 days.</p>
              <p className="text-xs text-gray-400 mt-1">Inventory is within healthy shelf life thresholds.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Lot Number</th>
                    <th className="px-4 py-3">Batch Code</th>
                    <th className="px-4 py-3">Remaining Qty</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Days Remaining</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expiringLots.map((lot) => {
                    const daysLeft = lot.expiryDate
                      ? Math.ceil((new Date(lot.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : 'N/A';
                    return (
                      <tr key={lot._id || lot.id} className="hover:bg-red-50/40 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {lot.material?.name || lot.materialName || 'Material'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {lot.lotNumber || '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {lot.batchCode || '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {Number(lot.quantity || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {lot.expiryDate
                            ? new Date(lot.expiryDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            daysLeft <= 2 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {daysLeft} days
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            Expiring Soon
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Material Modal Form */}
      <MaterialForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        material={editingMaterial}
      />

      {/* Delete Confirmation Modal */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 my-4">
              Are you sure you want to delete material{' '}
              <strong className="text-gray-900">{materialToDelete.name}</strong> (SKU: {materialToDelete.sku})? This will permanently remove its tracking records.
            </p>
            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Material'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
