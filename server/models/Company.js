const mongoose = require('mongoose');

const betaSchema = new mongoose.Schema({
  triASIBetaValue: Number,
  betaValueSPSL: Number,
  triASIBetaPeriod: String,
  quarter: Number
}, { _id: false });

const companySchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  isin: String,
  issueDate: String,
  quantityIssued: Number,
  parValue: Number,
  
  // Custom category for grouping/comparing companies
  category: {
    type: String,
    default: '',
    index: true
  },
  
  // Price data
  lastTradedPrice: Number,
  closingPrice: Number,
  previousClose: Number,
  hiTrade: Number,
  lowTrade: Number,
  change: Number,
  changePercentage: Number,
  
  // Volume data
  tdyShareVolume: Number,
  tdyTradeVolume: Number,
  tdyTurnover: Number,
  wdyShareVolume: Number,
  mtdShareVolume: Number,
  ytdShareVolume: Number,
  p12ShareVolume: Number,
  
  // Historical price ranges
  wtdHiPrice: Number,
  wtdLowPrice: Number,
  mtdHiPrice: Number,
  mtdLowPrice: Number,
  ytdHiPrice: Number,
  ytdLowPrice: Number,
  p12HiPrice: Number,
  p12LowPrice: Number,
  allHiPrice: Number,
  allLowPrice: Number,
  
  // Turnovers
  wtdTurnover: Number,
  mtdTurnover: Number,
  ytdTurnover: Number,
  
  // Market data
  marketCap: Number,
  marketCapPercentage: Number,
  
  // Beta values
  beta: betaSchema,
  
  // Logo
  logoPath: String
}, {
  timestamps: true
});

// Create text index for search
companySchema.index({ symbol: 'text', name: 'text' });

module.exports = mongoose.model('Company', companySchema);
