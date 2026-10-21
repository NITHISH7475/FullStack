const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema(
  {
    productSku: { type: String, required: true },
    productName: { type: String, required: true },
    weekStartDate: { type: Date, required: true },
    weekEndDate: { type: Date, required: true },
    projectedDemand: { type: Number, required: true, min: 0 },
    confidenceLevel: { type: Number, min: 0, max: 1, default: 0.8 },
    factors: {
      historicalAvg: { type: Number, default: 0 },
      seasonalIndex: { type: Number, default: 1.0 },
      promotionLift: { type: Number, default: 0 },
      volatilityAdjustment: { type: Number, default: 1.0 },
    },
    isPerishable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

demandForecastSchema.index({ productSku: 1, weekStartDate: 1 });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);
