const mongoose = require('mongoose');
const WasteEvent = require('../models/WasteEvent');
const RawMaterial = require('../models/RawMaterial');
const ProductionBatch = require('../models/ProductionBatch');

// GET all waste events, populate material and productionBatch. Support cause filter.
exports.getWasteEvents = async (req, res) => {
  try {
    const { cause } = req.query;
    const filter = {};

    if (cause) {
      filter.cause = cause;
    }

    const wasteEvents = await WasteEvent.find(filter)
      .populate('material')
      .populate('productionBatch')
      .sort({ createdAt: -1 });

    res.status(200).json(wasteEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create waste event. Auto-calculate costImpact = quantity * material.costPerUnit
exports.createWasteEvent = async (req, res) => {
  try {
    const wasteData = { ...req.body };

    // Resolve productionBatch if provided as string / batch number, or delete if empty
    if (wasteData.productionBatch) {
      if (mongoose.Types.ObjectId.isValid(wasteData.productionBatch)) {
        // Valid ObjectId
      } else {
        const foundBatch = await ProductionBatch.findOne({ batchNumber: wasteData.productionBatch });
        if (foundBatch) {
          wasteData.productionBatch = foundBatch._id;
        } else {
          delete wasteData.productionBatch;
        }
      }
    } else {
      delete wasteData.productionBatch;
    }

    if (!wasteData.costImpact) {
      if (wasteData.material) {
        const material = await RawMaterial.findById(wasteData.material);
        if (material && material.costPerUnit) {
          wasteData.costImpact = Number(wasteData.quantity || 0) * material.costPerUnit;
        } else {
          wasteData.costImpact = 0;
        }
      } else {
        wasteData.costImpact = 0;
      }
    }

    const wasteEvent = new WasteEvent(wasteData);
    const savedEvent = await wasteEvent.save();

    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET aggregation pipeline grouping by cause, summing quantity and costImpact
exports.getWasteByCategory = async (req, res) => {
  try {
    const summary = await WasteEvent.aggregate([
      {
        $group: {
          _id: '$cause',
          totalQuantity: { $sum: '$quantity' },
          totalCostImpact: { $sum: '$costImpact' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          cause: '$_id',
          _id: 0,
          totalQuantity: 1,
          totalCostImpact: 1,
          count: 1
        }
      },
      { $sort: { totalCostImpact: -1 } }
    ]);

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET aggregation grouping by productionLine
exports.getWasteByProductionLine = async (req, res) => {
  try {
    const summary = await WasteEvent.aggregate([
      {
        $group: {
          _id: '$productionLine',
          totalQuantity: { $sum: '$quantity' },
          totalCostImpact: { $sum: '$costImpact' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          productionLine: '$_id',
          _id: 0,
          totalQuantity: 1,
          totalCostImpact: 1,
          count: 1
        }
      },
      { $sort: { totalCostImpact: -1 } }
    ]);

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET summary stats: totalWaste, totalCost, wasteByMonth (last 6 months), topWastedMaterials
exports.getWasteSummary = async (req, res) => {
  try {
    // 1. Overall totals
    const totals = await WasteEvent.aggregate([
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$quantity' },
          totalCost: { $sum: '$costImpact' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalWaste = totals.length > 0 ? totals[0].totalWaste : 0;
    const totalCost = totals.length > 0 ? totals[0].totalCost : 0;

    // 2. Waste by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const wasteByMonth = await WasteEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$costImpact' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // 3. Top wasted materials
    const topWastedMaterials = await WasteEvent.aggregate([
      {
        $group: {
          _id: '$material',
          totalQuantity: { $sum: '$quantity' },
          totalCostImpact: { $sum: '$costImpact' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalCostImpact: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'rawmaterials',
          localField: '_id',
          foreignField: '_id',
          as: 'materialDetails'
        }
      },
      {
        $unwind: {
          path: '$materialDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          materialId: '$_id',
          materialName: '$materialDetails.name',
          materialSku: '$materialDetails.sku',
          totalQuantity: 1,
          totalCostImpact: 1,
          count: 1
        }
      }
    ]);

    res.status(200).json({
      totalWaste,
      totalCost,
      wasteByMonth,
      topWastedMaterials
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
