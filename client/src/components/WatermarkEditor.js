import React, { useState, useRef } from 'react';
import './PDFEditor.css';

const WatermarkEditor = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkData, setWatermarkData] = useState({
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 0.3,
    color: '#808080',
    rotation: 45,
    position: 'center',
    startPage: 1,
    endPage: 0 // 0 means all pages
  });
  const fileInputRef = useRef(null);

  const positions = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please drop a valid PDF file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleInputChange = (field, value) => {
    setWatermarkData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProcessPDF = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('watermarkData', JSON.stringify(watermarkData));

      console.log('Sending watermark data:', watermarkData);
      console.log('Selected file:', selectedFile.name);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/watermark`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'watermarked-document.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        try {
          const error = JSON.parse(errorText);
          alert(`Error: ${error.error || error.message || 'Unknown error'}`);
        } catch {
          alert(`Error: ${response.status} - ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error adding watermark:', error);
      alert(`Failed to add watermark: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="editor-container">
      <div className="page-icon">🖼️</div>
      <h1 className="page-title">PDF Watermark Editor</h1>
      
      {/* File Upload */}
      <div 
        className="file-upload-area"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          {selectedFile ? selectedFile.name : 'Choose PDF File'}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Watermark Configuration */}
      <div className="section">
        <h2 className="section-title">Watermark Settings</h2>
        
        <div className="watermark-grid">
          <div className="option-group">
            <label>Watermark Text:</label>
            <input
              type="text"
              placeholder="Enter watermark text"
              value={watermarkData.text}
              onChange={(e) => handleInputChange('text', e.target.value)}
              className="text-input"
            />
          </div>

          <div className="option-group">
            <label>Position:</label>
            <select 
              value={watermarkData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className="template-dropdown"
            >
              {positions.map(position => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
              ))}
            </select>
          </div>

          <div className="option-group">
            <label>Font Size:</label>
            <input
              type="range"
              min="12"
              max="100"
              value={watermarkData.fontSize}
              onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
              className="range-input"
            />
            <span className="range-value">{watermarkData.fontSize}px</span>
          </div>

          <div className="option-group">
            <label>Opacity:</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={watermarkData.opacity}
              onChange={(e) => handleInputChange('opacity', parseFloat(e.target.value))}
              className="range-input"
            />
            <span className="range-value">{Math.round(watermarkData.opacity * 100)}%</span>
          </div>

          <div className="option-group">
            <label>Color:</label>
            <input
              type="color"
              value={watermarkData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              className="color-input"
            />
          </div>

          <div className="option-group">
            <label>Rotation:</label>
            <input
              type="range"
              min="-90"
              max="90"
              value={watermarkData.rotation}
              onChange={(e) => handleInputChange('rotation', parseInt(e.target.value))}
              className="range-input"
            />
            <span className="range-value">{watermarkData.rotation}°</span>
          </div>

          <div className="option-group">
            <label>Start Page:</label>
            <input
              type="number"
              value={watermarkData.startPage}
              onChange={(e) => handleInputChange('startPage', parseInt(e.target.value) || 1)}
              min="1"
              className="page-input"
            />
          </div>

          <div className="option-group">
            <label>End Page:</label>
            <input
              type="number"
              value={watermarkData.endPage}
              onChange={(e) => handleInputChange('endPage', parseInt(e.target.value) || 0)}
              min="0"
              placeholder="All pages"
              className="page-input"
            />
            <small>Leave 0 for all pages</small>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="section">
        <h2 className="section-title">Preview</h2>
        <div className="watermark-preview">
          <div className="preview-page">
            <div 
              className="preview-watermark"
              style={{
                fontSize: `${Math.max(8, watermarkData.fontSize / 6)}px`,
                opacity: watermarkData.opacity,
                color: watermarkData.color,
                transform: `rotate(${watermarkData.rotation}deg)`,
                position: 'absolute',
                ...(watermarkData.position === 'center' && { top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${watermarkData.rotation}deg)` }),
                ...(watermarkData.position === 'top-left' && { top: '20px', left: '20px' }),
                ...(watermarkData.position === 'top-right' && { top: '20px', right: '20px' }),
                ...(watermarkData.position === 'bottom-left' && { bottom: '20px', left: '20px' }),
                ...(watermarkData.position === 'bottom-right' && { bottom: '20px', right: '20px' })
              }}
            >
              {watermarkData.text}
            </div>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <button 
        className="process-btn"
        onClick={handleProcessPDF}
        disabled={!selectedFile || isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Add Watermark'}
      </button>
    </div>
  );
};

export default WatermarkEditor;
