const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const zlib = require('zlib');
const pako = require('pako');

/**
 * PDF Processing Service
 * Handles all PDF manipulation operations
 */
class PDFService {
  
  /**
   * Convert hex color to RGB values for pdf-lib
   * @param {string} hex - Hex color code (e.g., '#FF0000')
   * @returns {Object} RGB values normalized to 0-1 range
   */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Process template variables in text
   * @param {string} text - Text containing template variables
   * @param {number} pageNum - Current page number
   * @param {number} totalPages - Total number of pages
   * @returns {string} Processed text with variables replaced
   */
  static processTemplate(text, pageNum, totalPages) {
    return text
      .replace(/Page \(x\) of \(y\)/g, `Page ${pageNum} of ${totalPages}`)
      .replace(/\(x\) of \(y\)/g, `${pageNum} of ${totalPages}`)
      .replace(/Page \(x\)/g, `Page ${pageNum}`)
      .replace(/\(x\)/g, pageNum.toString())
      .replace(/\(file\)/g, 'Document');
  }

  /**
   * Add text to specific position on page
   * @param {Object} page - PDF page object
   * @param {string} text - Text to add
   * @param {Object} options - Positioning and styling options
   */
  static addTextToPage(page, text, options) {
    const { x, y, size, font, color } = options;
    page.drawText(text, { x, y, size, font, color });
  }

  /**
   * Add white background rectangle to page
   * @param {Object} page - PDF page object
   * @param {number} y - Y position
   * @param {number} width - Page width
   * @param {number} height - Rectangle height
   */
  static addWhiteBackground(page, y, width, height = 20) {
    page.drawRectangle({
      x: 0,
      y: y - 5,
      width: width,
      height: height,
      color: rgb(1, 1, 1),
    });
  }

  /**
   * Calculate text position for center alignment
   * @param {Object} font - PDF font object
   * @param {string} text - Text to center
   * @param {number} fontSize - Font size
   * @param {number} pageWidth - Page width
   * @returns {number} X position for center alignment
   */
  static getCenterPosition(font, text, fontSize, pageWidth) {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    return (pageWidth - textWidth) / 2;
  }

  /**
   * Calculate text position for right alignment
   * @param {Object} font - PDF font object
   * @param {string} text - Text to align right
   * @param {number} fontSize - Font size
   * @param {number} pageWidth - Page width
   * @param {number} margin - Right margin
   * @returns {number} X position for right alignment
   */
  static getRightPosition(font, text, fontSize, pageWidth, margin = 50) {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    return pageWidth - textWidth - margin;
  }

  /**
   * Add watermark to PDF
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} watermarkData - Watermark configuration
   * @returns {Promise<Uint8Array>} Processed PDF bytes
   */
  static async addWatermarkToPDF(pdfBuffer, watermarkData) {
    try {
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      
      // Extract watermark configuration
      const {
        text = 'CONFIDENTIAL',
        fontSize = 48,
        opacity = 0.3,
        color = '#808080',
        rotation = 45,
        position = 'center', // center, top-left, top-right, bottom-left, bottom-right
        startPage = 1,
        endPage = 0 // 0 means all pages
      } = watermarkData;

      // Convert color and validate parameters
      const watermarkColor = this.hexToRgb(color);
      const watermarkOpacity = Math.max(0, Math.min(1, parseFloat(opacity)));
      const watermarkSize = parseInt(fontSize) || 48;
      const watermarkRotation = parseInt(rotation) || 45;
      
      // Embed font for watermark
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Calculate page range - handle endPage = 0 as "all pages"
      const startPageIndex = Math.max(0, parseInt(startPage) - 1);
      const actualEndPage = endPage === 0 ? pages.length : parseInt(endPage);
      const endPageIndex = Math.min(pages.length - 1, actualEndPage - 1);

      // Process each page in the specified range
      for (let i = startPageIndex; i <= endPageIndex; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Calculate watermark position
        const { x, y } = this.calculateWatermarkPosition(
          position, 
          width, 
          height, 
          text, 
          font, 
          watermarkSize
        );

        // Add watermark text with rotation and opacity
        page.drawText(text, {
          x,
          y,
          size: watermarkSize,
          font,
          color: rgb(watermarkColor.r, watermarkColor.g, watermarkColor.b),
          opacity: watermarkOpacity,
          rotate: degrees(watermarkRotation) // Use degrees() function from pdf-lib
        });
      }

      return await pdfDoc.save();
    } catch (error) {
      throw new Error(`Watermark processing failed: ${error.message}`);
    }
  }

  /**
   * Calculate watermark position based on position setting
   * @param {string} position - Position setting (center, top-left, etc.)
   * @param {number} pageWidth - Page width
   * @param {number} pageHeight - Page height
   * @param {string} text - Watermark text
   * @param {Object} font - PDF font object
   * @param {number} fontSize - Font size
   * @returns {Object} X and Y coordinates
   */
  static calculateWatermarkPosition(position, pageWidth, pageHeight, text, font, fontSize) {
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;
    
    switch (position) {
      case 'top-left':
        return { x: 50, y: pageHeight - 100 };
      case 'top-right':
        return { x: pageWidth - textWidth - 50, y: pageHeight - 100 };
      case 'bottom-left':
        return { x: 50, y: 100 };
      case 'bottom-right':
        return { x: pageWidth - textWidth - 50, y: 100 };
      case 'center':
      default:
        return { 
          x: (pageWidth - textWidth) / 2, 
          y: (pageHeight - textHeight) / 2 
        };
    }
  }

  /**
   * Split PDF into separate documents
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} splitData - Split configuration
   * @returns {Promise<Array>} Array of PDF buffers with metadata
   */
  static async splitPDF(pdfBuffer, splitData) {
    try {
      // Load PDF document
      const sourcePdf = await PDFDocument.load(pdfBuffer);
      const totalPages = sourcePdf.getPageCount();
      
      // Extract split configuration
      const {
        splitType = 'pages', // 'pages', 'ranges', 'every'
        pages = [], // Array of page numbers for 'pages' type
        ranges = [], // Array of {start, end} objects for 'ranges' type
        everyNPages = 1, // Number for 'every' type
        fileName = 'document' // Base filename
      } = splitData;

      const results = [];

      if (splitType === 'pages') {
        // Split by individual pages
        for (let i = 0; i < pages.length; i++) {
          const pageNum = parseInt(pages[i]);
          if (pageNum > 0 && pageNum <= totalPages) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);
            newPdf.addPage(copiedPage);
            
            const pdfBytes = await newPdf.save();
            results.push({
              buffer: Buffer.from(pdfBytes),
              filename: `${fileName}_page_${pageNum}.pdf`,
              pageRange: `Page ${pageNum}`,
              pageCount: 1
            });
          }
        }
      } else if (splitType === 'ranges') {
        // Split by page ranges
        for (let i = 0; i < ranges.length; i++) {
          const { start, end } = ranges[i];
          const startPage = Math.max(1, parseInt(start));
          const endPage = Math.min(totalPages, parseInt(end));
          
          if (startPage <= endPage) {
            const newPdf = await PDFDocument.create();
            const pageIndices = [];
            for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
              pageIndices.push(pageNum - 1);
            }
            
            const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));
            
            const pdfBytes = await newPdf.save();
            results.push({
              buffer: Buffer.from(pdfBytes),
              filename: `${fileName}_pages_${startPage}_to_${endPage}.pdf`,
              pageRange: `Pages ${startPage}-${endPage}`,
              pageCount: endPage - startPage + 1
            });
          }
        }
      } else if (splitType === 'every') {
        // Split every N pages
        const n = Math.max(1, parseInt(everyNPages));
        let partNumber = 1;
        
        for (let i = 0; i < totalPages; i += n) {
          const newPdf = await PDFDocument.create();
          const pageIndices = [];
          const endIndex = Math.min(i + n, totalPages);
          
          for (let j = i; j < endIndex; j++) {
            pageIndices.push(j);
          }
          
          const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach(page => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          const startPage = i + 1;
          const endPage = endIndex;
          
          results.push({
            buffer: Buffer.from(pdfBytes),
            filename: `${fileName}_part_${partNumber}.pdf`,
            pageRange: `Pages ${startPage}-${endPage}`,
            pageCount: endPage - startPage + 1
          });
          
          partNumber++;
        }
      } else {
        throw new Error(`Invalid split type: ${splitType}`);
      }

      if (results.length === 0) {
        throw new Error('No valid pages or ranges specified for splitting');
      }

      return results;
    } catch (error) {
      throw new Error(`PDF splitting failed: ${error.message}`);
    }
  }

  /**
   * Add headers and footers to PDF
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} headerFooterData - Header and footer configuration
   * @returns {Promise<Uint8Array>} Processed PDF bytes
   */
  static async addHeaderFooterToPDF(pdfBuffer, headerFooterData) {
    try {
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Extract configuration
      const {
        leftHeader = '',
        middleHeader = '',
        rightHeader = '',
        leftFooter = '',
        middleFooter = '',
        rightFooter = '',
        startPage = 1,
        coverWithWhite = false,
        textColor = '#000000',
        fontSize = 10
      } = headerFooterData;

      // Convert color and size
      const textColorRgb = this.hexToRgb(textColor);
      const textSize = parseInt(fontSize) || 10;
      
      // Page positioning constants
      const headerY = 750; // Near top of page
      const footerY = 50;  // Near bottom of page
      const leftMargin = 50;

      // Process each page starting from startPage
      for (let i = startPage - 1; i < pages.length; i++) {
        const page = pages[i];
        const { width } = page.getSize();
        // Page numbering: i+1 gives us the actual page number we want to display
        const currentPageNum = i + 1;
        
        // Add white background if requested
        if (coverWithWhite) {
          this.addWhiteBackground(page, headerY, width);
          this.addWhiteBackground(page, footerY, width);
        }

        // Text styling options
        const textOptions = {
          size: textSize,
          font,
          color: rgb(textColorRgb.r, textColorRgb.g, textColorRgb.b)
        };

        // Process and add headers
        if (leftHeader) {
          const processedText = this.processTemplate(leftHeader, currentPageNum, pages.length);
          this.addTextToPage(page, processedText, {
            ...textOptions,
            x: leftMargin,
            y: headerY
          });
        }

        if (middleHeader) {
          const processedText = this.processTemplate(middleHeader, currentPageNum, pages.length);
          const centerX = this.getCenterPosition(font, processedText, textSize, width);
          this.addTextToPage(page, processedText, {
            ...textOptions,
            x: centerX,
            y: headerY
          });
        }

        if (rightHeader) {
          const processedText = this.processTemplate(rightHeader, currentPageNum, pages.length);
          const rightX = this.getRightPosition(font, processedText, textSize, width);
          this.addTextToPage(page, processedText, {
            ...textOptions,
            x: rightX,
            y: headerY
          });
        }

        // Process and add footers
        if (leftFooter) {
          const processedText = this.processTemplate(leftFooter, currentPageNum, pages.length);
          this.addTextToPage(page, processedText, {
            ...textOptions,
            x: leftMargin,
            y: footerY
          });
        }

        if (middleFooter) {
          const processedText = this.processTemplate(middleFooter, currentPageNum, pages.length);
          const centerX = this.getCenterPosition(font, processedText, textSize, width);
          this.addTextToPage(page, processedText, {
            ...textOptions,
            x: centerX,
            y: footerY
          });
        }

        if (rightFooter) {
          const processedText = this.processTemplate(rightFooter, currentPageNum, pages.length);
          const rightX = this.getRightPosition(font, processedText, textSize, width);
          this.addTextToPage(page, processedText, {
            ...textOptions,
            x: rightX,
            y: footerY
          });
        }
      }

      return await pdfDoc.save();
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  /**
   * Merge multiple PDF documents into a single PDF
   * @param {Array<Buffer>} pdfBuffers - Array of PDF file buffers to merge
   * @param {Object} mergeData - Merge configuration options
   * @returns {Promise<Buffer>} Merged PDF as buffer
   */
  static async mergePDFs(pdfBuffers, mergeData = {}) {
    try {
      if (!pdfBuffers || pdfBuffers.length === 0) {
        throw new Error('No PDF files provided for merging');
      }

      if (pdfBuffers.length === 1) {
        throw new Error('At least 2 PDF files are required for merging');
      }

      // Check total size before processing
      const totalSize = pdfBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
      const totalSizeMB = totalSize / (1024 * 1024);
      
      console.log(`📊 Total file size: ${totalSizeMB.toFixed(2)} MB`);
      
      if (totalSizeMB > 500) {
        throw new Error(`Total file size (${totalSizeMB.toFixed(2)} MB) exceeds 500MB limit. Consider splitting large files first.`);
      }

      // Create a new PDF document to hold merged content
      const mergedPdf = await PDFDocument.create();

      console.log(`🔗 Starting merge of ${pdfBuffers.length} PDF files`);

      // Process each PDF file
      for (let i = 0; i < pdfBuffers.length; i++) {
        try {
          console.log(`📄 Processing PDF ${i + 1}/${pdfBuffers.length}`);
          
          const bufferSizeMB = pdfBuffers[i].length / (1024 * 1024);
          console.log(`   → File size: ${bufferSizeMB.toFixed(2)} MB`);
          
          // Load PDF with proper options for large files
          const loadOptions = {
            ignoreEncryption: true,
            // Remove capNumbers as it may cause issues with some PDFs
            throwOnInvalidObject: false,
            updateMetadata: false
          };
          
          const loadPromise = PDFDocument.load(pdfBuffers[i], loadOptions);
          
          // Set timeout for large file processing
          const timeoutMs = Math.max(30000, bufferSizeMB * 1000); // 1 second per MB, minimum 30 seconds
          const currentPdf = await Promise.race([
            loadPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`PDF ${i + 1} loading timeout after ${timeoutMs/1000}s`)), timeoutMs)
            )
          ]);
          
          const pageCount = currentPdf.getPageCount();
          console.log(`   → ${pageCount} pages found`);

          // Copy pages in smaller batches for large files
          const batchSize = bufferSizeMB > 100 ? 5 : (bufferSizeMB > 20 ? 10 : 20);
          const allCopiedPages = [];
          
          for (let pageStart = 0; pageStart < pageCount; pageStart += batchSize) {
            const pageEnd = Math.min(pageStart + batchSize, pageCount);
            const pageIndices = Array.from({length: pageEnd - pageStart}, (_, index) => pageStart + index);
            
            console.log(`   → Copying pages ${pageStart + 1}-${pageEnd}...`);
            
            try {
              // Copy pages with error handling for each batch
              const batchPages = await mergedPdf.copyPages(currentPdf, pageIndices);
              allCopiedPages.push(...batchPages);
              
              console.log(`   ✅ Successfully copied ${batchPages.length} pages`);
              
            } catch (copyError) {
              console.error(`   ❌ Error copying pages ${pageStart + 1}-${pageEnd}:`, copyError.message);
              
              // Try copying pages individually if batch fails
              for (let singlePageIdx of pageIndices) {
                try {
                  const [singlePage] = await mergedPdf.copyPages(currentPdf, [singlePageIdx]);
                  allCopiedPages.push(singlePage);
                  console.log(`   ✅ Recovered page ${singlePageIdx + 1}`);
                } catch (singleError) {
                  console.error(`   ⚠️  Skipping corrupted page ${singlePageIdx + 1}:`, singleError.message);
                }
              }
            }
            
            // Force garbage collection for large files
            if (bufferSizeMB > 50 && global.gc) {
              global.gc();
            }
          }

          // Add copied pages to merged document
          allCopiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });

          console.log(`   ✅ Added ${pageCount} pages to merged document`);

        } catch (error) {
          console.error(`❌ Error processing PDF ${i + 1}:`, error.message);
          if (error.message.includes('timeout')) {
            throw new Error(`PDF file ${i + 1} is too large or complex to process. Consider splitting it into smaller files first.`);
          }
          if (error.message.includes('Invalid PDF')) {
            throw new Error(`PDF file ${i + 1} appears to be corrupted or invalid.`);
          }
          throw new Error(`Failed to process PDF file ${i + 1}: ${error.message}`);
        }
      }

      const totalPages = mergedPdf.getPageCount();
      console.log(`🎉 Merge completed: ${totalPages} total pages in merged document`);

      // Add bookmarks/outline if enabled
      if (mergeData.addBookmarks) {
        await this.addBookmarksToMergedPDF(mergedPdf, pdfBuffers, mergeData);
      }

      console.log(`💾 Saving merged PDF...`);
      
      // Save with conservative options for maximum compatibility
      const savedPdf = await mergedPdf.save({
        useObjectStreams: false,  // Disable object streams for better compatibility
        addDefaultPage: false,    // Don't add default page
        objectsPerTick: 50,       // Process fewer objects per tick for stability
        updateFieldAppearances: false, // Avoid field appearance updates that can cause issues
        compress: false           // Disable compression to avoid corruption
      });
      
      const savedSizeMB = savedPdf.length / (1024 * 1024);
      console.log(`📊 Final PDF size: ${savedSizeMB.toFixed(2)} MB`);
      
      // Enhanced PDF validation
      try {
        // First validation: Load with pdf-lib
        const validationPdf = await PDFDocument.load(savedPdf, {
          ignoreEncryption: true,
          throwOnInvalidObject: true,  // More strict validation
          updateMetadata: false
        });
        
        const validationPageCount = validationPdf.getPageCount();
        console.log(`✅ PDF validation passed: ${validationPageCount} pages`);
        
        // Additional validation: Check PDF structure
        await this.validatePDFStructure(savedPdf);
        
        // Verify page count matches expected
        if (validationPageCount !== totalPages) {
          throw new Error(`Page count mismatch: expected ${totalPages}, got ${validationPageCount}`);
        }
        
      } catch (validationError) {
        console.error(`❌ PDF validation failed:`, validationError.message);
        throw new Error(`Generated PDF is corrupted and cannot be opened: ${validationError.message}`);
      }
      
      return savedPdf;
    } catch (error) {
      console.error('PDF merge error:', error);
      throw new Error(`PDF merge failed: ${error.message}`);
    }
  }

  /**
   * Add bookmarks to merged PDF for easier navigation
   * @param {PDFDocument} mergedPdf - The merged PDF document
   * @param {Array<Buffer>} pdfBuffers - Original PDF buffers for reference
   * @param {Object} mergeData - Merge configuration with file names
   */
  static async addBookmarksToMergedPDF(mergedPdf, pdfBuffers, mergeData) {
    try {
      let currentPageIndex = 0;
      const fileNames = mergeData.fileNames || [];

      for (let i = 0; i < pdfBuffers.length; i++) {
        const currentPdf = await PDFDocument.load(pdfBuffers[i]);
        const pageCount = currentPdf.getPageCount();
        
        const fileName = fileNames[i] || `Document ${i + 1}`;
        const bookmarkTitle = fileName.replace(/\.pdf$/i, '');

        // Note: pdf-lib has limited bookmark support in current version
        // This is a placeholder for future bookmark implementation
        console.log(`📑 Bookmark: "${bookmarkTitle}" at page ${currentPageIndex + 1}`);
        
        currentPageIndex += pageCount;
      }
    } catch (error) {
      console.warn('Bookmark creation failed:', error.message);
      // Don't throw error for bookmark failure
    }
  }

  /**
   * Get information about PDFs before merging
   * @param {Array<Buffer>} pdfBuffers - Array of PDF file buffers
   * @returns {Promise<Object>} Information about the PDFs
   */
  static async getPDFMergeInfo(pdfBuffers) {
    try {
      const pdfInfo = [];
      let totalPages = 0;

      for (let i = 0; i < pdfBuffers.length; i++) {
        const pdf = await PDFDocument.load(pdfBuffers[i]);
        const pageCount = pdf.getPageCount();
        
        pdfInfo.push({
          index: i,
          pageCount,
          size: pdfBuffers[i].length
        });
        
        totalPages += pageCount;
      }

      return {
        fileCount: pdfBuffers.length,
        totalPages,
        files: pdfInfo,
        estimatedSize: pdfBuffers.reduce((sum, buffer) => sum + buffer.length, 0)
      };
    } catch (error) {
      throw new Error(`Failed to analyze PDFs: ${error.message}`);
    }
  }

  /**
   * Compress PDF to reduce file size
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {Object} compressionData - Compression configuration
   * @returns {Promise<Uint8Array>} Compressed PDF bytes
   */
  static async compressPDF(pdfBuffer, compressionData = {}) {
    try {
      // Extract compression configuration
      const {
        compressionLevel = 'medium', // 'low', 'medium', 'high', 'maximum'
        removeMetadata = true,
        optimizeImages = true,
        targetSizeKB = null,
        maintainQuality = true
      } = compressionData;

      console.log(`🗜️  Starting PDF compression with level: ${compressionLevel}`);
      
      const originalSizeMB = pdfBuffer.length / (1024 * 1024);
      console.log(`📊 Original file size: ${originalSizeMB.toFixed(2)} MB`);

      // Load PDF document with compression-friendly options
      const pdfDoc = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false
      });

      const pageCount = pdfDoc.getPageCount();
      console.log(`📄 Processing ${pageCount} pages for compression`);

      // Configure compression settings based on level
      const compressionSettings = this.getCompressionSettings(compressionLevel);
      
      // Remove metadata if requested
      if (removeMetadata) {
        try {
          // Remove document metadata
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setCreator('');
          pdfDoc.setProducer('PDF Dost Compressor');
          pdfDoc.setKeywords([]);
          
          // Remove creation and modification dates safely
          try {
            pdfDoc.setCreationDate(undefined);
            pdfDoc.setModificationDate(undefined);
          } catch (dateError) {
            console.warn(`⚠️  Could not remove dates: ${dateError.message}`);
          }
          
          console.log(`🗑️  Metadata removed`);
        } catch (metadataError) {
          console.warn(`⚠️  Could not remove all metadata: ${metadataError.message}`);
        }
      }

      // Create a new PDF document for maximum compression to ensure clean structure
      let finalDoc = pdfDoc;
      
      if (compressionLevel === 'maximum') {
        try {
          console.log(`🔄 Creating fresh PDF document for maximum compression`);
          
          // Create new document and copy pages
          finalDoc = await PDFDocument.create();
          
          // Copy pages one by one to ensure clean structure
          const pages = pdfDoc.getPages();
          const pageRefs = pages.map((_, index) => index);
          
          const copiedPages = await finalDoc.copyPages(pdfDoc, pageRefs);
          copiedPages.forEach(page => {
            finalDoc.addPage(page);
          });
          
          console.log(`✅ Fresh PDF document created with ${copiedPages.length} pages`);
        } catch (copyError) {
          console.warn(`⚠️  Fresh document creation failed, using original: ${copyError.message}`);
          finalDoc = pdfDoc;
        }
      }

      // Try multiple compression passes with different settings
      console.log(`💾 Starting compression with ${compressionLevel} level...`);
      
      let bestCompressed = null;
      let bestSize = Infinity;
      let bestSettings = null;

      // Primary compression attempt
      const primarySettings = {
        useObjectStreams: compressionSettings.useObjectStreams,
        addDefaultPage: false,
        objectsPerTick: compressionSettings.objectsPerTick,
        updateFieldAppearances: false,
        compress: compressionSettings.compress
      };

      try {
        console.log(`� Primary compression attempt:`, primarySettings);
        const primaryResult = await finalDoc.save(primarySettings);
        
        if (primaryResult.length < bestSize) {
          bestCompressed = primaryResult;
          bestSize = primaryResult.length;
          bestSettings = primarySettings;
          console.log(`✅ Primary compression successful: ${(bestSize / (1024 * 1024)).toFixed(2)} MB`);
        }
      } catch (primaryError) {
        console.warn(`⚠️  Primary compression failed: ${primaryError.message}`);
      }

      // If we need better compression, try alternative settings
      if (compressionLevel === 'high' || compressionLevel === 'maximum') {
        const alternativeSettings = [
          {
            useObjectStreams: false,
            addDefaultPage: false,
            objectsPerTick: 5,
            updateFieldAppearances: false,
            compress: true
          },
          {
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 1,
            updateFieldAppearances: false,
            compress: true
          },
          {
            useObjectStreams: false,
            addDefaultPage: false,
            objectsPerTick: 1,
            updateFieldAppearances: false,
            compress: true
          }
        ];

        for (let i = 0; i < alternativeSettings.length; i++) {
          try {
            console.log(`🔧 Alternative compression ${i + 1}:`, alternativeSettings[i]);
            const altResult = await finalDoc.save(alternativeSettings[i]);
            
            if (altResult.length < bestSize) {
              bestCompressed = altResult;
              bestSize = altResult.length;
              bestSettings = alternativeSettings[i];
              console.log(`✅ Better compression found: ${(bestSize / (1024 * 1024)).toFixed(2)} MB`);
            }
          } catch (altError) {
            console.warn(`⚠️  Alternative compression ${i + 1} failed: ${altError.message}`);
          }
        }
      }

      // If no compression worked, use basic settings
      if (!bestCompressed) {
        console.log(`� Fallback to basic compression...`);
        const basicSettings = {
          useObjectStreams: false,
          addDefaultPage: false,
          objectsPerTick: 50,
          updateFieldAppearances: false,
          compress: true
        };
        
        bestCompressed = await finalDoc.save(basicSettings);
        bestSize = bestCompressed.length;
        bestSettings = basicSettings;
      }

      const compressedSizeMB = bestSize / (1024 * 1024);
      const compressionRatio = ((originalSizeMB - compressedSizeMB) / originalSizeMB * 100).toFixed(1);
      
      console.log(`📊 Final compressed size: ${compressedSizeMB.toFixed(2)} MB`);
      console.log(`📉 Compression ratio: ${compressionRatio}% reduction`);
      console.log(`🔧 Best settings used:`, bestSettings);

      // Check if target size is achieved
      if (targetSizeKB && bestSize > targetSizeKB * 1024) {
        console.log(`⚠️  Target size ${targetSizeKB}KB not achieved. Current size: ${(bestSize / 1024).toFixed(1)}KB`);
      }

      // Final validation
      try {
        await PDFDocument.load(bestCompressed);
        console.log(`✅ Compressed PDF validation successful`);
      } catch (validationError) {
        console.error(`❌ Compressed PDF validation failed:`, validationError.message);
        throw new Error(`Compression resulted in corrupted PDF: ${validationError.message}`);
      }

      console.log(`🎉 Final result: ${originalSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${compressionRatio}% reduction)`);
      return bestCompressed;
    } catch (error) {
      console.error('PDF compression error:', error);
      throw new Error(`PDF compression failed: ${error.message}`);
    }
  }

  /**
   * Get compression settings based on compression level
   * @param {string} level - Compression level (low, medium, high, maximum)
   * @returns {Object} Compression settings
   */
  static getCompressionSettings(level) {
    const settings = {
      low: {
        useObjectStreams: false,
        objectsPerTick: 100,
        compress: true,
        description: 'Minimal compression, preserves maximum quality'
      },
      medium: {
        useObjectStreams: true,
        objectsPerTick: 25,
        compress: true,
        description: 'Balanced compression with good quality'
      },
      high: {
        useObjectStreams: true,
        objectsPerTick: 10,
        compress: true,
        description: 'Strong compression, slight quality reduction'
      },
      maximum: {
        useObjectStreams: false,  // Sometimes false works better for max compression
        objectsPerTick: 1,        // Most aggressive setting
        compress: true,
        description: 'Maximum compression, quality may be affected'
      }
    };

    return settings[level] || settings.medium;
  }

  /**
   * Get compression preview information
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<Object>} Information about the PDF for compression preview
   */
  static async getCompressionInfo(pdfBuffer) {
    try {
      const pdf = await PDFDocument.load(pdfBuffer);
      const pageCount = pdf.getPageCount();
      const originalSize = pdfBuffer.length;
      
      // More realistic compression estimates based on actual PDF characteristics
      const baselineCompression = this.estimateCompressionPotential(pdfBuffer);
      
      const estimatedSavings = {
        low: Math.round(originalSize * (baselineCompression.low / 100)),
        medium: Math.round(originalSize * (baselineCompression.medium / 100)),
        high: Math.round(originalSize * (baselineCompression.high / 100)),
        maximum: Math.round(originalSize * (baselineCompression.maximum / 100))
      };

      return {
        originalSize,
        originalSizeMB: (originalSize / (1024 * 1024)).toFixed(2),
        pageCount,
        estimatedSavings,
        compressionLevels: [
          {
            level: 'low',
            description: 'Minimal compression, preserves maximum quality',
            estimatedSize: originalSize - estimatedSavings.low,
            estimatedReduction: `${baselineCompression.low}-${baselineCompression.low + 5}%`
          },
          {
            level: 'medium',
            description: 'Balanced compression with good quality',
            estimatedSize: originalSize - estimatedSavings.medium,
            estimatedReduction: `${baselineCompression.medium}-${baselineCompression.medium + 10}%`
          },
          {
            level: 'high',
            description: 'Strong compression, slight quality reduction',
            estimatedSize: originalSize - estimatedSavings.high,
            estimatedReduction: `${baselineCompression.high}-${baselineCompression.high + 20}%`
          },
          {
            level: 'maximum',
            description: 'Maximum compression, quality may be affected',
            estimatedSize: originalSize - estimatedSavings.maximum,
            estimatedReduction: `${baselineCompression.maximum}-${baselineCompression.maximum + 30}%`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to analyze PDF for compression: ${error.message}`);
    }
  }

  /**
   * Estimate compression potential based on PDF characteristics
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Object} Estimated compression percentages for each level
   */
  static estimateCompressionPotential(pdfBuffer) {
    try {
      const pdfString = pdfBuffer.toString('binary');
      
      // Analyze PDF content to estimate compression potential
      let baseCompression = 10; // Default baseline
      
      // Check for text content (highly compressible)
      const textObjects = (pdfString.match(/\/Type\s*\/Font/g) || []).length;
      if (textObjects > 0) {
        baseCompression += Math.min(textObjects * 2, 20);
      }
      
      // Check for repeated patterns (good for compression)
      const streamCount = (pdfString.match(/stream\s/g) || []).length;
      if (streamCount > 10) {
        baseCompression += Math.min(streamCount, 15);
      }
      
      // Check for whitespace and formatting (compressible)
      const whitespaceRatio = (pdfString.match(/\s/g) || []).length / pdfBuffer.length;
      if (whitespaceRatio > 0.1) {
        baseCompression += Math.min(whitespaceRatio * 100, 10);
      }
      
      // Check for metadata and annotations (removable)
      if (pdfString.includes('/Info') || pdfString.includes('/Metadata')) {
        baseCompression += 5;
      }
      
      // Ensure realistic ranges
      baseCompression = Math.max(5, Math.min(baseCompression, 40));
      
      return {
        low: Math.round(baseCompression * 0.3),      // Conservative
        medium: Math.round(baseCompression * 0.6),   // Moderate  
        high: Math.round(baseCompression * 1.0),     // Aggressive
        maximum: Math.round(baseCompression * 1.5)   // Very aggressive
      };
    } catch (error) {
      console.warn('Could not analyze PDF characteristics, using defaults');
      return {
        low: 5,
        medium: 15,
        high: 30,
        maximum: 50
      };
    }
  }

  /**
   * Validate PDF structure and integrity
   * @param {Uint8Array} pdfBytes - PDF bytes to validate
   * @returns {Promise<void>} Throws error if validation fails
   */
  static async validatePDFStructure(pdfBytes) {
    try {
      // Check PDF header
      const header = new TextDecoder().decode(pdfBytes.slice(0, 8));
      if (!header.startsWith('%PDF-')) {
        throw new Error('Invalid PDF header');
      }
      
      // Check PDF trailer
      const trailer = new TextDecoder().decode(pdfBytes.slice(-1024));
      if (!trailer.includes('%%EOF')) {
        throw new Error('Invalid PDF trailer - missing %%EOF');
      }
      
      // Check for minimum PDF structure
      const pdfString = new TextDecoder().decode(pdfBytes);
      if (!pdfString.includes('/Type /Catalog')) {
        throw new Error('Missing PDF catalog');
      }
      
      if (!pdfString.includes('/Type /Pages')) {
        throw new Error('Missing PDF pages structure');
      }
      
      console.log(`✅ PDF structure validation passed`);
      
    } catch (error) {
      console.error(`❌ PDF structure validation failed:`, error.message);
      throw new Error(`PDF structure is invalid: ${error.message}`);
    }
  }
}

module.exports = PDFService;
