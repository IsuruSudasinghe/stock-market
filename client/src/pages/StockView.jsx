import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppState } from '../contexts/AppStateContext';
import UpperInfoBand from '../components/UpperInfoBand';
import CompareControl from '../components/CompareControl';
import FinancialSection from '../components/FinancialSection';
import { getCompany, getFinancials, syncCompanyFromCSE } from '../utils/api';

const StockView = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { dashboardState, updateDashboardState } = useAppState();
  
  // State
  const [company, setCompany] = useState(null);
  const [financials, setFinancials] = useState({
    income: null,
    balance: null,
    cashflow: null
  });
  const [loading, setLoading] = useState({
    company: false,
    income: false,
    balance: false,
    cashflow: false
  });
  
  // Use preserved state from context
  const [isCompareMode, setIsCompareMode] = useState(dashboardState.isCompareMode);
  const [compareStockSymbols, setCompareStockSymbols] = useState(dashboardState.compareStockSymbols || []);
  const [compareData, setCompareData] = useState({
    income: [],
    balance: [],
    cashflow: []
  });
  const [periodTypes, setPeriodTypes] = useState(dashboardState.periodTypes || {
    income: 'quarterly',
    balance: 'quarterly',
    cashflow: 'quarterly'
  });

  // Default symbol for initial load
  const currentSymbol = symbol || 'JKH.N0000';

  // Save state to context whenever it changes
  useEffect(() => {
    updateDashboardState({
      isCompareMode,
      compareStockSymbols,
      periodTypes
    });
  }, [isCompareMode, compareStockSymbols, periodTypes, updateDashboardState]);

  // Fetch company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!currentSymbol) return;

      setLoading(prev => ({ ...prev, company: true }));
      try {
        let companyData = await getCompany(currentSymbol);
        setCompany(companyData);
      } catch (error) {
        if (error.response?.status === 404) {
          try {
            toast.loading('Fetching data from CSE...', { id: 'cse-fetch' });
            const syncedCompany = await syncCompanyFromCSE(currentSymbol);
            setCompany(syncedCompany);
            toast.success('Company data loaded from CSE', { id: 'cse-fetch' });
          } catch (syncError) {
            toast.error('Failed to fetch company data', { id: 'cse-fetch' });
            console.error('Sync error:', syncError);
          }
        } else {
          toast.error('Error loading company data');
          console.error('Fetch error:', error);
        }
      } finally {
        setLoading(prev => ({ ...prev, company: false }));
      }
    };

    fetchCompanyData();
  }, [currentSymbol]);

  // Fetch financial data for each section
  useEffect(() => {
    const fetchFinancials = async (section) => {
      if (!currentSymbol) return;

      setLoading(prev => ({ ...prev, [section]: true }));
      try {
        const data = await getFinancials(currentSymbol, {
          periodType: periodTypes[section],
          limit: 5
        });
        setFinancials(prev => ({ ...prev, [section]: data }));
      } catch (error) {
        console.error(`Error fetching ${section} data:`, error);
        setFinancials(prev => ({ ...prev, [section]: null }));
      } finally {
        setLoading(prev => ({ ...prev, [section]: false }));
      }
    };

    fetchFinancials('income');
    fetchFinancials('balance');
    fetchFinancials('cashflow');
  }, [currentSymbol, periodTypes]);

  // Fetch compare data for each section independently
  useEffect(() => {
    const fetchCompareDataForSection = async (section) => {
      if (!isCompareMode || compareStockSymbols.length === 0) {
        setCompareData(prev => ({ ...prev, [section]: [] }));
        return;
      }

      try {
        const sectionCompareData = await Promise.all(
          compareStockSymbols.map(async (sym) => {
            const data = await getFinancials(sym, {
              periodType: periodTypes[section],
              limit: 5
            });
            return { symbol: sym, ...data };
          })
        );
        setCompareData(prev => ({ ...prev, [section]: sectionCompareData }));
      } catch (error) {
        console.error(`Error fetching compare data for ${section}:`, error);
        setCompareData(prev => ({ ...prev, [section]: [] }));
      }
    };

    fetchCompareDataForSection('income');
    fetchCompareDataForSection('balance');
    fetchCompareDataForSection('cashflow');
  }, [isCompareMode, compareStockSymbols, periodTypes]);

  // Handle period type change
  const handlePeriodTypeChange = (section, type) => {
    setPeriodTypes(prev => ({ ...prev, [section]: type }));
  };

  // Handle compare mode toggle
  const handleCompareToggle = (enabled) => {
    setIsCompareMode(enabled);
    if (!enabled) {
      setCompareStockSymbols([]);
      setCompareData({ income: [], balance: [], cashflow: [] });
    }
  };

  // Sync company from CSE
  const handleSyncFromCSE = async () => {
    if (!currentSymbol) return;

    try {
      toast.loading('Syncing from CSE...', { id: 'sync' });
      const syncedCompany = await syncCompanyFromCSE(currentSymbol);
      setCompany(syncedCompany);
      toast.success('Company data updated from CSE', { id: 'sync' });
    } catch (error) {
      toast.error('Failed to sync from CSE', { id: 'sync' });
      console.error('Sync error:', error);
    }
  };

  return (
    <div>
      {/* Upper Information Band */}
      <UpperInfoBand company={company} />

      {/* Controls Row - Fixed alignment */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side: Compare Control */}
        <CompareControl
          isCompareMode={isCompareMode}
          onToggleMode={handleCompareToggle}
          selectedStocks={compareStockSymbols}
          onStocksChange={setCompareStockSymbols}
          mainSymbol={currentSymbol}
        />

        {/* Right side: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncFromCSE}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync from CSE
          </button>
          <button
            onClick={() => navigate(`/data-entry/${currentSymbol}`)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Data
          </button>
        </div>
      </div>

      {/* Financials Section - Placeholder when no symbol */}
      {!currentSymbol && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Company</h3>
          <p className="text-gray-500">Use the search bar above to find and select a company</p>
        </div>
      )}

      {/* Financial Sections */}
      {currentSymbol && (
        <>
          <FinancialSection
            section="income"
            symbol={currentSymbol}
            data={financials.income}
            loading={loading.income}
            periodType={periodTypes.income}
            onPeriodTypeChange={(type) => handlePeriodTypeChange('income', type)}
            compareData={isCompareMode ? compareData.income : []}
          />

          <FinancialSection
            section="balance"
            symbol={currentSymbol}
            data={financials.balance}
            loading={loading.balance}
            periodType={periodTypes.balance}
            onPeriodTypeChange={(type) => handlePeriodTypeChange('balance', type)}
            compareData={isCompareMode ? compareData.balance : []}
          />

          <FinancialSection
            section="cashflow"
            symbol={currentSymbol}
            data={financials.cashflow}
            loading={loading.cashflow}
            periodType={periodTypes.cashflow}
            onPeriodTypeChange={(type) => handlePeriodTypeChange('cashflow', type)}
            compareData={isCompareMode ? compareData.cashflow : []}
          />
        </>
      )}
    </div>
  );
};

export default StockView;
