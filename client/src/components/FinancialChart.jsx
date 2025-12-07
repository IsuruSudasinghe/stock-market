import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatNumber, formatPercentChange } from '../utils/formatters';

const COLORS = {
  primary: '#3b82f6',
  secondary: '#eab308',
  tertiary: '#10b981',
  quaternary: '#f97316',
  quinary: '#8b5cf6'
};

const COLOR_ARRAY = Object.values(COLORS);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg text-xs sm:text-sm max-w-[200px] sm:max-w-none">
      <div className="font-medium mb-1 sm:mb-2 text-xs sm:text-sm">{label}</div>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
          <div
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-300 text-xs truncate">{entry.name}:</span>
          <span className="font-medium text-xs sm:text-sm">{formatNumber(entry.value)}</span>
          {entry.payload[`${entry.dataKey}_yoy`] !== undefined && (
            <span className={`text-xs flex-shrink-0 ${
              entry.payload[`${entry.dataKey}_yoy`] > 0 
                ? 'text-green-400' 
                : entry.payload[`${entry.dataKey}_yoy`] < 0 
                  ? 'text-red-400' 
                  : 'text-gray-400'
            }`}>
              {formatPercentChange(entry.payload[`${entry.dataKey}_yoy`]).value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const FinancialChart = ({ 
  data, 
  metrics = [], 
  selectedPeriod, 
  onPeriodSelect,
  compareData = [],
  height = 280
}) => {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!data?.items) return [];

    // Ensure we always show 5 periods
    const items = [...data.items];
    
    // Pad with empty periods if needed
    while (items.length < 5) {
      items.unshift({
        periodISO: `placeholder-${items.length}`,
        label: '—',
        data: {},
        yoy: {}
      });
    }

    return items.map((item) => {
      const chartItem = {
        periodISO: item.periodISO,
        label: item.label,
        isPlaceholder: item.periodISO?.startsWith('placeholder')
      };

      // Add main stock metrics
      metrics.forEach((metricKey) => {
        chartItem[metricKey] = item.data?.[metricKey] ?? null;
        chartItem[`${metricKey}_yoy`] = item.yoy?.[metricKey] ?? null;
      });

      // Add compare stock data
      compareData.forEach((stockData, stockIndex) => {
        const matchingItem = stockData.items?.find(d => d.periodISO === item.periodISO);
        metrics.forEach((metricKey) => {
          // Get value from the matching item's data object
          const value = matchingItem?.data?.[metricKey] ?? matchingItem?.data?.custom?.[metricKey] ?? null;
          chartItem[`${stockData.symbol}_${metricKey}`] = value;
        });
      });

      return chartItem;
    });
  }, [data, metrics, compareData]);

  // Generate bars for selected metrics
  const bars = useMemo(() => {
    const barElements = [];
    
    // Main stock bars
    metrics.forEach((metricKey, index) => {
      barElements.push(
        <Bar
          key={metricKey}
          dataKey={metricKey}
          name={metricKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          fill={COLOR_ARRAY[index % COLOR_ARRAY.length]}
          radius={[4, 4, 0, 0]}
          onClick={(data) => onPeriodSelect && onPeriodSelect(data.periodISO)}
          cursor="pointer"
        >
          {chartData.map((entry, idx) => (
            <Cell
              key={idx}
              fill={
                entry.periodISO === selectedPeriod
                  ? COLOR_ARRAY[index % COLOR_ARRAY.length]
                  : entry.isPlaceholder
                    ? '#e2e8f0'
                    : COLOR_ARRAY[index % COLOR_ARRAY.length]
              }
              fillOpacity={entry.periodISO === selectedPeriod ? 1 : 0.8}
              stroke={entry.periodISO === selectedPeriod ? '#1e40af' : 'none'}
              strokeWidth={entry.periodISO === selectedPeriod ? 2 : 0}
            />
          ))}
        </Bar>
      );
    });

    // Compare stock bars (with pattern/opacity difference)
    compareData.forEach((stockData, stockIndex) => {
      metrics.forEach((metricKey, metricIndex) => {
        barElements.push(
          <Bar
            key={`${stockData.symbol}_${metricKey}`}
            dataKey={`${stockData.symbol}_${metricKey}`}
            name={`${stockData.symbol} - ${metricKey}`}
            fill={COLOR_ARRAY[(metrics.length + stockIndex * metrics.length + metricIndex) % COLOR_ARRAY.length]}
            fillOpacity={0.6}
            radius={[4, 4, 0, 0]}
          />
        );
      });
    });

    return barElements;
  }, [metrics, compareData, chartData, selectedPeriod, onPeriodSelect]);

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data available
      </div>
    );
  }

  // Calculate dynamic width based on number of metrics
  const barCount = metrics.length + (compareData.length * metrics.length);
  const minChartWidth = 400;
  const barsPerGroup = Math.max(1, barCount);
  // Standard bar size when there's 2 bars, scale down when more
  const standardBarSize = 35;
  const dynamicBarSize = barsPerGroup <= 2 ? standardBarSize : Math.max(20, standardBarSize - (barsPerGroup - 2) * 5);
  
  return (
    <div style={{ height }} className="w-full min-h-[280px] sm:min-h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
          barCategoryGap="20%"
          barSize={dynamicBarSize}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            tickFormatter={(value) => formatNumber(value, 0)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconType="circle"
            iconSize={8}
            fontSize={11}
          />
          {bars}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinancialChart;

