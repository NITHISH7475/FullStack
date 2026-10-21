const InventoryLot = require('../models/InventoryLot');
const RawMaterial = require('../models/RawMaterial');

// Helper function to recalculate material currentStock from active lots
const recalculateStock = async (materialId) => {
  const result = await InventoryLot.aggregate([
    {
      $match: {
        material: materialId,
        status: { $nin: ['expired', 'depleted'] }
      }
    },
    {
      $group: {
        _id: '$material',
        totalStock: { $sum: '$quantity' }
      }
    }
  ]);
  const newStock = result.length > 0 ? result[0].totalStock : 0;
  await RawMaterial.findByIdAndUpdate(materialId, { currentStock: newStock });
  return newStock;
};

// GET all lots, populate material name. Sort by expiryDate ASC (FEFO).
exports.getLots = async (req, res) => {
  try {
    const lots = await InventoryLot.find()
      .populate('material')
      .sort({ expiryDate: 1 });
    res.status(200).json(lots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET lots for a specific material ID, sorted FEFO
exports.getLotsByMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const lots = await InventoryLot.find({ material: materialId })
      .populate('material')
      .sort({ expiryDate: 1 });
    res.status(200).json(lots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create lot + update material's currentStock (add quantity)
exports.createLot = async (req, res) => {
  try {
    const lot = new InventoryLot(req.body);
    const savedLot = await lot.save();

    // Increment material currentStock
    if (savedLot.material && savedLot.quantity) {
      await RawMaterial.findByIdAndUpdate(savedLot.material, {
        $inc: { currentStock: savedLot.quantity }
      });
    }

    res.status(201).json(savedLot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT update lot. Recalculate material's currentStock from all active lots.
exports.updateLot = async (req, res) => {
  try {
    const originalLot = await InventoryLot.findById(req.params.id);
    if (!originalLot) {
      return res.status(404).json({ message: 'Inventory lot not found' });
    }

    const updatedLot = await InventoryLot.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Recalculate currentStock for the material
    await recalculateStock(updatedLot.material);

    // If material reference was changed, recalculate the original material too
    if (originalLot.material && originalLot.material.toString() !== updatedLot.material.toString()) {
      await recalculateStock(originalLot.material);
    }

    res.status(200).json(updatedLot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST consume quantity using FEFO - find earliest expiring active lot for the material and reduce its quantity.
// If lot reaches 0, mark as depleted. Update material currentStock.
exports.consumeFromLot = async (req, res) => {
  try {
    const { materialId, quantity } = req.body;

    if (!materialId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid materialId and quantity are required' });
    }

    // Find active non-expired lots for material sorted by expiryDate ASC (FEFO)
    const activeLots = await InventoryLot.find({
      material: materialId,
      status: { $nin: ['expired', 'depleted'] },
      quantity: { $gt: 0 }
    }).sort({ expiryDate: 1 });

    if (!activeLots || activeLots.length === 0) {
      return res.status(400).json({ message: 'No available inventory lots for this material' });
    }

    let remainingToConsume = Number(quantity);
    const consumedLotsInfo = [];

    for (const lot of activeLots) {
      if (remainingToConsume <= 0) break;

      const deductAmount = Math.min(lot.quantity, remainingToConsume);
      lot.quantity -= deductAmount;
      remainingToConsume -= deductAmount;

      if (lot.quantity === 0) {
        lot.status = 'depleted';
      }

      await lot.save();
      consumedLotsInfo.push({
        lotId: lot._id,
        lotNumber: lot.lotNumber,
        consumed: deductAmount,
        remainingInLot: lot.quantity,
        status: lot.status
      });
    }

    const actualConsumed = Number(quantity) - remainingToConsume;

    // Update material's currentStock
    await RawMaterial.findByIdAndUpdate(materialId, {
      $inc: { currentStock: -actualConsumed }
    });

    res.status(200).json({
      message: `Successfully consumed ${actualConsumed} units`,
      requestedQuantity: quantity,
      consumedQuantity: actualConsumed,
      unfulfilledQuantity: remainingToConsume,
      consumedLots: consumedLotsInfo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET lots expiring within N days (query param ?days=7)
exports.getExpiringLots = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + days);

    const expiringLots = await InventoryLot.find({
      expiryDate: { $gte: now, $lte: thresholdDate },
      status: { $nin: ['expired', 'depleted'] }
    })
      .populate('material')
      .sort({ expiryDate: 1 });

    res.status(200).json(expiringLots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT scan and mark lots past expiryDate as 'expired', update material stock
exports.markExpiredLots = async (req, res) => {
  try {
    const now = new Date();

    // Find all lots that are past expiryDate and not already expired or depleted
    const expiredLots = await InventoryLot.find({
      expiryDate: { $lt: now },
      status: { $nin: ['expired', 'depleted'] }
    });

    const affectedMaterialIds = new Set();

    for (const lot of expiredLots) {
      lot.status = 'expired';
      await lot.save();
      if (lot.material) {
        affectedMaterialIds.add(lot.material.toString());
      }
    }

    // Recalculate stock for all affected materials
    for (const materialId of affectedMaterialIds) {
      await recalculateStock(materialId);
    }

    res.status(200).json({
      message: `Marked ${expiredLots.length} lot(s) as expired`,
      expiredCount: expiredLots.length,
      affectedMaterialsCount: affectedMaterialIds.size
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
