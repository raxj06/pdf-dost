const PDFService = require('../services/pdfService');

/**
 * PDF Controller
 * Handles PDF-related HTTP requests
 */
class PDFController {
  
  /**
   * Process PDF with headers and footers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async processPDF(req, res) {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No PDF file uploaded',
          details: 'Please select a PDF file to process'
        });
      }

      // Validate and parse header/footer data
      let headerFooterData;
      try {
        headerFooterData = JSON.parse(req.body.headerFooterData || '{}');
      } catch (parseError) {
        return res.status(400).json({ 
          error: 'Invalid header/footer data',
          details: 'Header and footer data must be valid JSON'
        });
      }

      // Process the PDF
      const processedPdfBytes = await PDFService.addHeaderFooterToPDF(
        req.file.buffer, 
        headerFooterData
      );
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `processed-document-${timestamp}.pdf`;

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', processedPdfBytes.length);
      
      // Send processed PDF
      res.send(Buffer.from(processedPdfBytes));

    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // Send appropriate error response
      res.status(500).json({ 
        error: 'Failed to process PDF', 
        details: error.message 
      });
    }
  }

  /**
   * Get available PDF templates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getTemplates(req, res) {
    try {
      const templates = [
        { 
          value: 'page-x-of-y', 
          label: 'Page (x) of (y)',
          description: 'Shows page number with total pages (e.g., Page 1 of 10)'
        },
        { 
          value: 'x-of-y', 
          label: '(x) of (y)',
          description: 'Shows simple page count (e.g., 1 of 10)'
        },
        { 
          value: 'page-x', 
          label: 'Page (x)',
          description: 'Shows page number only (e.g., Page 1)'
        },
        { 
          value: 'x', 
          label: '(x)',
          description: 'Shows just the page number (e.g., 1)'
        },
        { 
          value: 'file', 
          label: '(file)',
          description: 'Shows document name placeholder'
        }
      ];

      res.json({
        success: true,
        templates
      });

    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ 
        error: 'Failed to fetch templates', 
        details: error.message 
      });
    }
  }

  /**
   * Health check for PDF service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async healthCheck(req, res) {
    try {
      res.json({ 
        status: 'OK', 
        service: 'PDF Processing Service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'ERROR', 
        error: error.message 
      });
    }
  }
}

module.exports = PDFController;
