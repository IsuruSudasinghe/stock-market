# Stock Market Tracker

A comprehensive MERN stack web application for tracking and visualizing company stock financials with CSE (Colombo Stock Exchange) API integration.

## Features

- **Real-time Stock Data**: Fetch company information directly from CSE API
- **Financial Statements**: View and analyze Income Statement, Balance Sheet, and Cash Flow data
- **Interactive Charts**: Grouped bar charts with up to 5 periods (quarterly/annual)
- **Y/Y Change Calculation**: Automatic year-over-year comparison with color-coded indicators (3 decimal places)
- **Multi-Stock Comparison**: Compare up to 10 stocks visually on charts with sortable columns
- **Category-Based Organization**: Group companies by custom categories for easier comparison
- **Category-Specific Metrics**: Default metric sets per company category
- **State Preservation**: Dashboard and Compare page states are preserved when switching between pages
- **Data Entry**: Comprehensive forms for company and financial data management
- **Custom Metrics**: Create and manage custom financial metrics with drag-and-drop reordering
- **Sortable Comparison Tables**: Click any period column to sort companies by that period's values
- **Export**: Export charts as PNG and data as CSV
- **Currency**: All values displayed in LKR (Sri Lankan Rupees)

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Charts**: Recharts (bar charts and line charts)
- **State Management**: React Context API + localStorage
- **Notifications**: React Hot Toast

## Project Structure

```
Stock Market/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React Context providers
│   │   └── utils/          # Utility functions and API client
│   ├── index.html
│   └── package.json
├── server/                 # Express backend
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route handlers
│   ├── services/           # External API integrations
│   ├── seed/               # Database seed data
│   ├── app.js
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Stock Market"
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=4000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/stocktracker

# CSE API Base URL
CSE_BASE_URL=https://www.cse.lk/api

# JWT Secret (optional - for future auth)
JWT_SECRET=your-secret-key-here

# Allowed Origins (comma-separated for multiple)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 5. Start MongoDB

Make sure MongoDB is running locally:

```bash
# Windows
mongod --dbpath C:\data\db

# Or use MongoDB Compass / Atlas
```

### 6. Seed the Database

```bash
cd server
npm run seed
```

### 7. Start the Development Servers

**Backend** (from `server` directory):
```bash
npm run dev
```

**Frontend** (from `client` directory):
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Key Features

### State Preservation
- Dashboard state (compare mode, selected stocks, period types) is preserved when navigating away
- Compare page state (category, period type, selected metrics, chart selections) is preserved
- States are stored in localStorage and restored on page return

### Category Management
- Companies can be assigned to custom categories
- Category-based filtering in Compare page
- Default metric sets per category
- Same-category company hints in compare mode

### Financial Data Entry
- Edit existing company information
- Add/remove custom metrics
- **Drag-and-Drop Metric Reordering**: Drag metrics to reorder them within each section (Income Statement, Balance Sheet, Cash Flow)
- New metrics are automatically added to the end of their section
- Category-specific default metrics loaded automatically
- Update existing financial data for any period
- Single save button (changes to "Update" when editing existing data)
- **Auto-load Financial Data**: When switching companies or tabs, financial data automatically loads for the selected company

### Compare Page
- Three independent sections: Income Statement, Balance Sheet, Cash Flow
- Each section has its own table and trend chart
- Independent metric selection and company selection per section
- Up to 10 companies can be selected per chart
- **Sortable Columns**: Click any period column header to sort companies by that period's values
  - Toggle between ascending (lowest to highest) and descending (highest to lowest) order
  - Sorted column is highlighted with a gray background
  - Companies with no data are automatically placed at the bottom
  - Column widths remain consistent when sorting
- **Column Order**: Periods displayed chronologically with oldest on the left, latest on the right
- Default sort is by the latest period (descending - highest values first)
- State preserved across navigation

## API Documentation

### Company Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List all companies (supports `?q=search&category=cat` query) |
| GET | `/api/companies/categories` | Get all unique categories |
| GET | `/api/companies/by-category/:category` | Get all companies in a category |
| GET | `/api/companies/:symbol` | Get single company by symbol |
| POST | `/api/companies` | Create new company |
| PUT | `/api/companies/:symbol` | Update company |
| DELETE | `/api/companies/:symbol` | Delete company |

### Category Metrics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/category-metrics/:category` | Get default metrics for a category |
| POST | `/api/category-metrics/:category` | Set default metrics for a category |
| DELETE | `/api/category-metrics/:category` | Remove default metrics for a category |

### Sync Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/company` | Fetch and sync company data from CSE API |

**Request Body:**
```json
{
  "symbol": "JKH.N0000"
}
```

### Financial Data Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/financials/:symbol` | Get financial data with Y/Y changes |
| POST | `/api/financials/:symbol` | Create/update financial data |
| DELETE | `/api/financials/:symbol` | Delete financial period |

**GET Query Parameters:**
- `periodType`: `quarterly` or `annual` (default: quarterly)
- `limit`: Number of periods to return (default: 5)
- `metrics`: Comma-separated list of metric keys to include

**POST Request Body:**
```json
{
  "periodType": "quarterly",
  "periodLabel": "Jul 2025",
  "periodISO": "2025-Q3",
  "data": {
    "revenue": 1740000000,
    "netIncome": 242510000,
    "custom": {
      "customMetric": 1000000
    }
  },
  "force": true
}
```

### Metric Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | List all metric definitions (sorted by section, order, name) |
| GET | `/api/metrics?section=income` | List metrics for a specific section |
| GET | `/api/metrics/:key` | Get single metric definition |
| POST | `/api/metrics` | Create new metric definition (automatically added to end of section) |
| PUT | `/api/metrics/:key` | Update metric definition |
| PUT | `/api/metrics/reorder` | Bulk update metric orders (for drag-and-drop reordering) |
| DELETE | `/api/metrics/:key` | Delete metric definition |

**POST Request Body:**
```json
{
  "name": "Gross Margin",
  "key": "grossMargin",
  "section": "income",
  "unit": "percentage"
}
```

**PUT /reorder Request Body:**
```json
{
  "metrics": [
    { "key": "revenue", "order": 0 },
    { "key": "operatingExpense", "order": 1 },
    { "key": "netIncome", "order": 2 }
  ]
}
```

## User Guide

### Data Entry Workflow

1. **Adding a Company**:
   - Go to Data Entry page
   - Enter company symbol and name (or use "Fetch from CSE" to auto-populate)
   - Optionally set category for grouping
   - Click "Create Company"

2. **Adding Financial Data**:
   - Select a company from the search or create a new one
   - Switch to "Financial Data" tab
   - Choose period type (Quarterly/Annual), year, and quarter
   - Select section (Income Statement, Balance Sheet, or Cash Flow)
   - Enter metric values
   - Click "Save" (button changes to "Update" if editing existing data)

3. **Managing Metrics**:
   - In Financial Data tab, click "+ Add Custom Metric"
   - Enter metric name, key (no spaces), section, and unit
   - Click "Create Metric"
   - **Reorder Metrics**: Drag any metric by its handle (≡ icon) to reorder within its section
   - New metrics are automatically added to the end of their section

4. **Comparing Companies**:
   - Go to Compare page
   - Select a category (or "All Companies")
   - Choose period type (Quarterly/Annual)
   - For each section, select a metric and companies to compare
   - **Sort by Column**: Click any period column header to sort companies by that period's values
   - Click again to toggle ascending/descending order
   - Select up to 10 companies per chart using checkboxes

### Tips

- **Metric Ordering**: Drag metrics to organize them in the order you prefer. This order is saved and persists across sessions.
- **Column Sorting**: The sorted column is highlighted in gray. Companies with missing data always appear at the bottom.
- **Auto-loading**: When switching companies in Data Entry, financial data automatically loads when you switch to the Financial Data tab.
- **State Preservation**: Your selections on the Compare page are saved and restored when you navigate away and return.

## Data Format

- **Currency**: All monetary values are in LKR (Sri Lankan Rupees)
- **Decimals**: All numbers and percentages display 3 decimal places
- **Percentages**: Only shown when data is available to calculate (no NaN/Infinity)
- **Period Format**: 
  - Quarterly: `YYYY-QN` (e.g., `2024-Q3` for July 2024)
  - Annual: `YYYY` (e.g., `2024`)

## Oracle Cloud Deployment (Production)

### Option A: MongoDB on Oracle Cloud Compute (Recommended)

1. **Create Oracle Cloud Free Tier Account**
   - Visit https://cloud.oracle.com
   - Sign up for Always Free tier

2. **Create Compute Instance**
   ```bash
   # Instance shape: VM.Standard.E2.1.Micro (Always Free)
   # OS: Oracle Linux 8 or Ubuntu 22.04
   ```

3. **Install MongoDB**
   ```bash
   # Ubuntu
   sudo apt-get update
   sudo apt-get install -y mongodb

   # Start MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **Configure Security**
   ```bash
   # Edit MongoDB config to bind to all IPs (careful with security!)
   sudo nano /etc/mongod.conf
   # Change: bindIp: 0.0.0.0
   
   # Set up authentication
   mongosh
   > use admin
   > db.createUser({user: "admin", pwd: "your-password", roles: ["root"]})
   ```

5. **Configure VCN Security List**
   - Add ingress rule for port 27017 (MongoDB)
   - Add ingress rule for port 4000 (API)
   - Restrict source IPs for security

6. **Update Environment**
   ```env
   MONGO_URI=mongodb://admin:your-password@<VM-PUBLIC-IP>:27017/stocktracker?authSource=admin
   ```

### Deploy the Application

1. **Deploy Backend**
   ```bash
   # On Oracle VM
   cd server
   npm install --production
   NODE_ENV=production npm start
   
   # Or use PM2 for process management
   npm install -g pm2
   pm2 start app.js --name stock-api
   ```

2. **Deploy Frontend**
   ```bash
   # Build for production
   cd client
   npm run build
   
   # Deploy dist/ to Netlify, Vercel, or serve with nginx
   ```

## Recent Improvements

### Version 2.0 Features

- **Drag-and-Drop Metric Reordering**: Metrics can now be reordered within each financial section using drag-and-drop. The order is persisted in the database.
- **Sortable Comparison Tables**: Click any period column in the Compare page to sort companies by that period's values. Toggle between ascending and descending order.
- **Column Highlighting**: The currently sorted column is highlighted with a gray background for easy identification.
- **Stable Column Widths**: Column widths remain consistent when sorting to prevent layout shifts.
- **Auto-loading Financial Data**: Financial data automatically loads when switching companies or tabs in the Data Entry page.
- **Chronological Column Display**: Period columns are displayed with oldest on the left and latest on the right for better readability.

## Database Schema

### MetricDefinition Model

```javascript
{
  name: String,           // Display name (e.g., "Revenue")
  key: String,           // Unique identifier (e.g., "revenue")
  section: String,       // "income", "balance", or "cashflow"
  unit: String,          // "LKR", "percentage", "ratio", "shares"
  isDefault: Boolean,    // Whether to show by default
  order: Number,          // Display order within section (for drag-and-drop)
  createdBy: String,     // Optional user identifier
  createdAt: Date,
  updatedAt: Date
}
```

**Note**: The `order` field is automatically assigned when creating new metrics (highest order + 1), ensuring new metrics appear at the end of their section.

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Positive | `#16a34a` | Positive Y/Y changes |
| Negative | `#dc2626` | Negative Y/Y changes |
| Neutral | `#6b7280` | Neutral/unavailable data |
| Primary | `#3b82f6` | Primary UI elements |
| Accent | `#eab308` | Secondary chart color |
| Sorted Column | `#e5e7eb` | Highlighted sorted column background |

## Troubleshooting

### Common Issues

1. **Metrics not reordering**:
   - Ensure the backend server is running
   - Check browser console for API errors
   - Verify MongoDB connection is active

2. **Financial data not loading**:
   - Make sure a company is selected before switching to Financial Data tab
   - Check that the selected company has financial data for the chosen period
   - Verify the period type (Quarterly/Annual) matches existing data

3. **Column sorting not working**:
   - Ensure you're clicking on the period column header (not the data cells)
   - Check that companies have data for the selected period
   - Verify the metric is selected for the section

4. **CSE API fetch failing**:
   - Verify CSE_BASE_URL in environment variables
   - Check network connectivity
   - Ensure the company symbol is correct (format: `SYMBOL.N0000`)

5. **State not persisting**:
   - Check browser localStorage is enabled
   - Clear localStorage if state becomes corrupted: `localStorage.clear()`

### Database Migration

If upgrading from a version without metric ordering:

```javascript
// Run in MongoDB shell or migration script
db.metricdefinitions.updateMany(
  { order: { $exists: false } },
  [
    {
      $set: {
        order: { $add: [{ $multiply: [{ $indexOfArray: ["income", "balance", "cashflow"] }, 1000] }, 0] }
      }
    }
  ]
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
