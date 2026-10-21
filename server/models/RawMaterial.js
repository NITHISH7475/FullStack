const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Material name is required'], trim: true },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, trim: true },
    category: { type: String, enum: ['Produce', 'Dairy', 'Grains', 'Meat', 'Spices', 'Oils', 'Packaging', 'Other'], default: 'Other' },
    unit: { type: String, required: true, default: 'kg' },
    currentStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 100, min: 0 },
    costPerUnit: { type: Number, required: true, min: 0 },
    shelfLifeDays: { type: Number, default: 30 },
    isPerishable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
