const multer = require('multer');

/**
 * File Upload Middleware Configuration
 * Handles PDF file uploads with validation
 */

// Configure memory storage for file uploads
const storage = multer.memoryStorage();

// File filter to allow only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Configure multer with storage and file filter
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB limit for large PDFs
    files: 10, // Maximum 10 files for merge operations
    fieldSize: 1024 * 1024 // 1MB for other fields
  }
});

/**
 * Error handling middleware for multer
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large', 
        details: 'Maximum file size is 250MB per file. For very large files, consider splitting them first.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files', 
        details: 'Maximum 10 files allowed for merge operations' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected file field', 
        details: 'Invalid file upload field' 
      });
    }
    return res.status(400).json({ 
      error: 'Upload error', 
      details: error.message 
    });
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ 
      error: 'Invalid file type', 
      details: 'Only PDF files are allowed' 
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  handleUploadError
};
