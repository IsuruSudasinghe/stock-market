const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const cseApi = require('../services/cseApi');

// POST /api/sync/company - Fetch from CSE API and upsert company
router.post('/company', async (req, res, next) => {
  try {
    const { symbol } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'symbol is required' });
    }
    
    // Fetch from CSE API
    const cseData = await cseApi.fetchCompanyInfo(symbol);
    
    if (!cseData || !cseData.reqSymbolInfo) {
      return res.status(502).json({ 
        error: 'Failed to fetch data from CSE API or invalid response' 
      });
    }
    
    const { reqSymbolInfo, reqSymbolBetaInfo, reqLogo } = cseData;
    
    // Map CSE data to our Company schema
    const companyData = {
      symbol: reqSymbolInfo.symbol,
      name: reqSymbolInfo.name,
      isin: reqSymbolInfo.isin,
      issueDate: reqSymbolInfo.issueDate,
      quantityIssued: reqSymbolInfo.quantityIssued,
      parValue: reqSymbolInfo.parValue,
      lastTradedPrice: reqSymbolInfo.lastTradedPrice,
      closingPrice: reqSymbolInfo.closingPrice,
      previousClose: reqSymbolInfo.previousClose,
      hiTrade: reqSymbolInfo.hiTrade,
      lowTrade: reqSymbolInfo.lowTrade,
      change: reqSymbolInfo.change,
      changePercentage: reqSymbolInfo.changePercentage,
      tdyShareVolume: reqSymbolInfo.tdyShareVolume,
      tdyTradeVolume: reqSymbolInfo.tdyTradeVolume,
      tdyTurnover: reqSymbolInfo.tdyTurnover,
      marketCap: reqSymbolInfo.marketCap,
      marketCapPercentage: reqSymbolInfo.marketCapPercentage,
      // Historical prices
      wtdHiPrice: reqSymbolInfo.wtdHiPrice,
      wtdLowPrice: reqSymbolInfo.wtdLowPrice,
      mtdHiPrice: reqSymbolInfo.mtdHiPrice,
      mtdLowPrice: reqSymbolInfo.mtdLowPrice,
      ytdHiPrice: reqSymbolInfo.ytdHiPrice,
      ytdLowPrice: reqSymbolInfo.ytdLowPrice,
      p12HiPrice: reqSymbolInfo.p12HiPrice,
      p12LowPrice: reqSymbolInfo.p12LowPrice,
      allHiPrice: reqSymbolInfo.allHiPrice,
      allLowPrice: reqSymbolInfo.allLowPrice,
      // Volumes
      wdyShareVolume: reqSymbolInfo.wdyShareVolume,
      mtdShareVolume: reqSymbolInfo.mtdShareVolume,
      ytdShareVolume: reqSymbolInfo.ytdShareVolume,
      p12ShareVolume: reqSymbolInfo.p12ShareVolume,
      // Turnovers
      wtdTurnover: reqSymbolInfo.wtdTurnover,
      mtdTurnover: reqSymbolInfo.mtdTurnover,
      ytdTurnover: reqSymbolInfo.ytdTurnover,
      // Beta values
      beta: reqSymbolBetaInfo ? {
        triASIBetaValue: reqSymbolBetaInfo.triASIBetaValue,
        betaValueSPSL: reqSymbolBetaInfo.betaValueSPSL,
        triASIBetaPeriod: reqSymbolBetaInfo.triASIBetaPeriod,
        quarter: reqSymbolBetaInfo.quarter
      } : undefined,
      // Logo
      logoPath: reqLogo?.path,
      updatedAt: new Date()
    };
    
    // Upsert company
    const company = await Company.findOneAndUpdate(
      { symbol: companyData.symbol },
      companyData,
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json(company);
  } catch (err) {
    if (err.response) {
      // CSE API returned an error
      return res.status(502).json({ 
        error: 'CSE API error',
        details: err.message
      });
    }
    next(err);
  }
});

module.exports = router;

