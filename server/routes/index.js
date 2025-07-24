const express = require('express');
const pdfRoutes = require('./pdfRoutes');

const router = express.Router();

/**
 * Main API Routes
 * Centralized route management
 */

// Welcome message for API root
router.get('/', (req, res) => {
  res.json({ 
    message: 'PDF Dost - Header & Footer Editor API',
    version: '2.0.0',
    status: 'Active',
    endpoints: {
      pdf: '/api/pdf',
      health: '/api/health'
    },
    timestamp: new Date().toISOString()
  });
});

// PDF-related routes
router.use('/pdf', pdfRoutes);

// General health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'PDF Dost API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

module.exports = router;
