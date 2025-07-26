const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');

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
}

module.exports = PDFService;
