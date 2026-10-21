const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['low-stock', 'expiry-warning', 'demand-mismatch', 'production-delay'],
      required: true,
    },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntity: {
      entityType: { type: String },
      entityId: { type: mongoose.Schema.Types.ObjectId },
    },
    isRead: { type: Boolean, default: false },
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

alertSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
