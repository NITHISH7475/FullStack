const mongoose = require('mongoose');

const inventoryLotSchema = new mongoose.Schema(
  {
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
    lotNumber: { type: String, required: true, unique: true },
    batchCode: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    initialQuantity: { type: Number, required: true, min: 0 },
    receivedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: [true, 'Expiry date is required'] },
    supplier: { type: String, default: '' },
    status: { type: String, enum: ['active', 'depleted', 'expired', 'quarantined'], default: 'active' },
  },
  { timestamps: true }
);

// Index for FEFO queries — sort by expiryDate ascending
inventoryLotSchema.index({ material: 1, expiryDate: 1 });
inventoryLotSchema.index({ status: 1 });

module.exports = mongoose.model('InventoryLot', inventoryLotSchema);
