import { formatNumber, formatPercentChange, formatPercent, formatToThreeDecimals } from '../utils/formatters';

const NumericDetailRows = ({ 
  data, 
  yoy, 
  metrics = [], 
  selectedPeriod,
  periodLabel 
}) => {
  // Get display name from metric key
  const getDisplayName = (key) => {
    const nameMap = {
      revenue: 'Revenue',
      operatingExpense: 'Operating expense',
      netIncome: 'Net income',
      netProfitMargin: 'Net profit margin',
      eps: 'Earnings per share',
      ebitda: 'EBITDA',
      effectiveTaxRate: 'Effective tax rate',
      cashAndShortTermInvestments: 'Cash and short-term investments',
      totalAssets: 'Total assets',
      totalLiabilities: 'Total liabilities',
      totalEquity: 'Total equity',
      sharesOutstanding: 'Shares outstanding',
      priceToBook: 'Price to book',
      returnOnAssets: 'Return on assets',
      returnOnCapital: 'Return on capital',
      cashFromOperations: 'Cash from operations',
      cashFromInvesting: 'Cash from investing',
      cashFromFinancing: 'Cash from financing',
      netChangeInCash: 'Net change in cash',
      freeCashFlow: 'Free cash flow'
    };
    return nameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Get unit type for metric
  const isPercentageMetric = (key) => {
    return ['netProfitMargin', 'effectiveTaxRate', 'returnOnAssets', 'returnOnCapital'].includes(key);
  };

  const isRatioMetric = (key) => {
    return ['priceToBook', 'eps'].includes(key);
  };

  // Format value based on metric type
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return '—';
    if (isPercentageMetric(key)) return formatPercent(value);
    if (isRatioMetric(key)) return formatToThreeDecimals(value);
    return formatNumber(value);
  };

  return (
    <div className="mt-3 sm:mt-4 px-2 sm:px-4 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide mb-2 sm:mb-3 pb-2 border-b border-gray-100 px-2 sm:px-4">
        <span className="text-xs">(LKR)</span>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1 text-xs">
            <span className="hidden sm:inline">{periodLabel || selectedPeriod || 'Latest'}</span>
            <span className="sm:hidden truncate max-w-[80px]">{periodLabel || selectedPeriod || 'Latest'}</span>
            <span className="text-gray-400">ⓘ</span>
          </span>
          <span className="w-20 sm:w-28 text-right text-xs">Y/Y Change</span>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {metrics.map((metricKey) => {
          const value = data?.[metricKey];
          const yoyValue = yoy?.[metricKey];
          const change = formatPercentChange(yoyValue);

          return (
            <div
              key={metricKey}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 px-2 sm:px-4 hover:bg-slate-50 rounded transition-colors"
            >
              <span className="text-xs sm:text-sm text-gray-700 flex-1 truncate">{getDisplayName(metricKey)}</span>
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 min-w-0">
                <span 
                  className="text-xs sm:text-sm font-medium text-slate-800 tabular-nums min-w-[80px] sm:min-w-[100px] text-right truncate"
                  title={value?.toLocaleString()}
                >
                  {formatValue(metricKey, value)}
                </span>
                <span className={`w-20 sm:w-28 text-right text-xs sm:text-sm font-medium tabular-nums flex-shrink-0 ${change.colorClass}`}>
                  {change.hasValue ? (
                    <>
                      {change.arrow && <span className="mr-0.5 sm:mr-1">{change.arrow}</span>}
                      <span className="truncate">{change.value}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NumericDetailRows;
