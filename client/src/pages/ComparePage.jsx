import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { useAppState } from '../contexts/AppStateContext';
import { getCompanies, getCategories, getCompaniesByCategory, getFinancials } from '../utils/api';
import { formatNumber, formatPercent } from '../utils/formatters';

const COLORS = [
  '#3b82f6', '#eab308', '#10b981', '#f97316', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1'
];

const METRICS = {
  income: [
    { key: 'revenue', name: 'Revenue' },
    { key: 'operatingExpense', name: 'Operating Expense' },
    { key: 'netIncome', name: 'Net Income' },
    { key: 'netProfitMargin', name: 'Net Profit Margin' },
    { key: 'eps', name: 'EPS' },
    { key: 'ebitda', name: 'EBITDA' },
    { key: 'effectiveTaxRate', name: 'Effective Tax Rate' }
  ],
  balance: [
    { key: 'cashAndShortTermInvestments', name: 'Cash & Investments' },
    { key: 'totalAssets', name: 'Total Assets' },
    { key: 'totalLiabilities', name: 'Total Liabilities' },
    { key: 'totalEquity', name: 'Total Equity' },
    { key: 'sharesOutstanding', name: 'Shares Outstanding' },
    { key: 'priceToBook', name: 'Price to Book' },
    { key: 'returnOnAssets', name: 'ROA' },
    { key: 'returnOnCapital', name: 'ROC' }
  ],
  cashflow: [
    { key: 'netIncome', name: 'Net Income' },
    { key: 'cashFromOperations', name: 'Cash from Operations' },
    { key: 'cashFromInvesting', name: 'Cash from Investing' },
    { key: 'cashFromFinancing', name: 'Cash from Financing' },
    { key: 'netChangeInCash', name: 'Net Change in Cash' },
    { key: 'freeCashFlow', name: 'Free Cash Flow' }
  ]
};

// Parse period for sorting (handles both "2024-Q3" and "2024")
const parsePeriod = (period) => {
  if (period.includes('-Q')) {
    const [year, quarter] = period.split('-Q');
    return { year: parseInt(year), quarter: parseInt(quarter), isQuarterly: true };
  }
  return { year: parseInt(period), quarter: 0, isQuarterly: false };
};

const CompareTable = ({ 
  title, 
  section,
  companies, 
  financialsMap, 
  selectedMetric, 
  onMetricChange, 
  metrics,
  periodType,
  selectedForChart,
  onToggleChartSelection
}) => {
  // Get all unique periods and sort them by date (oldest to newest, left to right)
  const periods = useMemo(() => {
    const allPeriods = new Set();
    Object.values(financialsMap).forEach(data => {
      if (data?.items) {
        data.items.forEach(item => {
          // Filter by periodType - only include matching periods
          const isQuarterly = item.periodISO && item.periodISO.includes('-Q');
          if (periodType === 'quarterly' && isQuarterly) {
            allPeriods.add(item.periodISO);
          } else if (periodType === 'annual' && !isQuarterly) {
            allPeriods.add(item.periodISO);
          }
        });
      }
    });
    
    const periodsArray = Array.from(allPeriods);
    
    // Sort by date (oldest first, newest last - left to right)
    periodsArray.sort((a, b) => {
      const aParsed = parsePeriod(a);
      const bParsed = parsePeriod(b);
      
      // Compare years first
      if (aParsed.year !== bParsed.year) {
        return aParsed.year - bParsed.year; // Oldest first
      }
      
      // If same year and both quarterly, compare quarters
      if (aParsed.isQuarterly && bParsed.isQuarterly) {
        return aParsed.quarter - bParsed.quarter; // Q1 before Q2, etc.
      }
      
      return 0;
    });
    
    // Return oldest to newest (left to right) - show up to 10 periods
    return periodsArray.slice(-10);
  }, [financialsMap, periodType]);

  // Sort state: { period: 'asc' | 'desc' | null } - tracks which column is sorted and direction
  // Default to latest period, descending
  const [columnSort, setColumnSort] = useState(() => {
    // Will be set after periods are calculated
    return { period: null, direction: null };
  });

  // Set default sort to latest period (last in array since it's reversed) when periods are first available
  useEffect(() => {
    if (periods.length > 0 && columnSort.period === null) {
      setColumnSort({ period: periods[periods.length - 1], direction: 'desc' });
    }
  }, [periods, columnSort.period]);

  // Sort companies based on selected column
  const sortedCompanies = useMemo(() => {
    if (!columnSort.period || !columnSort.direction) {
      return companies; // No sorting, return original order
    }

    const sorted = [...companies];
    sorted.sort((a, b) => {
      const aData = financialsMap[a.symbol];
      const bData = financialsMap[b.symbol];
      
      const aPeriodData = aData?.items?.find(i => i.periodISO === columnSort.period);
      const bPeriodData = bData?.items?.find(i => i.periodISO === columnSort.period);
      
      const aValue = aPeriodData?.data?.[selectedMetric];
      const bValue = bPeriodData?.data?.[selectedMetric];
      
      // Handle null/undefined values - put them at bottom
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1; // a goes to bottom
      if (bValue == null) return -1; // b goes to bottom
      
      // Compare values
      const comparison = aValue - bValue;
      return columnSort.direction === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [companies, financialsMap, selectedMetric, columnSort]);

  // Handle column header click for sorting
  const handleColumnSort = (period) => {
    setColumnSort(prev => {
      if (prev.period === period) {
        // Toggle direction if same column
        return {
          period,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New column, start with descending (highest first)
        return {
          period,
          direction: 'desc'
        };
      }
    });
  };

  const isPercentMetric = ['netProfitMargin', 'effectiveTaxRate', 'returnOnAssets', 'returnOnCapital'].includes(selectedMetric);

  // Build chart data for this section
  const chartData = useMemo(() => {
    if (selectedForChart.length === 0) return [];

    const allPeriods = new Set();
    selectedForChart.forEach(symbol => {
      financialsMap[symbol]?.items?.forEach(item => allPeriods.add(item.periodISO));
    });
    // Filter periods by periodType and sort by date (oldest first, newest last)
    const periodsArray = Array.from(allPeriods).filter(period => {
      const isQuarterly = period.includes('-Q');
      if (periodType === 'quarterly') return isQuarterly;
      if (periodType === 'annual') return !isQuarterly;
      return true;
    });
    
    periodsArray.sort((a, b) => {
      const aParsed = parsePeriod(a);
      const bParsed = parsePeriod(b);
      
      if (aParsed.year !== bParsed.year) {
        return aParsed.year - bParsed.year; // Oldest first
      }
      
      if (aParsed.isQuarterly && bParsed.isQuarterly) {
        return aParsed.quarter - bParsed.quarter; // Q1 before Q2
      }
      
      return 0;
    });
    const sortedPeriods = periodsArray.slice(-5); // Get last 5 (newest)

    return sortedPeriods.map(period => {
      const point = { period: period.includes('-Q') ? period.replace('-Q', ' Q') : period };
      selectedForChart.forEach(symbol => {
        const data = financialsMap[symbol]?.items?.find(i => i.periodISO === period);
        point[symbol] = data?.data?.[selectedMetric] ?? null;
      });
      return point;
    });
  }, [selectedForChart, financialsMap, selectedMetric]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 sm:mb-6">
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{title}</h2>
        </div>
        {/* Metric Selector */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {metrics.map(metric => (
            <button
              key={metric.key}
              onClick={() => onMetricChange(metric.key)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                selectedMetric === metric.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {metric.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-10 sm:w-12">
                Chart
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide min-w-[120px]">
                Company
              </th>
              {periods.map(period => {
                const isSorted = columnSort.period === period;
                return (
                  <th 
                    key={period} 
                    className={`px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none min-w-[80px] sm:min-w-[100px] ${
                      isSorted 
                        ? 'bg-gray-200 hover:bg-gray-300' 
                        : 'hover:bg-slate-100'
                    }`}
                    onClick={() => handleColumnSort(period)}
                    title="Click to sort by this column"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs">{period.includes('-Q') ? period.replace('-Q', ' Q') : period}</span>
                      {isSorted && (
                        <svg 
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform ${columnSort.direction === 'desc' ? '' : 'rotate-180'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedCompanies.map((company, idx) => {
              const data = financialsMap[company.symbol];
              const isSelected = selectedForChart.includes(company.symbol);
              // Find original index for color consistency
              const originalIdx = companies.findIndex(c => c.symbol === company.symbol);
              
              return (
                <tr key={company.symbol} className="hover:bg-slate-50">
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleChartSelection(company.symbol)}
                      disabled={!isSelected && selectedForChart.length >= 10}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[originalIdx >= 0 ? originalIdx % COLORS.length : idx % COLORS.length] }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-slate-800 truncate">{company.symbol}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[150px]">{company.name}</div>
                      </div>
                    </div>
                  </td>
                  {periods.map(period => {
                    const periodData = data?.items?.find(i => i.periodISO === period);
                    const value = periodData?.data?.[selectedMetric];
                    
                    return (
                      <td key={period} className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm tabular-nums min-w-[80px] sm:min-w-[100px]">
                        {value !== null && value !== undefined 
                          ? (isPercentMetric ? formatPercent(value) : formatNumber(value))
                          : '—'
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trend Chart for this section */}
      <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
            Trend Comparison - {metrics.find(m => m.key === selectedMetric)?.name || selectedMetric}
          </h3>
          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
            {selectedForChart.length} companies selected (max 10)
          </span>
        </div>

        {chartData.length > 0 && selectedForChart.length > 0 ? (
          <div style={{ height: 300 }} className="sm:h-[350px] lg:h-[400px] min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(v) => formatNumber(v, 0)}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                  formatter={(value) => [formatNumber(value), '']}
                />
                <Legend />
                {selectedForChart.map((symbol) => {
                  // Use the same index logic as the table for color consistency
                  const originalIdx = companies.findIndex(c => c.symbol === symbol);
                  const colorIdx = originalIdx >= 0 ? originalIdx : selectedForChart.indexOf(symbol);
                  return (
                    <Line
                      key={symbol}
                      type="monotone"
                      dataKey={symbol}
                      stroke={COLORS[colorIdx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Select companies using the checkboxes above to see the trend chart
          </div>
        )}
      </div>
    </div>
  );
};

const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { compareState, updateCompareState } = useAppState();
  
  // Use preserved state from context
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || compareState.selectedCategory || ''
  );
  const [companies, setCompanies] = useState([]);
  const [financialsMap, setFinancialsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState(compareState.periodType || 'quarterly');
  
  // Selected metrics for each section (from preserved state)
  const [selectedMetrics, setSelectedMetrics] = useState(compareState.selectedMetrics || {
    income: 'revenue',
    balance: 'totalAssets',
    cashflow: 'netChangeInCash'
  });
  
  // Companies selected for line chart per section (from preserved state)
  const [selectedForChart, setSelectedForChart] = useState(compareState.selectedForChart || {
    income: [],
    balance: [],
    cashflow: []
  });

  // Save state to context whenever it changes
  useEffect(() => {
    updateCompareState({
      selectedCategory,
      periodType,
      selectedMetrics,
      selectedForChart
    });
  }, [selectedCategory, periodType, selectedMetrics, selectedForChart, updateCompareState]);

  const [categories, setCategories] = useState([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Validate selectedCategory when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && selectedCategory && !categories.includes(selectedCategory)) {
      // Category doesn't exist, clear it
      setSelectedCategory('');
      setSearchParams({});
      updateCompareState({ 
        selectedCategory: '', 
        selectedForChart: { income: [], balance: [], cashflow: [] } 
      });
      setSelectedForChart({ income: [], balance: [], cashflow: [] });
    }
  }, [categories, selectedCategory]);

  // Load companies by category
  useEffect(() => {
    const loadCompanies = async () => {
      if (!selectedCategory) {
        try {
          const allCompanies = await getCompanies();
          setCompanies(allCompanies.slice(0, 20));
          // Reset chart selections when switching to "All Companies"
          const top10 = allCompanies.slice(0, 10).map(c => c.symbol);
          setSelectedForChart({
            income: top10,
            balance: top10,
            cashflow: top10
          });
        } catch (error) {
          console.error('Error loading companies:', error);
          setCompanies([]);
        }
        return;
      }

      setLoading(true);
      try {
        const categoryCompanies = await getCompaniesByCategory(selectedCategory);
        setCompanies(categoryCompanies);
        
        // Reset chart selections when switching categories - use top 10 from new category
        const top10 = categoryCompanies.slice(0, 10).map(c => c.symbol);
        setSelectedForChart({
          income: top10,
          balance: top10,
          cashflow: top10
        });
      } catch (error) {
        // If category doesn't exist or has no companies, show all companies
        console.error('Error loading category companies:', error);
        try {
          const allCompanies = await getCompanies();
          setCompanies(allCompanies.slice(0, 20));
          setSelectedCategory('');
          setSearchParams({});
          updateCompareState({ 
            selectedCategory: '',
            selectedForChart: { income: [], balance: [], cashflow: [] }
          });
          const top10 = allCompanies.slice(0, 10).map(c => c.symbol);
          setSelectedForChart({
            income: top10,
            balance: top10,
            cashflow: top10
          });
        } catch (fallbackError) {
          console.error('Error loading all companies:', fallbackError);
          setCompanies([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadCompanies();
  }, [selectedCategory]);

  // Load financial data for all companies
  useEffect(() => {
    const loadFinancials = async () => {
      if (companies.length === 0) return;

      setLoading(true);
      try {
        const financialsPromises = companies.map(async (company) => {
          try {
            const data = await getFinancials(company.symbol, { periodType, limit: 5 });
            return { symbol: company.symbol, data };
          } catch {
            return { symbol: company.symbol, data: null };
          }
        });

        const results = await Promise.all(financialsPromises);
        const map = {};
        results.forEach(r => {
          map[r.symbol] = r.data;
        });
        setFinancialsMap(map);
      } catch (error) {
        console.error('Error loading financials:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFinancials();
  }, [companies, periodType]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchParams(category ? { category } : {});
    // Reset chart selections when category changes
    setSelectedForChart({ income: [], balance: [], cashflow: [] });
  };

  // Handle metric change for a section
  const handleMetricChange = (section, metric) => {
    setSelectedMetrics(prev => ({ ...prev, [section]: metric }));
  };

  // Toggle company selection for chart (per section)
  const handleToggleChartSelection = (section, symbol) => {
    setSelectedForChart(prev => {
      const sectionSelection = prev[section] || [];
      if (sectionSelection.includes(symbol)) {
        return { ...prev, [section]: sectionSelection.filter(s => s !== symbol) };
      }
      if (sectionSelection.length >= 10) {
        toast.error('Maximum 10 companies can be shown in chart');
        return prev;
      }
      return { ...prev, [section]: [...sectionSelection, symbol] };
    });
  };

  return (
    <div>
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Compare Companies</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
              {selectedCategory ? `Showing companies in "${selectedCategory}"` : 'Showing all companies'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Category Selector */}
            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Companies</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Period Type Toggle */}
            <div className="flex-shrink-0">
              <label className="block text-xs text-gray-500 mb-1">Period</label>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setPeriodType('quarterly')}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                    periodType === 'quarterly'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setPeriodType('annual')}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                    periodType === 'annual'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Companies Found</h3>
          <p className="text-gray-500">
            {selectedCategory && categories.includes(selectedCategory)
              ? `No companies in category "${selectedCategory}". Add companies with this category first.`
              : 'Add some companies to start comparing.'}
          </p>
        </div>
      ) : (
        <>
          {/* Income Statement Table with Chart */}
          <CompareTable
            title="Income Statement"
            section="income"
            companies={companies}
            financialsMap={financialsMap}
            selectedMetric={selectedMetrics.income}
            onMetricChange={(m) => handleMetricChange('income', m)}
            metrics={METRICS.income}
            periodType={periodType}
            selectedForChart={selectedForChart.income}
            onToggleChartSelection={(symbol) => handleToggleChartSelection('income', symbol)}
          />

          {/* Balance Sheet Table with Chart */}
          <CompareTable
            title="Balance Sheet"
            section="balance"
            companies={companies}
            financialsMap={financialsMap}
            selectedMetric={selectedMetrics.balance}
            onMetricChange={(m) => handleMetricChange('balance', m)}
            metrics={METRICS.balance}
            periodType={periodType}
            selectedForChart={selectedForChart.balance}
            onToggleChartSelection={(symbol) => handleToggleChartSelection('balance', symbol)}
          />

          {/* Cash Flow Table with Chart */}
          <CompareTable
            title="Cash Flow"
            section="cashflow"
            companies={companies}
            financialsMap={financialsMap}
            selectedMetric={selectedMetrics.cashflow}
            onMetricChange={(m) => handleMetricChange('cashflow', m)}
            metrics={METRICS.cashflow}
            periodType={periodType}
            selectedForChart={selectedForChart.cashflow}
            onToggleChartSelection={(symbol) => handleToggleChartSelection('cashflow', symbol)}
          />
        </>
      )}
    </div>
  );
};

export default ComparePage;
