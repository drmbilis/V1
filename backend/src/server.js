const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();

// ---- Config ----
const apiVersion = 'v1';
const API_BASE = `/api/${apiVersion}`;

// Prefer CORS_ORIGIN (sen env'de bunu kullanıyorsun), yoksa FRONTEND_URL, yoksa localhost
const corsOrigin =
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  'http://localhost:3000';

// ---- Middleware ----
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ---- Health (tek handler, iki path) ----
const healthHandler = async (req, res) => {
  let dbOk = false;
  try {
    dbOk = await testConnection();
  } catch (_) {
    dbOk = false;
  }

  res.status(200).json({
    ok: true,
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    apiBase: API_BASE,
  });
};

// Root health (mevcut çalışıyor)
app.get('/health', healthHandler);
// ✅ Frontend /api/v1/health bekliyorsa bunu da açıyoruz
app.get(`${API_BASE}/health`, healthHandler);

// ---- Routes ----
const authRoutes = require('./modules/auth/auth.routes');
const customersRoutes = require('./modules/google/customers.routes');
const campaignsRoutes = require('./modules/google/campaigns.routes');
const jobsRoutes = require('./modules/jobs/jobs.routes');
const recommendationsRoutes = require('./modules/recommendations/recommendations.routes');
const applyRoutes = require('./modules/apply/apply.routes');

// Public
app.use(`${API_BASE}/auth`, authRoutes);

// Protected
app.use(`${API_BASE}/customers`, customersRoutes);
app.use(`${API_BASE}/campaigns`, campaignsRoutes);
app.use(`${API_BASE}/jobs`, jobsRoutes);
app.use(`${API_BASE}/recommendations`, recommendationsRoutes);
app.use(`${API_BASE}/apply`, applyRoutes);

// ---- Error handling ----
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ---- 404 ----
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Base Path: ${API_BASE}`);

  const dbOk = await testConnection();
  if (dbOk) {
    console.log('✅ Database connection established successfully.');
    console.log('✅ Ready to accept requests');
  } else {
    console.log('⚠️  Database connection failed');
  }
});

module.exports = app;
