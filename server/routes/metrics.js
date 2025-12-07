const express = require('express');
const router = express.Router();
const MetricDefinition = require('../models/MetricDefinition');

// GET /api/metrics - List all metric definitions
router.get('/', async (req, res, next) => {
  try {
    const { section } = req.query;
    const query = section ? { section } : {};
    
    const metrics = await MetricDefinition.find(query).sort({ section: 1, order: 1, name: 1 });
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

// GET /api/metrics/:key - Get single metric definition
router.get('/:key', async (req, res, next) => {
  try {
    const metric = await MetricDefinition.findOne({ key: req.params.key });
    
    if (!metric) {
      return res.status(404).json({ error: 'Metric definition not found' });
    }
    
    res.json(metric);
  } catch (err) {
    next(err);
  }
});

// POST /api/metrics - Create new metric definition
router.post('/', async (req, res, next) => {
  try {
    const { name, key, section, unit, isDefault } = req.body;
    
    if (!name || !key || !section) {
      return res.status(400).json({ error: 'name, key, and section are required' });
    }
    
    const existing = await MetricDefinition.findOne({ key });
    if (existing) {
      return res.status(409).json({ error: 'Metric with this key already exists' });
    }
    
    // Get the highest order for this section and add 1 (add to end)
    const maxOrderMetric = await MetricDefinition.findOne({ section })
      .sort({ order: -1 })
      .limit(1);
    const newOrder = maxOrderMetric?.order !== undefined ? maxOrderMetric.order + 1 : 0;
    
    const metric = await MetricDefinition.create({
      name,
      key,
      section,
      unit: unit || 'LKR',
      isDefault: isDefault || false,
      order: newOrder
    });
    
    res.status(201).json(metric);
  } catch (err) {
    next(err);
  }
});

// PUT /api/metrics/reorder - Bulk update metric orders (MUST be before /:key routes)
router.put('/reorder', async (req, res, next) => {
  try {
    const { metrics } = req.body; // Array of { key, order }
    
    if (!Array.isArray(metrics)) {
      return res.status(400).json({ error: 'metrics must be an array' });
    }
    
    const updatePromises = metrics.map(({ key, order }) =>
      MetricDefinition.findOneAndUpdate(
        { key },
        { order },
        { new: true }
      )
    );
    
    await Promise.all(updatePromises);
    
    res.json({ message: 'Metrics reordered successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/metrics/:key - Update metric definition
router.put('/:key', async (req, res, next) => {
  try {
    const { name, section, unit, isDefault, order } = req.body;
    
    const updateData = { name, section, unit, isDefault };
    if (order !== undefined) {
      updateData.order = order;
    }
    
    const metric = await MetricDefinition.findOneAndUpdate(
      { key: req.params.key },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!metric) {
      return res.status(404).json({ error: 'Metric definition not found' });
    }
    
    res.json(metric);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/metrics/:key - Delete metric definition
router.delete('/:key', async (req, res, next) => {
  try {
    const metric = await MetricDefinition.findOneAndDelete({ key: req.params.key });
    
    if (!metric) {
      return res.status(404).json({ error: 'Metric definition not found' });
    }
    
    res.json({ message: 'Metric definition deleted successfully', key: req.params.key });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
