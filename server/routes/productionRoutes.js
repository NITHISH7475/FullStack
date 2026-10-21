const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');

// Specific routes before param routes
router.get('/', productionController.getBatches);
router.get('/date-range', productionController.getBatchesByDateRange);
router.get('/:id', productionController.getBatchById);
router.post('/', productionController.createBatch);
router.put('/:id', productionController.updateBatch);
router.delete('/:id', productionController.deleteBatch);

module.exports = router;
