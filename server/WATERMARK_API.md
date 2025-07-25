# PDF Watermark API Documentation

## Overview
The PDF Watermark API allows you to add customizable watermarks to PDF documents. This feature is part of the PDF Dost application.

## Endpoints

### 1. Add Watermark to PDF
**POST** `/api/pdf/watermark`

Add a text watermark to a PDF document.

#### Request
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `pdf` (file): PDF file to watermark (required)
  - `watermarkData` (string): JSON string containing watermark configuration

#### Watermark Configuration Options
```json
{
  "text": "CONFIDENTIAL",           // Watermark text (default: "CONFIDENTIAL")
  "fontSize": 48,                 // Font size (12-100, default: 48)
  "opacity": 0.3,                 // Opacity (0.1-1.0, default: 0.3)
  "color": "#808080",             // Hex color code (default: "#808080")
  "rotation": 45,                 // Rotation angle in degrees (-90 to 90, default: 45)
  "position": "center",           // Position on page (default: "center")
  "startPage": 1,                 // First page to watermark (default: 1)
  "endPage": 10                   // Last page to watermark (default: all pages)
}
```

#### Position Options
- `center`: Center of the page
- `top-left`: Top-left corner
- `top-right`: Top-right corner
- `bottom-left`: Bottom-left corner
- `bottom-right`: Bottom-right corner

#### Response
- **Success**: PDF file download with watermark applied
- **Error**: JSON error message

#### Example Request (JavaScript)
```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('watermarkData', JSON.stringify({
  text: 'DRAFT',
  fontSize: 40,
  opacity: 0.4,
  color: '#FF0000',
  rotation: 30,
  position: 'center',
  startPage: 1,
  endPage: 5
}));

const response = await fetch('/api/pdf/watermark', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const blob = await response.blob();
  // Download or display the watermarked PDF
}
```

### 2. Get Watermark Options
**GET** `/api/pdf/watermark/options`

Retrieve available watermark configuration options and defaults.

#### Response
```json
{
  "success": true,
  "options": {
    "positions": [
      {
        "value": "center",
        "label": "Center",
        "description": "Watermark appears in the center of the page"
      }
      // ... other positions
    ],
    "defaultSettings": {
      "text": "CONFIDENTIAL",
      "fontSize": 48,
      "opacity": 0.3,
      "color": "#808080",
      "rotation": 45,
      "position": "center",
      "startPage": 1
    },
    "fontSizeRange": { "min": 12, "max": 100 },
    "opacityRange": { "min": 0.1, "max": 1.0 },
    "rotationRange": { "min": -90, "max": 90 }
  }
}
```

## Usage Examples

### Basic Watermark
Add a simple "CONFIDENTIAL" watermark to all pages:
```json
{
  "text": "CONFIDENTIAL"
}
```

### Custom Watermark
Add a red "DRAFT" watermark to pages 1-3:
```json
{
  "text": "DRAFT",
  "fontSize": 60,
  "opacity": 0.5,
  "color": "#FF0000",
  "rotation": 45,
  "position": "center",
  "startPage": 1,
  "endPage": 3
}
```

### Corner Watermark
Add a small watermark in the top-right corner:
```json
{
  "text": "INTERNAL USE",
  "fontSize": 24,
  "opacity": 0.7,
  "color": "#000000",
  "rotation": 0,
  "position": "top-right"
}
```

## Error Handling

Common error responses:
- `400`: No PDF file uploaded or invalid watermark data
- `500`: PDF processing failed

Example error response:
```json
{
  "error": "Failed to add watermark to PDF",
  "details": "Invalid color format"
}
```

## Notes
- Watermarks are applied as text overlays on the PDF pages
- The watermark text is rendered with the specified opacity and rotation
- Position calculations automatically adjust for text width and height
- All pages in the specified range will receive the watermark
- Original PDF content is preserved underneath the watermark
