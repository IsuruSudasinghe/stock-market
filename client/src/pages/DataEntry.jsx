import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchSelect from '../components/SearchSelect';
import {
  getCompany,
  getCompanies,
  getCategories,
  syncCompanyFromCSE,
  createCompany,
  updateCompany,
  deleteCompany,
  getFinancials,
  createFinancialData,
  getMetrics,
  createMetric,
  deleteMetric,
  getCategoryMetrics,
  setCategoryMetrics,
  reorderMetrics
} from '../utils/api';
import { formatToThreeDecimals } from '../utils/formatters';

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

// Standard metric keys that are defined in the MongoDB schema
// Custom metrics should be stored under data.custom instead
const STANDARD_METRIC_KEYS = [
  // Income Statement
  'revenue', 'operatingExpense', 'netIncome', 'netProfitMargin', 'eps', 'ebitda', 'effectiveTaxRate',
  // Balance Sheet
  'cashAndShortTermInvestments', 'totalAssets', 'totalLiabilities', 'totalEquity', 
  'sharesOutstanding', 'priceToBook', 'returnOnAssets', 'returnOnCapital',
  // Cash Flow
  'cashFromOperations', 'cashFromInvesting', 'cashFromFinancing', 'netChangeInCash', 'freeCashFlow'
];

const DataEntry = () => {
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'financials', or 'manage'
  const [selectedSymbol, setSelectedSymbol] = useState(urlSymbol || '');
  const [company, setCompany] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [existingFinancials, setExistingFinancials] = useState(null);

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    symbol: '',
    name: '',
    isin: '',
    category: ''
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
    unit: 'LKR'
  });

  // Load initial data
  useEffect(() => {
    loadAllCompanies();
    loadCategories();
    loadMetrics();
  }, []);

  // Load company data if symbol is provided
  useEffect(() => {
    if (selectedSymbol) {
      loadCompanyData(selectedSymbol);
    }
  }, [selectedSymbol]);

  // Load existing financial data when period changes
  useEffect(() => {
    if (selectedSymbol && activeTab === 'financials') {
      loadExistingFinancials();
    }
  }, [selectedSymbol, financialForm.periodType, financialForm.year, financialForm.quarter, activeTab]);

  // Track if company has existing financial data
  const [hasExistingFinancialData, setHasExistingFinancialData] = useState(false);

  // Check if company has existing financial data
  useEffect(() => {
    const checkExistingData = async () => {
      if (!selectedSymbol) {
        setHasExistingFinancialData(false);
        return;
      }

      try {
        const data = await getFinancials(selectedSymbol, { limit: 1 });
        setHasExistingFinancialData(data?.items && data.items.length > 0);
      } catch {
        setHasExistingFinancialData(false);
      }
    };

    checkExistingData();
  }, [selectedSymbol]);

  // Load category-specific metrics when company category changes
  useEffect(() => {
    const loadCategoryMetrics = async () => {
      // Always start with base metrics
      const baseMetrics = await getMetrics();
      
      // If company has existing financial data, use only base metrics (don't change)
      if (hasExistingFinancialData) {
        setMetrics(baseMetrics);
        return;
      }

      if (!company?.category) {
        // If no category, use only base metrics
        setMetrics(baseMetrics);
        return;
      }

      try {
        const categoryMetrics = await getCategoryMetrics(company.category);
        if (categoryMetrics && categoryMetrics.length > 0) {
          // Use category metrics as the full set (they include defaults)
          setMetrics(categoryMetrics);
        } else {
          // No category metrics yet - use base metrics as defaults
          setMetrics(baseMetrics);
        }
      } catch (error) {
        // Category metrics not found - use base metrics only
        setMetrics(baseMetrics);
      }
    };

    loadCategoryMetrics();
  }, [company?.category, hasExistingFinancialData]);

  const loadAllCompanies = async () => {
    try {
      const data = await getCompanies();
      setAllCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCompanyData = async (sym) => {
    try {
      const data = await getCompany(sym);
      setCompany(data);
      setCompanyForm({
        symbol: data.symbol || '',
        name: data.name || '',
        isin: data.isin || '',
        category: data.category || ''
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading company:', error);
      }
    }
  };

  const loadExistingFinancials = async () => {
    try {
      const periodISO = financialForm.periodType === 'annual' 
        ? financialForm.year 
        : `${financialForm.year}-${financialForm.quarter}`;

      const data = await getFinancials(selectedSymbol, {
        periodType: financialForm.periodType,
        limit: 1
      });

      const existing = data?.items?.find(i => i.periodISO === periodISO);
      if (existing) {
        setExistingFinancials(existing);
        // Merge existing data into form (flatten custom metrics)
        const formData = { ...existing.data };
        if (existing.data?.custom) {
          Object.entries(existing.data.custom).forEach(([k, v]) => {
            formData[k] = v;
          });
          delete formData.custom;
        }
        setFinancialForm(prev => ({ ...prev, data: formData }));
      } else {
        setExistingFinancials(null);
        setFinancialForm(prev => ({ ...prev, data: {} }));
      }
    } catch (error) {
      setExistingFinancials(null);
      setFinancialForm(prev => ({ ...prev, data: {} }));
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
      isin: company.isin || '',
      category: company.category || ''
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
        isin: data.isin || '',
        category: data.category || ''
      });
      loadAllCompanies();
      toast.success('Company data fetched successfully', { id: 'fetch' });
    } catch (error) {
      toast.error('Failed to fetch from CSE', { id: 'fetch' });
      console.error('CSE fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save company (create or update)
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.symbol || !companyForm.name) {
      toast.error('Symbol and name are required');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (company && company.symbol === companyForm.symbol) {
        // Update existing
        data = await updateCompany(company.symbol, companyForm);
        toast.success('Company updated successfully');
      } else {
        // Create new
        data = await createCompany(companyForm);
        toast.success('Company created successfully');
      }
      setCompany(data);
      setSelectedSymbol(data.symbol);
      loadAllCompanies();
      loadCategories();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Company already exists');
      } else {
        toast.error('Failed to save company');
      }
      console.error('Save company error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete company
  const handleDeleteCompany = async () => {
    if (!company) return;

    setLoading(true);
    try {
      await deleteCompany(company.symbol);
      toast.success('Company deleted successfully');
      setCompany(null);
      setSelectedSymbol('');
      setCompanyForm({ symbol: '', name: '', isin: '', category: '' });
      setShowDeleteConfirm(false);
      loadAllCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear form for new company
  const handleNewCompany = () => {
    setCompany(null);
    setSelectedSymbol('');
    setCompanyForm({ symbol: '', name: '', isin: '', category: '' });
    setFinancialForm(prev => ({ ...prev, data: {} }));
    setExistingFinancials(null);
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
  const handleSaveFinancials = async (e) => {
    e.preventDefault();
    if (!selectedSymbol) {
      toast.error('Please select a company first');
      return;
    }

    const periodInfo = getPeriodInfo();
    
    // Separate standard metrics from custom metrics
    const standardData = {};
    const customData = {};
    
    Object.entries(financialForm.data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (STANDARD_METRIC_KEYS.includes(key)) {
          standardData[key] = value;
        } else {
          customData[key] = value;
        }
      }
    });
    
    // Build the final data object with custom metrics nested properly
    const finalData = {
      ...standardData,
      ...(Object.keys(customData).length > 0 ? { custom: customData } : {})
    };
    
    setLoading(true);
    try {
      const isFirstSave = !hasExistingFinancialData && !existingFinancials;
      
      await createFinancialData(selectedSymbol, {
        periodType: financialForm.periodType,
        periodLabel: periodInfo.label,
        periodISO: periodInfo.iso,
        data: finalData,
        force: true // Allow upsert
      });
      
      // If this is the first time saving financial data for this company
      // and the company has a category, save current metrics as category defaults
      if (isFirstSave && company?.category) {
        try {
          // Get current metrics for all sections, sorted by order
          const allMetrics = await getMetrics();
          const metricsBySection = {
            income: allMetrics.filter(m => m.section === 'income').sort((a, b) => (a.order || 0) - (b.order || 0)),
            balance: allMetrics.filter(m => m.section === 'balance').sort((a, b) => (a.order || 0) - (b.order || 0)),
            cashflow: allMetrics.filter(m => m.section === 'cashflow').sort((a, b) => (a.order || 0) - (b.order || 0))
          };
          
          // Combine all metrics
          const categoryDefaults = [
            ...metricsBySection.income,
            ...metricsBySection.balance,
            ...metricsBySection.cashflow
          ];
          
          // Always update category defaults when first company saves (overwrites existing if any)
          await setCategoryMetrics(company.category, categoryDefaults);
        } catch (error) {
          // Fail silently - category metrics are optional
          console.log('Could not set category metrics:', error);
        }
      }
      
      toast.success(existingFinancials ? 'Financial data updated' : 'Financial data saved');
      setHasExistingFinancialData(true);
      navigate(`/stock/${selectedSymbol}`);
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
      setCustomMetricForm({ name: '', key: '', section: 'income', unit: 'LKR' });
      await loadMetrics();
      
      // If company has category and no existing financial data, update category defaults
      if (company?.category && !hasExistingFinancialData) {
        try {
          const allMetrics = await getMetrics();
          const metricsBySection = {
            income: allMetrics.filter(m => m.section === 'income').sort((a, b) => (a.order || 0) - (b.order || 0)),
            balance: allMetrics.filter(m => m.section === 'balance').sort((a, b) => (a.order || 0) - (b.order || 0)),
            cashflow: allMetrics.filter(m => m.section === 'cashflow').sort((a, b) => (a.order || 0) - (b.order || 0))
          };
          
          const categoryDefaults = [
            ...metricsBySection.income,
            ...metricsBySection.balance,
            ...metricsBySection.cashflow
          ];
          
          await setCategoryMetrics(company.category, categoryDefaults);
        } catch (error) {
          // Fail silently
          console.log('Could not update category metrics:', error);
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Metric key already exists');
      } else {
        toast.error('Failed to create metric');
      }
    }
  };

  // Delete metric
  const handleDeleteMetric = async (metricKey) => {
    if (!window.confirm(`Remove this metric? This will not delete existing data, only the metric definition.`)) {
      return;
    }

    try {
      await deleteMetric(metricKey);
      toast.success('Metric removed');
      await loadMetrics();
      
      // If company has category and no existing financial data, update category defaults
      if (company?.category && !hasExistingFinancialData) {
        try {
          const allMetrics = await getMetrics();
          const metricsBySection = {
            income: allMetrics.filter(m => m.section === 'income').sort((a, b) => (a.order || 0) - (b.order || 0)),
            balance: allMetrics.filter(m => m.section === 'balance').sort((a, b) => (a.order || 0) - (b.order || 0)),
            cashflow: allMetrics.filter(m => m.section === 'cashflow').sort((a, b) => (a.order || 0) - (b.order || 0))
          };
          
          const categoryDefaults = [
            ...metricsBySection.income,
            ...metricsBySection.balance,
            ...metricsBySection.cashflow
          ];
          
          await setCategoryMetrics(company.category, categoryDefaults);
        } catch (error) {
          // Fail silently
          console.log('Could not update category metrics:', error);
        }
      }
    } catch (error) {
      toast.error('Failed to remove metric');
    }
  };

  // Drag and drop state
  const [draggedMetric, setDraggedMetric] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedMetric(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedMetric(null);
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedMetric === null || draggedMetric === dropIndex) {
      setDraggedMetric(null);
      return;
    }

    // Get current section metrics
    const currentSectionMetrics = metrics
      .filter(m => m.section === financialForm.section)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return a.name.localeCompare(b.name);
      });

    // Reorder metrics
    const reordered = [...currentSectionMetrics];
    const [removed] = reordered.splice(draggedMetric, 1);
    reordered.splice(dropIndex, 0, removed);

    // Update order values
    const updatedMetrics = reordered.map((metric, idx) => ({
      key: metric.key,
      order: idx
    }));

    try {
      await reorderMetrics(updatedMetrics);
      toast.success('Metrics reordered');
      await loadMetrics();
      
      // If company has category and no existing financial data, update category defaults
      if (company?.category && !hasExistingFinancialData) {
        try {
          const allMetrics = await getMetrics();
          const metricsBySection = {
            income: allMetrics.filter(m => m.section === 'income').sort((a, b) => (a.order || 0) - (b.order || 0)),
            balance: allMetrics.filter(m => m.section === 'balance').sort((a, b) => (a.order || 0) - (b.order || 0)),
            cashflow: allMetrics.filter(m => m.section === 'cashflow').sort((a, b) => (a.order || 0) - (b.order || 0))
          };
          
          const categoryDefaults = [
            ...metricsBySection.income,
            ...metricsBySection.balance,
            ...metricsBySection.cashflow
          ];
          
          await setCategoryMetrics(company.category, categoryDefaults);
        } catch (error) {
          // Fail silently
          console.log('Could not update category metrics:', error);
        }
      }
    } catch (error) {
      toast.error('Failed to reorder metrics');
      console.error('Reorder error:', error);
    }

    setDraggedMetric(null);
  };

  // Get metrics for current section, sorted by order if available
  const sectionMetrics = metrics
    .filter(m => m.section === financialForm.section)
    .sort((a, b) => {
      // If order exists, sort by order, otherwise by name
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Data Entry</h1>
      </div>

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
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'manage'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Manage Companies
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
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              {company ? 'Edit Company Details' : 'Add New Company'}
            </h3>
            
            <form onSubmit={handleSaveCompany} className="space-y-4">
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
                    disabled={!!company}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={companyForm.category}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Banking, Manufacturing, etc."
                  list="categories"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">Used for grouping companies in comparison view</p>
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
                  {company ? 'Update Company' : 'Create Company'}
                </button>
                {company && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm font-medium text-negative bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                )}
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
                  <div><span className="text-gray-500">Category:</span> {company.category || '—'}</div>
                  <div><span className="text-gray-500">Last Price:</span> {formatToThreeDecimals(company.lastTradedPrice)}</div>
                  <div><span className="text-gray-500">Market Cap:</span> {company.marketCap?.toLocaleString() || '—'}</div>
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
            <form onSubmit={handleSaveFinancials}>
              {/* Period indicator */}
              {existingFinancials && (
                <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  Editing existing data for {getPeriodInfo().label}. Changes will update the existing record.
                </div>
              )}

              {/* Period Selection */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Type
                  </label>
                  <select
                    value={financialForm.periodType}
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, periodType: e.target.value, data: {} }))}
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
                    onChange={(e) => setFinancialForm(prev => ({ ...prev, year: e.target.value, data: {} }))}
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
                      onChange={(e) => setFinancialForm(prev => ({ ...prev, quarter: e.target.value, data: {} }))}
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
                  {sectionMetrics.map((metric, index) => (
                    <div
                      key={metric.key}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative cursor-move transition-all ${
                        draggedMetric === index ? 'opacity-50' : ''
                      } ${
                        dragOverIndex === index ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                          <label className="block text-sm text-gray-600">
                            {metric.name}
                            <span className="text-gray-400 text-xs ml-1">({metric.unit})</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMetric(metric.key)}
                          className="text-xs text-red-500 hover:text-red-700"
                          title="Remove metric"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
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
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {existingFinancials ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Manage Companies Tab */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">All Companies ({allCompanies.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Last Price</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allCompanies.map(comp => (
                  <tr key={comp.symbol} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{comp.symbol}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[200px]">{comp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {comp.category || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums">
                      {formatToThreeDecimals(comp.lastTradedPrice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          handleCompanySelect(comp);
                          setActiveTab('company');
                        }}
                        className="text-primary hover:underline text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Company?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{company?.symbol}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-negative rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
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
                    <option value="LKR">LKR</option>
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
