 #!/bin/bash

  # AI DocuSign - Main Setup Script
  echo "Setting up AI DocuSign project..."

  # Give execution permissions to all setup scripts
  chmod +x backend/setup.sh
  chmod +x frontend/setup.sh

  # Set up the backend
  echo ""
  echo "===================="
  echo "Setting up backend..."
  echo "===================="
  cd backend
  ./setup.sh
  cd ..

  # Set up the frontend
  echo ""
  echo "===================="
  echo "Setting up frontend..."
  echo "===================="
  cd frontend
  ./setup.sh
  cd ..

  # Create a README file
  echo "Creating main README.md file..."
  cat > README.md << 'EOF'
  # AI DocuSign

  An AI-powered document template generation and management system.

  ## Features

  ### Template Generation System
  - Document analysis engine to scan existing documents
  - Variable detection and extraction capability
  - Template storage and management interface

  ### Intelligent Data Management
  - User profile/data repository to store previously entered information
  - Data retrieval system for auto-filling forms
  - Integration with public data sources
  - Duplicate information detection

  ### Interactive Guidance Interface
  - Voice-based assistant for document completion
  - Terms and conditions explainer
  - Context-aware help system
  - Error detection and correction suggestions

  ### Dynamic Document Customization
  - Rule-based document adaptation system
  - Conditional logic for document sections
  - Personalization engine based on signer profiles
  - Situational context analyzer

  ### Integration Framework
  - API development for third-party integration
  - Webhook system
  - SDK for developers
  - Workflow automation tools

  ### E-Signature Core Infrastructure
  - Secure signature capture and verification
  - Compliance with legal e-signature standards
  - Audit trail and document history
  - Multi-party signing coordination

  ### Security and Compliance Layer
  - Document encryption
  - Permission management
  - Compliance with industry regulations (GDPR, HIPAA, etc.)
  - Identity verification

  ## Project Structure

  ai-docusign/
  ├── backend/            # Node.js Express backend
  │   ├── config/         # Configuration files
  │   ├── middleware/     # Custom middleware
  │   ├── models/         # MongoDB models
  │   ├── routes/         # API routes
  │   ├── services/       # Business logic services
  │   ├── uploads/        # Document uploads storage
  │   └── server.js       # Main server file
  ├── frontend/           # React frontend
  │   ├── public/         # Static files
  │   └── src/            # Source files
  │       ├── components/ # React components
  │       ├── pages/      # Page components
  │       ├── services/   # API service calls
  │       └── utils/      # Utility functions

  ## Getting Started

  ### Prerequisites

  - Node.js (v14 or higher)
  - MongoDB
  - OpenAI API key

  ### Installation

  1. Clone this repository:
     git clone https://github.com/yourusername/ai-docusign.git
     cd ai-docusign

  2. Set up environment variables:
  - Create a `.env` file in the backend directory
  - Add the necessary environment variables (see `.env.example`)

  3. Install dependencies and start development servers:
  Backend setup

     cd backend
     npm install
     npm run dev

  Frontend setup (in a new terminal)

     cd frontend
     npm install
     npm start

  4. Access the application:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:5000

  ## License

  MIT
  EOF

  echo ""
  echo "=================================="
  echo "AI DocuSign setup is complete!"
  echo "=================================="
  echo ""
  echo "To start the backend:"
  echo "  cd backend"
  echo "  npm run dev"
  echo ""
  echo "To start the frontend:"
  echo "  cd frontend"
  echo "  npm start"
  echo ""
  echo "Note: Make sure to update the environment variables in backend/.env before starting."

