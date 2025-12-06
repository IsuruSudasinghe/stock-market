const mongoose = require('mongoose');

const financialDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  periodType: {
    type: String,
    required: true,
    enum: ['quarterly', 'annual']
  },
  periodLabel: {
    type: String,
    required: true
  },
  periodISO: {
    type: String,
    required: true
  },
  data: {
    // Income Statement metrics
    revenue: Number,
    operatingExpense: Number,
    netIncome: Number,
    netProfitMargin: Number,
    eps: Number,
    ebitda: Number,
    effectiveTaxRate: Number,
    
    // Balance Sheet metrics
    cashAndShortTermInvestments: Number,
    totalAssets: Number,
    totalLiabilities: Number,
    totalEquity: Number,
    sharesOutstanding: Number,
    priceToBook: Number,
    returnOnAssets: Number,
    returnOnCapital: Number,
    
    // Cash Flow metrics
    cashFromOperations: Number,
    cashFromInvesting: Number,
    cashFromFinancing: Number,
    netChangeInCash: Number,
    freeCashFlow: Number,
    
    // Custom metrics (extensible)
    custom: {
      type: Map,
      of: Number,
      default: {}
    }
  }
}, {
  timestamps: true
});

// Create unique compound index
financialDataSchema.index(
  { symbol: 1, periodISO: 1, periodType: 1 },
  { unique: true }
);

module.exports = mongoose.model('FinancialData', financialDataSchema);

