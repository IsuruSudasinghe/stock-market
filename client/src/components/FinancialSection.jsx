import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import FinancialChart from './FinancialChart';
import MetricSelector from './MetricSelector';
import NumericDetailRows from './NumericDetailRows';
import { formatNumber } from '../utils/formatters';

const DEFAULT_METRICS = {
  income: ['revenue', 'netIncome'],
  balance: ['totalAssets', 'totalLiabilities'],
  cashflow: ['netChangeInCash']
};

const ALL_METRICS = {
  income: [
    { key: 'revenue', name: 'Revenue' },
    { key: 'operatingExpense', name: 'Operating Expense' },
    { key: 'netIncome', name: 'Net Income' },
    { key: 'netProfitMargin', name: 'Net Profit Margin' },
    { key: 'eps', name: 'Earnings Per Share' },
    { key: 'ebitda', name: 'EBITDA' },
    { key: 'effectiveTaxRate', name: 'Effective Tax Rate' }
  ],
  balance: [
    { key: 'cashAndShortTermInvestments', name: 'Cash & Short-term Investments' },
    { key: 'totalAssets', name: 'Total Assets' },
    { key: 'totalLiabilities', name: 'Total Liabilities' },
    { key: 'totalEquity', name: 'Total Equity' },
    { key: 'sharesOutstanding', name: 'Shares Outstanding' },
    { key: 'priceToBook', name: 'Price to Book' },
    { key: 'returnOnAssets', name: 'Return on Assets' },
    { key: 'returnOnCapital', name: 'Return on Capital' }
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

const SECTION_TITLES = {
  income: 'Income Statement',
  balance: 'Balance Sheet',
  cashflow: 'Cash Flow'
};

const FinancialSection = ({ 
  section, 
  symbol,
  data,
  loading,
  periodType,
  onPeriodTypeChange,
  compareData = []
}) => {
  const sectionRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState(DEFAULT_METRICS[section]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  
  // Get detail metrics for numeric rows (all metrics in section)
  const detailMetricKeys = ALL_METRICS[section].map(m => m.key);

  // Get selected period data for detail rows
  const getSelectedPeriodData = () => {
    if (!data?.items?.length) return { data: {}, yoy: {}, label: '' };
    
    if (selectedPeriod) {
      const item = data.items.find(i => i.periodISO === selectedPeriod);
      if (item) return { data: item.data, yoy: item.yoy, label: item.label };
    }
    
    // Default to latest period
    const latest = data.items[data.items.length - 1];
    return { data: latest?.data || {}, yoy: latest?.yoy || {}, label: latest?.label || '' };
  };

  const periodData = getSelectedPeriodData();

  // Export chart as PNG
  const handleExportChart = async () => {
    if (!sectionRef.current) return;
    
    try {
      const canvas = await html2canvas(sectionRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `${symbol}_${section}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Export data as CSV
  const handleExportCSV = () => {
    if (!data?.items?.length) return;

    const headers = ['Period', ...detailMetricKeys];
    const rows = data.items.map(item => [
      item.label,
      ...detailMetricKeys.map(key => item.data?.[key] ?? '')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = `${symbol}_${section}_${new Date().toISOString().split('T')[0]}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6" ref={sectionRef}>
      {/* Section Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {SECTION_TITLES[section]}
          </h2>
          
          {/* Period Type Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => onPeriodTypeChange('quarterly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                periodType === 'quarterly'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => onPeriodTypeChange('annual')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                periodType === 'annual'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export buttons */}
          <button
            onClick={handleExportChart}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Export as PNG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Export as CSV"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-64 bg-gray-100 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-8 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Metric Selector */}
              <MetricSelector
                metrics={ALL_METRICS[section]}
                selectedMetrics={selectedMetrics}
                onSelectionChange={setSelectedMetrics}
              />

              {/* Chart */}
              <FinancialChart
                data={data}
                metrics={selectedMetrics}
                selectedPeriod={selectedPeriod}
                onPeriodSelect={setSelectedPeriod}
                compareData={compareData}
              />

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 mb-2">
                {selectedMetrics.map((metricKey, index) => {
                  const metric = ALL_METRICS[section].find(m => m.key === metricKey);
                  const colors = ['#3b82f6', '#eab308', '#10b981', '#f97316'];
                  return (
                    <div key={metricKey} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-xs text-gray-600">{metric?.name || metricKey}</span>
                    </div>
                  );
                })}
              </div>

              {/* Numeric Detail Rows */}
              <NumericDetailRows
                data={periodData.data}
                yoy={periodData.yoy}
                metrics={detailMetricKeys}
                selectedPeriod={selectedPeriod}
                periodLabel={periodData.label}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialSection;

