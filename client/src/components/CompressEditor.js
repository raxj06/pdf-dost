import React, { useState, useRef } from 'react';
import './PDFEditor.css';

const CompressEditor = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionData, setCompressionData] = useState({
    compressionLevel: 'medium',
    removeMetadata: true,
    optimizeImages: true,
    targetSizeKB: '',
    outputFileName: ''
  });
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [compressionResult, setCompressionResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 250) {
      alert('File size exceeds 250MB limit. Please select a smaller file.');
      return;
    }
    
    if (fileSizeMB > 50) {
      const proceed = window.confirm(
        `Large file detected (${fileSizeMB.toFixed(1)}MB). ` +
        `Compression may take longer than usual. Continue?`
      );
      if (!proceed) return;
    }
    
    setSelectedFile(file);
    setCompressionResult(null);
    generatePreview(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please drop a PDF file');
      return;
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 250) {
      alert('File size exceeds 250MB limit. Please select a smaller file.');
      return;
    }
    
    if (fileSizeMB > 50) {
      const proceed = window.confirm(
        `Large file detected (${fileSizeMB.toFixed(1)}MB). ` +
        `Compression may take longer than usual. Continue?`
      );
      if (!proceed) return;
    }
    
    setSelectedFile(file);
    setCompressionResult(null);
    generatePreview(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const generatePreview = async (file) => {
    setIsLoadingPreview(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/compress/preview`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const preview = await response.json();
        setPreviewData(preview);
        
        // Set default output filename
        if (!compressionData.outputFileName) {
          const fileName = file.name.replace(/\.pdf$/i, '');
          setCompressionData(prev => ({
            ...prev,
            outputFileName: `${fileName}-compressed.pdf`
          }));
        }
      } else {
        console.error('Failed to generate compression preview');
        setPreviewData(null);
      }
    } catch (error) {
      console.error('Error generating compression preview:', error);
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCompressionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setCompressionResult(null);
    setCompressionData(prev => ({
      ...prev,
      outputFileName: ''
    }));
  };

  const handleCompressPDF = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file to compress');
      return;
    }

    setIsProcessing(true);
    setCompressionResult(null);
    
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('compressionData', JSON.stringify(compressionData));

      console.log('Sending compression request for:', selectedFile.name);
      console.log('Compression settings:', compressionData);

      // Set timeout based on file size
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      const timeoutMs = Math.max(60000, fileSizeMB * 3000); // 3 seconds per MB, minimum 1 minute
      console.log(`Setting timeout to ${timeoutMs/1000} seconds`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/compress`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Get compression stats from headers
        const originalSize = parseInt(response.headers.get('X-Original-Size')) || selectedFile.size;
        const compressedSize = parseInt(response.headers.get('X-Compressed-Size'));
        const compressionRatio = response.headers.get('X-Compression-Ratio');
        
        const blob = await response.blob();
        
        // Get true file size using ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        const trueSizeBytes = arrayBuffer.byteLength;
        const trueSizeMB = trueSizeBytes / (1024 * 1024);
        
        console.log(`Compression completed: ${(originalSize / (1024 * 1024)).toFixed(2)}MB → ${trueSizeMB.toFixed(2)}MB`);
        
        // Store compression result
        setCompressionResult({
          originalSize,
          compressedSize: trueSizeBytes,
          compressionRatio: compressionRatio || ((originalSize - trueSizeBytes) / originalSize * 100).toFixed(1),
          sizeMB: trueSizeMB
        });
        
        // Create corrected blob for download
        const correctedBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(correctedBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = compressionData.outputFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`✅ Download completed: ${compressionData.outputFileName}`);
      } else {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        try {
          const error = JSON.parse(errorText);
          let errorMessage = error.error || error.message || 'Unknown error';
          
          if (errorMessage.includes('timeout')) {
            errorMessage += '\\n\\nSuggestion: Try using a lower compression level or a smaller file.';
          } else if (errorMessage.includes('too large')) {
            errorMessage += '\\n\\nSuggestion: Please use a file smaller than 250MB.';
          }
          
          alert(`Error: ${errorMessage}`);
        } catch {
          alert(`Error: ${response.status} - ${response.statusText}\\n\\nThe file may be too large or corrupted.`);
        }
      }
    } catch (error) {
      console.error('Error compressing PDF:', error);
      let errorMessage = 'Failed to compress PDF. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = `Compression operation timed out. The file may be too large or complex.\\n\\nSuggestions:\\n- Try using a lower compression level\\n- Use a smaller file\\n- Check that the file is a valid PDF`;
      } else if (error.message) {
        errorMessage = `Failed to compress PDF: ${error.message}`;
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

  const getCompressionLevelInfo = (level) => {
    const info = {
      low: { color: '#4CAF50', description: 'Minimal compression, preserves maximum quality' },
      medium: { color: '#FF9800', description: 'Balanced compression with good quality' },
      high: { color: '#F44336', description: 'Strong compression, slight quality reduction' },
      maximum: { color: '#9C27B0', description: 'Maximum compression, quality may be affected' }
    };
    return info[level] || info.medium;
  };

  return (
    <div className="editor-container">
      <div className="page-icon">🗜️</div>
      <h1 className="page-title">PDF Compression Tool</h1>
      
      {/* File Upload */}
      <div 
        className="file-upload-area"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="upload-icon">📄</div>
        <div className="upload-text">
          {selectedFile ? selectedFile.name : 'Choose PDF File to Compress'}
        </div>
        <small>Reduce your PDF file size while maintaining quality</small>
        <small style={{color: '#ffa500', display: 'block', marginTop: '0.5rem'}}>
          💡 Maximum file size: 250MB
        </small>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* File Info */}
      {selectedFile && (
        <div className="section">
          <h2 className="section-title">Selected File</h2>
          <div className="file-item">
            <div className="file-info">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{formatFileSize(selectedFile.size)}</div>
              </div>
            </div>
            <div className="file-actions">
              <button 
                className="remove-btn"
                onClick={removeFile}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compression Options */}
      {selectedFile && (
        <div className="section">
          <h2 className="section-title">Compression Settings</h2>
          
          <div className="compression-options">
            <div className="option-group">
              <label>Compression Level:</label>
              <div className="select-wrapper">
                <select
                  value={compressionData.compressionLevel}
                  onChange={(e) => handleInputChange('compressionLevel', e.target.value)}
                  className="select-input"
                >
                  <option value="low">Low - Minimal compression (5-10% reduction)</option>
                  <option value="medium">Medium - Balanced (15-25% reduction)</option>
                  <option value="high">High - Strong compression (30-50% reduction)</option>
                  <option value="maximum">Maximum - Aggressive (50-70% reduction)</option>
                </select>
              </div>
              <small style={{color: getCompressionLevelInfo(compressionData.compressionLevel).color}}>
                {getCompressionLevelInfo(compressionData.compressionLevel).description}
              </small>
            </div>

            <div className="option-group">
              <label>Output Filename:</label>
              <input
                type="text"
                placeholder="compressed-document.pdf"
                value={compressionData.outputFileName}
                onChange={(e) => handleInputChange('outputFileName', e.target.value)}
                className="text-input"
              />
              <small>Name for the compressed PDF file</small>
            </div>

            <div className="option-group">
              <label>Target File Size (Optional):</label>
              <input
                type="number"
                placeholder="e.g., 1000 for 1MB"
                value={compressionData.targetSizeKB}
                onChange={(e) => handleInputChange('targetSizeKB', e.target.value)}
                className="text-input"
                min="10"
                max="250000"
              />
              <small>Target size in KB (optional - will use aggressive compression to reach this size)</small>
            </div>

            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={compressionData.removeMetadata}
                  onChange={(e) => handleInputChange('removeMetadata', e.target.checked)}
                />
                <span className="checkmark"></span>
                Remove metadata (title, author, etc.)
              </label>
              <small>Removes document metadata to reduce file size</small>
            </div>

            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={compressionData.optimizeImages}
                  onChange={(e) => handleInputChange('optimizeImages', e.target.checked)}
                />
                <span className="checkmark"></span>
                Optimize images (coming soon)
              </label>
              <small>Future feature: Compress images within the PDF</small>
            </div>
          </div>
        </div>
      )}

      {/* Preview Information */}
      {isLoadingPreview && (
        <div className="section">
          <h2 className="section-title">Analyzing PDF...</h2>
          <div className="loading-spinner">🔄</div>
        </div>
      )}

      {previewData && (
        <div className="section">
          <h2 className="section-title">Compression Preview</h2>
          <div className="preview-info">
            <div className="preview-grid">
              <div className="preview-item">
                <strong>Original Size:</strong> {previewData.originalSizeMB} MB
              </div>
              <div className="preview-item">
                <strong>Pages:</strong> {previewData.pageCount}
              </div>
            </div>
            
            <div className="compression-estimates">
              <h3>Estimated Results:</h3>
              {previewData.compressionLevels.map((level, index) => (
                <div 
                  key={index} 
                  className={`estimate-item ${level.level === compressionData.compressionLevel ? 'selected' : ''}`}
                >
                  <div className="estimate-header">
                    <span className="estimate-level">{level.level.toUpperCase()}</span>
                    <span className="estimate-reduction">{level.estimatedReduction}</span>
                  </div>
                  <div className="estimate-size">
                    Estimated size: {formatFileSize(level.estimatedSize)}
                  </div>
                  <div className="estimate-description">{level.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compression Result */}
      {compressionResult && (
        <div className="section">
          <h2 className="section-title">Compression Complete! 🎉</h2>
          <div className="result-info">
            <div className="result-grid">
              <div className="result-item success">
                <strong>Original Size:</strong> {formatFileSize(compressionResult.originalSize)}
              </div>
              <div className="result-item success">
                <strong>Compressed Size:</strong> {formatFileSize(compressionResult.compressedSize)}
              </div>
              <div className="result-item success">
                <strong>Size Reduction:</strong> {compressionResult.compressionRatio}%
              </div>
            </div>
            <div className="success-message">
              ✅ Your PDF has been successfully compressed and downloaded!
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedFile && (
        <div className="section">
          <h2 className="section-title">How to Compress PDFs</h2>
          <div className="instructions">
            <ol>
              <li>Select a PDF file using the file picker above (max 250MB)</li>
              <li>Choose your preferred compression level based on quality vs. size needs</li>
              <li>Optionally set a target file size for aggressive compression</li>
              <li>Configure additional options like metadata removal</li>
              <li>Click "Compress PDF" to process and download the optimized file</li>
            </ol>
            
            <div className="tips">
              <h3>💡 Compression Tips:</h3>
              <ul>
                <li><strong>Low:</strong> Best for documents that need to maintain exact quality</li>
                <li><strong>Medium:</strong> Good balance for most documents (recommended)</li>
                <li><strong>High:</strong> Suitable when file size is more important than perfect quality</li>
                <li><strong>Maximum:</strong> Use only when you need the smallest possible file size</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Compress Button */}
      <button 
        className="process-btn"
        onClick={handleCompressPDF}
        disabled={!selectedFile || isProcessing}
      >
        {isProcessing ? 'Compressing...' : 'Compress PDF'}
      </button>
    </div>
  );
};

export default CompressEditor;
