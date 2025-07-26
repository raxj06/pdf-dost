import React, { useState, useRef } from 'react';
import './PDFEditor.css';

const SplitEditor = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitData, setSplitData] = useState({
    splitType: 'every',
    pages: '',
    ranges: [{ start: '', end: '' }],
    everyNPages: 1,
    fileName: 'document'
  });
  const fileInputRef = useRef(null);

  const splitTypes = [
    { value: 'every', label: 'Split Every N Pages' },
    { value: 'pages', label: 'Extract Specific Pages' },
    { value: 'ranges', label: 'Split by Page Ranges' }
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
    setSplitData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRangeChange = (index, field, value) => {
    setSplitData(prev => ({
      ...prev,
      ranges: prev.ranges.map((range, i) => 
        i === index ? { ...range, [field]: value } : range
      )
    }));
  };

  const addRange = () => {
    setSplitData(prev => ({
      ...prev,
      ranges: [...prev.ranges, { start: '', end: '' }]
    }));
  };

  const removeRange = (index) => {
    setSplitData(prev => ({
      ...prev,
      ranges: prev.ranges.filter((_, i) => i !== index)
    }));
  };

  const handleProcessPDF = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }

    // Validate split data based on type
    if (splitData.splitType === 'pages' && !splitData.pages.trim()) {
      alert('Please specify page numbers to extract');
      return;
    }

    if (splitData.splitType === 'ranges') {
      const hasValidRange = splitData.ranges.some(range => 
        range.start && range.end && parseInt(range.start) <= parseInt(range.end)
      );
      if (!hasValidRange) {
        alert('Please specify at least one valid page range');
        return;
      }
    }

    if (splitData.splitType === 'every' && splitData.everyNPages < 1) {
      alert('Pages per split must be at least 1');
      return;
    }

    setIsProcessing(true);
    try {
      // Process split data based on type
      let processedSplitData = { ...splitData };
      
      if (splitData.splitType === 'pages') {
        // Convert comma-separated pages to array
        processedSplitData.pages = splitData.pages
          .split(',')
          .map(p => parseInt(p.trim()))
          .filter(p => !isNaN(p) && p > 0);
      }

      if (splitData.splitType === 'ranges') {
        // Filter out empty ranges
        processedSplitData.ranges = splitData.ranges
          .filter(range => range.start && range.end)
          .map(range => ({
            start: parseInt(range.start),
            end: parseInt(range.end)
          }));
      }

      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('splitData', JSON.stringify(processedSplitData));

      console.log('Sending split data:', processedSplitData);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/split`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        if (contentType.includes('application/zip')) {
          a.download = 'split-documents.zip';
        } else {
          a.download = 'split-document.pdf';
        }
        
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
      console.error('Error splitting PDF:', error);
      alert(`Failed to split PDF: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="editor-container">
      <div className="page-icon">✂️</div>
      <h1 className="page-title">PDF Split Tool</h1>
      
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

      {/* Split Configuration */}
      <div className="section">
        <h2 className="section-title">Split Options</h2>
        
        <div className="split-grid">
          <div className="option-group">
            <label>Split Type:</label>
            <select 
              value={splitData.splitType}
              onChange={(e) => handleInputChange('splitType', e.target.value)}
              className="template-dropdown"
            >
              {splitTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="option-group">
            <label>Output Filename:</label>
            <input
              type="text"
              placeholder="document"
              value={splitData.fileName}
              onChange={(e) => handleInputChange('fileName', e.target.value)}
              className="text-input"
            />
            <small>Base name for output files</small>
          </div>
        </div>

        {/* Split Type Specific Options */}
        {splitData.splitType === 'every' && (
          <div className="split-options">
            <h3>Split Every N Pages</h3>
            <div className="option-group">
              <label>Pages per split:</label>
              <input
                type="number"
                value={splitData.everyNPages}
                onChange={(e) => handleInputChange('everyNPages', parseInt(e.target.value) || 1)}
                min="1"
                className="page-input"
              />
              <small>Each output file will contain this many pages</small>
            </div>
          </div>
        )}

        {splitData.splitType === 'pages' && (
          <div className="split-options">
            <h3>Extract Specific Pages</h3>
            <div className="option-group">
              <label>Page Numbers:</label>
              <input
                type="text"
                placeholder="1, 3, 5-7, 10"
                value={splitData.pages}
                onChange={(e) => handleInputChange('pages', e.target.value)}
                className="text-input"
              />
              <small>Comma-separated page numbers (e.g., 1, 3, 5, 7)</small>
            </div>
          </div>
        )}

        {splitData.splitType === 'ranges' && (
          <div className="split-options">
            <h3>Page Ranges</h3>
            {splitData.ranges.map((range, index) => (
              <div key={index} className="range-group">
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="From"
                    value={range.start}
                    onChange={(e) => handleRangeChange(index, 'start', e.target.value)}
                    min="1"
                    className="page-input"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="To"
                    value={range.end}
                    onChange={(e) => handleRangeChange(index, 'end', e.target.value)}
                    min="1"
                    className="page-input"
                  />
                  {splitData.ranges.length > 1 && (
                    <button 
                      type="button"
                      className="remove-range-btn"
                      onClick={() => removeRange(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button 
              type="button"
              className="add-range-btn"
              onClick={addRange}
            >
              + Add Range
            </button>
          </div>
        )}
      </div>

      {/* Preview/Instructions */}
      <div className="section">
        <h2 className="section-title">Instructions</h2>
        <div className="instructions">
          {splitData.splitType === 'every' && (
            <p>The PDF will be split into multiple files, each containing {splitData.everyNPages} page(s).</p>
          )}
          {splitData.splitType === 'pages' && (
            <p>Extract individual pages as separate PDF files. Enter page numbers separated by commas.</p>
          )}
          {splitData.splitType === 'ranges' && (
            <p>Split PDF into files containing the specified page ranges. Each range becomes a separate file.</p>
          )}
          <p><strong>Output:</strong> {splitData.splitType === 'pages' || splitData.ranges?.length > 1 ? 'ZIP file containing multiple PDFs' : 'Single PDF or ZIP file'}</p>
        </div>
      </div>

      {/* Process Button */}
      <button 
        className="process-btn"
        onClick={handleProcessPDF}
        disabled={!selectedFile || isProcessing}
      >
        {isProcessing ? 'Splitting...' : 'Split PDF'}
      </button>
    </div>
  );
};

export default SplitEditor;
