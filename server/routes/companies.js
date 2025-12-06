const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// GET /api/companies - List/search companies
router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    let query = {};
    
    if (q) {
      query.$or = [
        { symbol: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    const companies = await Company.find(query)
      .select('symbol name isin category lastTradedPrice closingPrice change changePercentage marketCap')
      .limit(100)
      .sort({ symbol: 1 });
    
    res.json(companies);
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/categories - Get all unique categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Company.distinct('category');
    // Filter out empty categories
    const validCategories = categories.filter(c => c && c.trim() !== '');
    res.json(validCategories);
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/by-category/:category - Get all companies in a category
router.get('/by-category/:category', async (req, res, next) => {
  try {
    const companies = await Company.find({ category: req.params.category })
      .sort({ marketCap: -1 }); // Sort by market cap descending
    
    res.json(companies);
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:symbol - Get single company
router.get('/:symbol', async (req, res, next) => {
  try {
    const company = await Company.findOne({ symbol: req.params.symbol });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (err) {
    next(err);
  }
});

// POST /api/companies - Create company manually
router.post('/', async (req, res, next) => {
  try {
    const existingCompany = await Company.findOne({ symbol: req.body.symbol });
    
    if (existingCompany) {
      return res.status(409).json({ error: 'Company with this symbol already exists' });
    }
    
    const company = new Company(req.body);
    await company.save();
    
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
});

// PUT /api/companies/:symbol - Update company
router.put('/:symbol', async (req, res, next) => {
  try {
    const company = await Company.findOneAndUpdate(
      { symbol: req.params.symbol },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/companies/:symbol - Delete company
router.delete('/:symbol', async (req, res, next) => {
  try {
    const company = await Company.findOneAndDelete({ symbol: req.params.symbol });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ message: 'Company deleted successfully', symbol: req.params.symbol });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
