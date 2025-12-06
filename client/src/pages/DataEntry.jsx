import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchSelect from '../components/SearchSelect';
import {
  getCompany,
  syncCompanyFromCSE,
  createCompany,
  getFinancials,
  createFinancialData,
  getMetrics,
  createMetric
} from '../utils/api';

const SECTIONS = [
  { id: 'income', name: 'Income Statement' },
  { id: 'balance', name: 'Balance Sheet' },
  { id: 'cashflow', name: 'Cash Flow' }
];

const QUARTERS = [
  { label: 'Q1 (Jan)', value: 'Q1', month: 'Jan' },
  { label: 'Q2 (Apr)', value: 'Q2', month: 'Apr' },
  { label: 'Q3 (Jul)', value: 'Q3', month: 'Jul' },
  { label: 'Q4 (Oct)', value: 'Q4', month: 'Oct' }
];

const DataEntry = () => {
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('company'); // 'company' or 'financials'
  const [selectedSymbol, setSelectedSymbol] = useState(urlSymbol || '');
  const [company, setCompany] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    symbol: '',
    name: '',
    isin: ''
  });

  // Financial form state
  const [financialForm, setFinancialForm] = useState({
    periodType: 'quarterly',
    year: new Date().getFullYear().toString(),
    quarter: 'Q3',
    section: 'income',
    data: {}
  });

  // Custom metric form
  const [showCustomMetric, setShowCustomMetric] = useState(false);
  const [customMetricForm, setCustomMetricForm] = useState({
    name: '',
    key: '',
    section: 'income',
    unit: 'USD'
  });

  // Load company data if symbol is provided
  useEffect(() => {
    if (selectedSymbol) {
      loadCompanyData(selectedSymbol);
    }
  }, [selectedSymbol]);

  // Load metrics
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadCompanyData = async (sym) => {
    try {
      const data = await getCompany(sym);
      setCompany(data);
      setCompanyForm({
        symbol: data.symbol || '',
        name: data.name || '',
        isin: data.isin || ''
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading company:', error);
      }
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  // Handle company selection from search
  const handleCompanySelect = (company) => {
    setSelectedSymbol(company.symbol);
    setCompanyForm({
      symbol: company.symbol,
      name: company.name || '',
      isin: company.isin || ''
    });
  };

  // Fetch from CSE
  const handleFetchFromCSE = async () => {
    if (!companyForm.symbol) {
      toast.error('Please enter a symbol');
      return;
    }

    setLoading(true);
    try {
      toast.loading('Fetching from CSE...', { id: 'fetch' });
      const data = await syncCompanyFromCSE(companyForm.symbol);
      setCompany(data);
      setSelectedSymbol(data.symbol);
      setCompanyForm({
        symbol: data.symbol,
        name: data.name,
        isin: data.isin || ''
      });
      toast.success('Company data fetched successfully', { id: 'fetch' });
    } catch (error) {
      toast.error('Failed to fetch from CSE', { id: 'fetch' });
      console.error('CSE fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create company manually
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.symbol || !companyForm.name) {
      toast.error('Symbol and name are required');
      return;
    }

    setLoading(true);
    try {
      const data = await createCompany(companyForm);
      setCompany(data);
      setSelectedSymbol(data.symbol);
      toast.success('Company created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Company already exists');
      } else {
        toast.error('Failed to create company');
      }
      console.error('Create company error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get period label and ISO
  const getPeriodInfo = () => {
    const { periodType, year, quarter } = financialForm;
    if (periodType === 'annual') {
      return { label: year, iso: year };
    }
    const q = QUARTERS.find(q => q.value === quarter);
    return {
      label: `${q?.month || ''} ${year}`,
      iso: `${year}-${quarter}`
    };
  };

  // Handle financial data change
  const handleFinancialDataChange = (key, value) => {
    setFinancialForm(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value === '' ? null : parseFloat(value)
      }
    }));
  };

  // Save financial data
  const handleSaveFinancials = async (e, addAnother = false) => {
    e.preventDefault();
    if (!selectedSymbol) {
      toast.error('Please select a company first');
      return;
    }

    const periodInfo = getPeriodInfo();
    
    setLoading(true);
    try {
      await createFinancialData(selectedSymbol, {
        periodType: financialForm.periodType,
        periodLabel: periodInfo.label,
        periodISO: periodInfo.iso,
        data: financialForm.data,
        force: true // Allow upsert
      });
      
      toast.success('Financial data saved successfully');
      
      if (addAnother) {
        // Reset data but keep period settings
        setFinancialForm(prev => ({ ...prev, data: {} }));
      } else {
        navigate(`/stock/${selectedSymbol}`);
      }
    } catch (error) {
      toast.error('Failed to save financial data');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create custom metric
  const handleCreateCustomMetric = async (e) => {
    e.preventDefault();
    if (!customMetricForm.name || !customMetricForm.key) {
      toast.error('Name and key are required');
      return;
    }

    try {
      await createMetric(customMetricForm);
      toast.success('Custom metric created');
      setShowCustomMetric(false);
      setCustomMetricForm({ name: '', key: '', section: 'income', unit: 'USD' });
      loadMetrics();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Metric key already exists');
      } else {
        toast.error('Failed to create metric');
      }
    }
  };

  // Get metrics for current section
  const sectionMetrics = metrics.filter(m => m.section === financialForm.section);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Data Entry</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'company'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Company Info
        </button>
        <button
          onClick={() => setActiveTab('financials')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'financials'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Financial Data
        </button>
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Company Information</h2>
          
          {/* Search existing */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Existing Company
            </label>
            <SearchSelect
              onSelect={handleCompanySelect}
              placeholder="Search by symbol or name..."
              value={selectedSymbol}
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Or Enter Manually</h3>
            
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={companyForm.symbol}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    placeholder="e.g., JKH.N0000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISIN
                  </label>
                  <input
                    type="text"
                    value={companyForm.isin}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, isin: e.target.value }))}
                    placeholder="e.g., LK0092N00003"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John Keells Holdings PLC"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleFetchFromCSE}
                  disabled={loading || !companyForm.symbol}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Fetch from CSE
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {company ? 'Update' : 'Create'} Company
                </button>
              </div>
            </form>
          </div>

          {/* Current Company Info */}
          {company && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Company Data</h3>
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-500">Symbol:</span> {company.symbol}</div>
                  <div><span className="text-gray-500">Name:</span> {company.name}</div>
                  <div><span className="text-gray-500">ISIN:</span> {company.isin || '—'}</div>
                  <div><span className="text-gray-500">Last Price:</span> {company.lastTradedPrice?.toFixed(2) || '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Financials Tab */}
      {activeTab === 'financials' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Financial Data Entry</h2>
          
          {!selectedSymbol ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Please select a company first</p>
              <button
                onClick={() => setActiveTab('company')}
                className="text-primary hover:underline"
              >
                Go to Company Info
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => handleSaveFinancials(e, false)}>
              {/* Period Selection */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Type
                  </label>
                  <select
                    value={financialForm.periodType}
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, periodType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <select
                    value={financialForm.year}
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                {financialForm.periodType === 'quarterly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quarter
                    </label>
                    <select
                      value={financialForm.quarter}
                      onChange={(e) => setFinancialForm(prev => ({ ...prev, quarter: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {QUARTERS.map(q => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Section Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <div className="flex gap-2">
                  {SECTIONS.map(section => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setFinancialForm(prev => ({ ...prev, section: section.id }))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        financialForm.section === section.id
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metric Inputs */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Metrics</h3>
                  <button
                    type="button"
                    onClick={() => setShowCustomMetric(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    + Add Custom Metric
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {sectionMetrics.map(metric => (
                    <div key={metric.key}>
                      <label className="block text-sm text-gray-600 mb-1">
                        {metric.name}
                        <span className="text-gray-400 text-xs ml-1">({metric.unit})</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={financialForm.data[metric.key] ?? ''}
                        onChange={(e) => handleFinancialDataChange(metric.key, e.target.value)}
                        placeholder="Enter value..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveFinancials(e, true)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  Save & Add Another
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Custom Metric Modal */}
      {showCustomMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Custom Metric</h3>
            <form onSubmit={handleCreateCustomMetric} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric Name
                </label>
                <input
                  type="text"
                  value={customMetricForm.name}
                  onChange={(e) => setCustomMetricForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Gross Margin"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key (no spaces)
                </label>
                <input
                  type="text"
                  value={customMetricForm.key}
                  onChange={(e) => setCustomMetricForm(prev => ({ 
                    ...prev, 
                    key: e.target.value.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '')
                  }))}
                  placeholder="e.g., grossMargin"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <select
                    value={customMetricForm.section}
                    onChange={(e) => setCustomMetricForm(prev => ({ ...prev, section: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {SECTIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={customMetricForm.unit}
                    onChange={(e) => setCustomMetricForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="percentage">Percentage</option>
                    <option value="ratio">Ratio</option>
                    <option value="shares">Shares</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomMetric(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEntry;

