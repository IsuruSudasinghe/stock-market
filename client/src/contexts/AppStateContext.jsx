import { createContext, useContext, useState, useEffect } from 'react';

const AppStateContext = createContext();

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }) => {
  // Dashboard state
  const [dashboardState, setDashboardState] = useState(() => {
    const saved = localStorage.getItem('dashboardState');
    return saved ? JSON.parse(saved) : {
      isCompareMode: false,
      compareStockSymbols: [],
      periodTypes: {
        income: 'quarterly',
        balance: 'quarterly',
        cashflow: 'quarterly'
      }
    };
  });

  // Compare page state
  const [compareState, setCompareState] = useState(() => {
    const saved = localStorage.getItem('compareState');
    return saved ? JSON.parse(saved) : {
      selectedCategory: '',
      periodType: 'quarterly',
      selectedMetrics: {
        income: 'revenue',
        balance: 'totalAssets',
        cashflow: 'netChangeInCash'
      },
      selectedForChart: {
        income: [],
        balance: [],
        cashflow: []
      }
    };
  });

  // Save dashboard state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardState', JSON.stringify(dashboardState));
  }, [dashboardState]);

  // Save compare state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('compareState', JSON.stringify(compareState));
  }, [compareState]);

  const updateDashboardState = (updates) => {
    setDashboardState(prev => ({ ...prev, ...updates }));
  };

  const updateCompareState = (updates) => {
    setCompareState(prev => ({ ...prev, ...updates }));
  };

  return (
    <AppStateContext.Provider
      value={{
        dashboardState,
        compareState,
        updateDashboardState,
        updateCompareState
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

