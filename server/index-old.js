const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
  try {
    await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
  } catch (error) {
    console.log('Uploads directory already exists');
  }
};

// PDF processing function
const addHeaderFooterToPDF = async (pdfBuffer, headerFooterData) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const {
      leftHeader,
      middleHeader,
      rightHeader,
      leftFooter,
      middleFooter,
      rightFooter,
      startPage = 1,
      coverWithWhite = false,
      textColor = '#000000',
      fontSize = 10
    } = headerFooterData;

    // Convert hex color to RGB values for pdf-lib
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 0, g: 0, b: 0 };
    };

    const textColorRgb = hexToRgb(textColor);
    const textSize = parseInt(fontSize) || 10;
    const headerY = 750; // Near top of page
    const footerY = 50;  // Near bottom of page

    for (let i = startPage - 1; i < pages.length; i++) {
      const page = pages[i];
      const { width } = page.getSize();
      
      // Add white background rectangles if coverWithWhite is true
      if (coverWithWhite) {
        page.drawRectangle({
          x: 0,
          y: headerY - 5,
          width: width,
          height: 20,
          color: rgb(1, 1, 1),
        });
        page.drawRectangle({
          x: 0,
          y: footerY - 5,
          width: width,
          height: 20,
          color: rgb(1, 1, 1),
        });
      }

      // Process template variables
      const processTemplate = (text, pageNum, totalPages) => {
        return text
          .replace(/Page \(x\) of \(y\)/g, `Page ${pageNum} of ${totalPages}`)
          .replace(/\(x\) of \(y\)/g, `${pageNum} of ${totalPages}`)
          .replace(/Page \(x\)/g, `Page ${pageNum}`)
          .replace(/\(x\)/g, pageNum.toString())
          .replace(/\(file\)/g, 'Document');
      };

      // Add headers
      if (leftHeader) {
        const processedText = processTemplate(leftHeader, i + 1, pages.length);
        page.drawText(processedText, {
          x: 50,
          y: headerY,
          size: textSize,
          font,
          color: rgb(textColorRgb.r, textColorRgb.g, textColorRgb.b),
        });
      }

      if (middleHeader) {
        const processedText = processTemplate(middleHeader, i + 1, pages.length);
        const textWidth = font.widthOfTextAtSize(processedText, textSize);
        page.drawText(processedText, {
          x: (width - textWidth) / 2,
          y: headerY,
          size: textSize,
          font,
          color: rgb(textColorRgb.r, textColorRgb.g, textColorRgb.b),
        });
      }

      if (rightHeader) {
        const processedText = processTemplate(rightHeader, i + 1, pages.length);
        const textWidth = font.widthOfTextAtSize(processedText, textSize);
        page.drawText(processedText, {
          x: width - textWidth - 50,
          y: headerY,
          size: textSize,
          font,
          color: rgb(textColorRgb.r, textColorRgb.g, textColorRgb.b),
        });
      }

      // Add footers
      if (leftFooter) {
        const processedText = processTemplate(leftFooter, i + 1, pages.length);
        page.drawText(processedText, {
          x: 50,
          y: footerY,
          size: textSize,
          font,
          color: rgb(textColorRgb.r, textColorRgb.g, textColorRgb.b),
        });
      }

      if (middleFooter) {
        const processedText = processTemplate(middleFooter, i + 1, pages.length);
        const textWidth = font.widthOfTextAtSize(processedText, textSize);
        page.drawText(processedText, {
          x: (width - textWidth) / 2,
          y: footerY,
          size: textSize,
          font,
          color: rgb(textColorRgb.r, textColorRgb.g, textColorRgb.b),
        });
      }

      if (rightFooter) {
        const processedText = processTemplate(rightFooter, i + 1, pages.length);
        const textWidth = font.widthOfTextAtSize(processedText, textSize);
        page.drawText(processedText, {
          x: width - textWidth - 50,
          y: footerY,
          size: textSize,
          font,
          color: rgb(textColorRgb.r, textColorRgb.g, textColorRgb.b),
        });
      }
    }

    return await pdfDoc.save();
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'PDF Dost - Header & Footer Editor API' });
});

// Process PDF with headers and footers
app.post('/api/process-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const headerFooterData = JSON.parse(req.body.headerFooterData || '{}');
    
    const processedPdfBytes = await addHeaderFooterToPDF(req.file.buffer, headerFooterData);
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="processed-document.pdf"');
    res.setHeader('Content-Length', processedPdfBytes.length);
    
    res.send(Buffer.from(processedPdfBytes));
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, async () => {
  await createUploadsDir();
  console.log(`🚀 PDF Dost server running on port ${PORT}`);
  console.log(`📄 API available at http://localhost:${PORT}/api`);
});

module.exports = app;
