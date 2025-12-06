import { Link, useLocation, useNavigate } from 'react-router-dom';
import SearchSelect from './SearchSelect';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCompanySelect = (company) => {
    if (company?.symbol) {
      navigate(`/stock/${encodeURIComponent(company.symbol)}`);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/stock/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">Stock Tracker</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <SearchSelect 
              onSelect={handleCompanySelect}
              placeholder="Search companies..."
            />
          </div>

          {/* Navigation - Reordered: Dashboard, Data Entry, Compare */}
          <nav className="flex items-center gap-4">
            <Link 
              to="/" 
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/')
                  ? 'text-primary bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link 
              to="/data-entry" 
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/data-entry')
                  ? 'text-primary bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Data Entry
            </Link>
            <Link 
              to="/compare" 
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/compare')
                  ? 'text-primary bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
