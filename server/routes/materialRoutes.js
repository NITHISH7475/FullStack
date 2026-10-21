const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

// Specific routes before param routes
router.get('/', materialController.getMaterials);
router.get('/low-stock', materialController.getLowStockMaterials);
router.get('/:id', materialController.getMaterialById);
router.post('/', materialController.createMaterial);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', materialController.deleteMaterial);

module.exports = router;
