const express = require('express');
const router = express.Router();
const FinancialData = require('../models/FinancialData');

// POST /api/compare - Get combined datasets for chart comparison
router.post('/', async (req, res, next) => {
  try {
    const { symbols, metricKey, periodType = 'quarterly', limit = 5 } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
      return res.status(400).json({ error: 'At least 2 symbols are required for comparison' });
    }
    
    if (symbols.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 symbols allowed for comparison' });
    }
    
    if (!metricKey) {
      return res.status(400).json({ error: 'metricKey is required' });
    }
    
    // Fetch financial data for all symbols
    const allData = await Promise.all(
      symbols.map(async (symbol) => {
        const financials = await FinancialData.find({
          symbol,
          periodType
        })
          .sort({ periodISO: -1 })
          .limit(parseInt(limit));
        
        return {
          symbol,
          data: financials.map(f => ({
            periodISO: f.periodISO,
            label: f.periodLabel,
            value: f.data[metricKey] ?? f.data.custom?.[metricKey] ?? null
          })).reverse() // Return in chronological order
        };
      })
    );
    
    // Get all unique periods across all symbols
    const allPeriods = [...new Set(
      allData.flatMap(d => d.data.map(p => p.periodISO))
    )].sort();
    
    // Align data to common periods
    const alignedData = allData.map(stockData => ({
      symbol: stockData.symbol,
      data: allPeriods.map(periodISO => {
        const found = stockData.data.find(d => d.periodISO === periodISO);
        return {
          periodISO,
          label: found?.label || periodISO,
          value: found?.value ?? null
        };
      })
    }));
    
    res.json({
      metricKey,
      periodType,
      periods: allPeriods,
      datasets: alignedData
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

