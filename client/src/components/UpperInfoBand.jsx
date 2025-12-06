import { formatNumber, formatCurrency } from '../utils/formatters';

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-4 gap-4">
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
    return `(${val.toFixed(3)}%)`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* Top Section - Company Info and Price */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          {/* Company Info */}
          <div className="flex items-center gap-4">
            {/* Logo placeholder */}
            <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
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
              <span className={logoPath ? 'hidden' : 'text-lg font-bold'}>
                {symbol?.substring(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{name}</h1>
              <div className="text-sm text-gray-500 mt-1">
                <span className="font-medium">({symbol})</span>
                {isin && <span className="ml-3">ISIN : {isin}</span>}
                {category && (
                  <span className="ml-3 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-center gap-8">
            {/* Main Price */}
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-800">
                {(lastTradedPrice || closingPrice)?.toFixed(3) || '—'}
              </div>
              <div className={`flex items-center justify-end gap-2 mt-1 ${priceColorClass}`}>
                <span className={`px-2 py-0.5 rounded text-sm font-medium ${bgColorClass}`}>
                  {isNegative ? '▼' : isPositive ? '▲' : ''}
                  {' '}{change >= 0 ? '+' : ''}{change?.toFixed(3) || '0.000'}
                </span>
                {formatChangePercent(changePercentage) && (
                  <span className={`px-2 py-0.5 rounded text-sm font-medium ${bgColorClass}`}>
                    {formatChangePercent(changePercentage)}
                  </span>
                )}
              </div>
            </div>

            {/* Close & Previous */}
            <div className="border-l border-gray-200 pl-6">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Close Price (Rs.)</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  {closingPrice?.toFixed(3) || '—'}
                </div>
              </div>
            </div>
            <div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Previous Close (Rs.)</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">
                  {previousClose?.toFixed(3) || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Trading Info */}
      <div className="px-6 py-4 bg-slate-50 border-b border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            value={`${hiTrade?.toFixed(3) || '—'} - ${lowTrade?.toFixed(3) || '—'}`} 
          />
        </div>
      </div>

      {/* Third Row - Market Info */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem 
            label="Market Capitalization (Rs.)" 
            value={formatCurrency(marketCap)} 
          />
          <InfoItem 
            label="Market Cap/Total Market Cap" 
            value={marketCapPercentage != null && isFinite(marketCapPercentage) ? `${marketCapPercentage.toFixed(3)}%` : '—'} 
          />
          <InfoItem 
            label="Beta Values Against ASPI"
            value={beta?.triASIBetaValue?.toFixed(3) || '—'}
            subLabel={beta?.triASIBetaPeriod ? `(As of ${beta.quarter ? `Q${beta.quarter}` : ''} ${beta.triASIBetaPeriod})` : ''}
          />
          <InfoItem 
            label="Beta Values Against S&P SL20"
            value={beta?.betaValueSPSL?.toFixed(3) || '—'}
            subLabel={beta?.triASIBetaPeriod ? `(As of ${beta.quarter ? `Q${beta.quarter}` : ''} ${beta.triASIBetaPeriod})` : ''}
          />
        </div>
      </div>
    </div>
  );
};

export default UpperInfoBand;
