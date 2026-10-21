const mongoose = require('mongoose');

const wasteEventSchema = new mongoose.Schema(
  {
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
    productionBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionBatch' },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'kg' },
    cause: {
      type: String,
      enum: ['spoilage', 'equipment-failure', 'over-production', 'quality-rejection', 'handling-damage', 'other'],
      required: [true, 'Waste cause is required'],
    },
    description: { type: String, default: '' },
    costImpact: { type: Number, default: 0, min: 0 },
    productionLine: { type: String, default: '' },
    reportedBy: { type: String, default: 'System' },
    eventDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WasteEvent', wasteEventSchema);
