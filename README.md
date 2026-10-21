# FoodFlow AI — Food Manufacturing Supply Chain & Waste-Reduction Platform

An enterprise-grade MERN stack platform designed to tackle the 20–30% raw material waste in food manufacturing. By marrying **First-Expired, First-Out (FEFO)** lot tracking with **multi-variable AI demand forecasting**, production line allocation, and automated cron alerts, FoodFlow AI optimizes inventory turnover and mitigates spoilage.

---

## 🚀 Key Features

1. **FEFO Inventory & Perishability Tracking**
   - First-Expired, First-Out (FEFO) material consumption logic.
   - Dynamic lot and batch tracking with color-coded shelf-life indicators (<3 days critical, <7 days warning).
   - Real-time stock recalculations and automated expired lot quarantining.

2. **AI Demand Forecasting Service**
   - Multi-variable projection engine combining 12-week weighted moving averages, monthly seasonal indices, and promotional uplift.
   - Volatility adjustments for fresh, short-shelf-life goods to prevent over-production waste.
   - Confidence scoring and gap analysis against current inventory stock.

3. **Production Batch Planning**
   - Schedule and track production runs against AI demand forecasts.
   - Bill-of-Materials (BOM) lot allocation mapping consumed raw materials to specific lots.
   - Efficiency scoring and production line tracking.

4. **Waste Analytics & Root Cause Attribution**
   - Granular attribution categorization: `Spoilage`, `Equipment Failure`, `Over-production`, `Quality Rejection`, `Handling Damage`, `Other`.
   - Automatic financial impact calculations (`quantity × material.costPerUnit`).
   - Interactive Recharts donut attribution and production line loss visualizations.

5. **Automated Alerting Engine (`node-cron`)**
   - Hourly background scans detecting:
     - **Low Stock Thresholds** (`currentStock < reorderLevel`)
     - **Imminent Lot Expiry** (Critical within 3 days, warning within 7 days)
     - **Demand Mismatch** (Current inventory < 80% of forecasted weekly demand)
   - Real-time notification badge with polling bell in the header and interactive Alert Center.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB / Mongoose, `node-cron`, Jest
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios, React Router v6
- **Tooling**: `concurrently` for unified one-command execution

---

## 📂 Project Structure

```
food-supply-chain/
├── .env.example                # Template for MongoDB Atlas & environment variables
├── package.json                # Root orchestration with concurrently
├── server/
│   ├── config/
│   │   └── db.js               # Resilient MongoDB Atlas connector
│   ├── models/
│   │   ├── RawMaterial.js      # Raw materials with shelf life & reorder points
│   │   ├── InventoryLot.js     # Individual lots indexed for FEFO queries
│   │   ├── ProductionBatch.js  # Scheduled production runs & BOM lot allocations
│   │   ├── WasteEvent.js       # Incidents with root-cause categorization & cost impact
│   │   ├── DemandForecast.js   # AI weekly forecast projections & attribution factors
│   │   └── Alert.js            # System alerts with severity & entity references
│   ├── controllers/            # Modular controllers with complete CRUD & aggregates
│   ├── routes/                 # Express REST endpoints
│   ├── services/
│   │   ├── forecastService.js  # AI multi-variable forecasting algorithm
│   │   ├── alertService.js     # Cron jobs for automated threshold checks
│   │   └── seedService.js      # Database seeder with realistic test data
│   ├── tests/
│   │   └── forecastService.test.js # Jest unit test suite (13 passing tests)
│   ├── server.js               # Express application entry point
│   └── package.json
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── alerts/         # AlertBell & AlertPanel
    │   │   ├── dashboard/      # KpiCards & Recharts visual components
    │   │   ├── inventory/      # MaterialTable, LotTracker, MaterialForm
    │   │   ├── layout/         # Sidebar, Header, Layout shell
    │   │   ├── production/     # BatchTable, BatchForm
    │   │   └── waste/          # WasteTable, WasteForm, WasteAttributionChart
    │   ├── pages/              # Dashboard, Inventory, Production, Forecasting, Waste, Alerts
    │   ├── services/api.js     # Axios API service client
    │   ├── App.jsx             # React Router hierarchy
    │   └── main.jsx
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Start

### 1. Configure MongoDB Atlas
Create a `.env` file in the root directory (or in `server/.env`) using `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and set your MongoDB Atlas connection string:
```ini
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/foodflow?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

### 2. Populate Sample Data
Seed the database with realistic inventory lots, batches, waste incidents, and AI forecasts:

```bash
npm run seed
```

### 3. Launch Development Servers
Start both the Express backend (`http://localhost:5000`) and Vite frontend (`http://localhost:5173`) concurrently:

```bash
npm run dev
```

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing

Run the unit tests for the demand forecasting module:

```bash
npm test
```
All 13 test suites validate weighted moving averages, seasonality multipliers, active promotion lift, perishable volatility adjustments, and confidence scoring.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/materials` | GET, POST | List & create raw materials |
| `/api/materials/low-stock` | GET | List materials below reorder threshold |
| `/api/inventory` | GET, POST | List lots (FEFO-sorted) & create lots |
| `/api/inventory/consume` | POST | Consume quantity from earliest expiring active lot |
| `/api/inventory/expiring` | GET | Lots expiring within specified days (default 7) |
| `/api/production` | GET, POST | List & schedule production batches |
| `/api/waste` | GET, POST | List & report waste incidents |
| `/api/waste/summary` | GET | Aggregate loss KPIs and category breakdown |
| `/api/forecasts` | GET | List demand forecasts |
| `/api/forecasts/generate-all` | POST | Re-run AI forecast engine across all SKUs |
| `/api/alerts` | GET | List active alerts (supports filters by severity/unread) |
| `/api/alerts/mark-all-read` | PUT | Mark all unread notifications as read |
