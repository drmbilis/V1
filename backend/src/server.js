const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check - Bu çalışıyor, dokunmadım
app.get('/health', async (req, res) => {
  const dbOk = await testConnection();
  res.json({ 
    ok: true,
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const customersRoutes = require('./modules/google/customers.routes');
const campaignsRoutes = require('./modules/google/campaigns.routes');
const jobsRoutes = require('./modules/jobs/jobs.routes');
const recommendationsRoutes = require('./modules/recommendations/recommendations.routes');
const applyRoutes = require('./modules/apply/apply.routes');

// API Routes - API_VERSION belirsizliğini v1 olarak sabitledik
const apiVersion = 'v1'; 

// Public routes
app.use(`/api/${apiVersion}/auth`, authRoutes);

// Protected routes
app.use(`/api/${apiVersion}/customers`, customersRoutes);
app.use(`/api/${apiVersion}/campaigns`, campaignsRoutes);
app.use(`/api/${apiVersion}/jobs`, jobsRoutes);
app.use(`/api/${apiVersion}/recommendations`, recommendationsRoutes);
app.use(`/api/${apiVersion}/apply`, applyRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - Eğer hiçbir rotaya girmezse burası çalışır
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`
  });
});

const PORT = process.env.PORT || 5000;

// Sunucuyu ayağa kaldır
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Base Path: /api/v1`);
  
  const dbOk = await testConnection();
  if (dbOk) {
    console.log('✅ Ready to accept requests');
  } else {
    console.log('⚠️  Database connection failed');
  }
});

module.exports = app;