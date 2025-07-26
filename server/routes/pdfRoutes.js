const express = require('express');
const PDFController = require('../controllers/pdfController');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

/**
 * PDF Routes
 * Handles all PDF-related endpoints
 */

/**
 * @route   POST /api/pdf/split
 * @desc    Split PDF into multiple documents
 * @access  Public
 * @body    multipart/form-data with PDF file and splitData JSON
 */
router.post('/split', 
  upload.single('pdf'), 
  handleUploadError,
  PDFController.splitPDF
);

/**
 * @route   POST /api/pdf/merge
 * @desc    Merge multiple PDF files into a single document
 * @access  Public
 * @body    multipart/form-data with multiple PDF files and mergeData JSON
 */
router.post('/merge', 
  upload.array('pdfs', 10), // Allow up to 10 files
  handleUploadError,
  PDFController.mergePDFs
);

/**
 * @route   POST /api/pdf/merge/preview
 * @desc    Get preview information for PDF merge
 * @access  Public
 * @body    multipart/form-data with multiple PDF files
 */
router.post('/merge/preview', 
  upload.array('pdfs', 10),
  handleUploadError,
  PDFController.getMergePreview
);

/**
 * @route   POST /api/pdf/watermark
 * @desc    Add watermark to PDF
 * @access  Public
 * @body    multipart/form-data with PDF file and watermarkData JSON
 */
router.post('/watermark', 
  upload.single('pdf'), 
  handleUploadError,
  PDFController.addWatermark
);

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
 * @route   GET /api/pdf/watermark/options
 * @desc    Get watermark configuration options
 * @access  Public
 */
router.get('/watermark/options', PDFController.getWatermarkOptions);

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
