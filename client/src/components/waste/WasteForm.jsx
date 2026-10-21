import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CAUSES = [
  { value: 'spoilage', label: 'Spoilage (Past Expiry / Microbial)' },
  { value: 'equipment-failure', label: 'Equipment Failure (Breakdown / Power Loss)' },
  { value: 'over-production', label: 'Over-Production (Excess Unsold Yield)' },
  { value: 'quality-rejection', label: 'Quality Rejection (Failed Lab / QA Test)' },
  { value: 'handling-damage', label: 'Handling Damage (Drop / Ruptured Packaging)' },
  { value: 'other', label: 'Other Operational Waste' },
];

const PRODUCTION_LINES = ['Line A', 'Line B', 'Line C', 'Line D'];

export default function WasteForm({ isOpen, onClose, onSubmit, materials = [] }) {
  const [formData, setFormData] = useState({
    material: '',
    productionBatch: '',
    quantity: '',
    unit: 'kg',
    cause: 'spoilage',
    description: '',
    productionLine: 'Line A',
    reportedBy: '',
    eventDate: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      material: materials[0]?._id || materials[0]?.id || '',
      productionBatch: '',
      quantity: '',
      unit: materials[0]?.unit || 'kg',
      cause: 'spoilage',
      description: '',
      productionLine: 'Line A',
      reportedBy: '',
      eventDate: today,
    });
    setErrors({});
  }, [isOpen, materials]);

  if (!isOpen) return null;

  const handleMaterialChange = (e) => {
    const matId = e.target.value;
    const matObj = materials.find((m) => (m._id || m.id) === matId);
    setFormData((prev) => ({
      ...prev,
      material: matId,
      unit: matObj?.unit || prev.unit,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.material) errs.material = 'Please select a material';
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.unit.trim()) errs.unit = 'Unit is required';
    if (!formData.cause) errs.cause = 'Cause is required';
    if (!formData.eventDate) errs.eventDate = 'Event date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 mb-0.5">
              LOSS MITIGATION & QUALITY AUDIT
            </div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Record Waste Event</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Attribute manufacturing losses and track root-cause indicators for yield reconciliation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Material */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Material / Ingredient <span className="text-rose-500">*</span>
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleMaterialChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition ${
                  errors.material ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
                }`}
              >
                <option value="">Select Material</option>
                {materials.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>
                    {m.name} ({m.sku})
                  </option>
                ))}
              </select>
              {errors.material && <p className="text-xs text-rose-600 mt-1">{errors.material}</p>}
            </div>

            {/* Cause Selection (Emphasized) */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 mb-1">
                Root Cause Attribution <span className="text-rose-500">*</span>
              </label>
              <select
                name="cause"
                value={formData.cause}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm font-mono border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20 text-slate-800"
              >
                {CAUSES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Loss Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 25"
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.quantity ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.quantity && <p className="text-xs text-rose-600 mt-1">{errors.quantity}</p>}
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
                placeholder="e.g. kg, L, units"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.unit ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.unit && <p className="text-xs text-rose-600 mt-1">{errors.unit}</p>}
            </div>

            {/* Production Batch (Optional) */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Production Batch # (Optional)
              </label>
              <input
                type="text"
                name="productionBatch"
                value={formData.productionBatch}
                onChange={handleChange}
                placeholder="e.g. BATCH-2026-001"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Production Line */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Production Line
              </label>
              <select
                name="productionLine"
                value={formData.productionLine}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {PRODUCTION_LINES.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Incident Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                  errors.eventDate ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.eventDate && <p className="text-xs text-rose-600 mt-1">{errors.eventDate}</p>}
            </div>

            {/* Reported By */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Reported By (Operator)
              </label>
              <input
                type="text"
                name="reportedBy"
                value={formData.reportedBy}
                onChange={handleChange}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Description / Notes */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Incident Description & Context
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide root-cause details (e.g. cooling seal failure on tank 3)."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-mono font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 active:scale-[0.98] shadow-sm shadow-rose-600/20 transition"
            >
              Commit Waste Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
