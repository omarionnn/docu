#!/bin/bash

# Frontend setup script
echo "Setting up AI DocuSign frontend..."

# Create React app if not already created
if [ ! -f "package.json" ]; then
  echo "Creating React app..."
  npx create-react-app .
  
  # Clean up unnecessary files
  rm src/logo.svg
  rm src/App.test.js
  rm src/reportWebVitals.js
  rm src/setupTests.js
  
  # Update package.json with project details
  sed -i '' 's/"name": "frontend"/"name": "ai-docusign-frontend"/g' package.json
  
  # Add proxy for API requests
  sed -i '' 's/"private": true,/"private": true,\n  "proxy": "http:\/\/localhost:5000",/g' package.json
fi

# Install additional dependencies
echo "Installing additional dependencies..."
npm install axios react-router-dom react-toastify styled-components moment

# Create CSS files for components
echo "Creating CSS files for components..."
mkdir -p src/components/css
touch src/components/DocumentUpload.css
touch src/components/LegalTermExplainer.css

# Create App.js with router setup
echo "Setting up main App component..."
cat > src/App.js << EOF
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Import components
import DocumentUpload from './components/DocumentUpload';
import LegalTermExplainer from './components/LegalTermExplainer';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>AI DocuSign</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/templates">Templates</a></li>
              <li><a href="/documents">Documents</a></li>
            </ul>
          </nav>
        </header>
        
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<DocumentUpload />} />
            <Route path="/templates" element={<div>Templates Page</div>} />
            <Route path="/documents" element={<div>Documents Page</div>} />
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>&copy; 2023 AI DocuSign. All rights reserved.</p>
        </footer>
        
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

// Home component
const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h2>Intelligent Document Generation and Management</h2>
        <p>
          AI-powered document creation, analysis, and signing platform
          that simplifies your document workflows.
        </p>
        <div className="cta-buttons">
          <a href="/upload" className="btn btn-primary">Upload Document</a>
          <a href="/templates" className="btn btn-secondary">Browse Templates</a>
        </div>
      </div>
      
      <div className="features-section">
        <div className="feature-card">
          <h3>Smart Template Generation</h3>
          <p>Convert existing documents into reusable templates with AI-detected variables.</p>
        </div>
        <div className="feature-card">
          <h3>Legal Term Explanation</h3>
          <p>Get simple explanations for complex legal terms in your documents.</p>
        </div>
        <div className="feature-card">
          <h3>Secure E-Signatures</h3>
          <p>Legally compliant electronic signatures with audit trail.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
EOF

# Create App.css
echo "Creating App styles..."
cat > src/App.css << EOF
/* Global styles */
:root {
  --primary-color: #4a6cf7;
  --secondary-color: #6c757d;
  --accent-color: #3cbc8d;
  --light-color: #f8f9fa;
  --dark-color: #343a40;
  --danger-color: #dc3545;
  --success-color: #28a745;
  --border-color: #dee2e6;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--dark-color);
  background-color: #f5f7ff;
}

a {
  text-decoration: none;
  color: var(--primary-color);
}

ul {
  list-style: none;
}

/* App Container */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.app-header {
  background-color: white;
  padding: 1rem 2rem;
  box-shadow: var(--shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  color: var(--primary-color);
  font-size: 1.8rem;
}

.app-header nav ul {
  display: flex;
}

.app-header nav ul li {
  margin-left: 1.5rem;
}

.app-header nav ul li a {
  color: var(--dark-color);
  font-weight: 500;
  padding: 0.5rem;
  transition: color 0.3s;
}

.app-header nav ul li a:hover {
  color: var(--primary-color);
}

/* Main Content */
.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Footer */
.app-footer {
  background-color: white;
  padding: 1rem 2rem;
  text-align: center;
  color: var(--secondary-color);
  border-top: 1px solid var(--border-color);
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: #3a5bd9;
  color: white;
}

.btn-secondary {
  background-color: white;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn-secondary:hover {
  background-color: #f0f4ff;
}

/* Home Page Styles */
.home-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.hero-section {
  text-align: center;
  padding: 3rem 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.hero-section h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--dark-color);
}

.hero-section p {
  font-size: 1.2rem;
  color: var(--secondary-color);
  max-width: 800px;
  margin: 0 auto 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--shadow);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    padding: 1rem;
  }
  
  .app-header nav ul {
    margin-top: 1rem;
  }
  
  .app-header nav ul li {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .hero-section h2 {
    font-size: 2rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .app-main {
    padding: 1rem;
  }
}
EOF

# Create index.js
echo "Updating index.js..."
cat > src/index.js << EOF
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo "Frontend setup completed successfully!"
echo "To start the development server, run: npm start"