cat > frontend/src/components/DocumentUpload.js << 'EOF'
  import React, { useState, useRef, useEffect } from 'react';
  import axios from 'axios';
  import './DocumentUpload.css';

  /**
   * Component for uploading and creating document templates
   */
  const DocumentUpload = () => {
    // State for file and form data
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [tags, setTags] = useState('');
    const [categories, setCategories] = useState(['General', 'Legal', 'HR', 'Finance', 'Education', 'Healthcare']);

    // State for UI feedback
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Ref for file input
    const fileInputRef = useRef(null);

    // Reset form when upload is successful
    useEffect(() => {
      if (success) {
        const timer = setTimeout(() => {
          setSuccess(false);
          setFile(null);
          setName('');
          setDescription('');
          setTags('');
          setCategory('General');
          setUploadProgress(0);
          setProcessingStatus('');
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [success]);

    // Handle file selection
    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];

      if (selectedFile) {
        validateFile(selectedFile);
      }
    };

    // Validate file type and size
    const validateFile = (selectedFile) => {
      const validTypes = ['.pdf', '.docx', '.txt'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();

      if (!validTypes.includes(fileExtension)) {
        setError(`Invalid file type. Only PDF, DOCX, and TXT files are allowed.`);
        return;
      }

      if (selectedFile.size > maxSize) {
        setError(`File size exceeds 10MB limit.`);
        return;
      }

      setError(null);
      setFile(selectedFile);

      // Set default name based on file name (without extension)
      if (!name) {
        const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
        setName(fileName);
      }
    };

    // Handle drag events
    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    // Handle drop event
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateFile(e.dataTransfer.files[0]);
      }
    };

    // Handle click on the drag-drop area
    const handleButtonClick = () => {
      fileInputRef.current.click();
    };

    // Handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!file) {
        setError('Please select a file to upload.');
        return;
      }

      if (!name.trim()) {
        setError('Please enter a template name.');
        return;
      }

      try {
        setUploading(true);
        setError(null);
        setUploadProgress(0);
        setProcessingStatus('Uploading file...');

        const formData = new FormData();
        formData.append('document', file);
        formData.append('name', name);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('tags', tags);

        const response = await axios.post('/api/templates/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);

            if (progress === 100) {
              setProcessingStatus('Processing document...');
            }
          }
        });

        setProcessingStatus('Template created successfully!');
        setSuccess(true);
        console.log('Template created:', response.data);

      } catch (error) {
        console.error('Error creating template:', error);
        setError(error.response?.data?.message || 'Failed to create template. Please try again.');
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="document-upload-container">
        {success && (
          <div className="success-message">
            <p>Template created successfully!</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button className="close-error" onClick={() => setError(null)}>✕</button>
          </div>
        )}

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
  EOF
