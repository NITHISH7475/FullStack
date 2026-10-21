const RawMaterial = require('../models/RawMaterial');
const InventoryLot = require('../models/InventoryLot');
const DemandForecast = require('../models/DemandForecast');
const forecastService = require('../services/forecastService');

// GET all materials with optional query filters (category, isPerishable). Sort by name.
exports.getMaterials = async (req, res) => {
  try {
    const { category, isPerishable } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (isPerishable !== undefined) {
      filter.isPerishable = isPerishable === 'true' || isPerishable === true;
    }

    const materials = await RawMaterial.find(filter).sort({ name: 1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.status(200).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create material with validation and auto-generate AI forecast & initial lot
exports.createMaterial = async (req, res) => {
  try {
    const material = new RawMaterial(req.body);
    const savedMaterial = await material.save();

    // 1. Automatically register into AI Forecasting Engine and generate initial forecast
    try {
      const forecastResult = forecastService.generateWeeklyForecast(
        savedMaterial.sku,
        null,
        savedMaterial
      );

      if (forecastResult && !forecastResult.error) {
        await DemandForecast.create(forecastResult);
      }
    } catch (forecastErr) {
      console.warn('Auto-forecast generation warning:', forecastErr.message);
    }

    // 2. If current stock was provided, automatically create an initial inventory lot
    if (savedMaterial.currentStock && savedMaterial.currentStock > 0) {
      try {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (savedMaterial.shelfLifeDays || 30));

        await InventoryLot.create({
          material: savedMaterial._id,
          lotNumber: `LOT-${savedMaterial.sku.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
          batchCode: `INIT-${savedMaterial.sku}`,
          quantity: savedMaterial.currentStock,
          initialQuantity: savedMaterial.currentStock,
          expiryDate: expiry,
          supplier: 'Initial Intake',
          status: 'active',
        });
      } catch (lotErr) {
        console.warn('Auto-lot creation warning:', lotErr.message);
      }
    }

    res.status(201).json(savedMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT update material by ID
exports.updateMaterial = async (req, res) => {
  try {
    const updatedMaterial = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMaterial) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.status(200).json(updatedMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE material by ID (also delete related InventoryLots)
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Delete associated inventory lots
    await InventoryLot.deleteMany({ material: req.params.id });

    res.status(200).json({ message: 'Material and associated inventory lots deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET materials where currentStock < reorderLevel
exports.getLowStockMaterials = async (req, res) => {
  try {
    const lowStockMaterials = await RawMaterial.find({
      $expr: { $lt: ['$currentStock', '$reorderLevel'] }
    }).sort({ name: 1 });

    res.status(200).json(lowStockMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
