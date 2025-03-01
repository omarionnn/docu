#!/bin/bash

# AI DocuSign Frontend Setup Script
echo "Setting up AI DocuSign frontend..."

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << 'ENVEOF'
REACT_APP_API_URL=http://localhost:5000
REACT_APP_VERSION=0.1.0
ENVEOF
fi

# Build the frontend (optional for development)
# echo "Building frontend..."
# npm run build

echo "Frontend setup complete!"

