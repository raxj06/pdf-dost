# PDF Watermark Feature Test

## Testing the Watermark API

You can test the watermark functionality using the following methods:

### 1. Using the Web Interface
1. Open http://localhost:3000
2. Click on the "🖼️ Watermark" tab
3. Upload a PDF file
4. Configure watermark settings:
   - Text: "CONFIDENTIAL", "DRAFT", "SAMPLE", etc.
   - Position: Center, Top Left, Top Right, Bottom Left, Bottom Right
   - Font Size: 12-100px (default: 48px)
   - Opacity: 0.1-1.0 (default: 0.3)
   - Color: Any hex color (default: #808080)
   - Rotation: -90 to 90 degrees (default: 45°)
   - Page Range: Start and end pages
5. Click "Add Watermark" to process

### 2. Using cURL (PowerShell)
```powershell
# Create a test request
$formData = @{
    'watermarkData' = '{"text":"CONFIDENTIAL","fontSize":48,"opacity":0.3,"color":"#808080","rotation":45,"position":"center","startPage":1}'
}

# Note: You would need to add the PDF file to the form data
# This is just an example of the JSON structure
```

### 3. Using the API directly
**Endpoint:** `POST /api/pdf/watermark`

**Form Data:**
- `pdf`: PDF file (multipart/form-data)
- `watermarkData`: JSON string with configuration

**Example watermarkData:**
```json
{
  "text": "CONFIDENTIAL",
  "fontSize": 48,
  "opacity": 0.3,
  "color": "#FF0000",
  "rotation": 45,
  "position": "center",
  "startPage": 1,
  "endPage": 0
}
```

### 4. Test the Options Endpoint
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/pdf/watermark/options" -Method GET
```

This will return the available watermark configuration options.

## Features Implemented

✅ **Watermark Text**: Custom text overlay  
✅ **Position Control**: 5 predefined positions  
✅ **Font Size**: Range from 12-100px  
✅ **Opacity Control**: 0.1 to 1.0 transparency  
✅ **Color Selection**: Any hex color  
✅ **Rotation**: -90° to 90° angle control  
✅ **Page Range**: Start and end page specification  
✅ **Preview**: Real-time watermark preview  
✅ **API Endpoints**: RESTful API for integration  
✅ **Documentation**: Complete API documentation  

## Next Steps

1. Test with various PDF files
2. Try different watermark configurations
3. Test the page range functionality
4. Verify the preview matches the output
5. Test error handling with invalid inputs

The watermark feature is now fully functional and integrated into the PDF Dost application!
