const express = require('express');
const router = express.Router();
const CategoryMetrics = require('../models/CategoryMetrics');

// GET /api/category-metrics/:category - Get default metrics for a category
router.get('/:category', async (req, res, next) => {
  try {
    const categoryMetrics = await CategoryMetrics.findOne({ category: req.params.category });
    
    if (!categoryMetrics) {
      return res.status(404).json({ error: 'No default metrics found for this category' });
    }
    
    res.json(categoryMetrics.metrics);
  } catch (err) {
    next(err);
  }
});

// POST /api/category-metrics/:category - Set default metrics for a category
router.post('/:category', async (req, res, next) => {
  try {
    const { metrics } = req.body;
    
    if (!Array.isArray(metrics)) {
      return res.status(400).json({ error: 'metrics must be an array' });
    }
    
    const categoryMetrics = await CategoryMetrics.findOneAndUpdate(
      { category: req.params.category },
      { 
        category: req.params.category,
        metrics,
        updatedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json(categoryMetrics);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/category-metrics/:category - Remove default metrics for a category
router.delete('/:category', async (req, res, next) => {
  try {
    const result = await CategoryMetrics.findOneAndDelete({ category: req.params.category });
    
    if (!result) {
      return res.status(404).json({ error: 'Category metrics not found' });
    }
    
    res.json({ message: 'Category metrics deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


