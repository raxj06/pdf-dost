const PDFService = require('../services/pdfService');

/**
 * PDF Controller
 * Handles PDF-related HTTP requests
 */
class PDFController {
  
  /**
   * Split PDF into multiple documents
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async splitPDF(req, res) {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No PDF file uploaded',
          details: 'Please select a PDF file to split'
        });
      }

      // Validate and parse split data
      let splitData;
      try {
        splitData = JSON.parse(req.body.splitData || '{}');
        console.log('Split data received:', splitData);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        return res.status(400).json({ 
          error: 'Invalid split data',
          details: 'Split data must be valid JSON'
        });
      }

      // Process the PDF split
      const splitResults = await PDFService.splitPDF(
        req.file.buffer, 
        splitData
      );
      
      if (splitResults.length === 1) {
        // Single file result - send directly
        const result = splitResults[0];
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('Content-Length', result.buffer.length);
        res.send(result.buffer);
      } else {
        // Multiple files - create ZIP archive
        const archiver = require('archiver');
        const archive = archiver('zip', {
          zlib: { level: 9 }
        });

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipFilename = `split-documents-${timestamp}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
        
        archive.pipe(res);

        // Add each PDF to the archive
        splitResults.forEach(result => {
          archive.append(result.buffer, { name: result.filename });
        });

        await archive.finalize();
      }

    } catch (error) {
      console.error('Error splitting PDF:', error);
      
      // Send appropriate error response
      res.status(500).json({ 
        error: 'Failed to split PDF', 
        details: error.message 
      });
    }
  }

  /**
   * Process PDF with watermark
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addWatermark(req, res) {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No PDF file uploaded',
          details: 'Please select a PDF file to add watermark'
        });
      }

      // Validate and parse watermark data
      let watermarkData;
      try {
        watermarkData = JSON.parse(req.body.watermarkData || '{}');
        console.log('Watermark data received:', watermarkData);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        return res.status(400).json({ 
          error: 'Invalid watermark data',
          details: 'Watermark data must be valid JSON'
        });
      }

      // Process the PDF with watermark
      const processedPdfBytes = await PDFService.addWatermarkToPDF(
        req.file.buffer, 
        watermarkData
      );
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `watermarked-document-${timestamp}.pdf`;

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', processedPdfBytes.length);
      
      // Send processed PDF
      res.send(Buffer.from(processedPdfBytes));

    } catch (error) {
      console.error('Error adding watermark to PDF:', error);
      
      // Send appropriate error response
      res.status(500).json({ 
        error: 'Failed to add watermark to PDF', 
        details: error.message 
      });
    }
  }

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
   * Get available PDF templates and watermark options
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

      const watermarkPositions = [
        { 
          value: 'center', 
          label: 'Center',
          description: 'Watermark appears in the center of the page'
        },
        { 
          value: 'top-left', 
          label: 'Top Left',
          description: 'Watermark appears in the top-left corner'
        },
        { 
          value: 'top-right', 
          label: 'Top Right',
          description: 'Watermark appears in the top-right corner'
        },
        { 
          value: 'bottom-left', 
          label: 'Bottom Left',
          description: 'Watermark appears in the bottom-left corner'
        },
        { 
          value: 'bottom-right', 
          label: 'Bottom Right',
          description: 'Watermark appears in the bottom-right corner'
        }
      ];

      res.json({
        success: true,
        templates,
        watermarkPositions
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
   * Get watermark configuration options
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getWatermarkOptions(req, res) {
    try {
      const options = {
        positions: [
          { value: 'center', label: 'Center', description: 'Watermark appears in the center of the page' },
          { value: 'top-left', label: 'Top Left', description: 'Watermark appears in the top-left corner' },
          { value: 'top-right', label: 'Top Right', description: 'Watermark appears in the top-right corner' },
          { value: 'bottom-left', label: 'Bottom Left', description: 'Watermark appears in the bottom-left corner' },
          { value: 'bottom-right', label: 'Bottom Right', description: 'Watermark appears in the bottom-right corner' }
        ],
        defaultSettings: {
          text: 'CONFIDENTIAL',
          fontSize: 48,
          opacity: 0.3,
          color: '#808080',
          rotation: 45,
          position: 'center',
          startPage: 1
        },
        fontSizeRange: { min: 12, max: 100 },
        opacityRange: { min: 0.1, max: 1.0 },
        rotationRange: { min: -90, max: 90 }
      };

      res.json({
        success: true,
        options
      });

    } catch (error) {
      console.error('Error fetching watermark options:', error);
      res.status(500).json({ 
        error: 'Failed to fetch watermark options', 
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
