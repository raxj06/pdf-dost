# PDF Dost - Complete Architecture Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Frontend Structure](#frontend-structure)
4. [Backend Structure](#backend-structure)
5. [File-by-File Breakdown](#file-by-file-breakdown)
6. [Data Flow](#data-flow)
7. [API Endpoints](#api-endpoints)
8. [Component Interaction](#component-interaction)
9. [Development Setup](#development-setup)
10. [Feature Implementation](#feature-implementation)

---

## 🎯 Project Overview

**PDF Dost** is a comprehensive web-based PDF processing application that provides three main features:
- **Header & Footer Editor**: Add customizable headers and footers to PDF documents
- **Watermark Tool**: Add text watermarks with positioning, rotation, and opacity controls
- **PDF Splitter**: Split PDF documents by pages, ranges, or every N pages

### Technology Stack
- **Frontend**: React.js with custom CSS
- **Backend**: Node.js with Express.js
- **PDF Processing**: pdf-lib library
- **File Upload**: Multer middleware
- **Archive Creation**: Archiver for ZIP files
- **Development**: Concurrently for running both server and client

---

## 🏗️ Architecture Overview

```
PDF Dost Application
├── Client (React - Port 3001)
│   ├── Components (UI Layer)
│   ├── API Calls (HTTP Requests)
│   └── File Handling (Upload/Download)
│
├── Server (Express - Port 5000)
│   ├── Routes (API Endpoints)
│   ├── Controllers (Business Logic)
│   ├── Services (PDF Processing)
│   ├── Middleware (File Upload)
│   └── Utils (Helper Functions)
│
└── File System
    ├── Uploads (Temporary PDF Storage)
    ├── Temp (Processing Workspace)
    └── Logs (Application Logs)
```

---

## 🎨 Frontend Structure

### Main Components Hierarchy

```
PDFEditor.js (Main Container)
├── HeaderFooterEditor.js (Header/Footer Feature)
├── WatermarkEditor.js (Watermark Feature)
└── SplitEditor.js (PDF Splitting Feature)
```

### Component Responsibilities

**PDFEditor.js** - Main container component that:
- Manages tab navigation between features
- Handles global state (file selection, processing status)
- Renders the appropriate editor component based on active tab
- Provides common UI elements (header, navigation, branding)

**HeaderFooterEditor.js** - Specialized component for header/footer editing:
- Manages header/footer form data and templates
- Handles file upload and validation
- Processes API calls to `/api/pdf/process`
- Downloads the processed PDF

**WatermarkEditor.js** - Dedicated watermark component:
- Manages watermark configuration (text, position, rotation, opacity)
- Provides real-time preview of watermark settings
- Processes API calls to `/api/pdf/watermark`
- Handles both single and batch watermarking

**SplitEditor.js** - PDF splitting interface:
- Manages three split types (every N pages, specific pages, ranges)
- Dynamic form fields based on split type
- Processes API calls to `/api/pdf/split`
- Handles ZIP download for multiple files

---

## ⚙️ Backend Structure

### Server Architecture

```
server/
├── index.js (Main Server File)
├── routes/
│   ├── index.js (Route Aggregator)
│   └── pdfRoutes.js (PDF-specific Routes)
├── controllers/
│   └── pdfController.js (Request Handlers)
├── services/
│   └── pdfService.js (PDF Processing Logic)
├── middleware/
│   └── upload.js (File Upload Configuration)
└── utils/
    ├── fileUtils.js (File System Helpers)
    └── logger.js (Logging Utilities)
```

### Backend Responsibilities

**index.js** - Main server configuration:
- Express app setup and middleware configuration
- CORS policy for client-server communication
- Static file serving and error handling
- Server startup and health check endpoint

**pdfRoutes.js** - API endpoint definitions:
- Route definitions for all PDF operations
- Middleware integration (upload, validation)
- Route-to-controller mapping

**pdfController.js** - Request/Response handling:
- HTTP request validation and parsing
- Service layer integration
- Response formatting and error handling
- File download and cleanup management

**pdfService.js** - Core PDF processing:
- PDF-lib integration for document manipulation
- Header/footer text positioning and styling
- Watermark application with transformations
- PDF splitting algorithms and logic

---

## 📁 File-by-File Breakdown

### Root Level Files

#### `package.json` (Root)
```json
{
  "name": "pdf-dost",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server/index.js",
    "client": "cd client && npm start"
  }
}
```
- **Purpose**: Main project configuration and script definitions
- **Key Scripts**: 
  - `npm run dev`: Starts both server and client concurrently
  - `npm run server`: Starts backend server with nodemon
  - `npm run client`: Starts React development server

#### `README.md`
- **Purpose**: Project documentation and setup instructions
- **Contains**: Installation steps, usage guide, feature descriptions

---

### Client Directory (`client/`)

#### `client/package.json`
```json
{
  "name": "client",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  }
}
```
- **Purpose**: Client-side dependencies and build configuration
- **Key Dependencies**: React for UI, react-scripts for development server

#### `client/public/index.html`
```html
<div id="root"></div>
```
- **Purpose**: HTML template for React application
- **Contains**: Root div element where React app mounts

#### `client/src/index.js`
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```
- **Purpose**: React application entry point
- **Function**: Mounts the main App component to DOM

#### `client/src/App.js`
```javascript
import PDFEditor from './components/PDFEditor';

function App() {
  return <PDFEditor />;
}
```
- **Purpose**: Main application component
- **Function**: Renders the PDFEditor component

#### `client/src/components/PDFEditor.js`
**State Management:**
```javascript
const [activeTab, setActiveTab] = useState('header-footer');
const [selectedFile, setSelectedFile] = useState(null);
const [isProcessing, setIsProcessing] = useState(false);
```
- **Purpose**: Main container component with tab navigation
- **Key Features**:
  - Tab switching between Header/Footer, Watermark, and Split PDF
  - Global file selection state management
  - Processing status indicator
  - Responsive navigation header

**Tab Navigation Logic:**
```javascript
{activeTab === 'header-footer' ? (
  <HeaderFooterEditor />
) : activeTab === 'watermark' ? (
  <WatermarkEditor />
) : activeTab === 'split' ? (
  <SplitEditor />
) : null}
```

#### `client/src/components/WatermarkEditor.js`
**Watermark Configuration:**
```javascript
const [watermarkData, setWatermarkData] = useState({
  text: 'CONFIDENTIAL',
  position: 'center',
  rotation: 45,
  opacity: 0.3,
  fontSize: 48,
  color: '#FF0000'
});
```
- **Purpose**: Dedicated watermark editing interface
- **Key Features**:
  - Real-time watermark preview
  - Position selection (9 positions + custom coordinates)
  - Rotation and opacity controls
  - Font size and color customization
  - Batch processing capability

#### `client/src/components/SplitEditor.js`
**Split Configuration:**
```javascript
const [splitData, setSplitData] = useState({
  splitType: 'every',
  pages: '',
  ranges: [{ start: '', end: '' }],
  everyNPages: 1,
  fileName: 'document'
});
```
- **Purpose**: PDF splitting interface with multiple split types
- **Key Features**:
  - Three split modes: every N pages, specific pages, page ranges
  - Dynamic form fields based on selected split type
  - Range management (add/remove ranges)
  - ZIP file handling for multiple outputs

#### `client/src/components/PDFEditor.css`
- **Purpose**: Comprehensive styling for all components
- **Key Features**:
  - Gradient backgrounds and modern UI design
  - Responsive grid layouts
  - Interactive button states and animations
  - Tab navigation styling
  - Form control styling (inputs, dropdowns, buttons)
  - Mobile-responsive breakpoints

---

### Server Directory (`server/`)

#### `server/package.json`
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "pdf-lib": "^1.17.1",
    "archiver": "^6.0.1"
  }
}
```
- **Purpose**: Server-side dependencies
- **Key Dependencies**:
  - Express: Web framework
  - CORS: Cross-origin request handling
  - Multer: File upload middleware
  - pdf-lib: PDF manipulation
  - Archiver: ZIP file creation

#### `server/index.js`
**Server Configuration:**
```javascript
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000']
}));
app.use('/api', routes);
```
- **Purpose**: Main server setup and configuration
- **Key Features**:
  - Express application initialization
  - CORS configuration for client communication
  - Route mounting and middleware setup
  - Directory creation for uploads/temp/logs
  - Error handling and logging

#### `server/routes/index.js`
```javascript
const express = require('express');
const pdfRoutes = require('./pdfRoutes');

const router = express.Router();
router.use('/pdf', pdfRoutes);
```
- **Purpose**: Route aggregator and organization
- **Function**: Mounts PDF routes under `/api/pdf` prefix

#### `server/routes/pdfRoutes.js`
**Route Definitions:**
```javascript
router.post('/process', upload.single('pdf'), pdfController.processPDF);
router.post('/watermark', upload.single('pdf'), pdfController.addWatermark);
router.post('/split', upload.single('pdf'), pdfController.splitPDF);
router.get('/watermark/options', pdfController.getWatermarkOptions);
```
- **Purpose**: PDF-specific route definitions
- **Routes**:
  - `POST /process`: Header/footer processing
  - `POST /watermark`: Watermark application
  - `POST /split`: PDF splitting
  - `GET /watermark/options`: Watermark configuration options

#### `server/controllers/pdfController.js`
**Controller Structure:**
```javascript
const processPDF = async (req, res) => {
  try {
    const { file } = req;
    const headerFooterData = JSON.parse(req.body.headerFooterData);
    
    const result = await pdfService.addHeaderFooterToPDF(file.buffer, headerFooterData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="processed.pdf"');
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```
- **Purpose**: Request handling and response management
- **Functions**:
  - `processPDF`: Handles header/footer requests
  - `addWatermark`: Processes watermark requests
  - `splitPDF`: Manages PDF splitting with ZIP creation
  - `getWatermarkOptions`: Returns available watermark positions

#### `server/services/pdfService.js`
**PDF Processing Core:**
```javascript
const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

const addHeaderFooterToPDF = async (pdfBuffer, headerFooterData) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  pages.forEach((page, index) => {
    // Header/footer processing logic
  });
  
  return await pdfDoc.save();
};
```
- **Purpose**: Core PDF manipulation logic
- **Key Functions**:
  - `addHeaderFooterToPDF`: Text positioning and template processing
  - `addWatermarkToPDF`: Watermark application with transformations
  - `splitPDF`: Document splitting algorithms for different split types

**Splitting Logic:**
```javascript
const splitPDF = async (pdfBuffer, splitData) => {
  switch (splitData.splitType) {
    case 'every':
      // Split every N pages
    case 'pages':
      // Extract specific pages
    case 'ranges':
      // Split by page ranges
  }
};
```

#### `server/middleware/upload.js`
```javascript
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});
```
- **Purpose**: File upload configuration and validation
- **Features**:
  - Memory storage for temporary file handling
  - PDF file type validation
  - File size limits and error handling

#### `server/utils/fileUtils.js`
```javascript
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
```
- **Purpose**: File system utility functions
- **Functions**: Directory creation, file cleanup, path validation

#### `server/utils/logger.js`
```javascript
const logInfo = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`✅ [SUCCESS] ${timestamp} - ${message}`);
};
```
- **Purpose**: Centralized logging utilities
- **Features**: Structured logging with timestamps and log levels

---

## 🔄 Data Flow

### Header/Footer Processing Flow
```
1. User uploads PDF in HeaderFooterEditor
2. Form data collected (header/footer text, styling options)
3. POST request to /api/pdf/process with FormData
4. pdfController.processPDF receives request
5. pdfService.addHeaderFooterToPDF processes PDF
6. PDF-lib adds text to each page with positioning
7. Processed PDF returned as downloadable file
```

### Watermark Processing Flow
```
1. User configures watermark in WatermarkEditor
2. Watermark settings (text, position, rotation, opacity)
3. POST request to /api/pdf/watermark
4. pdfController.addWatermark handles request
5. pdfService.addWatermarkToPDF applies watermark
6. PDF-lib transforms and positions watermark text
7. Watermarked PDF downloaded by client
```

### PDF Splitting Flow
```
1. User selects split type and configuration in SplitEditor
2. Split data validation (pages, ranges, or every N pages)
3. POST request to /api/pdf/split
4. pdfController.splitPDF processes request
5. pdfService.splitPDF creates multiple PDFs based on type
6. If multiple files: archiver creates ZIP file
7. Single PDF or ZIP file downloaded by client
```

---

## 🛠️ API Endpoints

### Base URL: `http://localhost:5000/api`

#### `POST /pdf/process`
- **Purpose**: Add headers and footers to PDF
- **Request**: `multipart/form-data`
  - `pdf`: PDF file
  - `headerFooterData`: JSON string with header/footer configuration
- **Response**: Processed PDF file
- **Example Request Body**:
```json
{
  "leftHeader": "Document Title",
  "rightHeader": "Page (x) of (y)",
  "leftFooter": "Confidential",
  "rightFooter": "Date: 2025-01-26",
  "fontSize": 12,
  "textColor": "#000000",
  "startPage": 1
}
```

#### `POST /pdf/watermark`
- **Purpose**: Add watermark to PDF
- **Request**: `multipart/form-data`
  - `pdf`: PDF file
  - `watermarkData`: JSON string with watermark configuration
- **Response**: Watermarked PDF file
- **Example Request Body**:
```json
{
  "text": "CONFIDENTIAL",
  "position": "center",
  "rotation": 45,
  "opacity": 0.3,
  "fontSize": 48,
  "color": "#FF0000"
}
```

#### `POST /pdf/split`
- **Purpose**: Split PDF into multiple files
- **Request**: `multipart/form-data`
  - `pdf`: PDF file
  - `splitData`: JSON string with split configuration
- **Response**: Single PDF or ZIP file containing multiple PDFs
- **Example Request Bodies**:

**Split Every N Pages:**
```json
{
  "splitType": "every",
  "everyNPages": 2,
  "fileName": "document"
}
```

**Extract Specific Pages:**
```json
{
  "splitType": "pages",
  "pages": [1, 3, 5, 7],
  "fileName": "pages"
}
```

**Split by Ranges:**
```json
{
  "splitType": "ranges",
  "ranges": [
    {"start": 1, "end": 5},
    {"start": 10, "end": 15}
  ],
  "fileName": "sections"
}
```

#### `GET /pdf/watermark/options`
- **Purpose**: Get available watermark positions
- **Response**: JSON array of position options
```json
{
  "positions": [
    {"value": "top-left", "label": "Top Left"},
    {"value": "top-center", "label": "Top Center"},
    {"value": "top-right", "label": "Top Right"},
    {"value": "middle-left", "label": "Middle Left"},
    {"value": "center", "label": "Center"},
    {"value": "middle-right", "label": "Middle Right"},
    {"value": "bottom-left", "label": "Bottom Left"},
    {"value": "bottom-center", "label": "Bottom Center"},
    {"value": "bottom-right", "label": "Bottom Right"}
  ]
}
```

---

## 🔗 Component Interaction

### State Management Flow
```
PDFEditor (Main State)
├── selectedFile: Shared across all editors
├── isProcessing: Global processing indicator
└── activeTab: Controls which editor is visible

Individual Editors (Local State)
├── HeaderFooterEditor: headerFooterData, templates
├── WatermarkEditor: watermarkData, positions
└── SplitEditor: splitData, ranges
```

### File Upload Handling
```
1. User selects/drops file in any editor
2. File validation (PDF type, size checks)
3. File stored in component state
4. Upload area updates to show selected file
5. Process button becomes enabled
```

### Processing Workflow
```
1. User clicks process button
2. isProcessing state set to true
3. FormData created with file and configuration
4. HTTP request sent to appropriate endpoint
5. Response handled:
   - Success: File download triggered
   - Error: Error message displayed
6. isProcessing state reset to false
```

---

## 🚀 Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation Steps
```bash
# 1. Clone the repository
git clone <repository-url>
cd pdf-dost

# 2. Install root dependencies
npm install

# 3. Install client dependencies
cd client
npm install
cd ..

# 4. Install server dependencies
cd server
npm install
cd ..

# 5. Start development servers
npm run dev
```

### Development Commands
```bash
# Start both client and server
npm run dev

# Start only server (port 5000)
npm run server

# Start only client (port 3001)
npm run client

# Build client for production
cd client && npm run build
```

### Environment Variables
Create `.env` file in client directory:
```
REACT_APP_API_URL=http://localhost:5000
```

---

## ⚡ Feature Implementation

### Adding New PDF Features

#### 1. Backend Implementation
```javascript
// 1. Add method to pdfService.js
const newFeaturePDF = async (pdfBuffer, featureData) => {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  // Feature implementation logic
  return await pdfDoc.save();
};

// 2. Add controller method to pdfController.js
const newFeature = async (req, res) => {
  try {
    const result = await pdfService.newFeaturePDF(req.file.buffer, req.body.featureData);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Add route to pdfRoutes.js
router.post('/new-feature', upload.single('pdf'), pdfController.newFeature);
```

#### 2. Frontend Implementation
```javascript
// 1. Create new editor component
const NewFeatureEditor = () => {
  const [featureData, setFeatureData] = useState({});
  
  const handleProcess = async () => {
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('featureData', JSON.stringify(featureData));
    
    const response = await fetch('/api/pdf/new-feature', {
      method: 'POST',
      body: formData
    });
    // Handle response
  };
  
  return (
    // Component JSX
  );
};

// 2. Add to PDFEditor.js navigation
<button 
  className={`nav-btn ${activeTab === 'new-feature' ? 'active' : ''}`}
  onClick={() => setActiveTab('new-feature')}
>
  New Feature
</button>

// 3. Add to component rendering
{activeTab === 'new-feature' ? (
  <NewFeatureEditor />
) : /* other tabs */}
```

### Error Handling Patterns

#### Backend Error Handling
```javascript
try {
  // Processing logic
  const result = await pdfService.processFunction(data);
  res.send(result);
} catch (error) {
  console.error('Processing error:', error);
  res.status(500).json({ 
    error: error.message || 'Processing failed',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

#### Frontend Error Handling
```javascript
try {
  const response = await fetch(endpoint, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  // Handle success
} catch (error) {
  console.error('Request error:', error);
  alert(`Error: ${error.message}`);
} finally {
  setIsProcessing(false);
}
```

---

## 📝 Summary

The PDF Dost application is a full-stack web application built with React and Express.js that provides comprehensive PDF processing capabilities. The architecture follows a clear separation of concerns with:

- **Frontend**: React components handling user interaction and API communication
- **Backend**: Express server with specialized services for PDF manipulation
- **PDF Processing**: pdf-lib library for document manipulation
- **File Handling**: Multer for uploads, archiver for ZIP creation

Each feature (Header/Footer, Watermark, Split) is implemented as a self-contained module with its own UI component, API endpoint, and processing logic, making the application highly maintainable and extensible.

The application uses modern web development practices including:
- Component-based architecture
- RESTful API design
- Responsive UI design
- Error handling and validation
- Development tooling (nodemon, concurrently)

This documentation serves as a complete reference for understanding, maintaining, and extending the PDF Dost application.
