/**
 * AI Demand Forecasting Service
 * Uses multi-variable analysis: historical sales, seasonality, promotions, volatility
 */

// Mock historical sales data (weekly units sold over past 12 weeks)
const mockHistoricalData = {
  'SKU-TOM-001': { name: 'Organic Tomatoes', data: [450, 480, 420, 510, 490, 530, 460, 500, 520, 480, 510, 540], isPerishable: true, shelfLifeDays: 7 },
  'SKU-MLK-001': { name: 'Whole Milk', data: [800, 820, 780, 850, 830, 870, 810, 840, 860, 820, 850, 880], isPerishable: true, shelfLifeDays: 10 },
  'SKU-FLR-001': { name: 'All-Purpose Flour', data: [300, 310, 290, 320, 300, 330, 310, 320, 340, 300, 320, 350], isPerishable: false, shelfLifeDays: 180 },
  'SKU-OIL-001': { name: 'Olive Oil', data: [200, 210, 190, 220, 200, 230, 210, 220, 240, 200, 220, 250], isPerishable: false, shelfLifeDays: 365 },
  'SKU-CHK-001': { name: 'Chicken Breast', data: [600, 620, 580, 640, 610, 660, 590, 630, 650, 610, 640, 670], isPerishable: true, shelfLifeDays: 5 },
  'SKU-SPC-001': { name: 'Mixed Spices Blend', data: [150, 160, 140, 170, 150, 180, 160, 170, 180, 150, 170, 190], isPerishable: false, shelfLifeDays: 365 },
};

// Seasonal indices by month (1-indexed, Jan=1)
const seasonalIndices = {
  1: 0.85, 2: 0.88, 3: 0.95, 4: 1.0, 5: 1.05, 6: 1.15,
  7: 1.20, 8: 1.18, 9: 1.10, 10: 1.05, 11: 1.12, 12: 1.25,
};

// Active promotions (mock)
const activePromotions = {
  'SKU-TOM-001': { active: true, liftPercent: 15 },
  'SKU-MLK-001': { active: false, liftPercent: 0 },
  'SKU-CHK-001': { active: true, liftPercent: 20 },
};

/**
 * Calculate weighted moving average (more recent weeks weighted higher)
 */
function calculateWeightedAverage(data) {
  if (!data || data.length === 0) return 0;
  const weights = data.map((_, i) => i + 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weightedSum = data.reduce((sum, val, i) => sum + val * weights[i], 0);
  return weightedSum / totalWeight;
}

/**
 * Get seasonal index for the current/target month
 */
function getSeasonalIndex(targetDate) {
  const month = (targetDate || new Date()).getMonth() + 1;
  return seasonalIndices[month] || 1.0;
}

/**
 * Get promotion multiplier for a SKU
 */
function getPromotionMultiplier(sku) {
  const promo = activePromotions[sku];
  if (promo && promo.active) {
    return 1 + promo.liftPercent / 100;
  }
  return 1.0;
}

/**
 * Calculate volatility adjustment for perishable items.
 * Reduces forecast slightly to prevent over-production waste.
 * Short shelf-life items get a larger reduction.
 */
function calculateVolatilityAdjustment(isPerishable, shelfLifeDays) {
  if (!isPerishable) return 1.0;
  if (shelfLifeDays <= 5) return 0.88;  // Very short shelf life — aggressive reduction
  if (shelfLifeDays <= 10) return 0.92; // Short shelf life
  if (shelfLifeDays <= 30) return 0.95; // Medium shelf life
  return 1.0;
}

/**
 * Calculate confidence level based on data completeness and variability
 */
function calculateConfidence(data) {
  if (!data || data.length === 0) return 0.1;
  const avg = data.reduce((s, v) => s + v, 0) / data.length;
  const variance = data.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / data.length;
  const cv = Math.sqrt(variance) / avg; // coefficient of variation
  // Lower CV = higher confidence
  const confidence = Math.max(0.3, Math.min(0.98, 1 - cv));
  return Math.round(confidence * 100) / 100;
}

/**
 * Register a newly added material dynamically into the forecasting engine
 */
function registerNewMaterial(material) {
  if (!material || !material.sku) return null;
  
  // Synthesize a realistic 12-week baseline sales history from stock/reorder levels
  const baseline = Math.max(
    50,
    Math.round(material.reorderLevel ? material.reorderLevel * 1.1 : (material.currentStock || 100) * 0.4)
  );
  
  const data = Array.from({ length: 12 }, (_, i) => {
    // Natural sales fluctuation between 90% and 110%
    const factor = 0.92 + ((i * 7) % 17) * 0.01;
    return Math.round(baseline * factor);
  });

  mockHistoricalData[material.sku] = {
    name: material.name,
    data,
    isPerishable: Boolean(material.isPerishable),
    shelfLifeDays: material.shelfLifeDays || (material.isPerishable ? 7 : 180),
  };

  return mockHistoricalData[material.sku];
}

/**
 * Generate weekly demand forecast for a given product SKU
 * @param {string} sku - Product SKU
 * @param {Date} targetDate - Optional target date for forecast (defaults to next week)
 * @param {Object} materialFallback - Optional RawMaterial document if not in mock data
 * @returns {Object} Forecast result
 */
function generateWeeklyForecast(sku, targetDate, materialFallback = null) {
  let product = mockHistoricalData[sku];

  if (!product && materialFallback) {
    product = registerNewMaterial(materialFallback);
  }

  if (!product) {
    return { error: `No historical data found for SKU: ${sku}` };
  }

  const now = targetDate || new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() + (7 - weekStart.getDay()) % 7 + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const historicalAvg = calculateWeightedAverage(product.data);
  const seasonalIndex = getSeasonalIndex(weekStart);
  const promotionMultiplier = getPromotionMultiplier(sku);
  const volatilityAdjustment = calculateVolatilityAdjustment(product.isPerishable, product.shelfLifeDays);

  const projectedDemand = Math.round(
    historicalAvg * seasonalIndex * promotionMultiplier * volatilityAdjustment
  );

  const confidenceLevel = calculateConfidence(product.data);

  return {
    productSku: sku,
    productName: product.name,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    projectedDemand,
    confidenceLevel,
    factors: {
      historicalAvg: Math.round(historicalAvg * 100) / 100,
      seasonalIndex,
      promotionLift: (promotionMultiplier - 1) * 100,
      volatilityAdjustment,
    },
    isPerishable: product.isPerishable,
  };
}

/**
 * Generate forecasts for all known SKUs
 */
function generateAllForecasts(targetDate) {
  const results = [];
  for (const sku of Object.keys(mockHistoricalData)) {
    const forecast = generateWeeklyForecast(sku, targetDate);
    if (!forecast.error) {
      results.push(forecast);
    }
  }
  return results;
}

/**
 * Get all available SKUs from mock data
 */
function getAvailableSkus() {
  return Object.keys(mockHistoricalData).map(sku => ({
    sku,
    name: mockHistoricalData[sku].name,
    isPerishable: mockHistoricalData[sku].isPerishable,
  }));
}

module.exports = {
  registerNewMaterial,
  generateWeeklyForecast,
  generateAllForecasts,
  getAvailableSkus,
  calculateWeightedAverage,
  getSeasonalIndex,
  getPromotionMultiplier,
  calculateVolatilityAdjustment,
  calculateConfidence,
};
