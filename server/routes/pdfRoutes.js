const express = require('express');
const PDFController = require('../controllers/pdfController');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

/**
 * PDF Routes
 * Handles all PDF-related endpoints
 */

/**
 * @route   POST /api/pdf/process
 * @desc    Process PDF with headers and footers
 * @access  Public
 * @body    multipart/form-data with PDF file and headerFooterData JSON
 */
router.post('/process', 
  upload.single('pdf'), 
  handleUploadError,
  PDFController.processPDF
);

/**
 * @route   GET /api/pdf/templates
 * @desc    Get available header/footer templates
 * @access  Public
 */
router.get('/templates', PDFController.getTemplates);

/**
 * @route   GET /api/pdf/health
 * @desc    Health check for PDF service
 * @access  Public
 */
router.get('/health', PDFController.healthCheck);

module.exports = router;
