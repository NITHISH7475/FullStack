const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const RawMaterial = require('../models/RawMaterial');
const InventoryLot = require('../models/InventoryLot');
const ProductionBatch = require('../models/ProductionBatch');
const WasteEvent = require('../models/WasteEvent');
const DemandForecast = require('../models/DemandForecast');
const Alert = require('../models/Alert');

const forecastService = require('./forecastService');

async function seedDatabase() {
  try {
    console.log('[SeedService] Connecting to MongoDB...');
    const conn = await connectDB();
    if (!conn) {
      console.error('[SeedService] Cannot seed database without an active MongoDB connection. Exiting.');
      process.exit(1);
    }

    console.log('[SeedService] Clearing existing collections...');
    await Promise.all([
      RawMaterial.deleteMany({}),
      InventoryLot.deleteMany({}),
      ProductionBatch.deleteMany({}),
      WasteEvent.deleteMany({}),
      DemandForecast.deleteMany({}),
      Alert.deleteMany({}),
    ]);
    console.log('[SeedService] Collections cleared.');

    // 1. Create Raw Materials (6 matching forecast SKUs)
    console.log('[SeedService] Creating Raw Materials...');
    const materialsData = [
      {
        name: 'Organic Tomatoes',
        sku: 'SKU-TOM-001',
        category: 'Produce',
        unit: 'kg',
        currentStock: 480,
        reorderLevel: 500,
        costPerUnit: 2.5,
        shelfLifeDays: 7,
        isPerishable: true,
      },
      {
        name: 'Whole Milk',
        sku: 'SKU-MLK-001',
        category: 'Dairy',
        unit: 'L',
        currentStock: 350,
        reorderLevel: 800,
        costPerUnit: 1.2,
        shelfLifeDays: 10,
        isPerishable: true,
      },
      {
        name: 'All-Purpose Flour',
        sku: 'SKU-FLR-001',
        category: 'Grains',
        unit: 'kg',
        currentStock: 1200,
        reorderLevel: 300,
        costPerUnit: 0.8,
        shelfLifeDays: 180,
        isPerishable: false,
      },
      {
        name: 'Olive Oil',
        sku: 'SKU-OIL-001',
        category: 'Oils',
        unit: 'L',
        currentStock: 650,
        reorderLevel: 200,
        costPerUnit: 6.5,
        shelfLifeDays: 365,
        isPerishable: false,
      },
      {
        name: 'Chicken Breast',
        sku: 'SKU-CHK-001',
        category: 'Meat',
        unit: 'kg',
        currentStock: 250,
        reorderLevel: 600,
        costPerUnit: 5.0,
        shelfLifeDays: 5,
        isPerishable: true,
      },
      {
        name: 'Mixed Spices Blend',
        sku: 'SKU-SPC-001',
        category: 'Spices',
        unit: 'kg',
        currentStock: 400,
        reorderLevel: 150,
        costPerUnit: 12.0,
        shelfLifeDays: 365,
        isPerishable: false,
      },
    ];

    const materials = await RawMaterial.insertMany(materialsData);
    const materialMap = {};
    materials.forEach((m) => {
      materialMap[m.sku] = m;
    });
    console.log(`[SeedService] Created ${materials.length} Raw Materials.`);

    // 2. Create Inventory Lots (18 lots with varied expiry dates)
    console.log('[SeedService] Creating Inventory Lots...');
    const now = new Date();
    const addDays = (d, days) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    const subDays = (d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);

    const lotsData = [
      // Tomatoes (SKU-TOM-001) - some expiring in 2 days (critical), 5 days (warning), fresh
      {
        material: materialMap['SKU-TOM-001']._id,
        lotNumber: 'LOT-TOM-2026-001',
        batchCode: 'BC-TOM-101',
        quantity: 120,
        initialQuantity: 300,
        receivedDate: subDays(now, 5),
        expiryDate: addDays(now, 2), // Expiring in 2 days -> critical
        supplier: 'Green Valley Organics',
        status: 'active',
      },
      {
        material: materialMap['SKU-TOM-001']._id,
        lotNumber: 'LOT-TOM-2026-002',
        batchCode: 'BC-TOM-102',
        quantity: 200,
        initialQuantity: 250,
        receivedDate: subDays(now, 2),
        expiryDate: addDays(now, 5), // Expiring in 5 days -> warning
        supplier: 'Green Valley Organics',
        status: 'active',
      },
      {
        material: materialMap['SKU-TOM-001']._id,
        lotNumber: 'LOT-TOM-2026-003',
        batchCode: 'BC-TOM-103',
        quantity: 160,
        initialQuantity: 200,
        receivedDate: subDays(now, 1),
        expiryDate: addDays(now, 6),
        supplier: 'Sunrise Farms',
        status: 'active',
      },
      {
        material: materialMap['SKU-TOM-001']._id,
        lotNumber: 'LOT-TOM-2026-000',
        batchCode: 'BC-TOM-099',
        quantity: 0,
        initialQuantity: 400,
        receivedDate: subDays(now, 14),
        expiryDate: subDays(now, 7),
        supplier: 'Sunrise Farms',
        status: 'depleted',
      },

      // Whole Milk (SKU-MLK-001) - 1 critical expiry, 1 warning, 1 active
      {
        material: materialMap['SKU-MLK-001']._id,
        lotNumber: 'LOT-MLK-2026-001',
        batchCode: 'BC-MLK-201',
        quantity: 100,
        initialQuantity: 500,
        receivedDate: subDays(now, 8),
        expiryDate: addDays(now, 2), // critical
        supplier: 'Dairy Crest Co.',
        status: 'active',
      },
      {
        material: materialMap['SKU-MLK-001']._id,
        lotNumber: 'LOT-MLK-2026-002',
        batchCode: 'BC-MLK-202',
        quantity: 250,
        initialQuantity: 500,
        receivedDate: subDays(now, 4),
        expiryDate: addDays(now, 6), // warning
        supplier: 'Dairy Crest Co.',
        status: 'active',
      },

      // Flour (SKU-FLR-001) - long shelf life
      {
        material: materialMap['SKU-FLR-001']._id,
        lotNumber: 'LOT-FLR-2026-001',
        batchCode: 'BC-FLR-301',
        quantity: 500,
        initialQuantity: 600,
        receivedDate: subDays(now, 30),
        expiryDate: addDays(now, 150),
        supplier: 'Golden Grain Mills',
        status: 'active',
      },
      {
        material: materialMap['SKU-FLR-001']._id,
        lotNumber: 'LOT-FLR-2026-002',
        batchCode: 'BC-FLR-302',
        quantity: 700,
        initialQuantity: 700,
        receivedDate: subDays(now, 10),
        expiryDate: addDays(now, 170),
        supplier: 'Golden Grain Mills',
        status: 'active',
      },
      {
        material: materialMap['SKU-FLR-001']._id,
        lotNumber: 'LOT-FLR-2025-099',
        batchCode: 'BC-FLR-299',
        quantity: 0,
        initialQuantity: 800,
        receivedDate: subDays(now, 200),
        expiryDate: subDays(now, 20),
        supplier: 'Golden Grain Mills',
        status: 'depleted',
      },

      // Olive Oil (SKU-OIL-001) - long shelf life
      {
        material: materialMap['SKU-OIL-001']._id,
        lotNumber: 'LOT-OIL-2026-001',
        batchCode: 'BC-OIL-401',
        quantity: 300,
        initialQuantity: 400,
        receivedDate: subDays(now, 45),
        expiryDate: addDays(now, 320),
        supplier: 'Mediterranean Imports',
        status: 'active',
      },
      {
        material: materialMap['SKU-OIL-001']._id,
        lotNumber: 'LOT-OIL-2026-002',
        batchCode: 'BC-OIL-402',
        quantity: 350,
        initialQuantity: 350,
        receivedDate: subDays(now, 15),
        expiryDate: addDays(now, 350),
        supplier: 'Mediterranean Imports',
        status: 'active',
      },

      // Chicken Breast (SKU-CHK-001) - highly perishable, 1 critical, 1 fresh, 1 expired
      {
        material: materialMap['SKU-CHK-001']._id,
        lotNumber: 'LOT-CHK-2026-001',
        batchCode: 'BC-CHK-501',
        quantity: 80,
        initialQuantity: 300,
        receivedDate: subDays(now, 4),
        expiryDate: addDays(now, 1), // critical: 1 day remaining
        supplier: 'Apex Poultry Supplies',
        status: 'active',
      },
      {
        material: materialMap['SKU-CHK-001']._id,
        lotNumber: 'LOT-CHK-2026-002',
        batchCode: 'BC-CHK-502',
        quantity: 170,
        initialQuantity: 200,
        receivedDate: subDays(now, 1),
        expiryDate: addDays(now, 4),
        supplier: 'Apex Poultry Supplies',
        status: 'active',
      },
      {
        material: materialMap['SKU-CHK-001']._id,
        lotNumber: 'LOT-CHK-2026-EXP',
        quantity: 45,
        initialQuantity: 250,
        receivedDate: subDays(now, 8),
        expiryDate: subDays(now, 3),
        supplier: 'Apex Poultry Supplies',
        status: 'expired',
      },

      // Mixed Spices (SKU-SPC-001)
      {
        material: materialMap['SKU-SPC-001']._id,
        lotNumber: 'LOT-SPC-2026-001',
        batchCode: 'BC-SPC-601',
        quantity: 150,
        initialQuantity: 200,
        receivedDate: subDays(now, 60),
        expiryDate: addDays(now, 305),
        supplier: 'Spice Route Traders',
        status: 'active',
      },
      {
        material: materialMap['SKU-SPC-001']._id,
        lotNumber: 'LOT-SPC-2026-002',
        batchCode: 'BC-SPC-602',
        quantity: 250,
        initialQuantity: 250,
        receivedDate: subDays(now, 10),
        expiryDate: addDays(now, 355),
        supplier: 'Spice Route Traders',
        status: 'active',
      },
      {
        material: materialMap['SKU-SPC-001']._id,
        lotNumber: 'LOT-SPC-2026-QUA',
        batchCode: 'BC-SPC-599',
        quantity: 30,
        initialQuantity: 100,
        receivedDate: subDays(now, 20),
        expiryDate: addDays(now, 200),
        supplier: 'Spice Route Traders',
        status: 'quarantined',
      },
    ];

    const lots = await InventoryLot.insertMany(lotsData);
    console.log(`[SeedService] Created ${lots.length} Inventory Lots.`);

    // 3. Create Demand Forecasts (for all SKUs)
    console.log('[SeedService] Generating and saving Demand Forecasts...');
    const generatedForecasts = forecastService.generateAllForecasts(now);
    const savedForecasts = await DemandForecast.insertMany(generatedForecasts);
    const forecastMap = {};
    savedForecasts.forEach((f) => {
      forecastMap[f.productSku] = f;
    });
    console.log(`[SeedService] Created ${savedForecasts.length} Demand Forecasts.`);

    // 4. Create Production Batches (8-10 batches)
    console.log('[SeedService] Creating Production Batches...');
    const batchesData = [
      {
        batchNumber: 'PB-2026-001',
        productName: 'Organic Tomato Pasta Sauce',
        productSku: 'SKU-TOM-001',
        targetQuantity: 500,
        actualQuantity: 495,
        status: 'completed',
        scheduledDate: subDays(now, 14),
        completedDate: subDays(now, 13),
        materialsUsed: [
          { material: materialMap['SKU-TOM-001']._id, lotNumber: 'LOT-TOM-2026-001', quantityUsed: 150 },
          { material: materialMap['SKU-OIL-001']._id, lotNumber: 'LOT-OIL-2026-001', quantityUsed: 25 },
          { material: materialMap['SKU-SPC-001']._id, lotNumber: 'LOT-SPC-2026-001', quantityUsed: 10 },
        ],
        forecastId: forecastMap['SKU-TOM-001']?._id,
        productionLine: 'Line A',
        notes: 'High yield run, quality inspection passed.',
      },
      {
        batchNumber: 'PB-2026-002',
        productName: 'Creamy Garlic Chicken Ready-Meal',
        productSku: 'SKU-CHK-001',
        targetQuantity: 300,
        actualQuantity: 285,
        status: 'completed',
        scheduledDate: subDays(now, 10),
        completedDate: subDays(now, 9),
        materialsUsed: [
          { material: materialMap['SKU-CHK-001']._id, lotNumber: 'LOT-CHK-2026-001', quantityUsed: 120 },
          { material: materialMap['SKU-MLK-001']._id, lotNumber: 'LOT-MLK-2026-001', quantityUsed: 40 },
        ],
        forecastId: forecastMap['SKU-CHK-001']?._id,
        productionLine: 'Line B',
        notes: 'Slight yield variance due to trimming.',
      },
      {
        batchNumber: 'PB-2026-003',
        productName: 'Artisan Bakery Pizza Dough',
        productSku: 'SKU-FLR-001',
        targetQuantity: 400,
        actualQuantity: 400,
        status: 'completed',
        scheduledDate: subDays(now, 5),
        completedDate: subDays(now, 5),
        materialsUsed: [
          { material: materialMap['SKU-FLR-001']._id, lotNumber: 'LOT-FLR-2026-001', quantityUsed: 200 },
          { material: materialMap['SKU-OIL-001']._id, lotNumber: 'LOT-OIL-2026-001', quantityUsed: 15 },
        ],
        forecastId: forecastMap['SKU-FLR-001']?._id,
        productionLine: 'Line A',
        notes: 'Optimal dough hydration attained.',
      },
      {
        batchNumber: 'PB-2026-004',
        productName: 'Organic Tomato Salsa',
        productSku: 'SKU-TOM-001',
        targetQuantity: 350,
        actualQuantity: 180,
        status: 'in-progress',
        scheduledDate: subDays(now, 1),
        materialsUsed: [
          { material: materialMap['SKU-TOM-001']._id, lotNumber: 'LOT-TOM-2026-002', quantityUsed: 100 },
          { material: materialMap['SKU-SPC-001']._id, lotNumber: 'LOT-SPC-2026-001', quantityUsed: 15 },
        ],
        forecastId: forecastMap['SKU-TOM-001']?._id,
        productionLine: 'Line C',
        notes: 'Filling and capping currently underway.',
      },
      {
        batchNumber: 'PB-2026-005',
        productName: 'Pasteurized Homogenized Milk Pouch',
        productSku: 'SKU-MLK-001',
        targetQuantity: 600,
        actualQuantity: 300,
        status: 'in-progress',
        scheduledDate: now,
        materialsUsed: [
          { material: materialMap['SKU-MLK-001']._id, lotNumber: 'LOT-MLK-2026-002', quantityUsed: 300 },
        ],
        forecastId: forecastMap['SKU-MLK-001']?._id,
        productionLine: 'Line D',
        notes: 'Sterilization cycle active.',
      },
      {
        batchNumber: 'PB-2026-006',
        productName: 'Spiced Chicken Skewers Prep',
        productSku: 'SKU-CHK-001',
        targetQuantity: 450,
        actualQuantity: 0,
        status: 'planned',
        scheduledDate: addDays(now, 2),
        materialsUsed: [],
        forecastId: forecastMap['SKU-CHK-001']?._id,
        productionLine: 'Line B',
        notes: 'Awaiting raw chicken lot inspection.',
      },
      {
        batchNumber: 'PB-2026-007',
        productName: 'Stoneground Wheat Loaf Batch',
        productSku: 'SKU-FLR-001',
        targetQuantity: 500,
        actualQuantity: 0,
        status: 'planned',
        scheduledDate: addDays(now, 3),
        materialsUsed: [],
        forecastId: forecastMap['SKU-FLR-001']?._id,
        productionLine: 'Line A',
        notes: 'Scheduled for morning shift.',
      },
      {
        batchNumber: 'PB-2026-008',
        productName: 'Extra Virgin Herb-Infused Oil',
        productSku: 'SKU-OIL-001',
        targetQuantity: 250,
        actualQuantity: 0,
        status: 'planned',
        scheduledDate: addDays(now, 5),
        materialsUsed: [],
        forecastId: forecastMap['SKU-OIL-001']?._id,
        productionLine: 'Line C',
        notes: 'Specialty seasonal export run.',
      },
      {
        batchNumber: 'PB-2026-009',
        productName: 'Fresh Dairy Yogurt Base',
        productSku: 'SKU-MLK-001',
        targetQuantity: 350,
        actualQuantity: 0,
        status: 'cancelled',
        scheduledDate: subDays(now, 8),
        materialsUsed: [],
        forecastId: forecastMap['SKU-MLK-001']?._id,
        productionLine: 'Line D',
        notes: 'Cancelled due to scheduled tank sanitation maintenance.',
      },
    ];

    const batches = await ProductionBatch.insertMany(batchesData);
    console.log(`[SeedService] Created ${batches.length} Production Batches.`);

    // 5. Create Waste Events (10-12 events across causes)
    console.log('[SeedService] Creating Waste Events...');
    const wasteEventsData = [
      {
        material: materialMap['SKU-TOM-001']._id,
        productionBatch: batches[0]._id,
        quantity: 18,
        unit: 'kg',
        cause: 'spoilage',
        description: 'Over-ripe tomatoes discarded during initial sorting inspection.',
        costImpact: 18 * materialMap['SKU-TOM-001'].costPerUnit,
        productionLine: 'Line A',
        reportedBy: 'QA Inspector Dave',
        eventDate: subDays(now, 14),
      },
      {
        material: materialMap['SKU-TOM-001']._id,
        quantity: 25,
        unit: 'kg',
        cause: 'handling-damage',
        description: 'Crate dropped during forklift transfer in loading bay 2.',
        costImpact: 25 * materialMap['SKU-TOM-001'].costPerUnit,
        productionLine: 'Warehouse Bay 2',
        reportedBy: 'Logistics Lead Maria',
        eventDate: subDays(now, 11),
      },
      {
        material: materialMap['SKU-MLK-001']._id,
        productionBatch: batches[1]._id,
        quantity: 40,
        unit: 'L',
        cause: 'equipment-failure',
        description: 'Chiller valve leakage during pasteurization line transfer.',
        costImpact: 40 * materialMap['SKU-MLK-001'].costPerUnit,
        productionLine: 'Line B',
        reportedBy: 'Shift Supervisor Alex',
        eventDate: subDays(now, 10),
      },
      {
        material: materialMap['SKU-CHK-001']._id,
        quantity: 45,
        unit: 'kg',
        cause: 'spoilage',
        description: 'Expired inventory lot (LOT-CHK-2026-EXP) removed from cold room.',
        costImpact: 45 * materialMap['SKU-CHK-001'].costPerUnit,
        productionLine: 'Cold Storage Room 3',
        reportedBy: 'Inventory Specialist Sarah',
        eventDate: subDays(now, 3),
      },
      {
        material: materialMap['SKU-CHK-001']._id,
        productionBatch: batches[1]._id,
        quantity: 15,
        unit: 'kg',
        cause: 'quality-rejection',
        description: 'Excess fat and gristle trimmed beyond specification thresholds.',
        costImpact: 15 * materialMap['SKU-CHK-001'].costPerUnit,
        productionLine: 'Line B',
        reportedBy: 'Line Lead Marcus',
        eventDate: subDays(now, 9),
      },
      {
        material: materialMap['SKU-FLR-001']._id,
        productionBatch: batches[2]._id,
        quantity: 20,
        unit: 'kg',
        cause: 'over-production',
        description: 'Residual batch batter discarded after target mold fulfillment.',
        costImpact: 20 * materialMap['SKU-FLR-001'].costPerUnit,
        productionLine: 'Line A',
        reportedBy: 'Baker Tony',
        eventDate: subDays(now, 5),
      },
      {
        material: materialMap['SKU-OIL-001']._id,
        quantity: 12,
        unit: 'L',
        cause: 'equipment-failure',
        description: 'Dispenser nozzle seal leak during bottling cycle calibration.',
        costImpact: 12 * materialMap['SKU-OIL-001'].costPerUnit,
        productionLine: 'Line C',
        reportedBy: 'Maintenance Tech Priya',
        eventDate: subDays(now, 7),
      },
      {
        material: materialMap['SKU-SPC-001']._id,
        quantity: 5,
        unit: 'kg',
        cause: 'handling-damage',
        description: 'Punctured spice storage sack during de-palletizing.',
        costImpact: 5 * materialMap['SKU-SPC-001'].costPerUnit,
        productionLine: 'Dry Store A',
        reportedBy: 'Warehouse Staff Kevin',
        eventDate: subDays(now, 18),
      },
      {
        material: materialMap['SKU-TOM-001']._id,
        quantity: 10,
        unit: 'kg',
        cause: 'quality-rejection',
        description: 'Surface blemishes detected exceeding Grade-A sauce tolerance.',
        costImpact: 10 * materialMap['SKU-TOM-001'].costPerUnit,
        productionLine: 'Sorting Conveyor 1',
        reportedBy: 'QA Inspector Dave',
        eventDate: subDays(now, 2),
      },
      {
        material: materialMap['SKU-MLK-001']._id,
        quantity: 30,
        unit: 'L',
        cause: 'other',
        description: 'CIP wash line flush rinse contamination sample discarded.',
        costImpact: 30 * materialMap['SKU-MLK-001'].costPerUnit,
        productionLine: 'Line D',
        reportedBy: 'Sanitation Lead Chen',
        eventDate: subDays(now, 8),
      },
      {
        material: materialMap['SKU-FLR-001']._id,
        quantity: 15,
        unit: 'kg',
        cause: 'handling-damage',
        description: 'Bag tear during conveyor transport to mixer silo.',
        costImpact: 15 * materialMap['SKU-FLR-001'].costPerUnit,
        productionLine: 'Line A',
        reportedBy: 'Baker Tony',
        eventDate: subDays(now, 22),
      },
    ];

    const wasteEvents = await WasteEvent.insertMany(wasteEventsData);
    console.log(`[SeedService] Created ${wasteEvents.length} Waste Events.`);

    // 6. Create Alerts (5-6 sample alerts across types)
    console.log('[SeedService] Creating sample Alerts...');
    const alertsData = [
      {
        type: 'low-stock',
        severity: 'critical',
        title: `Low Stock: Chicken Breast`,
        message: `Chicken Breast (SKU-CHK-001) has 250 kg remaining. Reorder level is 600 kg.`,
        relatedEntity: { entityType: 'RawMaterial', entityId: materialMap['SKU-CHK-001']._id },
        isRead: false,
        isResolved: false,
      },
      {
        type: 'low-stock',
        severity: 'warning',
        title: `Low Stock: Whole Milk`,
        message: `Whole Milk (SKU-MLK-001) has 350 L remaining. Reorder level is 800 L.`,
        relatedEntity: { entityType: 'RawMaterial', entityId: materialMap['SKU-MLK-001']._id },
        isRead: false,
        isResolved: false,
      },
      {
        type: 'expiry-warning',
        severity: 'critical',
        title: `Expiring Soon: Chicken Breast (Lot LOT-CHK-2026-001)`,
        message: `Lot LOT-CHK-2026-001 of Chicken Breast expires tomorrow. 80 kg remaining.`,
        relatedEntity: { entityType: 'InventoryLot', entityId: lots[11]._id },
        isRead: false,
        isResolved: false,
      },
      {
        type: 'expiry-warning',
        severity: 'critical',
        title: `Expiring Soon: Organic Tomatoes (Lot LOT-TOM-2026-001)`,
        message: `Lot LOT-TOM-2026-001 of Organic Tomatoes expires in 2 days. 120 kg remaining.`,
        relatedEntity: { entityType: 'InventoryLot', entityId: lots[0]._id },
        isRead: true,
        isResolved: false,
      },
      {
        type: 'demand-mismatch',
        severity: 'warning',
        title: `Demand Mismatch: Chicken Breast`,
        message: `Current stock (250 kg) is below 80% of forecasted demand for next week.`,
        relatedEntity: { entityType: 'RawMaterial', entityId: materialMap['SKU-CHK-001']._id },
        isRead: false,
        isResolved: false,
      },
      {
        type: 'production-delay',
        severity: 'info',
        title: `Batch Rescheduled: Fresh Dairy Yogurt Base`,
        message: `Production Batch PB-2026-009 was cancelled and scheduled for reschedule after maintenance.`,
        relatedEntity: { entityType: 'ProductionBatch', entityId: batches[8]._id },
        isRead: true,
        isResolved: true,
      },
    ];

    const alerts = await Alert.insertMany(alertsData);
    console.log(`[SeedService] Created ${alerts.length} Alerts.`);

    console.log('==================================================');
    console.log('[SeedService] Database seeding completed successfully:');
    console.log(` - Raw Materials:    ${materials.length}`);
    console.log(` - Inventory Lots:   ${lots.length}`);
    console.log(` - Forecasts:        ${savedForecasts.length}`);
    console.log(` - Production Batches:${batches.length}`);
    console.log(` - Waste Events:     ${wasteEvents.length}`);
    console.log(` - Alerts:           ${alerts.length}`);
    console.log('==================================================');

    await mongoose.connection.close();
    console.log('[SeedService] Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('[SeedService] Seeding failed with error:', error);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

// Allow running directly via CLI
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
