const DemandForecast = require('../models/DemandForecast');
const RawMaterial = require('../models/RawMaterial');
const forecastService = require('../services/forecastService');

// Helper to save forecast if forecastService returns unsaved object/array
const persistForecastResult = async (result, sku) => {
  if (!result) return null;
  // If result is already a saved mongoose model or has _id, return it
  if (result._id) return result;

  if (Array.isArray(result)) {
    return await DemandForecast.insertMany(result);
  } else if (typeof result === 'object') {
    const docData = { ...result };
    if (!docData.productSku && sku) docData.productSku = sku;
    const forecastDoc = new DemandForecast(docData);
    return await forecastDoc.save();
  }
  return result;
};

// GET all forecasts, sorted by weekStartDate DESC
exports.getForecasts = async (req, res) => {
  try {
    const forecasts = await DemandForecast.find().sort({ weekStartDate: -1 });
    res.status(200).json(forecasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST trigger the forecast service for a given productSku
exports.generateForecast = async (req, res) => {
  try {
    const { productSku } = req.body;
    if (!productSku) {
      return res.status(400).json({ message: 'productSku is required' });
    }

    const forecastData = await forecastService.generateWeeklyForecast(productSku);
    const saved = await persistForecastResult(forecastData, productSku);

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST trigger forecasts for all materials
exports.generateAllForecasts = async (req, res) => {
  try {
    const materials = await RawMaterial.find({});
    const results = [];

    for (const material of materials) {
      if (material.sku) {
        try {
          const forecastData = await forecastService.generateWeeklyForecast(
            material.sku,
            null,
            material
          );
          const saved = await persistForecastResult(forecastData, material.sku);
          results.push({ sku: material.sku, status: 'success', forecast: saved });
        } catch (err) {
          results.push({ sku: material.sku, status: 'failed', error: err.message });
        }
      }
    }

    res.status(201).json({
      message: `Processed forecasts for ${materials.length} material(s)`,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET forecasts for a specific SKU
exports.getForecastBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    const forecasts = await DemandForecast.find({ productSku: sku }).sort({ weekStartDate: -1 });
    res.status(200).json(forecasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET compare current inventory levels vs next week's forecast for all products
exports.getDemandVsInventory = async (req, res) => {
  try {
    const materials = await RawMaterial.find();
    const now = new Date();

    const comparisonList = await Promise.all(
      materials.map(async (material) => {
        // Find latest forecast for this material's SKU
        const latestForecast = await DemandForecast.findOne({
          productSku: material.sku,
        }).sort({ weekStartDate: -1 });

        const forecastedDemand = latestForecast
          ? Number(latestForecast.projectedDemand ?? latestForecast.predictedDemand ?? latestForecast.forecastedQuantity ?? 0)
          : 0;

        const currentStock = Number(material.currentStock || 0);
        const gap = currentStock - forecastedDemand;

        let status = 'Sufficient';
        if (forecastedDemand > 0) {
          if (currentStock < forecastedDemand * 0.5) {
            status = 'Critical';
          } else if (currentStock < forecastedDemand * 0.8) {
            status = 'At Risk';
          }
        }

        return {
          materialId: material._id,
          sku: material.sku,
          name: material.name,
          product: material.name,
          productName: material.name,
          category: material.category,
          unit: material.unit,
          currentStock,
          stock: currentStock,
          forecastedDemand,
          demand: forecastedDemand,
          gap,
          difference: gap,
          status,
          reorderRecommended: gap < 0 || currentStock <= (material.reorderLevel || 0),
          forecastWeek: latestForecast ? latestForecast.weekStartDate : null
        };
      })
    );

    res.status(200).json(comparisonList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
