const express = require('express');
const router = express.Router();
const FinancialData = require('../models/FinancialData');

// Helper function to calculate Y/Y change
const calculateYoYChange = (current, previous) => {
  if (previous === null || previous === undefined || previous === 0) {
    return null;
  }
  return (current - previous) / Math.abs(previous);
};

// Helper function to get previous year period ISO
const getPreviousYearPeriodISO = (periodISO) => {
  if (periodISO.includes('-Q')) {
    // Quarterly: 2025-Q3 -> 2024-Q3
    const [year, quarter] = periodISO.split('-Q');
    return `${parseInt(year) - 1}-Q${quarter}`;
  } else {
    // Annual: 2025 -> 2024
    return String(parseInt(periodISO) - 1);
  }
};

// GET /api/financials/:symbol - Get financial data with Y/Y change
router.get('/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { periodType = 'quarterly', limit = 5, metrics } = req.query;
    
    // Get current periods
    const financials = await FinancialData.find({
      symbol,
      periodType
    })
      .sort({ periodISO: -1 })
      .limit(parseInt(limit));
    
    if (financials.length === 0) {
      return res.json({
        symbol,
        periodType,
        items: []
      });
    }
    
    // Get previous year periods for Y/Y calculation
    const periodISOs = financials.map(f => getPreviousYearPeriodISO(f.periodISO));
    const previousYearData = await FinancialData.find({
      symbol,
      periodType,
      periodISO: { $in: periodISOs }
    });
    
    // Create lookup map for previous year data
    const prevYearMap = {};
    previousYearData.forEach(d => {
      prevYearMap[d.periodISO] = d.data;
    });
    
    // Calculate Y/Y changes
    const items = financials.map(f => {
      const prevPeriodISO = getPreviousYearPeriodISO(f.periodISO);
      const prevData = prevYearMap[prevPeriodISO] || {};
      
      const yoy = {};
      const dataObj = f.data.toObject ? f.data.toObject() : f.data;
      
      // Calculate Y/Y for standard metrics
      Object.keys(dataObj).forEach(key => {
        if (key !== 'custom' && typeof dataObj[key] === 'number') {
          yoy[key] = calculateYoYChange(dataObj[key], prevData[key]);
        }
      });
      
      // Calculate Y/Y for custom metrics
      if (dataObj.custom && prevData.custom) {
        yoy.custom = {};
        Object.keys(dataObj.custom).forEach(key => {
          yoy.custom[key] = calculateYoYChange(dataObj.custom[key], prevData.custom?.[key]);
        });
      }
      
      return {
        periodISO: f.periodISO,
        label: f.periodLabel,
        data: dataObj,
        yoy
      };
    });
    
    // Filter metrics if specified
    let filteredItems = items;
    if (metrics) {
      const metricKeys = metrics.split(',');
      filteredItems = items.map(item => ({
        ...item,
        data: metricKeys.reduce((acc, key) => {
          if (item.data[key] !== undefined) {
            acc[key] = item.data[key];
          }
          return acc;
        }, {}),
        yoy: metricKeys.reduce((acc, key) => {
          if (item.yoy[key] !== undefined) {
            acc[key] = item.yoy[key];
          }
          return acc;
        }, {})
      }));
    }
    
    res.json({
      symbol,
      periodType,
      items: filteredItems.reverse() // Return in chronological order
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/financials/:symbol - Create/update financial data
router.post('/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { periodType, periodLabel, periodISO, data, force } = req.body;
    
    if (!periodType || !periodISO) {
      return res.status(400).json({ error: 'periodType and periodISO are required' });
    }
    
    // Check for existing record
    const existing = await FinancialData.findOne({
      symbol,
      periodType,
      periodISO
    });
    
    if (existing && !force) {
      return res.status(409).json({ 
        error: 'Financial data for this period already exists. Use force=true to update.',
        existingId: existing._id
      });
    }
    
    let doc;
    if (existing) {
      // Update existing
      existing.data = { ...existing.data.toObject(), ...data };
      existing.periodLabel = periodLabel || existing.periodLabel;
      existing.updatedAt = new Date();
      doc = await existing.save();
    } else {
      // Create new
      doc = await FinancialData.create({
        symbol,
        periodType,
        periodLabel,
        periodISO,
        data
      });
    }
    
    res.status(existing ? 200 : 201).json({ ok: true, doc });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/financials/:symbol - Delete financial data for a period
router.delete('/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { periodISO, periodType } = req.query;
    
    if (!periodISO) {
      return res.status(400).json({ error: 'periodISO query parameter is required' });
    }
    
    const query = { symbol, periodISO };
    if (periodType) {
      query.periodType = periodType;
    }
    
    const result = await FinancialData.findOneAndDelete(query);
    
    if (!result) {
      return res.status(404).json({ error: 'Financial data not found' });
    }
    
    res.json({ message: 'Financial data deleted successfully', periodISO });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

