const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import utilities and routes
const logger = require('./utils/logger');
const { initializeDirectories } = require('./utils/fileUtils');
const apiRoutes = require('./routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware Configuration
 */
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://pdf-dost.vercel.app',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

/**
 * Routes Configuration
 */
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'PDF Dost - Header & Footer Editor API',
    version: '2.0.0',
    status: 'Active',
    documentation: '/api',
    timestamp: new Date().toISOString()
  });
});

/**
 * Error Handling Middleware
 */
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    message: 'The requested endpoint does not exist'
  });
});

/**
 * Server Initialization
 */
const startServer = async () => {
  try {
    // Initialize required directories
    await initializeDirectories();
    logger.success('Application directories initialized');

    // Start the server
    app.listen(PORT, () => {
      logger.serverStart(PORT);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the application
startServer();

module.exports = app;
