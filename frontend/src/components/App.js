import React, { useState, useEffect } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link 
} from "react-router-dom";
import "./App.css";
// Import toast for notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

  function App() {
    // Add state to store uploaded templates
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    // Load any stored templates from localStorage on app initialization
    useEffect(() => {
      try {
        const storedTemplates = localStorage.getItem('saafi-templates');
        if (storedTemplates) {
          setTemplates(JSON.parse(storedTemplates));
        }
      } catch (error) {
        console.error('Error loading templates from localStorage:', error);
      }
    }, []);
    
    // Handle newly uploaded templates
    const handleTemplateUploaded = (template) => {
      // Add the new template to our list
      const updatedTemplates = [...templates, {
        ...template,
        id: template.id || `template-${Date.now()}`,
        createdAt: template.createdAt || new Date().toISOString()
      }];
      
      setTemplates(updatedTemplates);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('saafi-templates', JSON.stringify(updatedTemplates));
      } catch (error) {
        console.error('Error saving templates to localStorage:', error);
      }
      
      // Show notification
      toast.success(`Template "${template.name}" created successfully!`);
    };
    
    // Select a template for customization
    const selectTemplate = (templateId) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        toast.info(`Template "${template.name}" selected for customization`);
      }
    };
    
    return (
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>Saafi</h1>
            <p>AI-powered document management platform</p>
            <nav className="App-nav">
              <Link to="/">Home</Link>
              <Link to="/upload">Upload</Link>
              <Link to="/customize">Customize</Link>
              <Link to="/edit">Edit</Link>
              <Link to="/sign">Sign</Link>
              <Link to="/legal">Legal Terms</Link>
              <Link to="/integrate">Integrations</Link>
            </nav>
          </header>

          <main className="App-main">
            <Routes>
              <Route path="/" element={<Home templates={templates} onSelectTemplate={selectTemplate} />} />
              <Route path="/upload" element={<UploadComponent onSuccess={handleTemplateUploaded} />} />
              <Route path="/customize" element={<CustomizeComponent 
                templates={templates} 
                selectedTemplate={selectedTemplate}
                onSelectTemplate={selectTemplate}
              />} />
              <Route path="/edit" element={<EditComponent />} />
              <Route path="/sign" element={<SignComponent />} />
              <Route path="/legal" element={<LegalComponent />} />
              <Route path="/integrate" element={<IntegrateComponent />} />
            </Routes>
          </main>

          <footer className="App-footer">
            <p>Saafi MVP Demo - © 2025</p>
          </footer>
        </div>
        
        {/* Add ToastContainer here as well for notifications */}
        <ToastContainer 
          position="bottom-right" 
          autoClose={3000} 
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    );
  }

  function Home({ templates = [], onSelectTemplate }) {
    return (
      <div className="home-container">
        <h2>Welcome to Saafi</h2>
        <p>Select a feature from the navigation menu to get started</p>

        {templates.length > 0 && (
          <div className="templates-section">
            <h3>Your Templates</h3>
            <div className="templates-list">
              {templates.map(template => (
                <div key={template.id} className="template-card">
                  <h4>{template.name}</h4>
                  <p>{template.description || 'No description'}</p>
                  <div className="template-meta">
                    <span>Category: {template.category || 'General'}</span>
                    <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="template-actions">
                    <button 
                      onClick={() => {
                        onSelectTemplate(template.id);
                        // Navigate to customize page
                        window.location.href = '/customize';
                      }}
                      className="customize-btn"
                    >
                      Customize
                    </button>
                    <Link to="/edit" className="edit-link">Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="feature-cards">
          <div className="feature-card">
            <h3>Upload Documents</h3>
            <p>Create new templates by uploading documents</p>
            <Link to="/upload" className="feature-link">Try it</Link>
          </div>

          <div className="feature-card">
            <h3>Customize Documents</h3>
            <p>Apply rules and conditions to customize documents</p>
            <Link to="/customize" className="feature-link">Try it</Link>
          </div>

          <div className="feature-card">
            <h3>Edit Documents</h3>
            <p>Edit document content and fill in variables</p>
            <Link to="/edit" className="feature-link">Try it</Link>
          </div>

          <div className="feature-card">
            <h3>Sign Documents</h3>
            <p>Add signatures to documents</p>
            <Link to="/sign" className="feature-link">Try it</Link>
          </div>

          <div className="feature-card">
            <h3>Explain Legal Terms</h3>
            <p>Get explanations for complex legal terms</p>
            <Link to="/legal" className="feature-link">Try it</Link>
          </div>

          <div className="feature-card">
            <h3>Manage Integrations</h3>
            <p>Connect with external systems</p>
            <Link to="/integrate" className="feature-link">Try it</Link>
          </div>
        </div>
      </div>
    );
  }

  // Document Upload Component
  function UploadComponent({ onSuccess }) {
    // Import DocumentUpload component
    const DocumentUpload = React.lazy(() => import('./DocumentUpload'));
    
    const handleUploadSuccess = (template) => {
      console.log('Template created:', template);
      // Call the parent's onSuccess handler to store the template
      if (onSuccess) {
        onSuccess(template);
      }
      // Show a toast notification
      toast.success('Template created successfully! You can now customize it.');
    };
    
    return (
      <div>
        <h2>Document Upload</h2>
        <p>Upload documents to create reusable templates with AI-detected variables.</p>
        
        <React.Suspense fallback={<div>Loading document uploader...</div>}>
          <DocumentUpload onSuccess={handleUploadSuccess} />
        </React.Suspense>
      </div>
    );
  }

  function CustomizeComponent({ templates = [], selectedTemplate, onSelectTemplate }) {
    // Import DocumentCustomizer component
    const DocumentCustomizer = React.lazy(() => import('./DocumentCustomizer'));
    
    const [documentId, setDocumentId] = useState(null);
    
    useEffect(() => {
      // Set document ID if a template is selected
      if (selectedTemplate) {
        setDocumentId(selectedTemplate.id);
      }
    }, [selectedTemplate]);
    
    return (
      <div>
        <h2>Document Customization</h2>
        <p>Create and apply rules to customize documents based on specific conditions.</p>
        
        {templates.length > 0 ? (
          <div className="template-selector">
            <h3>Select a Template to Customize</h3>
            <div className="templates-dropdown-container">
              <select 
                className="templates-dropdown"
                value={documentId || ""}
                onChange={(e) => {
                  const templateId = e.target.value;
                  setDocumentId(templateId);
                  if (templateId) {
                    onSelectTemplate(templateId);
                  }
                }}
              >
                <option value="">-- Select a template --</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="no-templates-message">
            <p>No templates available for customization. Please upload a document first.</p>
            <Link to="/upload" className="upload-link">Upload a Document</Link>
          </div>
        )}
        
        {documentId && (
          <React.Suspense fallback={<div>Loading document customizer...</div>}>
            <DocumentCustomizer 
              documentId={documentId} 
              template={selectedTemplate}
            />
          </React.Suspense>
        )}
      </div>
    );
  }

  function EditComponent() {
    return <div>
      <h2>Document Editor</h2>
      <p>Edit documents and fill in template variables.</p>
      <div style={{border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginTop: '20px'}}>
        <p>In the full version, you can:</p>
        <ul style={{textAlign: 'left'}}>
          <li>Fill in template variables with validation</li>
          <li>Edit document content directly</li>
          <li>Save document versions and track changes</li>
          <li>AI-powered content suggestions</li>
        </ul>
        <button style={{backgroundColor: '#61dafb', border: 'none', padding: '10px 20px', borderRadius: '4px', marginTop: '20px'}}>
          Edit Document (Demo)
        </button>
      </div>
    </div>;
  }

  function SignComponent() {
    return <div>
      <h2>Document Signing</h2>
      <p>Add electronic signatures to documents and manage signing workflows.</p>
      <div style={{border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginTop: '20px'}}>
        <p>In the full version, you can:</p>
        <ul style={{textAlign: 'left'}}>
          <li>Add electronic signatures to documents</li>
          <li>Set up multi-party signing workflows</li>
          <li>Track document signing status</li>
          <li>Secure signature verification and audit trails</li>
        </ul>
        <button style={{backgroundColor: '#61dafb', border: 'none', padding: '10px 20px', borderRadius: '4px', marginTop: '20px'}}>
          Sign Document (Demo)
        </button>
      </div>
    </div>;
  }

  function LegalComponent() {
    return <div>
      <h2>Legal Term Explainer</h2>
      <p>Get explanations for complex legal terms in your documents.</p>
      <div style={{border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginTop: '20px'}}>
        <p>In the full version, you can:</p>
        <ul style={{textAlign: 'left'}}>
          <li>AI automatically identifies complex legal terms</li>
          <li>Get plain language explanations of legal jargon</li>
          <li>Understand the implications of legal clauses</li>
          <li>See related terms and concepts</li>
        </ul>
        <button style={{backgroundColor: '#61dafb', border: 'none', padding: '10px 20px', borderRadius: '4px', marginTop: '20px'}}>
          Explain Legal Terms (Demo)
        </button>
      </div>
    </div>;
  }

  function IntegrateComponent() {
    return <div>
      <h2>Integration Manager</h2>
      <p>Connect Saafi with external systems and services.</p>
      <div style={{border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginTop: '20px'}}>
        <p>In the full version, you can:</p>
        <ul style={{textAlign: 'left'}}>
          <li>Connect to cloud storage (Google Drive, Dropbox)</li>
          <li>Integrate with CRM and ERP systems</li>
          <li>Set up webhook notifications</li>
          <li>Configure automated document workflows</li>
        </ul>
        <button style={{backgroundColor: '#61dafb', border: 'none', padding: '10px 20px', borderRadius: '4px', marginTop: '20px'}}>
          Manage Integrations (Demo)
        </button>
      </div>
    </div>;
  }

  export default App;
