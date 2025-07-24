# PDF Dost - Backend API

A well-organized Node.js backend for the PDF Dost header and footer editor application.

## 📁 Project Structure

```
server/
├── controllers/           # Request handlers and business logic
│   └── pdfController.js  # PDF processing controller
├── middleware/           # Custom middleware functions
│   └── upload.js        # File upload middleware
├── routes/              # API route definitions
│   ├── index.js        # Main route entry point
│   └── pdfRoutes.js    # PDF-specific routes
├── services/           # Business logic and external services
│   └── pdfService.js   # PDF manipulation service
├── utils/              # Utility functions and helpers
│   ├── fileUtils.js    # File system utilities
│   └── logger.js       # Logging utility
├── uploads/            # Temporary file uploads (auto-created)
├── temp/              # Temporary processing files (auto-created)
├── logs/              # Application logs (auto-created)
├── .env               # Environment variables
└── index.js           # Main application entry point
```

## 🚀 API Endpoints

### Base URL: `http://localhost:5000/api`

#### PDF Processing
- **POST** `/pdf/process` - Process PDF with headers and footers
- **GET** `/pdf/templates` - Get available template options
- **GET** `/pdf/health` - PDF service health check

#### General
- **GET** `/` - API information and status
- **GET** `/health` - General health check

## 📋 API Documentation

### Process PDF
**Endpoint:** `POST /api/pdf/process`

**Description:** Adds headers and footers to a PDF file

**Request:**
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `pdf` (file): PDF file to process
  - `headerFooterData` (JSON string): Configuration object

**headerFooterData Format:**
```json
{
  "leftHeader": "Document Title",
  "middleHeader": "Page (x) of (y)",
  "rightHeader": "Date",
  "leftFooter": "Company Name",
  "middleFooter": "",
  "rightFooter": "(x)",
  "startPage": 1,
  "coverWithWhite": false,
  "textColor": "#000000",
  "fontSize": 12
}
```

**Response:**
- **Success:** PDF file download
- **Error:** JSON with error details

### Get Templates
**Endpoint:** `GET /api/pdf/templates`

**Description:** Returns available header/footer templates

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "value": "page-x-of-y",
      "label": "Page (x) of (y)",
      "description": "Shows page number with total pages"
    }
  ]
}
```

## 🛠️ Components Overview

### Controllers
**Location:** `controllers/`

Controllers handle HTTP requests and responses. They coordinate between routes and services.

- `pdfController.js` - Handles PDF processing requests, validates input, and manages responses

### Services
**Location:** `services/`

Services contain the core business logic and are reusable across different controllers.

- `pdfService.js` - PDF manipulation using pdf-lib, template processing, text positioning

### Middleware
**Location:** `middleware/`

Custom middleware functions for request processing.

- `upload.js` - Handles file uploads with validation and error handling

### Routes
**Location:** `routes/`

Route definitions and organization.

- `index.js` - Main router with general endpoints
- `pdfRoutes.js` - PDF-specific route definitions

### Utils
**Location:** `utils/`

Utility functions and helpers.

- `fileUtils.js` - File system operations, directory management
- `logger.js` - Colored console logging with different levels

## 🔧 Key Features

### PDF Processing
- **Template Variables:** Automatic replacement of placeholders like `(x)`, `(y)`, `(file)`
- **Positioning:** Left, center, and right alignment for headers and footers
- **Styling:** Custom colors and font sizes
- **Page Range:** Start from specific page number
- **Background:** Optional white background overlay

### Error Handling
- **Comprehensive:** Detailed error messages and proper HTTP status codes
- **Validation:** Input validation for files and data
- **Graceful:** Graceful shutdown handling

### Logging
- **Colored Output:** Different colors for different log levels
- **Timestamps:** ISO timestamps for all log entries
- **Request Logging:** Automatic logging of all API requests
- **Startup Banner:** Formatted server startup information

### File Management
- **Auto-creation:** Automatic directory creation for uploads, temp, and logs
- **Memory Storage:** Files processed in memory for better performance
- **Size Limits:** Configurable file size limits (50MB default)

## 🚦 Running the Server

### Development
```bash
npm run server
```

### Production
```bash
npm start
```

## 🔒 Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 📝 Logging Levels

The logger supports different levels with color coding:

- **INFO** (Blue) - General information
- **SUCCESS** (Green) - Successful operations
- **WARN** (Yellow) - Warnings
- **ERROR** (Red) - Error messages with stack traces
- **DEBUG** (Magenta) - Debug information (development only)

## 🔄 Request Flow

1. **Request** → Middleware (CORS, JSON parsing, logging)
2. **Routing** → Route handler identifies endpoint
3. **Upload** → File upload middleware processes PDF
4. **Controller** → Validates request and coordinates processing
5. **Service** → Performs PDF manipulation
6. **Response** → Sends processed PDF or error response

## 🎯 Benefits of This Structure

- **Separation of Concerns:** Each component has a specific responsibility
- **Maintainability:** Easy to update and extend functionality
- **Testability:** Components can be tested in isolation
- **Reusability:** Services and utilities can be reused
- **Scalability:** Easy to add new features and endpoints
- **Error Handling:** Centralized error management
- **Logging:** Comprehensive logging for debugging and monitoring
