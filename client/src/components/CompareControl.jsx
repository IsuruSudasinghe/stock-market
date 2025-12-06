import { useState, useEffect } from 'react';
import { getCompanies, getCompany } from '../utils/api';

const CompareControl = ({
  isCompareMode,
  onToggleMode,
  selectedStocks = [],
  onStocksChange,
  mainSymbol,
  maxStocks = 5
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [categoryHints, setCategoryHints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load same-category companies when compare mode is enabled
  useEffect(() => {
    const loadCategoryHints = async () => {
      if (!isCompareMode || !mainSymbol) {
        setCategoryHints([]);
        return;
      }

      try {
        const mainCompany = await getCompany(mainSymbol);
        if (mainCompany?.category) {
          const sameCategory = await getCompanies('', mainCompany.category);
          // Filter out main stock and already selected
          const filtered = sameCategory.filter(
            c => c.symbol !== mainSymbol && !selectedStocks.includes(c.symbol)
          );
          setCategoryHints(filtered.slice(0, 5)); // Show top 5
        } else {
          setCategoryHints([]);
        }
      } catch (error) {
        console.error('Error loading category hints:', error);
      }
    };

    loadCategoryHints();
  }, [isCompareMode, mainSymbol, selectedStocks]);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (searchQuery.length < 1) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const companies = await getCompanies(searchQuery);
        // Filter out already selected stocks and main stock
        const filtered = companies.filter(
          c => c.symbol !== mainSymbol && !selectedStocks.includes(c.symbol)
        );
        setSearchResults(filtered.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchCompanies, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, mainSymbol, selectedStocks]);

  const handleAddStock = (symbol) => {
    if (selectedStocks.length < maxStocks - 1) {
      onStocksChange([...selectedStocks, symbol]);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleRemoveStock = (symbol) => {
    onStocksChange(selectedStocks.filter(s => s !== symbol));
  };

  return (
    <div className="flex items-center gap-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => onToggleMode(false)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            !isCompareMode
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Single
        </button>
        <button
          onClick={() => onToggleMode(true)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            isCompareMode
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Compare
        </button>
      </div>

      {/* Selected Stocks Chips */}
      {isCompareMode && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Stock (not removable) */}
          {mainSymbol && (
            <span className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
              {mainSymbol}
            </span>
          )}
          
          {/* Comparison Stocks */}
          {selectedStocks.map((symbol) => (
            <span
              key={symbol}
              className="px-3 py-1 bg-slate-200 text-slate-700 text-sm font-medium rounded-full flex items-center gap-1"
            >
              {symbol}
              <button
                onClick={() => handleRemoveStock(symbol)}
                className="ml-1 text-slate-500 hover:text-slate-700"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          {/* Category Hints */}
          {categoryHints.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-full">
              <span className="text-xs text-amber-700 font-medium">Same category:</span>
              {categoryHints.map((company) => (
                <button
                  key={company.symbol}
                  onClick={() => handleAddStock(company.symbol)}
                  disabled={selectedStocks.length >= maxStocks - 1 || selectedStocks.includes(company.symbol)}
                  className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {company.symbol}
                </button>
              ))}
            </div>
          )}

          {/* Add Stock Button */}
          {selectedStocks.length < maxStocks - 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-3 py-1 border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium rounded-full hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Stock
              </button>

              {/* Search Dropdown */}
              {showSearch && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search symbol..."
                      autoFocus
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  {loading && (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                  )}
                  
                  {!loading && searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto">
                      {searchResults.map((company) => (
                        <button
                          key={company.symbol}
                          onClick={() => handleAddStock(company.symbol)}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="text-sm font-medium text-slate-800">{company.symbol}</div>
                          <div className="text-xs text-gray-500 truncate">{company.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {!loading && searchQuery && searchResults.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>
          )}

          <span className="text-xs text-gray-400">
            ({selectedStocks.length + 1}/{maxStocks})
          </span>
        </div>
      )}
    </div>
  );
};

export default CompareControl;
