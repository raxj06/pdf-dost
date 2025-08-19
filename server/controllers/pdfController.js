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
   * Merge multiple PDF files into a single document
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async mergePDFs(req, res) {
    try {
      // Validate file uploads
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'No PDF files uploaded',
          details: 'Please select at least 2 PDF files to merge'
        });
      }

      if (req.files.length < 2) {
        return res.status(400).json({ 
          error: 'Insufficient files',
          details: 'At least 2 PDF files are required for merging'
        });
      }

      console.log(`📁 Merge request received: ${req.files.length} files`);

      // Validate and parse merge data
      let mergeData = {};
      try {
        if (req.body.mergeData) {
          mergeData = JSON.parse(req.body.mergeData);
        }
        console.log('Merge data received:', mergeData);
      } catch (parseError) {
        console.warn('Invalid merge data, using defaults:', parseError.message);
        mergeData = {};
      }

      // Extract file buffers and names
      const pdfBuffers = req.files.map(file => file.buffer);
      const fileNames = req.files.map(file => file.originalname);
      
      // Add file names to merge data for potential bookmark creation
      mergeData.fileNames = fileNames;

      console.log('Files to merge:', fileNames);

      // Get merge info first
      const mergeInfo = await PDFService.getPDFMergeInfo(pdfBuffers);
      console.log('Merge info:', mergeInfo);

      // Process the PDF merge
      const mergedPdfBuffer = await PDFService.mergePDFs(pdfBuffers, mergeData);
      
      // Additional validation: Ensure buffer is a valid type
      if (!Buffer.isBuffer(mergedPdfBuffer) && !(mergedPdfBuffer instanceof Uint8Array)) {
        throw new Error('Invalid PDF buffer type returned from merge service');
      }
      
      // Convert to Buffer if it's Uint8Array for consistent handling
      const finalBuffer = Buffer.isBuffer(mergedPdfBuffer) ? 
        mergedPdfBuffer : 
        Buffer.from(mergedPdfBuffer);
      
      // Verify buffer integrity
      if (finalBuffer.length === 0) {
        throw new Error('Merged PDF buffer is empty');
      }
      
      // Check PDF header in the buffer
      const headerCheck = finalBuffer.toString('ascii', 0, 8);
      if (!headerCheck.startsWith('%PDF-')) {
        throw new Error('Merged PDF buffer does not contain valid PDF header');
      }
      
      console.log(`✅ Buffer validation passed: ${finalBuffer.length} bytes`);
      
      // Debug: Save a copy to server temp folder for verification (in development)
      if (process.env.NODE_ENV !== 'production') {
        const fs = require('fs');
        const path = require('path');
        const tempFilePath = path.join(__dirname, '../temp', `debug-${Date.now()}.pdf`);
        try {
          fs.writeFileSync(tempFilePath, finalBuffer);
          console.log(`🔍 Debug PDF saved to: ${tempFilePath}`);
        } catch (debugError) {
          console.warn(`⚠️  Could not save debug PDF: ${debugError.message}`);
        }
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFileName = mergeData.outputFileName || `merged-document-${timestamp}.pdf`;
      
      console.log(`✅ Merge completed: ${mergeInfo.totalPages} pages, ${finalBuffer.length} bytes`);

      // Send the merged PDF with proper headers to prevent compression issues
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
      res.setHeader('Content-Length', finalBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Encoding', 'identity'); // Prevent automatic compression
      res.setHeader('Accept-Ranges', 'bytes'); // Allow partial downloads
      
      console.log(`📤 Sending PDF: ${finalBuffer.length} bytes (${(finalBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
      
      res.send(finalBuffer);

    } catch (error) {
      console.error('PDF merge error:', error);
      res.status(500).json({ 
        error: 'PDF merge failed', 
        details: error.message 
      });
    }
  }

  /**
   * Get merge preview information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMergePreview(req, res) {
    try {
      // Validate file uploads
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'No PDF files uploaded',
          details: 'Please select PDF files for preview'
        });
      }

      console.log(`📋 Preview request for ${req.files.length} files`);

      // Extract file buffers
      const pdfBuffers = req.files.map(file => file.buffer);
      
      // Get merge info
      const mergeInfo = await PDFService.getPDFMergeInfo(pdfBuffers);
      
      // Add file names to response
      const fileDetails = req.files.map((file, index) => ({
        name: file.originalname,
        size: file.size,
        pageCount: mergeInfo.files[index].pageCount
      }));

      const previewData = {
        ...mergeInfo,
        files: fileDetails,
        estimatedOutputSize: Math.round(mergeInfo.estimatedSize * 1.1) // Rough estimate with overhead
      };

      console.log('Preview data:', previewData);

      res.json(previewData);

    } catch (error) {
      console.error('Error generating merge preview:', error);
      res.status(500).json({ 
        error: 'Failed to generate preview', 
        details: error.message 
      });
    }
  }

  /**
   * Compress PDF to reduce file size
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async compressPDF(req, res) {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No PDF file uploaded',
          details: 'Please select a PDF file to compress'
        });
      }

      console.log(`📁 Compression request received for: ${req.file.originalname}`);

      // Validate and parse compression data
      let compressionData = {};
      try {
        if (req.body.compressionData) {
          compressionData = JSON.parse(req.body.compressionData);
        }
        console.log('Compression data received:', compressionData);
      } catch (parseError) {
        console.warn('Invalid compression data, using defaults:', parseError.message);
        compressionData = {};
      }

      // Check file size limits
      const fileSizeMB = req.file.buffer.length / (1024 * 1024);
      console.log(`📊 Input file size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 250) {
        return res.status(400).json({
          error: 'File too large',
          details: 'Maximum file size for compression is 250MB. Please use a smaller file.'
        });
      }

      // Process the PDF compression
      const compressedPdfBuffer = await PDFService.compressPDF(
        req.file.buffer, 
        compressionData
      );
      
      // Additional validation: Ensure buffer is valid
      if (!Buffer.isBuffer(compressedPdfBuffer) && !(compressedPdfBuffer instanceof Uint8Array)) {
        throw new Error('Invalid PDF buffer type returned from compression service');
      }
      
      // Convert to Buffer if it's Uint8Array
      const finalBuffer = Buffer.isBuffer(compressedPdfBuffer) ? 
        compressedPdfBuffer : 
        Buffer.from(compressedPdfBuffer);
      
      // Verify buffer integrity
      if (finalBuffer.length === 0) {
        throw new Error('Compressed PDF buffer is empty');
      }
      
      // Check PDF header
      const headerCheck = finalBuffer.toString('ascii', 0, 8);
      if (!headerCheck.startsWith('%PDF-')) {
        throw new Error('Compressed PDF buffer does not contain valid PDF header');
      }
      
      console.log(`✅ Compression validation passed: ${finalBuffer.length} bytes`);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const originalName = req.file.originalname.replace(/\.pdf$/i, '');
      const outputFileName = compressionData.outputFileName || 
        `${originalName}-compressed-${timestamp}.pdf`;
      
      const originalSizeMB = req.file.buffer.length / (1024 * 1024);
      const compressedSizeMB = finalBuffer.length / (1024 * 1024);
      const reductionPercent = ((originalSizeMB - compressedSizeMB) / originalSizeMB * 100).toFixed(1);
      
      console.log(`✅ Compression completed: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${reductionPercent}% reduction)`);

      // Send the compressed PDF with proper headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
      res.setHeader('Content-Length', finalBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Encoding', 'identity');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Add compression stats to response headers for frontend
      res.setHeader('X-Original-Size', req.file.buffer.length);
      res.setHeader('X-Compressed-Size', finalBuffer.length);
      res.setHeader('X-Compression-Ratio', reductionPercent);
      
      console.log(`📤 Sending compressed PDF: ${finalBuffer.length} bytes`);
      
      res.send(finalBuffer);

    } catch (error) {
      console.error('PDF compression error:', error);
      res.status(500).json({ 
        error: 'PDF compression failed', 
        details: error.message 
      });
    }
  }

  /**
   * Get compression preview information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCompressionPreview(req, res) {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No PDF file uploaded',
          details: 'Please select a PDF file for compression preview'
        });
      }

      console.log(`📋 Compression preview request for: ${req.file.originalname}`);

      // Get compression info
      const compressionInfo = await PDFService.getCompressionInfo(req.file.buffer);
      
      // Add file name to response
      const previewData = {
        ...compressionInfo,
        fileName: req.file.originalname,
        originalSizeMB: (compressionInfo.originalSize / (1024 * 1024)).toFixed(2)
      };

      console.log('Compression preview data:', previewData);

      res.json(previewData);

    } catch (error) {
      console.error('Error generating compression preview:', error);
      res.status(500).json({ 
        error: 'Failed to generate compression preview', 
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
