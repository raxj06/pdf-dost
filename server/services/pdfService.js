const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

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
