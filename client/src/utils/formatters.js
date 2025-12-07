/**
 * Remove trailing zeros from a number string
 * @param {string} numStr - Number string with decimals
 * @returns {string} Number string without trailing zeros
 */
export const removeTrailingZeros = (numStr) => {
  // Remove trailing zeros and trailing decimal point if all decimals are zeros
  return numStr.replace(/\.?0+$/, '');
};

/**
 * Format a number to 3 decimal places, removing trailing zeros
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatToThreeDecimals = (num) => {
  if (num === null || num === undefined) return '—';
  return removeTrailingZeros(num.toFixed(3));
};

/**
 * Format a number with abbreviations (K, M, B, T) in LKR
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default 3)
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = 3) => {
  if (num === null || num === undefined) return '—';
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1e12) {
    return sign + removeTrailingZeros((absNum / 1e12).toFixed(decimals)) + 'T';
  }
  if (absNum >= 1e9) {
    return sign + removeTrailingZeros((absNum / 1e9).toFixed(decimals)) + 'B';
  }
  if (absNum >= 1e6) {
    return sign + removeTrailingZeros((absNum / 1e6).toFixed(decimals)) + 'M';
  }
  if (absNum >= 1e3) {
    return sign + removeTrailingZeros((absNum / 1e3).toFixed(decimals)) + 'K';
  }
  
  return sign + removeTrailingZeros(absNum.toFixed(decimals));
};

/**
 * Format a number as LKR currency with full precision
 * @param {number} num - The number to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (num) => {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-LK', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(num);
};

/**
 * Format LKR currency with symbol
 * @param {number} num - The number to format
 * @returns {string} Formatted currency string with LKR symbol
 */
export const formatLKR = (num) => {
  if (num === null || num === undefined) return '—';
  return 'Rs. ' + new Intl.NumberFormat('en-LK', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 3
  }).format(num);
};

/**
 * Format a percentage change with sign and color class
 * Only shows percentage if data is available to calculate
 * @param {number} change - The change value (decimal, e.g., 0.1403 for 14.03%)
 * @returns {object} { value: string, colorClass: string, arrow: string, hasValue: boolean }
 */
export const formatPercentChange = (change) => {
  if (change === null || change === undefined || !isFinite(change)) {
    return { value: '—', colorClass: 'text-neutral', arrow: '', hasValue: false };
  }
  
  const percentage = removeTrailingZeros((change * 100).toFixed(3));
  
  if (change > 0) {
    return {
      value: `+${percentage}%`,
      colorClass: 'text-positive',
      arrow: '↑',
      hasValue: true
    };
  } else if (change < 0) {
    return {
      value: `${percentage}%`,
      colorClass: 'text-negative',
      arrow: '↓',
      hasValue: true
    };
  }
  
  return { value: '0%', colorClass: 'text-neutral', arrow: '', hasValue: true };
};

/**
 * Format a simple percentage value
 * @param {number} value - The percentage value
 * @returns {string} Formatted percentage
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined || !isFinite(value)) return '—';
  return `${removeTrailingZeros(value.toFixed(3))}%`;
};

/**
 * Format price with change indicator
 * @param {number} price - Current price
 * @param {number} change - Price change
 * @param {number} changePercent - Percentage change
 * @returns {object} Formatted price data
 */
export const formatPriceChange = (price, change, changePercent) => {
  const priceStr = price !== null && price !== undefined ? removeTrailingZeros(price.toFixed(3)) : '—';
  const changeStr = change !== null && change !== undefined ? removeTrailingZeros(change.toFixed(3)) : '—';
  const percentStr = (changePercent !== null && changePercent !== undefined && isFinite(changePercent)) 
    ? removeTrailingZeros(changePercent.toFixed(3))
    : null;
  
  let colorClass = 'text-neutral';
  let arrow = '';
  let bgClass = 'bg-gray-100';
  
  if (change > 0) {
    colorClass = 'text-positive';
    arrow = '▲';
    bgClass = 'bg-green-50';
  } else if (change < 0) {
    colorClass = 'text-negative';
    arrow = '▼';
    bgClass = 'bg-red-50';
  }
  
  return {
    price: priceStr,
    change: change >= 0 ? `+${changeStr}` : changeStr,
    percent: percentStr ? `(${percentStr}%)` : '',
    colorClass,
    arrow,
    bgClass
  };
};

/**
 * Get period label from ISO string
 * @param {string} periodISO - Period ISO string (e.g., "2025-Q3" or "2025")
 * @returns {string} Human-readable label
 */
export const getPeriodLabel = (periodISO) => {
  if (!periodISO) return '';
  
  if (periodISO.includes('-Q')) {
    const [year, quarter] = periodISO.split('-Q');
    const quarterMonths = {
      '1': 'Jan',
      '2': 'Apr',
      '3': 'Jul',
      '4': 'Oct'
    };
    return `${quarterMonths[quarter]} ${year}`;
  }
  
  return periodISO; // Annual - just return the year
};

/**
 * Parse period label to ISO format
 * @param {string} label - Period label (e.g., "Jul 2025")
 * @param {string} type - Period type ("quarterly" or "annual")
 * @returns {string} Period ISO string
 */
export const labelToPeriodISO = (label, type) => {
  if (type === 'annual') {
    return label;
  }
  
  const monthQuarterMap = {
    'Jan': 'Q1', 'Feb': 'Q1', 'Mar': 'Q1',
    'Apr': 'Q2', 'May': 'Q2', 'Jun': 'Q2',
    'Jul': 'Q3', 'Aug': 'Q3', 'Sep': 'Q3',
    'Oct': 'Q4', 'Nov': 'Q4', 'Dec': 'Q4'
  };
  
  const parts = label.split(' ');
  if (parts.length === 2) {
    const [month, year] = parts;
    const quarter = monthQuarterMap[month];
    if (quarter) {
      return `${year}-${quarter}`;
    }
  }
  
  return label;
};
