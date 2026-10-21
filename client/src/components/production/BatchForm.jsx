import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PRODUCTION_LINES = ['Line A', 'Line B', 'Line C', 'Line D'];
const STATUSES = ['planned', 'in-progress', 'completed', 'cancelled'];

export default function BatchForm({ isOpen, onClose, onSubmit, batch = null, materials = [] }) {
  const [formData, setFormData] = useState({
    batchNumber: '',
    productName: '',
    productSku: '',
    targetQuantity: 0,
    scheduledDate: '',
    productionLine: 'Line A',
    status: 'planned',
    notes: '',
    materialsUsed: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (batch) {
      let formattedDate = '';
      if (batch.scheduledDate) {
        formattedDate = new Date(batch.scheduledDate).toISOString().split('T')[0];
      }

      setFormData({
        batchNumber: batch.batchNumber || '',
        productName: batch.productName || '',
        productSku: batch.productSku || '',
        targetQuantity: batch.targetQuantity !== undefined ? batch.targetQuantity : 0,
        scheduledDate: formattedDate,
        productionLine: batch.productionLine || 'Line A',
        status: batch.status || 'planned',
        notes: batch.notes || '',
        materialsUsed: batch.materialsUsed
          ? batch.materialsUsed.map((m) => ({
              material: typeof m.material === 'object' ? m.material?._id || m.material?.id : m.material || '',
              lotNumber: m.lotNumber || '',
              quantityUsed: m.quantityUsed || 0,
            }))
          : [],
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const autoBatchNum = `BATCH-${Date.now().toString().slice(-6)}`;
      setFormData({
        batchNumber: autoBatchNum,
        productName: '',
        productSku: '',
        targetQuantity: 100,
        scheduledDate: today,
        productionLine: 'Line A',
        status: 'planned',
        notes: '',
        materialsUsed: [],
      });
    }
    setErrors({});
  }, [batch, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddMaterialRow = () => {
    setFormData((prev) => ({
      ...prev,
      materialsUsed: [
        ...prev.materialsUsed,
        { material: materials[0]?._id || materials[0]?.id || '', lotNumber: '', quantityUsed: 0 },
      ],
    }));
  };

  const handleRemoveMaterialRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter((_, idx) => idx !== index),
    }));
  };

  const handleMaterialRowChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.materialsUsed];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, materialsUsed: updated };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.batchNumber.trim()) errs.batchNumber = 'Batch Number is required';
    if (!formData.productName.trim()) errs.productName = 'Product Name is required';
    if (!formData.productSku.trim()) errs.productSku = 'Product SKU is required';
    if (!formData.targetQuantity || Number(formData.targetQuantity) <= 0) {
      errs.targetQuantity = 'Target quantity must be greater than 0';
    }
    if (!formData.scheduledDate) errs.scheduledDate = 'Scheduled date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      targetQuantity: Number(formData.targetQuantity),
      materialsUsed: formData.materialsUsed
        .filter((m) => m.material && String(m.material).trim() !== '')
        .map((m) => ({
          material: m.material,
          lotNumber: m.lotNumber,
          quantityUsed: Number(m.quantityUsed) || 0,
        })),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
              MANUFACTURING EXECUTION • BATCH DISPATCH
            </div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              {batch ? 'Edit Production Batch' : 'Plan New Production Batch'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule manufacturing runs and link raw material lot consumption for strict traceability.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Batch Number */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Batch Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="e.g. BATCH-2026-001"
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.batchNumber ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.batchNumber && <p className="text-xs text-rose-600 mt-1">{errors.batchNumber}</p>}
            </div>

            {/* Production Line */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Production Line <span className="text-rose-500">*</span>
              </label>
              <select
                name="productionLine"
                value={formData.productionLine}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition"
              >
                {PRODUCTION_LINES.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g. Strawberry Greek Yogurt 500g"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.productName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.productName && <p className="text-xs text-rose-600 mt-1">{errors.productName}</p>}
            </div>

            {/* Product SKU */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Product SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="productSku"
                value={formData.productSku}
                onChange={handleChange}
                placeholder="e.g. FG-YOG-01"
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition uppercase ${
                  errors.productSku ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.productSku && <p className="text-xs text-rose-600 mt-1">{errors.productSku}</p>}
            </div>

            {/* Target Quantity */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Target Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                name="targetQuantity"
                value={formData.targetQuantity}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.targetQuantity ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.targetQuantity && <p className="text-xs text-rose-600 mt-1">{errors.targetQuantity}</p>}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Scheduled Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                  errors.scheduledDate ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-white'
                }`}
              />
              {errors.scheduledDate && <p className="text-xs text-rose-600 mt-1">{errors.scheduledDate}</p>}
            </div>

            {/* Status (dropdown for edit or creation) */}
            {batch && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Batch Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white capitalize"
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Materials Used Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">Materials Used (BOM)</h4>
                <p className="text-xs text-slate-500">Record ingredient lot numbers and quantity requirements.</p>
              </div>
              <button
                type="button"
                onClick={handleAddMaterialRow}
                className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 transition"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Material
              </button>
            </div>

            {formData.materialsUsed.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 font-mono">No raw materials attached yet. Click 'Add Material' to link inventory items.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {formData.materialsUsed.map((row, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/80">
                    <div className="flex-1">
                      <select
                        value={row.material}
                        onChange={(e) => handleMaterialRowChange(idx, 'material', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-white font-mono"
                      >
                        <option value="">Select Material</option>
                        {materials.map((m) => (
                          <option key={m._id || m.id} value={m._id || m.id}>
                            {m.name} ({m.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-1/3">
                      <input
                        type="text"
                        placeholder="Lot #"
                        value={row.lotNumber}
                        onChange={(e) => handleMaterialRowChange(idx, 'lotNumber', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white"
                      />
                    </div>

                    <div className="w-1/4">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={row.quantityUsed}
                        onChange={(e) => handleMaterialRowChange(idx, 'quantityUsed', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-slate-200 rounded bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMaterialRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Batch Notes & Production Instructions
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Ensure sanitize cycle 4 prior to loading. Set vat temperature to 4°C."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Modal Footer */}
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
              className="px-4 py-2 text-xs font-mono font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-[0.98] shadow-sm shadow-emerald-600/20 transition"
            >
              {batch ? 'Update Batch Record' : 'Dispatch Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
