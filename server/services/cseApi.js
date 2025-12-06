const axios = require('axios');

const CSE_BASE_URL = process.env.CSE_BASE_URL || 'https://www.cse.lk/api';

/**
 * Fetch company information from CSE API
 * @param {string} symbol - Company symbol (e.g., "JKH.N0000")
 * @returns {Promise<Object>} Company data from CSE
 */
const fetchCompanyInfo = async (symbol) => {
  try {
    // The CSE API endpoint for company info
    const response = await axios.post(
      `${CSE_BASE_URL}/companyInfoSummery`,
      { symbol },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('CSE API Error:', error.message);
    throw error;
  }
};

/**
 * Fetch chart data from CSE API
 * @param {number} chartId - Chart ID
 * @param {number} period - Period (1=weekly, 2=monthly, etc.)
 * @returns {Promise<Object>} Chart data from CSE
 */
const fetchChartData = async (chartId, period = 2) => {
  try {
    const response = await axios.post(
      `${CSE_BASE_URL}/chartData`,
      { chartId, period },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('CSE Chart API Error:', error.message);
    throw error;
  }
};

module.exports = {
  fetchCompanyInfo,
  fetchChartData
};

