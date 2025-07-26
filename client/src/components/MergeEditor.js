import React, { useState, useRef } from 'react';
import './PDFEditor.css';

const MergeEditor = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergeData, setMergeData] = useState({
    outputFileName: 'merged-document.pdf',
    addBookmarks: false
  });
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      alert('Please select only PDF files');
    }
    
    // Check individual file sizes and warn about large files
    const largeFiles = pdfFiles.filter(file => file.size > 50 * 1024 * 1024); // 50MB
    const veryLargeFiles = pdfFiles.filter(file => file.size > 200 * 1024 * 1024); // 200MB
    
    if (veryLargeFiles.length > 0) {
      const fileNames = veryLargeFiles.map(f => f.name).join(', ');
      const confirmMsg = `Warning: Very large files detected (${fileNames}). ` +
        `Files over 200MB may take a long time to process or fail. ` +
        `Consider splitting large files first. Continue anyway?`;
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    } else if (largeFiles.length > 0) {
      const fileNames = largeFiles.map(f => f.name).join(', ');
      alert(`Notice: Large files detected (${fileNames}). Processing may take longer than usual.`);
    }
    
    // Check total size
    const totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    if (totalSizeMB > 400) {
      const confirmMsg = `Warning: Total file size is ${totalSizeMB.toFixed(1)}MB. ` +
        `Very large merges may fail or take a long time. Continue anyway?`;
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    
    if (pdfFiles.length > 0) {
      setSelectedFiles(pdfFiles);
      generatePreview(pdfFiles);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      alert('Please drop only PDF files');
    }
    
    // Same size checks as handleFileUpload
    const largeFiles = pdfFiles.filter(file => file.size > 50 * 1024 * 1024);
    const veryLargeFiles = pdfFiles.filter(file => file.size > 200 * 1024 * 1024);
    
    if (veryLargeFiles.length > 0) {
      const fileNames = veryLargeFiles.map(f => f.name).join(', ');
      const confirmMsg = `Warning: Very large files detected (${fileNames}). ` +
        `Files over 200MB may take a long time to process or fail. ` +
        `Consider splitting large files first. Continue anyway?`;
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    } else if (largeFiles.length > 0) {
      const fileNames = largeFiles.map(f => f.name).join(', ');
      alert(`Notice: Large files detected (${fileNames}). Processing may take longer than usual.`);
    }
    
    const totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    if (totalSizeMB > 400) {
      const confirmMsg = `Warning: Total file size is ${totalSizeMB.toFixed(1)}MB. ` +
        `Very large merges may fail or take a long time. Continue anyway?`;
      
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    
    if (pdfFiles.length > 0) {
      setSelectedFiles(pdfFiles);
      generatePreview(pdfFiles);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const generatePreview = async (files) => {
    if (files.length < 2) {
      setPreviewData(null);
      return;
    }

    setIsLoadingPreview(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('pdfs', file);
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/merge/preview`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const preview = await response.json();
        setPreviewData(preview);
      } else {
        console.error('Failed to generate preview');
        setPreviewData(null);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleInputChange = (field, value) => {
    setMergeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length >= 2) {
      generatePreview(newFiles);
    } else {
      setPreviewData(null);
    }
  };

  const moveFile = (fromIndex, toIndex) => {
    const newFiles = [...selectedFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setSelectedFiles(newFiles);
    generatePreview(newFiles);
  };

  const handleMergePDF = async () => {
    if (selectedFiles.length < 2) {
      alert('Please select at least 2 PDF files to merge');
      return;
    }

    // Check for very large files one more time
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    if (totalSizeMB > 500) {
      alert(`Error: Total file size (${totalSizeMB.toFixed(1)}MB) exceeds the 500MB limit. Please reduce the file sizes or split large files first.`);
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('pdfs', file);
      });
      formData.append('mergeData', JSON.stringify(mergeData));

      console.log('Sending merge request with files:', selectedFiles.map(f => f.name));
      console.log(`Total size: ${totalSizeMB.toFixed(2)}MB`);

      // Set a longer timeout for large files
      const timeoutMs = Math.max(60000, totalSizeMB * 2000); // 2 seconds per MB, minimum 1 minute
      console.log(`Setting timeout to ${timeoutMs/1000} seconds`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/merge`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Log response headers for debugging
        console.log('Response headers:');
        response.headers.forEach((value, key) => {
          console.log(`  ${key}: ${value}`);
        });
        
        const contentLength = response.headers.get('content-length');
        console.log(`Server reported content-length: ${contentLength} bytes`);
        
        const blob = await response.blob();
        
        // Get true file size using ArrayBuffer as blob.size can be unreliable
        const arrayBuffer = await blob.arrayBuffer();
        const trueSizeBytes = arrayBuffer.byteLength;
        const trueSizeMB = trueSizeBytes / (1024 * 1024);
        
        console.log(`Frontend blob.size: ${blob.size} bytes (${(blob.size / (1024 * 1024)).toFixed(2)}MB)`);
        console.log(`True ArrayBuffer size: ${trueSizeBytes} bytes (${trueSizeMB.toFixed(2)}MB)`);
        console.log(`Server content-length: ${contentLength} bytes (${contentLength ? (contentLength / (1024 * 1024)).toFixed(2) : 'unknown'}MB)`);
        
        // Use the most reliable size measurement
        let actualSizeMB = trueSizeMB;
        
        // If there's a significant difference between blob.size and ArrayBuffer size, warn the user
        if (Math.abs(blob.size - trueSizeBytes) > 1000) {
          console.warn(`⚠️  Blob size inconsistency! blob.size: ${blob.size}, ArrayBuffer: ${trueSizeBytes}`);
        }
        
        // Use server-reported size if available and significantly different
        if (contentLength && Math.abs(trueSizeBytes - parseInt(contentLength)) > 1000) {
          console.warn(`⚠️  Size mismatch with server! ArrayBuffer: ${trueSizeBytes}, Server: ${contentLength}`);
          // In this case, trust the server size as it's the source of truth
          actualSizeMB = parseInt(contentLength) / (1024 * 1024);
        }
        
        // Check if the downloaded file is unexpectedly large
        const expectedSizeMB = previewData ? previewData.estimatedOutputSize / (1024 * 1024) : totalSizeMB;
        if (actualSizeMB > expectedSizeMB * 3) {
          const proceed = window.confirm(
            `Warning: The merged file is ${actualSizeMB.toFixed(2)}MB, which is much larger than expected (${expectedSizeMB.toFixed(2)}MB). ` +
            `This may indicate an issue with the merge. The file might not open properly. ` +
            `Download anyway?`
          );
          if (!proceed) {
            return;
          }
        }
        
        // Create a new blob from the ArrayBuffer to ensure data integrity
        const correctedBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(correctedBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = mergeData.outputFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`✅ Download completed: ${mergeData.outputFileName} (${trueSizeMB.toFixed(2)}MB)`);
      } else {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        try {
          const error = JSON.parse(errorText);
          let errorMessage = error.error || error.message || 'Unknown error';
          
          // Provide specific guidance for common errors
          if (errorMessage.includes('timeout')) {
            errorMessage += '\n\nSuggestion: Try splitting large files into smaller parts first.';
          } else if (errorMessage.includes('too large') || errorMessage.includes('exceeds')) {
            errorMessage += '\n\nSuggestion: Reduce file sizes or merge fewer files at once.';
          } else if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupted')) {
            errorMessage += '\n\nSuggestion: Check that all files are valid PDF documents.';
          }
          
          alert(`Error: ${errorMessage}`);
        } catch {
          alert(`Error: ${response.status} - ${response.statusText}\n\nThe files may be too large or complex to process.`);
        }
      }
    } catch (error) {
      console.error('Error merging PDFs:', error);
      let errorMessage = 'Failed to merge PDFs. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = `Merge operation timed out. The files may be too large or complex.\n\nSuggestions:\n- Split large files into smaller parts\n- Try merging fewer files at once\n- Check that all files are valid PDFs`;
      } else if (error.message) {
        errorMessage = `Failed to merge PDFs: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="editor-container">
      <div className="page-icon">🔗</div>
      <h1 className="page-title">PDF Merge Tool</h1>
      
      {/* File Upload */}
      <div 
        className="file-upload-area"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          {selectedFiles.length > 0 
            ? `${selectedFiles.length} PDF file(s) selected` 
            : 'Choose Multiple PDF Files'
          }
        </div>
        <small>Select multiple PDF files to merge them into one document</small>
        <small style={{color: '#ffa500', display: 'block', marginTop: '0.5rem'}}>
          💡 Maximum file size: 250MB per file, 500MB total
        </small>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="section">
          <h2 className="section-title">Selected Files (Merge Order)</h2>
          <div className="file-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <div className="file-actions">
                  {index > 0 && (
                    <button 
                      className="move-btn"
                      onClick={() => moveFile(index, index - 1)}
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < selectedFiles.length - 1 && (
                    <button 
                      className="move-btn"
                      onClick={() => moveFile(index, index + 1)}
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  <button 
                    className="remove-btn"
                    onClick={() => removeFile(index)}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Options */}
      {selectedFiles.length >= 2 && (
        <div className="section">
          <h2 className="section-title">Merge Options</h2>
          
          <div className="merge-options">
            <div className="option-group">
              <label>Output Filename:</label>
              <input
                type="text"
                placeholder="merged-document.pdf"
                value={mergeData.outputFileName}
                onChange={(e) => handleInputChange('outputFileName', e.target.value)}
                className="text-input"
              />
              <small>Name for the merged PDF file</small>
            </div>

            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={mergeData.addBookmarks}
                  onChange={(e) => handleInputChange('addBookmarks', e.target.checked)}
                />
                <span className="checkmark"></span>
                Add bookmarks for each file (when supported)
              </label>
              <small>Creates navigation bookmarks in the merged PDF</small>
            </div>
          </div>
        </div>
      )}

      {/* Preview Information */}
      {isLoadingPreview && (
        <div className="section">
          <h2 className="section-title">Loading Preview...</h2>
          <div className="loading-spinner">🔄</div>
        </div>
      )}

      {previewData && (
        <div className="section">
          <h2 className="section-title">Merge Preview</h2>
          <div className="preview-info">
            <div className="preview-grid">
              <div className="preview-item">
                <strong>Total Files:</strong> {previewData.fileCount}
              </div>
              <div className="preview-item">
                <strong>Total Pages:</strong> {previewData.totalPages}
              </div>
              <div className="preview-item">
                <strong>Estimated Size:</strong> {formatFileSize(previewData.estimatedOutputSize)}
              </div>
            </div>
            
            <div className="file-breakdown">
              <h3>File Breakdown:</h3>
              {previewData.files.map((file, index) => (
                <div key={index} className="breakdown-item">
                  <span className="breakdown-name">{file.name}</span>
                  <span className="breakdown-pages">{file.pageCount} pages</span>
                  <span className="breakdown-size">{formatFileSize(file.size)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {selectedFiles.length < 2 && (
        <div className="section">
          <h2 className="section-title">How to Merge PDFs</h2>
          <div className="instructions">
            <ol>
              <li>Select 2 or more PDF files using the file picker above</li>
              <li>Arrange the files in your desired merge order using the arrow buttons</li>
              <li>Configure output options (filename, bookmarks)</li>
              <li>Click "Merge PDFs" to download the combined document</li>
            </ol>
          </div>
        </div>
      )}

      {/* Merge Button */}
      <button 
        className="process-btn"
        onClick={handleMergePDF}
        disabled={selectedFiles.length < 2 || isProcessing}
      >
        {isProcessing ? 'Merging...' : `Merge ${selectedFiles.length} PDFs`}
      </button>
    </div>
  );
};

export default MergeEditor;
