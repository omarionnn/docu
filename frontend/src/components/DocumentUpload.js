import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './DocumentUpload.css';

/**
 * Component for uploading and creating document templates
 */
const DocumentUpload = ({ onTemplateCreated }) => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  /**
   * Handle file input change
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  /**
   * Validate file type and size
   */
  const validateAndSetFile = (selectedFile) => {
    // Check file type
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      toast.error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
      return;
    }
    
    // Check file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }
    
    // Set file and default name
    setFile(selectedFile);
    if (!name) {
      // Use filename without extension as default name
      setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setProcessingStatus('Uploading file...');
      
      const formData = new FormData();
      formData.append('document', file);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('tags', tags);
      
      // Upload with progress tracking
      const response = await axios.post('/api/templates/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          
          if (percentCompleted === 100) {
            setProcessingStatus('Processing document...');
          }
        }
      });
      
      toast.success('Template created successfully!');
      
      // Reset form
      setFile(null);
      setName('');
      setDescription('');
      setCategory('General');
      setTags('');
      
      // Notify parent component
      if (onTemplateCreated) {
        onTemplateCreated(response.data.template);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Error uploading document');
    } finally {
      setUploading(false);
      setProcessingStatus('');
    }
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Trigger file input click
   */
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  /**
   * Predefined document categories
   */
  const categories = [
    'General',
    'Legal',
    'Financial',
    'HR',
    'Real Estate',
    'Healthcare',
    'Education',
    'Business'
  ];

  return (
    <div className="document-upload">
      <h2>Create New Template</h2>
      
      <form onSubmit={handleSubmit}>
        <div 
          className={`drag-drop-area ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt"
          />
          
          {file ? (
            <div className="file-preview">
              <div className="file-icon">
                {file.name.endsWith('.pdf') ? '📄' : file.name.endsWith('.docx') ? '📝' : '📃'}
              </div>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button 
                type="button" 
                className="remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">📁</div>
              <p>Drag & drop your document here, or click to browse</p>
              <span className="file-types">Supports PDF, DOCX, and TXT (Max 10MB)</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Template Name*</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter template name"
            required
            disabled={uploading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter template description"
            rows="3"
            disabled={uploading}
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
              disabled={uploading}
            />
          </div>
        </div>
        
        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="progress-status">
              <span>{uploadProgress}% - {processingStatus}</span>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={!file || uploading}
          >
            {uploading ? 'Creating Template...' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUpload;