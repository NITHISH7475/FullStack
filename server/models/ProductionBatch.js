const mongoose = require('mongoose');

const productionBatchSchema = new mongoose.Schema(
  {
    batchNumber: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    productSku: { type: String, required: true },
    targetQuantity: { type: Number, required: true, min: 0 },
    actualQuantity: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['planned', 'in-progress', 'completed', 'cancelled'], default: 'planned' },
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },
    materialsUsed: [
      {
        material: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
        lotNumber: { type: String },
        quantityUsed: { type: Number, min: 0 },
      },
    ],
    forecastId: { type: mongoose.Schema.Types.ObjectId, ref: 'DemandForecast' },
    productionLine: { type: String, default: 'Line A' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductionBatch', productionBatchSchema);
