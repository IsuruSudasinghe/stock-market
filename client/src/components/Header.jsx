import { Link, useNavigate } from 'react-router-dom';
import SearchSelect from './SearchSelect';

const Header = () => {
  const navigate = useNavigate();

  const handleCompanySelect = (company) => {
    if (company?.symbol) {
      navigate(`/stock/${encodeURIComponent(company.symbol)}`);
    }
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

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/data-entry" 
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Data Entry
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

