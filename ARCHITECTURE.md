# PDF Dost - Architectural Guide

## Overview

PDF Dost is a comprehensive PDF processing application built with a React frontend and Express.js backend. It provides multiple PDF manipulation features including header/footer addition, watermarking, splitting, and merging capabilities.

## System Architecture

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   React Client  │ ◄─────────────────► │ Express Server  │
│   (Port 3000)   │                     │   (Port 5000)   │
└─────────────────┘                     └─────────────────┘
         │                                        │
         │                                        │
    ┌─────────┐                              ┌─────────┐
    │ Browser │                              │ pdf-lib │
    │ Storage │                              │ Engine  │
    └─────────┘                              └─────────┘
```

## Technology Stack

### Frontend
- **React.js** - UI framework
- **CSS3** - Styling with component-specific CSS files
- **Fetch API** - HTTP client for API communication
- **File API** - Browser file handling and drag-and-drop

### Backend
- **Express.js** - Web framework
- **pdf-lib** - PDF manipulation library
- **Multer** - File upload middleware
- **Archiver** - ZIP file creation for split operations
- **CORS** - Cross-origin resource sharing

## Core Components

### 1. Frontend Architecture

#### Main Components

```
src/
├── App.js                 # Main application component
├── components/
│   ├── PDFEditor.js       # Main container with tab navigation
│   ├── HeaderFooterEditor.js  # Header/footer functionality
│   ├── WatermarkEditor.js     # Watermark functionality
│   ├── SplitEditor.js         # PDF splitting functionality
│   └── MergeEditor.js         # PDF merging functionality
└── App.css               # Global styles
```

#### Component Hierarchy

```
App
└── PDFEditor (Tab Container)
    ├── HeaderFooterEditor
    ├── WatermarkEditor
    ├── SplitEditor
    └── MergeEditor
```

### 2. Backend Architecture

#### Service Layer Pattern

```
server/
├── index.js                    # Express app configuration
├── controllers/
│   └── pdfController.js        # HTTP request handlers
├── services/
│   └── pdfService.js           # Business logic & PDF processing
├── middleware/
│   └── upload.js               # File upload configuration
├── routes/
│   ├── index.js                # Route aggregation
│   └── pdfRoutes.js            # PDF-specific routes
└── utils/
    ├── fileUtils.js            # File system utilities
    └── logger.js               # Logging utilities
```

## PDF Processing Features

### 1. Header & Footer Addition

**Purpose**: Add customizable headers and footers to PDF documents

**Key Features**:
- Left, center, right positioning
- Template variables: `(x)`, `(y)`, `Page (x) of (y)`, `(file)`
- Custom fonts, colors, and sizes
- White background option
- Page range selection

**Technical Implementation**:
```javascript
// Template processing
static processTemplate(text, pageNum, totalPages) {
  return text
    .replace(/Page \(x\) of \(y\)/g, `Page ${pageNum} of ${totalPages}`)
    .replace(/\(x\) of \(y\)/g, `${pageNum} of ${totalPages}`)
    // ... more replacements
}
```

### 2. Watermarking

**Purpose**: Add text watermarks to PDF documents

**Key Features**:
- 5 position options (center, corners)
- Rotation, opacity, color customization
- Page range support
- Font size control

**Technical Implementation**:
- Uses `degrees()` function for rotation
- RGB color conversion from hex
- Position calculation based on page dimensions

### 3. PDF Splitting

**Purpose**: Split large PDFs into smaller documents

**Split Types**:
1. **Individual Pages**: Extract specific pages
2. **Page Ranges**: Extract page ranges (e.g., 1-5, 10-15)
3. **Every N Pages**: Split every N pages

**Output Options**:
- Single PDF (for one result)
- ZIP archive (for multiple results)

**Technical Implementation**:
```javascript
// Batch processing for large files
const batchSize = bufferSizeMB > 100 ? 5 : (bufferSizeMB > 20 ? 10 : 20);
for (let pageStart = 0; pageStart < pageCount; pageStart += batchSize) {
  // Process pages in batches
}
```

### 4. PDF Merging (Critical Implementation)

**Purpose**: Combine multiple PDF files into a single document

**Key Features**:
- Large file support (up to 250MB per file, 500MB total)
- Drag-and-drop interface
- File reordering
- Preview information
- Size validation and warnings

#### Critical Technical Details

The PDF merge functionality underwent extensive optimization to handle corruption and file size issues:

##### Problem Analysis
- **Original Issue**: Merged PDFs were corrupted and wouldn't open
- **Size Inflation**: Files grew from expected 16MB to actual 200MB+
- **Root Cause**: PDF compression and object stream handling

##### Solution Architecture

**1. Enhanced PDF Save Options**
```javascript
const savedPdf = await mergedPdf.save({
  useObjectStreams: false,    // Disable for better compatibility
  addDefaultPage: false,      // Don't add unnecessary pages
  objectsPerTick: 50,         // Stable processing
  updateFieldAppearances: false, // Avoid form field corruption
  compress: false             // CRITICAL: Prevents corruption
});
```

**2. Comprehensive Validation Pipeline**
```javascript
// Multi-layer validation
try {
  // 1. pdf-lib validation
  const validationPdf = await PDFDocument.load(savedPdf, {
    ignoreEncryption: true,
    throwOnInvalidObject: true,
    updateMetadata: false
  });
  
  // 2. Structure validation
  await this.validatePDFStructure(savedPdf);
  
  // 3. Page count verification
  if (validationPageCount !== totalPages) {
    throw new Error(`Page count mismatch`);
  }
} catch (validationError) {
  throw new Error(`Generated PDF is corrupted: ${validationError.message}`);
}
```

**3. PDF Structure Validation**
```javascript
static async validatePDFStructure(pdfBytes) {
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
  
  // Check minimum PDF structure
  const pdfString = new TextDecoder().decode(pdfBytes);
  if (!pdfString.includes('/Type /Catalog')) {
    throw new Error('Missing PDF catalog');
  }
}
```

**4. Buffer Integrity Validation**
```javascript
// Server-side buffer validation
if (!Buffer.isBuffer(mergedPdfBuffer) && !(mergedPdfBuffer instanceof Uint8Array)) {
  throw new Error('Invalid PDF buffer type returned from merge service');
}

const finalBuffer = Buffer.isBuffer(mergedPdfBuffer) ? 
  mergedPdfBuffer : Buffer.from(mergedPdfBuffer);

// Check PDF header in buffer
const headerCheck = finalBuffer.toString('ascii', 0, 8);
if (!headerCheck.startsWith('%PDF-')) {
  throw new Error('Merged PDF buffer does not contain valid PDF header');
}
```

**5. Enhanced HTTP Response Headers**
```javascript
// Prevent compression and caching issues
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
res.setHeader('Content-Length', finalBuffer.length);
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
res.setHeader('Pragma', 'no-cache');
res.setHeader('Expires', '0');
res.setHeader('Content-Encoding', 'identity'); // Prevent compression
res.setHeader('Accept-Ranges', 'bytes'); // Allow partial downloads
```

**6. Client-Side Size Validation**
```javascript
// Dual size checking on frontend
const blob = await response.blob();
const arrayBuffer = await blob.arrayBuffer();
const trueSizeBytes = arrayBuffer.byteLength;

// Use ArrayBuffer size as it's more reliable than blob.size
if (Math.abs(blob.size - trueSizeBytes) > 1000) {
  console.warn(`Blob size inconsistency detected`);
}

// Create corrected blob for download
const correctedBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
```

**7. Debug Infrastructure**
```javascript
// Development debugging
if (process.env.NODE_ENV !== 'production') {
  const tempFilePath = path.join(__dirname, '../temp', `debug-${Date.now()}.pdf`);
  fs.writeFileSync(tempFilePath, finalBuffer);
  console.log(`🔍 Debug PDF saved to: ${tempFilePath}`);
}
```

## Error Handling Strategy

### 1. Graceful Degradation
- Individual page recovery on batch copy failure
- Fallback to single-page processing
- Skip corrupted pages with warnings

### 2. User Feedback
- Size warnings for large files (>50MB, >200MB)
- Processing timeouts with helpful suggestions
- Detailed error messages with actionable advice

### 3. Server Logging
- Comprehensive operation logging
- Performance metrics (file sizes, processing times)
- Error categorization and context

## Performance Optimizations

### 1. Large File Handling
```javascript
// Dynamic batch sizing based on file size
const batchSize = bufferSizeMB > 100 ? 5 : (bufferSizeMB > 20 ? 10 : 20);

// Timeout scaling
const timeoutMs = Math.max(30000, bufferSizeMB * 1000); // 1s per MB

// Memory management
if (bufferSizeMB > 50 && global.gc) {
  global.gc(); // Force garbage collection
}
```

### 2. Express Configuration
```javascript
// High limits for large file processing
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true, limit: '300mb' }));
app.use(express.raw({ limit: '300mb', type: 'application/pdf' }));

// Disable etag for PDF responses
app.set('etag', false);
```

### 3. Frontend Optimizations
- Chunked file processing
- Progress indicators for large operations
- Memory-efficient blob handling
- Responsive UI during processing

## Security Considerations

### 1. File Validation
- PDF header verification
- File size limits (250MB per file, 500MB total)
- MIME type checking
- Buffer integrity validation

### 2. CORS Configuration
```javascript
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'https://pdf-dost.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
```

### 3. Input Sanitization
- JSON parsing with error handling
- Template variable validation
- File name sanitization

## Deployment Architecture

### Development
- React dev server (port 3000)
- Express server (port 5000)
- Concurrent development with `npm run dev`

### Production
- Client: Vercel deployment
- Server: Configurable via environment variables
- File storage: Temporary processing (auto-cleanup)

## API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pdf/process` | Add headers/footers |
| POST | `/api/pdf/watermark` | Add watermarks |
| POST | `/api/pdf/split` | Split PDFs |
| POST | `/api/pdf/merge` | Merge PDFs |
| POST | `/api/pdf/merge/preview` | Get merge preview |
| GET | `/api/pdf/templates` | Get available templates |
| GET | `/api/health` | Health check |

### Request/Response Format

**Merge Request**:
```javascript
// Form Data
{
  pdfs: [File, File, ...],           // Multiple PDF files
  mergeData: JSON.stringify({
    outputFileName: "merged.pdf",
    addBookmarks: false
  })
}
```

**Merge Response**:
```javascript
// Success: Binary PDF data with headers
Content-Type: application/pdf
Content-Disposition: attachment; filename="merged.pdf"
Content-Length: [file-size]

// Error: JSON response
{
  error: "PDF merge failed",
  details: "Specific error message"
}
```

## Monitoring and Debugging

### 1. Logging Strategy
- Operation-level logging with emojis for visibility
- Performance metrics (file sizes, processing times)
- Error categorization with context
- Debug file generation in development

### 2. Health Checks
- Service availability endpoint
- Uptime monitoring
- Resource usage tracking

### 3. Development Tools
- Debug PDF file generation
- Comprehensive console logging
- Size validation and warnings
- Performance timing

## Future Enhancements

### 1. Planned Features
- Bookmark/outline support for merged PDFs
- Password protection and encryption
- OCR text extraction
- Digital signature support

### 2. Performance Improvements
- Streaming PDF processing for very large files
- Worker thread utilization
- Progressive merge with real-time updates
- Memory optimization for batch operations

### 3. User Experience
- Real-time progress bars
- Drag-and-drop reordering
- Batch operations interface
- Preview thumbnails

## Troubleshooting Guide

### Common Issues

**1. PDF Won't Open After Merge**
- Cause: Compression corruption or invalid save options
- Solution: Disable compression (`compress: false`) and object streams
- Validation: Check debug files in server/temp/

**2. File Size Inflation**
- Cause: Browser blob size miscalculation
- Solution: Use ArrayBuffer.byteLength instead of blob.size
- Validation: Compare server Content-Length with client blob size

**3. Large File Timeout**
- Cause: Processing timeout on large files
- Solution: Increase timeout based on file size, use batch processing
- Prevention: Warn users about large files (>200MB)

**4. Memory Issues**
- Cause: Large files consuming too much memory
- Solution: Force garbage collection, process in smaller batches
- Monitoring: Watch server memory usage during operations

This architectural guide provides a comprehensive overview of the PDF Dost system, with particular focus on the critical PDF merge functionality and the solutions implemented to handle corruption and performance issues.
