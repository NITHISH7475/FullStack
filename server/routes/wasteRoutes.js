const express = require('express');
const router = express.Router();
const wasteController = require('../controllers/wasteController');

// Specific routes
router.get('/', wasteController.getWasteEvents);
router.get('/summary', wasteController.getWasteSummary);
router.get('/by-category', wasteController.getWasteByCategory);
router.get('/by-line', wasteController.getWasteByProductionLine);
router.post('/', wasteController.createWasteEvent);

module.exports = router;
