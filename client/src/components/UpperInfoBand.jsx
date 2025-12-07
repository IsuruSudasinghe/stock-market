import { formatNumber, formatCurrency, formatToThreeDecimals } from '../utils/formatters';

const InfoItem = ({ label, value, subLabel }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
      {label}
    </span>
    <span className="text-xl font-bold text-slate-800 mt-1">
      {value}
    </span>
    {subLabel && (
      <span className="text-xs text-gray-400">{subLabel}</span>
    )}
  </div>
);

const UpperInfoBand = ({ company }) => {
  if (!company) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 animate-pulse">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const {
    name,
    symbol,
    isin,
    category,
    lastTradedPrice,
    closingPrice,
    previousClose,
    change,
    changePercentage,
    tdyTurnover,
    tdyShareVolume,
    tdyTradeVolume,
    hiTrade,
    lowTrade,
    marketCap,
    marketCapPercentage,
    beta,
    logoPath
  } = company;

  const isPositive = change > 0;
  const isNegative = change < 0;
  const priceColorClass = isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-gray-600';
  const bgColorClass = isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50';

  // Format percentage only if valid
  const formatChangePercent = (val) => {
    if (val === null || val === undefined || !isFinite(val)) return '';
    return `(${formatToThreeDecimals(val)}%)`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4 sm:mb-6">
      {/* Top Section - Company Info and Price */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Company Info */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Logo placeholder */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200 flex-shrink-0">
              {logoPath ? (
                <img 
                  src={`https://www.cse.lk/${logoPath}`} 
                  alt={symbol}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <span className={logoPath ? 'hidden' : 'text-base sm:text-lg font-bold'}>
                {symbol?.substring(0, 2)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{name}</h1>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="font-medium">({symbol})</span>
                {isin && <span className="hidden sm:inline">ISIN : {isin}</span>}
                {isin && <span className="sm:hidden">ISIN: {isin}</span>}
                {category && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full whitespace-nowrap">
                    {category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price Section - Stack on mobile, horizontal on desktop */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8 flex-shrink-0">
            {/* Main Price */}
            <div className="text-left sm:text-right">
              <div className="text-3xl sm:text-4xl font-bold text-slate-800">
                {formatToThreeDecimals(lastTradedPrice || closingPrice)}
              </div>
              <div className={`flex items-center sm:justify-end gap-2 mt-1 flex-wrap ${priceColorClass}`}>
                <span className={`px-2 py-0.5 rounded text-xs sm:text-sm font-medium ${bgColorClass}`}>
                  {isNegative ? '▼' : isPositive ? '▲' : ''}
                  {' '}{change >= 0 ? '+' : ''}{formatToThreeDecimals(change)}
                </span>
                {formatChangePercent(changePercentage) && (
                  <span className={`px-2 py-0.5 rounded text-xs sm:text-sm font-medium ${bgColorClass}`}>
                    {formatChangePercent(changePercentage)}
                  </span>
                )}
              </div>
            </div>

            {/* Close & Previous - Stack on mobile, horizontal on tablet+ */}
            <div className="flex gap-3 sm:gap-4 lg:gap-6">
              <div className="border-l border-gray-200 pl-3 sm:pl-4 lg:pl-6">
                <div className="text-left sm:text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Close Price (Rs.)</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                    {formatToThreeDecimals(closingPrice)}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-left sm:text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Previous Close (Rs.)</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                    {formatToThreeDecimals(previousClose)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Trading Info */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <InfoItem 
            label="Turnover (Rs.)" 
            value={formatCurrency(tdyTurnover)} 
          />
          <InfoItem 
            label="Share Volume" 
            value={tdyShareVolume ? formatNumber(tdyShareVolume, 0) : '—'} 
          />
          <InfoItem 
            label="Trade Volume" 
            value={tdyTradeVolume ? formatNumber(tdyTradeVolume, 0) : '—'} 
          />
          <InfoItem 
            label="Day's Price Range (Rs.)" 
            value={`${formatToThreeDecimals(hiTrade)} - ${formatToThreeDecimals(lowTrade)}`} 
          />
        </div>
      </div>

      {/* Third Row - Market Info */}
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <InfoItem 
            label="Market Capitalization (Rs.)" 
            value={formatCurrency(marketCap)} 
          />
          <InfoItem 
            label="Market Cap/Total Market Cap" 
            value={marketCapPercentage != null && isFinite(marketCapPercentage) ? `${formatToThreeDecimals(marketCapPercentage)}%` : '—'} 
          />
          <InfoItem 
            label="Beta Values Against ASPI"
            value={formatToThreeDecimals(beta?.triASIBetaValue)}
            subLabel={beta?.triASIBetaPeriod ? `(As of ${beta.quarter ? `Q${beta.quarter}` : ''} ${beta.triASIBetaPeriod})` : ''}
          />
          <InfoItem 
            label="Beta Values Against S&P SL20"
            value={formatToThreeDecimals(beta?.betaValueSPSL)}
            subLabel={beta?.triASIBetaPeriod ? `(As of ${beta.quarter ? `Q${beta.quarter}` : ''} ${beta.triASIBetaPeriod})` : ''}
          />
        </div>
      </div>
    </div>
  );
};

export default UpperInfoBand;
