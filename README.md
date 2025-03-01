# Saafi - Intelligent Document Management

An AI-powered document template generation and management system that helps create, customize, and manage legal and business documents.

## Features

### Template Generation System
- Document analysis engine to scan existing documents
- Variable detection and extraction capability
- Template storage and management interface

### Dynamic Document Customization
- Rule-based document adaptation system
- Conditional logic for document sections
- Personalization engine based on user inputs
- Situational context analyzer

### Legal Term Explainer
- Identify complex legal terms in documents
- Provide plain-language explanations
- Contextual information for better understanding

### Intelligent Data Management
- User profile/data repository to store previously entered information
- Data retrieval system for auto-filling forms
- Duplicate information detection

## Project Structure

```
saafi/
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
│       ├── services/   # API service calls
│       └── utils/      # Utility functions
```

## Quick Start Guide

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (optional for full functionality)
- OpenAI API key (optional for AI features)

### Installation

1. **Clone this repository:**
   ```bash
   git clone https://github.com/omarionnn/docu.git
   cd docu
   ```

2. **Run the setup script:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Start the application:**
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## User Guide

### Uploading Documents
1. Navigate to the "Create New Template" page
2. Drag and drop a document (PDF, DOCX, TXT) or click to browse files
3. Fill in template details (name, description, category, tags)
4. Click "Create Template" to process the document

### Customizing Documents
1. Select a template from your library
2. Create custom rules to show/hide sections based on variables
3. Use the Context tab to analyze document fit for specific situations
4. Generate AI-powered text to include in the document
5. Preview changes in real-time

### Explaining Legal Terms
1. Select text containing legal terminology
2. Use the Legal Term Explainer to get plain-language explanations
3. View contextual information about the term's implications

## Development

The application is structured with a React frontend and Node.js/Express backend. The setup scripts will install all necessary dependencies.

### Backend Environment Variables
Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/saafi
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-api-key
```

### Frontend Environment Variables
Create a `.env` file in the frontend directory with:
```
REACT_APP_API_URL=http://localhost:5000
```

## License

MIT

