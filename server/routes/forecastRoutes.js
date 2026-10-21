const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');

// Specific routes before param routes
router.get('/', forecastController.getForecasts);
router.get('/demand-vs-inventory', forecastController.getDemandVsInventory);
router.get('/:sku', forecastController.getForecastBySku);
router.post('/generate', forecastController.generateForecast);
router.post('/generate-all', forecastController.generateAllForecasts);

module.exports = router;
