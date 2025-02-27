#!/bin/bash

# Backend setup script
echo "Setting up AI DocuSign backend..."

# Initialize npm project if package.json doesn't exist
if [ ! -f "package.json" ]; then
  echo "Initializing npm project..."
  npm init -y
  
  # Update package.json with project details
  sed -i '' 's/"name": "backend"/"name": "ai-docusign-backend"/g' package.json
  sed -i '' 's/"description": ""/"description": "AI-powered document template generation and management system"/g' package.json
  sed -i '' 's/"author": ""/"author": "AI DocuSign Team"/g' package.json
  sed -i '' 's/"license": "ISC"/"license": "MIT"/g' package.json
  
  # Add scripts
  sed -i '' 's/"scripts": {/"scripts": {\n    "start": "node server.js",\n    "dev": "nodemon server.js",/g' package.json
fi

# Install dependencies
echo "Installing dependencies..."
npm install express mongoose cors dotenv morgan multer pdf-parse mammoth axios uuid jsonwebtoken express-rate-limit

# Install development dependencies
echo "Installing development dependencies..."
npm install --save-dev nodemon

# Create necessary directories if they don't exist
echo "Creating project structure..."
mkdir -p uploads middleware

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ai-docusign

# JWT Configuration
JWT_SECRET=your-development-secret-key
JWT_EXPIRES_IN=1d

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000

# Storage Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Email Configuration
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@ai-docusign.com
EOF

  echo "NOTE: Please update the .env file with your actual configuration values."
fi

# Create auth middleware
echo "Creating auth middleware..."
mkdir -p middleware
cat > middleware/auth.js << EOF
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Authentication middleware
 * Verifies JWT token in the request header
 */
module.exports = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Set user ID in request
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
EOF

echo "Backend setup completed successfully!"
echo "To start the server, run: npm run dev"