const mongoose = require('mongoose');
const ProductionBatch = require('../models/ProductionBatch');

// Helper to filter valid materialsUsed
const sanitizeMaterialsUsed = (materialsUsed) => {
  if (!Array.isArray(materialsUsed)) return [];
  return materialsUsed.filter((m) => m && m.material && mongoose.Types.ObjectId.isValid(m.material));
};

// GET all batches, populate materialsUsed.material. Support status filter.
exports.getBatches = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    const batches = await ProductionBatch.find(filter)
      .populate('materialsUsed.material')
      .sort({ scheduledDate: -1 });

    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single batch by ID with populated refs
exports.getBatchById = async (req, res) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id)
      .populate('materialsUsed.material');

    if (!batch) {
      return res.status(404).json({ message: 'Production batch not found' });
    }

    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST create new batch
exports.createBatch = async (req, res) => {
  try {
    const batchData = { ...req.body };
    if (batchData.materialsUsed) {
      batchData.materialsUsed = sanitizeMaterialsUsed(batchData.materialsUsed);
    }
    const batch = new ProductionBatch(batchData);
    const savedBatch = await batch.save();
    res.status(201).json(savedBatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT update batch by ID. If status changes to 'completed', set completedDate.
exports.updateBatch = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.materialsUsed) {
      updateData.materialsUsed = sanitizeMaterialsUsed(updateData.materialsUsed);
    }

    if (updateData.status === 'completed' && !updateData.completedDate) {
      updateData.completedDate = new Date();
    }

    const updatedBatch = await ProductionBatch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('materialsUsed.material');

    if (!updatedBatch) {
      return res.status(404).json({ message: 'Production batch not found' });
    }

    res.status(200).json(updatedBatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE batch by ID
exports.deleteBatch = async (req, res) => {
  try {
    const batch = await ProductionBatch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Production batch not found' });
    }

    res.status(200).json({ message: 'Production batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET batches within scheduledDate range (query params ?start=&end=)
exports.getBatchesByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: 'start and end query parameters are required' });
    }

    const batches = await ProductionBatch.find({
      scheduledDate: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    })
      .populate('materialsUsed.material')
      .sort({ scheduledDate: 1 });

    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
