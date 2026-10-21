const cron = require('node-cron');
const RawMaterial = require('../models/RawMaterial');
const InventoryLot = require('../models/InventoryLot');
const DemandForecast = require('../models/DemandForecast');
const Alert = require('../models/Alert');

/**
 * Check for low stock materials and create alerts
 */
async function checkLowStock() {
  try {
    const materials = await RawMaterial.find({
      $expr: { $lt: ['$currentStock', '$reorderLevel'] },
    });

    for (const material of materials) {
      const existingAlert = await Alert.findOne({
        type: 'low-stock',
        'relatedEntity.entityId': material._id,
        isResolved: false,
      });

      if (!existingAlert) {
        const severity = material.currentStock <= material.reorderLevel * 0.5 ? 'critical' : 'warning';
        await Alert.create({
          type: 'low-stock',
          severity,
          title: `Low Stock: ${material.name}`,
          message: `${material.name} (${material.sku}) has ${material.currentStock} ${material.unit} remaining. Reorder level is ${material.reorderLevel} ${material.unit}.`,
          relatedEntity: { entityType: 'RawMaterial', entityId: material._id },
        });
      }
    }
  } catch (error) {
    console.error('Low stock check error:', error.message);
  }
}

/**
 * Check for expiring inventory lots
 */
async function checkExpiringLots() {
  try {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Critical: expiring within 3 days
    const criticalLots = await InventoryLot.find({
      status: 'active',
      expiryDate: { $lte: threeDays, $gt: now },
    }).populate('material', 'name sku');

    for (const lot of criticalLots) {
      const existingAlert = await Alert.findOne({
        type: 'expiry-warning',
        'relatedEntity.entityId': lot._id,
        severity: 'critical',
        isResolved: false,
      });

      if (!existingAlert) {
        await Alert.create({
          type: 'expiry-warning',
          severity: 'critical',
          title: `Expiring Soon: ${lot.material?.name || 'Unknown'} (Lot ${lot.lotNumber})`,
          message: `Lot ${lot.lotNumber} of ${lot.material?.name} expires on ${lot.expiryDate.toLocaleDateString()}. ${lot.quantity} ${lot.material?.unit || 'units'} remaining.`,
          relatedEntity: { entityType: 'InventoryLot', entityId: lot._id },
        });
      }
    }

    // Warning: expiring within 7 days (but not within 3)
    const warningLots = await InventoryLot.find({
      status: 'active',
      expiryDate: { $lte: sevenDays, $gt: threeDays },
    }).populate('material', 'name sku');

    for (const lot of warningLots) {
      const existingAlert = await Alert.findOne({
        type: 'expiry-warning',
        'relatedEntity.entityId': lot._id,
        isResolved: false,
      });

      if (!existingAlert) {
        await Alert.create({
          type: 'expiry-warning',
          severity: 'warning',
          title: `Expiry Approaching: ${lot.material?.name || 'Unknown'} (Lot ${lot.lotNumber})`,
          message: `Lot ${lot.lotNumber} of ${lot.material?.name} expires on ${lot.expiryDate.toLocaleDateString()}. Consider prioritizing usage.`,
          relatedEntity: { entityType: 'InventoryLot', entityId: lot._id },
        });
      }
    }
  } catch (error) {
    console.error('Expiry check error:', error.message);
  }
}

/**
 * Check for demand vs inventory mismatches
 */
async function checkDemandMismatch() {
  try {
    const now = new Date();
    const nextWeekStart = new Date(now);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const forecasts = await DemandForecast.find({
      weekStartDate: { $lte: nextWeekStart },
      weekEndDate: { $gte: now },
    });

    for (const forecast of forecasts) {
      const material = await RawMaterial.findOne({ sku: forecast.productSku });
      if (!material) continue;

      const threshold = forecast.projectedDemand * 0.8;
      if (material.currentStock < threshold) {
        const existingAlert = await Alert.findOne({
          type: 'demand-mismatch',
          'relatedEntity.entityId': material._id,
          isResolved: false,
        });

        if (!existingAlert) {
          await Alert.create({
            type: 'demand-mismatch',
            severity: 'warning',
            title: `Demand Mismatch: ${material.name}`,
            message: `Current stock (${material.currentStock} ${material.unit}) is below 80% of forecasted demand (${forecast.projectedDemand} units) for next week.`,
            relatedEntity: { entityType: 'RawMaterial', entityId: material._id },
          });
        }
      }
    }
  } catch (error) {
    console.error('Demand mismatch check error:', error.message);
  }
}

/**
 * Run all alert checks
 */
async function runAllChecks() {
  console.log('[AlertService] Running scheduled alert checks...');
  await checkLowStock();
  await checkExpiringLots();
  await checkDemandMismatch();
  console.log('[AlertService] Alert checks completed.');
}

/**
 * Start the cron job - runs every hour
 */
function startAlertCron() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    await runAllChecks();
  });

  // Also run once on startup after a 10-second delay
  setTimeout(async () => {
    await runAllChecks();
  }, 10000);

  console.log('[AlertService] Cron job scheduled (hourly)');
}

module.exports = {
  startAlertCron,
  runAllChecks,
  checkLowStock,
  checkExpiringLots,
  checkDemandMismatch,
};
