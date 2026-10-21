import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CATEGORIES = [
  'Produce',
  'Dairy',
  'Grains',
  'Meat',
  'Spices',
  'Oils',
  'Packaging',
  'Other'
];

export default function MaterialForm({ isOpen, onClose, onSubmit, material = null }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Produce',
    unit: 'kg',
    currentStock: 0,
    reorderLevel: 0,
    costPerUnit: 0,
    shelfLifeDays: 30,
    isPerishable: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        sku: material.sku || '',
        category: material.category || 'Produce',
        unit: material.unit || 'kg',
        currentStock: material.currentStock !== undefined ? material.currentStock : 0,
        reorderLevel: material.reorderLevel !== undefined ? material.reorderLevel : 0,
        costPerUnit: material.costPerUnit !== undefined ? material.costPerUnit : 0,
        shelfLifeDays: material.shelfLifeDays !== undefined ? material.shelfLifeDays : 30,
        isPerishable: Boolean(material.isPerishable),
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Produce',
        unit: 'kg',
        currentStock: 0,
        reorderLevel: 0,
        costPerUnit: 0,
        shelfLifeDays: 30,
        isPerishable: false,
      });
    }
    setErrors({});
  }, [material, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU is required';
    if (!formData.category) errs.category = 'Category is required';
    if (!formData.unit.trim()) errs.unit = 'Unit is required';
    if (formData.currentStock === '' || Number(formData.currentStock) < 0) {
      errs.currentStock = 'Stock must be 0 or greater';
    }
    if (formData.reorderLevel === '' || Number(formData.reorderLevel) < 0) {
      errs.reorderLevel = 'Reorder level must be 0 or greater';
    }
    if (formData.costPerUnit === '' || Number(formData.costPerUnit) < 0) {
      errs.costPerUnit = 'Cost per unit must be 0 or greater';
    }
    if (formData.isPerishable && (!formData.shelfLifeDays || Number(formData.shelfLifeDays) <= 0)) {
      errs.shelfLifeDays = 'Perishable items require shelf life > 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      currentStock: Number(formData.currentStock),
      reorderLevel: Number(formData.reorderLevel),
      costPerUnit: Number(formData.costPerUnit),
      shelfLifeDays: Number(formData.shelfLifeDays),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
              MATERIAL RESOURCE PLANNING
            </div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {material ? 'Edit Raw Material' : 'Register Raw Material'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {material ? 'Update material specifications and inventory control parameters.' : 'Register a new raw material to the active telemetry database.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Material Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Organic Whole Milk"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                SKU Identifier <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. RM-DAIRY-001"
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition uppercase ${
                  errors.sku ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.sku && <p className="text-xs text-rose-600 mt-1">{errors.sku}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Unit of Measure <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g. kg, L, bags, units"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.unit ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.unit && <p className="text-xs text-rose-600 mt-1">{errors.unit}</p>}
            </div>

            {/* Cost Per Unit */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Cost / Unit ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="costPerUnit"
                value={formData.costPerUnit}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.costPerUnit ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.costPerUnit && <p className="text-xs text-rose-600 mt-1">{errors.costPerUnit}</p>}
            </div>

            {/* Current Stock */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Current Stock <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.currentStock ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.currentStock && <p className="text-xs text-rose-600 mt-1">{errors.currentStock}</p>}
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Reorder Buffer <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.reorderLevel ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.reorderLevel && <p className="text-xs text-rose-600 mt-1">{errors.reorderLevel}</p>}
            </div>

            {/* Shelf Life Days */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Shelf Life Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                name="shelfLifeDays"
                value={formData.shelfLifeDays}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.shelfLifeDays ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.shelfLifeDays && <p className="text-xs text-rose-600 mt-1">{errors.shelfLifeDays}</p>}
            </div>

            {/* Perishable Checkbox */}
            <div className="sm:col-span-2 flex items-center space-x-2.5 pt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <input
                type="checkbox"
                id="isPerishable"
                name="isPerishable"
                checked={formData.isPerishable}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <label htmlFor="isPerishable" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                Perishable Material <span className="text-slate-400 font-mono text-[11px]">(Enforces strict FEFO lot dispatch & batch expiry audits)</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-mono font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm shadow-emerald-600/20 transition"
            >
              {material ? 'Commit Changes' : 'Register Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
