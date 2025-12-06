# Stock Market Tracker

A comprehensive MERN stack web application for tracking and visualizing company stock financials with CSE (Colombo Stock Exchange) API integration.

## Features

- **Real-time Stock Data**: Fetch company information directly from CSE API
- **Financial Statements**: View and analyze Income Statement, Balance Sheet, and Cash Flow data
- **Interactive Charts**: Grouped bar charts with up to 5 periods (quarterly/annual)
- **Y/Y Change Calculation**: Automatic year-over-year comparison with color-coded indicators
- **Multi-Stock Comparison**: Compare up to 5 stocks visually on charts
- **Data Entry**: Manual entry forms for financial data
- **Custom Metrics**: Create and manage custom financial metrics
- **Export**: Export charts as PNG and data as CSV

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## Project Structure

```
Stock Market/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
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

## API Documentation

### Company Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | List all companies (supports `?q=search` query) |
| GET | `/api/companies/:symbol` | Get single company by symbol |
| POST | `/api/companies` | Create new company |
| PUT | `/api/companies/:symbol` | Update company |
| DELETE | `/api/companies/:symbol` | Delete company |

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
    "eps": 3.39
  },
  "force": true
}
```

### Metric Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | List all metric definitions |
| POST | `/api/metrics` | Create new metric definition |
| PUT | `/api/metrics/:key` | Update metric definition |
| DELETE | `/api/metrics/:key` | Delete metric definition |

### Compare Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/compare` | Get combined datasets for comparison |

**Request Body:**
```json
{
  "symbols": ["JKH.N0000", "COMB.N0000"],
  "metricKey": "revenue",
  "periodType": "quarterly",
  "limit": 5
}
```

## Sample API Responses

### Company Data
```json
{
  "symbol": "JKH.N0000",
  "name": "JOHN KEELLS HOLDINGS PLC",
  "isin": "LK0092N00003",
  "lastTradedPrice": 21.0,
  "closingPrice": 21.0,
  "previousClose": 21.5,
  "change": -0.5,
  "changePercentage": -2.33,
  "marketCap": 371446556985,
  "beta": {
    "triASIBetaValue": 1.44,
    "betaValueSPSL": 1.33
  }
}
```

### Financial Data
```json
{
  "symbol": "JKH.N0000",
  "periodType": "quarterly",
  "items": [
    {
      "periodISO": "2025-Q3",
      "label": "Jul 2025",
      "data": {
        "revenue": 1740000000,
        "netIncome": 242510000
      },
      "yoy": {
        "revenue": 0.1403,
        "netIncome": -0.4057
      }
    }
  ]
}
```

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

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Positive | `#16a34a` | Positive Y/Y changes |
| Negative | `#dc2626` | Negative Y/Y changes |
| Neutral | `#6b7280` | Neutral/unavailable data |
| Primary | `#3b82f6` | Primary UI elements |
| Accent | `#eab308` | Secondary chart color |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

