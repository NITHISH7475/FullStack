const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Specific routes before param routes
router.get('/', alertController.getAlerts);
router.get('/unread-count', alertController.getUnreadCount);
router.put('/mark-all-read', alertController.markAllAsRead);
router.put('/:id/read', alertController.markAsRead);
router.put('/:id/resolve', alertController.resolveAlert);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
