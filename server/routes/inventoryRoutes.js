const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Specific routes before param routes
router.get('/', inventoryController.getLots);
router.get('/expiring', inventoryController.getExpiringLots);
router.get('/material/:materialId', inventoryController.getLotsByMaterial);
router.post('/', inventoryController.createLot);
router.post('/consume', inventoryController.consumeFromLot);
router.put('/mark-expired', inventoryController.markExpiredLots);
router.put('/:id', inventoryController.updateLot);

module.exports = router;
