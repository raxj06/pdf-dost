import React, { useState, useRef } from 'react';
import WatermarkEditor from './WatermarkEditor';
import SplitEditor from './SplitEditor';
import MergeEditor from './MergeEditor';
import './PDFEditor.css';

const PDFEditor = () => {
  const [activeTab, setActiveTab] = useState('header-footer');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

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
  const [headerFooterData, setHeaderFooterData] = useState({
    leftHeader: '',
    middleHeader: '',
    rightHeader: '',
    leftFooter: '',
    middleFooter: '',
    rightFooter: '',
    startPage: 1,
    coverWithWhite: false,
    textColor: '#000000',
    fontSize: 10
  });
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = [
    { value: 'page-x-of-y', label: 'Page (x) of (y)' },
    { value: 'x-of-y', label: '(x) of (y)' },
    { value: 'page-x', label: 'Page (x)' },
    { value: 'x', label: '(x)' },
    { value: 'file', label: '(file)' }
  ];

  const handleTemplateSelect = (templateValue, position) => {
    const templateText = templates.find(t => t.value === templateValue)?.label || '';
    setHeaderFooterData(prev => ({
      ...prev,
      [position]: templateText
    }));
  };

  const handleInputChange = (field, value) => {
    setHeaderFooterData(prev => ({
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
      formData.append('headerFooterData', JSON.stringify(headerFooterData));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/process`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'processed-document.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pdf-editor">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">📄</span>
            <span className="logo-text">PDF Dost</span>
            <span className="logo-subtitle">Your PDF Solution</span>
          </div>
        </div>
        <div className="header-center">
          <button 
            className={`nav-btn ${activeTab === 'header-footer' ? 'active' : ''}`}
            onClick={() => setActiveTab('header-footer')}
          >
            📄 Header & Footer
          </button>
          <button 
            className={`nav-btn ${activeTab === 'watermark' ? 'active' : ''}`}
            onClick={() => setActiveTab('watermark')}
          >
            🖼️ Watermark
          </button>
          <button 
            className={`nav-btn ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => setActiveTab('split')}
          >
            ✂️ Split PDF
          </button>
          <button 
            className={`nav-btn ${activeTab === 'merge' ? 'active' : ''}`}
            onClick={() => setActiveTab('merge')}
          >
            🔗 Merge PDFs
          </button>
        </div>
        <div className="header-right">
          <span className="version">v2.1</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'header-footer' ? (
          <HeaderFooterEditor 
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
          />
        ) : activeTab === 'watermark' ? (
          <WatermarkEditor />
        ) : activeTab === 'split' ? (
          <SplitEditor />
        ) : activeTab === 'merge' ? (
          <MergeEditor />
        ) : (
          <div className="editor-container">
            <div className="page-icon">✂️</div>
            <h1 className="page-title">Split PDF</h1>
            <div className="coming-soon">
              <p>PDF splitting feature coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HeaderFooterEditor = ({ 
  selectedFile, 
  setSelectedFile, 
  isProcessing, 
  setIsProcessing,
  fileInputRef,
  handleFileUpload,
  handleDrop,
  handleDragOver
}) => {
  const [headerFooterData, setHeaderFooterData] = useState({
    leftHeader: '',
    middleHeader: '',
    rightHeader: '',
    leftFooter: '',
    middleFooter: '',
    rightFooter: '',
    startPage: 1,
    coverWithWhite: false,
    textColor: '#000000',
    fontSize: 10
  });

  const templates = [
    { value: 'page-x-of-y', label: 'Page (x) of (y)' },
    { value: 'x-of-y', label: '(x) of (y)' },
    { value: 'page-x', label: 'Page (x)' },
    { value: 'x', label: '(x)' },
    { value: 'file', label: '(file)' }
  ];

  const handleTemplateSelect = (templateValue, position) => {
    const templateText = templates.find(t => t.value === templateValue)?.label || '';
    setHeaderFooterData(prev => ({
      ...prev,
      [position]: templateText
    }));
  };

  const handleInputChange = (field, value) => {
    setHeaderFooterData(prev => ({
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
      formData.append('headerFooterData', JSON.stringify(headerFooterData));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/process`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'processed-document.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="editor-container">
      <div className="page-icon">📄</div>
      <h1 className="page-title">Header & Footer Editor</h1>
      
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

          {/* Header Section */}
          <div className="section">
            <h2 className="section-title">Header</h2>
            <div className="header-footer-grid">
              <div className="position-group">
                <label>Left Header</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter header text"
                    value={headerFooterData.leftHeader}
                    onChange={(e) => handleInputChange('leftHeader', e.target.value)}
                    className="text-input"
                  />
                  <select 
                    className="template-dropdown"
                    value=""
                    onChange={(e) => handleTemplateSelect(e.target.value, 'leftHeader')}
                  >
                    <option value="">Templates ▼</option>
                    {templates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="position-group">
                <label>Middle Header</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter header text"
                    value={headerFooterData.middleHeader}
                    onChange={(e) => handleInputChange('middleHeader', e.target.value)}
                    className="text-input"
                  />
                  <select 
                    className="template-dropdown"
                    value=""
                    onChange={(e) => handleTemplateSelect(e.target.value, 'middleHeader')}
                  >
                    <option value="">Templates ▼</option>
                    {templates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="position-group">
                <label>Right Header</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter header text"
                    value={headerFooterData.rightHeader}
                    onChange={(e) => handleInputChange('rightHeader', e.target.value)}
                    className="text-input"
                  />
                  <select 
                    className="template-dropdown"
                    value=""
                    onChange={(e) => handleTemplateSelect(e.target.value, 'rightHeader')}
                  >
                    <option value="">Templates ▼</option>
                    {templates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="section">
            <h2 className="section-title">Footer</h2>
            <div className="header-footer-grid">
              <div className="position-group">
                <label>Left Footer</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter footer text"
                    value={headerFooterData.leftFooter}
                    onChange={(e) => handleInputChange('leftFooter', e.target.value)}
                    className="text-input"
                  />
                  <select 
                    className="template-dropdown"
                    value=""
                    onChange={(e) => handleTemplateSelect(e.target.value, 'leftFooter')}
                  >
                    <option value="">Templates ▼</option>
                    {templates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="position-group">
                <label>Middle Footer</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter footer text"
                    value={headerFooterData.middleFooter}
                    onChange={(e) => handleInputChange('middleFooter', e.target.value)}
                    className="text-input"
                  />
                  <select 
                    className="template-dropdown"
                    value=""
                    onChange={(e) => handleTemplateSelect(e.target.value, 'middleFooter')}
                  >
                    <option value="">Templates ▼</option>
                    {templates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="position-group">
                <label>Right Footer</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Enter footer text"
                    value={headerFooterData.rightFooter}
                    onChange={(e) => handleInputChange('rightFooter', e.target.value)}
                    className="text-input"
                  />
                  <select 
                    className="template-dropdown"
                    value=""
                    onChange={(e) => handleTemplateSelect(e.target.value, 'rightFooter')}
                  >
                    <option value="">Templates ▼</option>
                    {templates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="options">
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={headerFooterData.coverWithWhite}
                  onChange={(e) => handleInputChange('coverWithWhite', e.target.checked)}
                />
                <span className="checkmark"></span>
                Cover margins with white color
              </label>
            </div>

            <div className="option-group">
              <label>Start Page Number:</label>
              <input
                type="number"
                value={headerFooterData.startPage}
                onChange={(e) => handleInputChange('startPage', parseInt(e.target.value) || 1)}
                min="1"
                className="page-input"
              />
            </div>

            <div className="option-group">
              <label>Text Color:</label>
              <input
                type="color"
                value={headerFooterData.textColor}
                onChange={(e) => handleInputChange('textColor', e.target.value)}
                className="color-input"
              />
            </div>

            <div className="option-group">
              <label>Font Size:</label>
              <input
                type="number"
                value={headerFooterData.fontSize}
                onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value) || 10)}
                min="6"
                max="24"
                className="page-input"
              />
              <span className="input-unit">px</span>
            </div>
          </div>

          {/* Process Button */}
          <button 
            className="process-btn"
            onClick={handleProcessPDF}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Add Header & Footer'}
          </button>
        </div>
      );
    };

export default PDFEditor;
