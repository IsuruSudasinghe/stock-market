const axios = require('axios');

const CSE_BASE_URL = process.env.CSE_BASE_URL || 'https://www.cse.lk/api';

/**
 * Fetch company information from CSE API
 * @param {string} symbol - Company symbol (e.g., "JKH.N0000")
 * @returns {Promise<Object>} Company data from CSE
 */
const fetchCompanyInfo = async (symbol) => {
  try {
    // Create form-urlencoded data (like Python's requests.post with data=)
    const params = new URLSearchParams();
    params.append('symbol', symbol);

    const response = await axios.post(
      `${CSE_BASE_URL}/companyInfoSummery`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
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
    // Create form-urlencoded data
    const params = new URLSearchParams();
    params.append('chartId', chartId);
    params.append('period', period);

    const response = await axios.post(
      `${CSE_BASE_URL}/chartData`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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
