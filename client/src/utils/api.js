import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Company endpoints
export const getCompanies = async (search = '') => {
  const params = search ? { q: search } : {};
  const response = await api.get('/companies', { params });
  return response.data;
};

export const getCompany = async (symbol) => {
  const response = await api.get(`/companies/${encodeURIComponent(symbol)}`);
  return response.data;
};

export const createCompany = async (companyData) => {
  const response = await api.post('/companies', companyData);
  return response.data;
};

export const updateCompany = async (symbol, companyData) => {
  const response = await api.put(`/companies/${encodeURIComponent(symbol)}`, companyData);
  return response.data;
};

export const deleteCompany = async (symbol) => {
  const response = await api.delete(`/companies/${encodeURIComponent(symbol)}`);
  return response.data;
};

// Sync endpoint
export const syncCompanyFromCSE = async (symbol) => {
  const response = await api.post('/sync/company', { symbol });
  return response.data;
};

// Financial data endpoints
export const getFinancials = async (symbol, options = {}) => {
  const { periodType = 'quarterly', limit = 5, metrics } = options;
  const params = { periodType, limit };
  if (metrics) {
    params.metrics = Array.isArray(metrics) ? metrics.join(',') : metrics;
  }
  const response = await api.get(`/financials/${encodeURIComponent(symbol)}`, { params });
  return response.data;
};

export const createFinancialData = async (symbol, data) => {
  const response = await api.post(`/financials/${encodeURIComponent(symbol)}`, data);
  return response.data;
};

export const deleteFinancialData = async (symbol, periodISO, periodType) => {
  const params = { periodISO };
  if (periodType) {
    params.periodType = periodType;
  }
  const response = await api.delete(`/financials/${encodeURIComponent(symbol)}`, { params });
  return response.data;
};

// Metrics endpoints
export const getMetrics = async (section = '') => {
  const params = section ? { section } : {};
  const response = await api.get('/metrics', { params });
  return response.data;
};

export const createMetric = async (metricData) => {
  const response = await api.post('/metrics', metricData);
  return response.data;
};

export const updateMetric = async (key, metricData) => {
  const response = await api.put(`/metrics/${encodeURIComponent(key)}`, metricData);
  return response.data;
};

export const deleteMetric = async (key) => {
  const response = await api.delete(`/metrics/${encodeURIComponent(key)}`);
  return response.data;
};

// Compare endpoint
export const compareStocks = async (symbols, metricKey, periodType = 'quarterly', limit = 5) => {
  const response = await api.post('/compare', {
    symbols,
    metricKey,
    periodType,
    limit
  });
  return response.data;
};

export default api;

