const {
  generateWeeklyForecast,
  generateAllForecasts,
  getAvailableSkus,
  calculateWeightedAverage,
  getSeasonalIndex,
  getPromotionMultiplier,
  calculateVolatilityAdjustment,
  calculateConfidence,
} = require('../services/forecastService');

describe('Demand Forecasting Service', () => {
  describe('calculateWeightedAverage', () => {
    it('should return correct weighted average with recent weeks weighted higher', () => {
      // weights: [1, 2, 3], sum: 6
      // weighted sum: 10*1 + 20*2 + 30*3 = 10 + 40 + 90 = 140
      // expected: 140 / 6 = 23.333...
      const result = calculateWeightedAverage([10, 20, 30]);
      expect(result).toBeCloseTo(23.333, 2);

      // Constant values should return identical average
      expect(calculateWeightedAverage([50, 50, 50, 50])).toBe(50);
    });

    it('should handle empty array and falsy inputs gracefully', () => {
      expect(calculateWeightedAverage([])).toBe(0);
      expect(calculateWeightedAverage(null)).toBe(0);
      expect(calculateWeightedAverage(undefined)).toBe(0);
    });
  });

  describe('getSeasonalIndex', () => {
    it('should return correct index for known months', () => {
      // January (month index 0 -> month 1)
      const janDate = new Date(2026, 0, 15);
      expect(getSeasonalIndex(janDate)).toBe(0.85);

      // July (month index 6 -> month 7)
      const julDate = new Date(2026, 6, 15);
      expect(getSeasonalIndex(julDate)).toBe(1.20);

      // December (month index 11 -> month 12)
      const decDate = new Date(2026, 11, 15);
      expect(getSeasonalIndex(decDate)).toBe(1.25);
    });
  });

  describe('getPromotionMultiplier', () => {
    it('should return lift multiplier for active promotions', () => {
      // SKU-TOM-001 has active promo with 15% lift
      expect(getPromotionMultiplier('SKU-TOM-001')).toBe(1.15);

      // SKU-CHK-001 has active promo with 20% lift
      expect(getPromotionMultiplier('SKU-CHK-001')).toBe(1.20);
    });

    it('should return 1.0 for inactive or unknown SKUs', () => {
      // SKU-MLK-001 is inactive (liftPercent: 0, active: false)
      expect(getPromotionMultiplier('SKU-MLK-001')).toBe(1.0);

      // Unknown SKU
      expect(getPromotionMultiplier('SKU-UNKNOWN-999')).toBe(1.0);
    });
  });

  describe('calculateVolatilityAdjustment', () => {
    it('should return 1.0 for non-perishable items regardless of shelf life', () => {
      expect(calculateVolatilityAdjustment(false, 365)).toBe(1.0);
      expect(calculateVolatilityAdjustment(false, 5)).toBe(1.0);
      expect(calculateVolatilityAdjustment(false, 0)).toBe(1.0);
    });

    it('should return < 1.0 for short-shelf-life perishable items', () => {
      // Very short shelf life (<= 5 days)
      const adjustment5Days = calculateVolatilityAdjustment(true, 5);
      expect(adjustment5Days).toBe(0.88);
      expect(adjustment5Days).toBeLessThan(1.0);

      // Short shelf life (<= 10 days)
      const adjustment10Days = calculateVolatilityAdjustment(true, 10);
      expect(adjustment10Days).toBe(0.92);
      expect(adjustment10Days).toBeLessThan(1.0);

      // Medium shelf life (<= 30 days)
      const adjustment30Days = calculateVolatilityAdjustment(true, 30);
      expect(adjustment30Days).toBe(0.95);
      expect(adjustment30Days).toBeLessThan(1.0);
    });
  });

  describe('generateWeeklyForecast', () => {
    it('should return a valid forecast object with all required fields', () => {
      const forecast = generateWeeklyForecast('SKU-TOM-001');

      expect(forecast).not.toHaveProperty('error');
      expect(forecast).toMatchObject({
        productSku: 'SKU-TOM-001',
        productName: 'Organic Tomatoes',
        isPerishable: true,
      });

      expect(forecast.weekStartDate).toBeInstanceOf(Date);
      expect(forecast.weekEndDate).toBeInstanceOf(Date);
      expect(typeof forecast.projectedDemand).toBe('number');
      expect(forecast.projectedDemand).toBeGreaterThan(0);
      expect(typeof forecast.confidenceLevel).toBe('number');
      expect(forecast.confidenceLevel).toBeGreaterThanOrEqual(0.3);
      expect(forecast.confidenceLevel).toBeLessThanOrEqual(0.98);

      expect(forecast.factors).toBeDefined();
      expect(typeof forecast.factors.historicalAvg).toBe('number');
      expect(typeof forecast.factors.seasonalIndex).toBe('number');
      expect(typeof forecast.factors.promotionLift).toBe('number');
      expect(typeof forecast.factors.volatilityAdjustment).toBe('number');
    });

    it('should return error for unknown SKU', () => {
      const result = generateWeeklyForecast('UNKNOWN-SKU-999');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('No historical data found for SKU: UNKNOWN-SKU-999');
    });

    it('should ensure perishable items get lower projected demand than equivalent non-perishable', () => {
      const targetDate = new Date(2026, 3, 15); // April
      const forecast = generateWeeklyForecast('SKU-CHK-001', targetDate); // Perishable chicken, shelf life 5

      // Without perishable volatility discount (volatilityAdjustment = 1.0)
      const unadjustedDemand = Math.round(
        forecast.factors.historicalAvg *
        forecast.factors.seasonalIndex *
        (1 + forecast.factors.promotionLift / 100) *
        1.0
      );

      expect(forecast.factors.volatilityAdjustment).toBeLessThan(1.0);
      expect(forecast.projectedDemand).toBeLessThan(unadjustedDemand);
    });

    it('should ensure items with active promotions get higher projected demand', () => {
      const targetDate = new Date(2026, 3, 15); // April
      const promoForecast = generateWeeklyForecast('SKU-TOM-001', targetDate); // 15% promotion lift

      // Baseline calculation without promotional lift (promotion multiplier = 1.0)
      const demandWithoutPromotion = Math.round(
        promoForecast.factors.historicalAvg *
        promoForecast.factors.seasonalIndex *
        1.0 *
        promoForecast.factors.volatilityAdjustment
      );

      expect(promoForecast.factors.promotionLift).toBeCloseTo(15, 5);
      expect(promoForecast.projectedDemand).toBeGreaterThan(demandWithoutPromotion);
    });
  });

  describe('generateAllForecasts', () => {
    it('should return an array of forecasts for all known SKUs', () => {
      const forecasts = generateAllForecasts();
      const availableSkus = getAvailableSkus();

      expect(Array.isArray(forecasts)).toBe(true);
      expect(forecasts.length).toBe(availableSkus.length);
      expect(forecasts.length).toBe(6);

      const returnedSkus = forecasts.map(f => f.productSku);
      availableSkus.forEach(item => {
        expect(returnedSkus).toContain(item.sku);
      });
    });
  });

  describe('calculateConfidence', () => {
    it('should return sensible confidence bounds for dataset', () => {
      const testData = [500, 510, 490, 505, 495];
      const confidence = calculateConfidence(testData);
      expect(confidence).toBeGreaterThanOrEqual(0.3);
      expect(confidence).toBeLessThanOrEqual(0.98);

      expect(calculateConfidence([])).toBe(0.1);
    });
  });
});
