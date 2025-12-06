const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('../models/Company');
const MetricDefinition = require('../models/MetricDefinition');
const FinancialData = require('../models/FinancialData');

const companies = require('./companies.json');
const metrics = require('./metrics.json');

// Sample financial data for JKH.N0000 (John Keells Holdings)
const sampleFinancialData = [
  {
    symbol: 'JKH.N0000',
    periodType: 'quarterly',
    periodLabel: 'Jul 2024',
    periodISO: '2024-Q3',
    data: {
      revenue: 1520000000,
      operatingExpense: 890000000,
      netIncome: 408000000,
      netProfitMargin: 26.84,
      eps: 3.43,
      ebitda: 402000000,
      effectiveTaxRate: -22.5,
      cashAndShortTermInvestments: 1990000000,
      totalAssets: 11200000000,
      totalLiabilities: 4800000000,
      totalEquity: 6400000000,
      sharesOutstanding: 185750000,
      priceToBook: 2.95,
      returnOnAssets: 3.64,
      returnOnCapital: 6.38,
      cashFromOperations: 455000000,
      cashFromInvesting: 53800,
      cashFromFinancing: 55000000,
      netChangeInCash: 2040000000,
      freeCashFlow: 320000000
    }
  },
  {
    symbol: 'JKH.N0000',
    periodType: 'quarterly',
    periodLabel: 'Oct 2024',
    periodISO: '2024-Q4',
    data: {
      revenue: 1580000000,
      operatingExpense: 920000000,
      netIncome: 385000000,
      netProfitMargin: 24.37,
      eps: 3.24,
      ebitda: 378000000,
      effectiveTaxRate: -24.2,
      cashAndShortTermInvestments: 2050000000,
      totalAssets: 11800000000,
      totalLiabilities: 5100000000,
      totalEquity: 6700000000,
      sharesOutstanding: 185750000,
      priceToBook: 2.88,
      returnOnAssets: 3.26,
      returnOnCapital: 5.75,
      cashFromOperations: 420000000,
      cashFromInvesting: -120000000,
      cashFromFinancing: 78000000,
      netChangeInCash: -580000000,
      freeCashFlow: 290000000
    }
  },
  {
    symbol: 'JKH.N0000',
    periodType: 'quarterly',
    periodLabel: 'Jan 2025',
    periodISO: '2025-Q1',
    data: {
      revenue: 1620000000,
      operatingExpense: 980000000,
      netIncome: 320000000,
      netProfitMargin: 19.75,
      eps: 3.28,
      ebitda: 315000000,
      effectiveTaxRate: -25.8,
      cashAndShortTermInvestments: 2180000000,
      totalAssets: 25500000000,
      totalLiabilities: 11200000000,
      totalEquity: 14300000000,
      sharesOutstanding: 185750000,
      priceToBook: 2.92,
      returnOnAssets: 1.25,
      returnOnCapital: 2.24,
      cashFromOperations: 380000000,
      cashFromInvesting: -280000000,
      cashFromFinancing: 125000000,
      netChangeInCash: -1200000000,
      freeCashFlow: 245000000
    }
  },
  {
    symbol: 'JKH.N0000',
    periodType: 'quarterly',
    periodLabel: 'Apr 2025',
    periodISO: '2025-Q2',
    data: {
      revenue: 1680000000,
      operatingExpense: 1150000000,
      netIncome: 278000000,
      netProfitMargin: 16.55,
      eps: 3.32,
      ebitda: 272000000,
      effectiveTaxRate: -26.5,
      cashAndShortTermInvestments: 2320000000,
      totalAssets: 38500000000,
      totalLiabilities: 16800000000,
      totalEquity: 21700000000,
      sharesOutstanding: 185750000,
      priceToBook: 3.02,
      returnOnAssets: 0.72,
      returnOnCapital: 1.28,
      cashFromOperations: 520000000,
      cashFromInvesting: -8500000000,
      cashFromFinancing: 2100000000,
      netChangeInCash: -5800000000,
      freeCashFlow: 680000000
    }
  },
  {
    symbol: 'JKH.N0000',
    periodType: 'quarterly',
    periodLabel: 'Jul 2025',
    periodISO: '2025-Q3',
    data: {
      revenue: 1740000000,
      operatingExpense: 1240000000,
      netIncome: 242510000,
      netProfitMargin: 13.94,
      eps: 3.39,
      ebitda: 242380000,
      effectiveTaxRate: -27.98,
      cashAndShortTermInvestments: 2590000000,
      totalAssets: 48230000000,
      totalLiabilities: 20620000000,
      totalEquity: 27610000000,
      sharesOutstanding: 185750000,
      priceToBook: 3.11,
      returnOnAssets: 1.15,
      returnOnCapital: 1.30,
      cashFromOperations: 670960000,
      cashFromInvesting: -16500000000,
      cashFromFinancing: 4240000000,
      netChangeInCash: -11590000000,
      freeCashFlow: 1000000000
    }
  }
];

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stocktracker';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Company.deleteMany({});
    await MetricDefinition.deleteMany({});
    await FinancialData.deleteMany({});

    // Seed companies
    console.log('Seeding companies...');
    await Company.insertMany(companies);
    console.log(`Inserted ${companies.length} companies`);

    // Seed metric definitions
    console.log('Seeding metric definitions...');
    await MetricDefinition.insertMany(metrics);
    console.log(`Inserted ${metrics.length} metric definitions`);

    // Seed sample financial data
    console.log('Seeding sample financial data...');
    await FinancialData.insertMany(sampleFinancialData);
    console.log(`Inserted ${sampleFinancialData.length} financial records`);

    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

