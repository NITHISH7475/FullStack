const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startAlertCron } = require('./services/alertService');

// Route imports
const materialRoutes = require('./routes/materialRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const productionRoutes = require('./routes/productionRoutes');
const wasteRoutes = require('./routes/wasteRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const alertRoutes = require('./routes/alertRoutes');

const path = require('path');
dotenv.config();
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/materials', materialRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  startAlertCron();
  
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n⚠️  Port ${PORT} is currently in use by an existing Node process.`);
      console.error(`   To free port ${PORT}, run: npm run kill:port\n`);
      process.exit(1);
    } else {
      console.error('Server error:', error.message);
    }
  });
};

startServer();

module.exports = app;
