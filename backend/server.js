require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');

// Import routes
const documentRoutes = require('./routes/documents');
const customizationRoutes = require('./routes/customization');
const dataManagementRoutes = require('./routes/dataManagement');
const signatureRoutes = require('./routes/signatures');
// We'll add more routes as we implement other components

// Initialize Express app
const app = express();
// Use explicit port configuration - no auto-detection
const PORT = 5009; // Using port 5009 explicitly

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3009', 'http://localhost:5005', 'http://localhost:5009'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // Logging

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes for testing
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

// Debug route to test file uploads
app.post('/api/test-upload', (req, res) => {
  console.log('Test upload received:', req.body);
  console.log('Files:', req.files);
  res.json({ status: 'ok', message: 'Test upload endpoint reached' });
});

// Mock authentication middleware for demo purposes
app.use((req, res, next) => {
  // For demo purposes, set a mock user
  req.user = {
    _id: '64a2c41b5dc92f3456789012',
    name: 'Demo User',
    email: 'user@example.com'
  };
  next();
});

// Basic status endpoint
app.get('/api/status', (req, res) => {
  // Determine if we're in mock mode
  const useMockMode = !process.env.CLAUDE_API_KEY || 
                      process.env.CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY_HERE' || 
                      process.env.CLAUDE_API_KEY === 'mock-key';
                      
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    ai: {
      provider: 'claude',
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240229',
      apiConfigured: !useMockMode,
      mockMode: useMockMode,
      info: 'Using Claude integration for all AI features'
    }
  });
});

// Test endpoint for Claude AI
app.post('/api/test/claude', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    console.log('Testing Claude AI with prompt:', prompt);
    const result = await aiService.generateText(prompt, { name: 'Test Document' });
    
    res.json({
      success: true,
      result,
      aiProvider: 'claude'
    });
  } catch (error) {
    console.error('Error testing Claude AI:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error testing Claude AI', 
      error: error.message,
      usingMock: !process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'YOUR_CLAUDE_API_KEY_HERE' || process.env.CLAUDE_API_KEY === 'mock-key'
    });
  }
});

// Direct route handlers for mock data
app.get('/api/documents', (req, res) => {
  console.log("Fetching document list");
  const mockDocuments = [
    {
      _id: '64a2c41b5dc92f1234567890',
      name: 'Employment Contract',
      template: {
        _id: '64a2c41b5dc92f1234567891',
        name: 'Standard Employment Agreement'
      },
      status: 'draft',
      creator: '64a2c41b5dc92f3456789012',
      createdAt: '2023-08-01T10:00:00.000Z'
    },
    {
      _id: '64a2c41b5dc92f1234567892',
      name: 'Non-Disclosure Agreement',
      template: {
        _id: '64a2c41b5dc92f1234567893',
        name: 'Standard NDA'
      },
      status: 'draft',
      creator: '64a2c41b5dc92f3456789012',
      createdAt: '2023-08-05T14:30:00.000Z'
    }
  ];
  
  res.json(mockDocuments);
});

// Document detail endpoint
app.get('/api/documents/:id', (req, res) => {
  console.log(`Fetching document with ID: ${req.params.id}`);
  
  // Return a mock document regardless of ID for demonstration purposes
  const mockDocument = {
    _id: req.params.id,
    name: 'Employment Contract',
    template: {
      _id: '64a2c41b5dc92f1234567891',
      name: 'Standard Employment Agreement',
      variables: [
        {
          name: 'employer_name',
          pattern: "/{{employer_name}}/g",
          dataType: 'text',
          required: true,
          description: 'Name of the employer'
        },
        {
          name: 'employee_name',
          pattern: "/{{employee_name}}/g",
          dataType: 'text',
          required: true,
          description: 'Name of the employee'
        },
        {
          name: 'position_title',
          pattern: "/{{position_title}}/g",
          dataType: 'text',
          required: true,
          description: 'Job title of the employee'
        },
        {
          name: 'start_date',
          pattern: "/{{start_date}}/g",
          dataType: 'date',
          required: true,
          description: 'Start date of employment'
        },
        {
          name: 'contract_term',
          pattern: "/{{contract_term}}/g",
          dataType: 'text',
          required: true,
          description: 'Duration of employment contract'
        },
        {
          name: 'salary_amount',
          pattern: "/{{salary_amount}}/g",
          dataType: 'number',
          required: true,
          description: 'Salary amount'
        },
        {
          name: 'payment_period',
          pattern: "/{{payment_period}}/g",
          dataType: 'select',
          options: ['weekly', 'biweekly', 'monthly', 'annually'],
          required: true,
          description: 'Payment frequency'
        },
        {
          name: 'benefits_description',
          pattern: "/{{benefits_description}}/g",
          dataType: 'text',
          required: false,
          description: 'Description of employee benefits'
        },
        {
          name: 'notice_period',
          pattern: "/{{notice_period}}/g",
          dataType: 'text',
          required: true,
          description: 'Notice period for termination'
        }
      ]
    },
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and effective as of {{start_date}}, by and between {{employer_name}} ("Employer") and {{employee_name}} ("Employee").

1. POSITION AND DUTIES
<!-- BEGIN employment_duties -->
Employer hereby employs Employee as {{position_title}} to perform duties as described in the attached job description. Employee accepts such employment and agrees to perform the duties specified in a satisfactory and proper manner.
<!-- END employment_duties -->

2. TERM
<!-- BEGIN employment_term -->
This Agreement shall be for a term of {{contract_term}} beginning on {{start_date}}.
<!-- END employment_term -->

3. COMPENSATION
<!-- BEGIN compensation_section -->
As full compensation for all services provided, Employee shall receive:
a) Salary: {{salary_amount}} per {{payment_period}}
b) Benefits: {{benefits_description}}
<!-- END compensation_section -->

4. CONFIDENTIALITY
<!-- BEGIN confidentiality_clause -->
Employee acknowledges that they will have access to proprietary information, trade secrets, and confidential business information. Employee agrees that during employment and thereafter, they will not disclose such information without the Employer's consent.
<!-- END confidentiality_clause -->

5. TERMINATION
<!-- BEGIN termination_section -->
This Agreement may be terminated by Employer upon {{notice_period}} notice to Employee. Employer may terminate this Agreement immediately for cause.
<!-- END termination_section -->

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.

{{employer_signature}}
Employer

{{employee_signature}}
Employee`,
    status: 'draft',
    creator: '64a2c41b5dc92f3456789012',
    createdAt: '2023-08-01T10:00:00.000Z',
    filledVariables: [
      {
        name: 'employer_name',
        value: 'ABC Technologies, Inc.',
        originalPattern: "/{{employer_name}}/g"
      },
      {
        name: 'employee_name',
        value: 'John Smith',
        originalPattern: "/{{employee_name}}/g"
      },
      {
        name: 'position_title',
        value: 'Software Developer',
        originalPattern: "/{{position_title}}/g"
      },
      {
        name: 'start_date',
        value: 'January 1, 2023',
        originalPattern: "/{{start_date}}/g"
      }
    ],
    appliedRules: []
  };
  
  res.json(mockDocument);
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Set mock auth for all routes
const auth = require('./middleware/auth');

// Routes
// Use these routes after our direct handlers
app.use('/api', documentRoutes);
app.use('/api/customization', customizationRoutes);
app.use('/api/data', dataManagementRoutes);
app.use('/api/signatures', signatureRoutes);

// Mock signature routes for demonstration
app.get('/api/signatures/requests', (req, res) => {
  // Return mock signature requests
  const mockRequests = [
    {
      _id: 'req123',
      name: 'Employment Contract - John Smith',
      document: {
        _id: 'doc123',
        name: 'Employment Contract'
      },
      status: 'sent',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      expiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      signers: [
        {
          name: 'John Smith',
          email: 'john@example.com',
          role: 'Signer',
          order: 1,
          signature: null // not signed yet
        },
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'Approver',
          order: 2,
          signature: null // not signed yet
        }
      ],
      signatureOrder: true,
      message: 'Please review and sign this employment contract'
    },
    {
      _id: 'req456',
      name: 'NDA - Partner Company',
      document: {
        _id: 'doc456',
        name: 'Non-Disclosure Agreement'
      },
      status: 'completed',
      createdAt: new Date(Date.now() - 691200000).toISOString(), // 8 days ago
      completedAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      expiresAt: new Date(Date.now() + 1296000000).toISOString(), // 15 days from now
      signers: [
        {
          name: 'Robert Johnson',
          email: 'robert@example.com',
          role: 'Signer',
          order: 1,
          signature: 'sig789' // signed
        }
      ],
      signatureOrder: false,
      message: 'Please sign the NDA for our upcoming partnership'
    }
  ];
  
  res.json({ requests: mockRequests });
});

app.get('/api/signatures/requests/:id', (req, res) => {
  const requestId = req.params.id;
  
  // Return a mock signature request
  const mockRequest = {
    _id: requestId,
    name: 'Employment Contract - John Smith',
    document: {
      _id: 'doc123',
      name: 'Employment Contract'
    },
    status: 'sent',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    expiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
    signers: [
      {
        name: 'John Smith',
        email: 'john@example.com',
        role: 'Signer',
        order: 1,
        signature: null // not signed yet
      },
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Approver',
        order: 2,
        signature: null // not signed yet
      }
    ],
    signatureOrder: true,
    message: 'Please review and sign this employment contract'
  };
  
  res.json(mockRequest);
});

app.post('/api/signatures/requests/:id/remind', (req, res) => {
  const requestId = req.params.id;
  
  // Return success
  res.json({ 
    success: true, 
    message: 'Reminders sent successfully',
    remindersCount: 1
  });
});

app.post('/api/signatures/requests/:id/cancel', (req, res) => {
  const requestId = req.params.id;
  
  // Return updated request with canceled status
  res.json({
    _id: requestId,
    status: 'canceled',
    cancelReason: req.body.reason || 'Request canceled by user'
  });
});

app.get('/api/signatures/sign/:token', (req, res) => {
  const token = req.params.token;
  
  // Return mock signing data
  res.json({
    request: {
      _id: 'req123',
      name: 'Employment Contract - John Smith',
      document: {
        _id: 'doc123',
        name: 'Employment Contract',
        content: 'This is the document content...'
      },
      message: 'Please review and sign this employment contract',
      settings: {
        allowDecline: true
      },
      signers: [
        {
          name: 'John Smith',
          email: 'john@example.com',
          role: 'Signer',
          order: 1,
          signature: null
        },
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'Approver',
          order: 2,
          signature: null
        }
      ]
    },
    signer: {
      name: 'John Smith',
      email: 'john@example.com',
      role: 'Signer',
      order: 1
    },
    canSign: true,
    alreadySigned: false
  });
});

app.post('/api/signatures/sign/:token', (req, res) => {
  const token = req.params.token;
  const { signatureData, signatureType } = req.body;
  
  // Return mock signature response
  res.json({
    signature: {
      _id: 'sig123',
      signatureData: signatureData,
      signatureType: signatureType,
      status: 'signed',
      signedAt: new Date().toISOString()
    },
    request: {
      _id: 'req123',
      status: 'sent',
      signers: [
        {
          name: 'John Smith',
          email: 'john@example.com',
          signature: 'sig123'
        },
        {
          name: 'Jane Doe',
          email: 'jane@example.com',
          signature: null
        }
      ]
    },
    isComplete: false
  });
});

app.post('/api/signatures/requests', (req, res) => {
  const { documentId, name, message, signers, settings } = req.body;
  
  // Return a mock created signature request
  const mockRequest = {
    _id: 'req' + Math.floor(Math.random() * 10000),
    name,
    document: {
      _id: documentId,
      name: "Document " + documentId
    },
    message,
    signers: signers.map((signer, index) => ({
      ...signer,
      signature: null,
      accessToken: 'token' + Math.floor(Math.random() * 10000)
    })),
    status: 'draft',
    createdAt: new Date().toISOString(),
    settings: settings || {
      allowDecline: true,
      expiryDays: 30
    }
  };
  
  res.status(201).json(mockRequest);
});

app.post('/api/signatures/requests/:id/send', (req, res) => {
  const requestId = req.params.id;
  
  // Return the updated request with 'sent' status
  res.json({
    _id: requestId,
    status: 'sent',
    sentAt: new Date().toISOString()
  });
});

// Import AI service
const aiService = require('./services/aiService');

// Define AI routes
app.post('/api/ai/identify-legal-terms', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Document content is required' });
    }
    
    const terms = await aiService.identifyLegalTerms(content);
    res.json(terms);
  } catch (error) {
    console.error('Error identifying legal terms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/ai/explain-legal-term', async (req, res) => {
  try {
    const { term, context } = req.body;
    
    if (!term) {
      return res.status(400).json({ message: 'Term is required' });
    }
    
    const explanation = await aiService.explainLegalTerm(term, context);
    res.json(explanation);
  } catch (error) {
    console.error('Error explaining legal term:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/ai/generate-text', async (req, res) => {
  try {
    const { prompt, document } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    
    const generatedText = await aiService.generateText(prompt, document);
    res.json({ generatedText });
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/ai/suggest-rules', async (req, res) => {
  try {
    const { template } = req.body;
    
    if (!template) {
      return res.status(400).json({ message: 'Template data is required' });
    }
    
    const suggestions = await aiService.suggestConditionalRules(template);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting rules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New Claude-specific endpoints
app.post('/api/ai/summarize-document', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Document content is required' });
    }
    
    const summary = await aiService.summarizeDocument(content);
    res.json(summary);
  } catch (error) {
    console.error('Error summarizing document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/ai/analyze-compliance', async (req, res) => {
  try {
    const { content, industry, jurisdiction } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Document content is required' });
    }
    
    if (!industry) {
      return res.status(400).json({ message: 'Industry is required' });
    }
    
    if (!jurisdiction) {
      return res.status(400).json({ message: 'Jurisdiction is required' });
    }
    
    const compliance = await aiService.analyzeCompliance(content, industry, jurisdiction);
    res.json(compliance);
  } catch (error) {
    console.error('Error analyzing compliance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Document analysis endpoint for variable detection
app.post('/api/ai/analyze-document', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Document content is required' });
    }
    
    console.log('Analyzing document for variables with Claude AI');
    const variables = await aiService.analyzeDocument(content);
    
    res.json({
      variables,
      count: variables.length,
      aiProvider: 'claude'
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Additional customization endpoints for the DocumentCustomizer component
app.post('/api/customization/templates/rules/suggest', (req, res) => {
  console.log('Suggesting rules for template');
  
  // Mock response for demo - employment specific rules
  const mockRules = [
    {
      name: "Hide Probation Period for Senior Roles",
      description: "Hides the probation period section for senior level positions",
      condition: {
        type: "simple",
        variable: "position_title",
        operator: "contains",
        value: "Senior"
      },
      action: "hide",
      targetVariables: ["employment_probation"]
    },
    {
      name: "Show Remote Work Section",
      description: "Shows remote work clauses when the employment type includes remote work",
      condition: {
        type: "simple",
        variable: "work_location",
        operator: "contains",
        value: "Remote"
      },
      action: "show",
      targetVariables: ["remote_work_clause"]
    },
    {
      name: "Add Performance Bonus for Sales Positions",
      description: "Adds performance bonus text for sales positions",
      condition: {
        type: "simple",
        variable: "position_title",
        operator: "contains",
        value: "Sales"
      },
      action: "insertText",
      targetVariables: ["benefits_description:Standard benefits package plus commission-based performance bonuses based on sales targets."]
    },
    {
      name: "Add Non-Compete for Technical Roles",
      description: "Adds non-compete clause for technical positions",
      condition: {
        type: "simple",
        variable: "position_title",
        operator: "contains",
        value: "Developer"
      },
      action: "show",
      targetVariables: ["non_compete_clause"]
    }
  ];
  
  res.json({ suggestions: mockRules });
});

app.post('/api/customization/rules/apply', (req, res) => {
  console.log('Applying rules to document');
  const { documentId, rules } = req.body;
  
  if (!documentId || !rules) {
    return res.status(400).json({ message: 'Document ID and rules are required' });
  }
  
  // In a real implementation, this would modify the document based on rules
  // For the demo, we'll just return the document with rules applied
  const mockDocument = {
    _id: documentId,
    name: 'Employment Contract (Modified)',
    template: {
      _id: '64a2c41b5dc92f1234567891',
      name: 'Standard Employment Agreement'
    },
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and effective as of January 1, 2023, by and between ABC Technologies, Inc. ("Employer") and John Smith ("Employee").

1. POSITION AND DUTIES
Employer hereby employs Employee as Software Developer to perform duties as described in the attached job description. Employee accepts such employment and agrees to perform the duties specified in a satisfactory and proper manner.

2. TERM
This Agreement shall be for a term of 12 months beginning on January 1, 2023.

3. COMPENSATION
As full compensation for all services provided, Employee shall receive:
a) Salary: $120,000 per year
b) Benefits: Health insurance, 401(k) matching, and 15 days PTO annually
c) Performance Bonus: Employee may be eligible for performance bonuses as outlined in the company's incentive plan.

4. CONFIDENTIALITY
Employee acknowledges that they will have access to proprietary information, trade secrets, and confidential business information. Employee agrees that during employment and thereafter, they will not disclose such information without the Employer's consent.

5. TERMINATION
This Agreement may be terminated by Employer upon 30 days notice to Employee. Employer may terminate this Agreement immediately for cause.

6. DATA PROTECTION AND PRIVACY
Employee agrees to comply with all company data protection policies and applicable data privacy laws, including keeping all customer and employee data strictly confidential.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.

________________________
Employer

________________________
Employee`,
    status: 'draft',
    creator: '64a2c41b5dc92f3456789012',
    createdAt: '2023-08-01T10:00:00.000Z',
    filledVariables: [
      {
        name: 'employer_name',
        value: 'ABC Technologies, Inc.',
        originalPattern: "/{{employer_name}}/g"
      },
      {
        name: 'employee_name',
        value: 'John Smith',
        originalPattern: "/{{employee_name}}/g"
      },
      {
        name: 'position_title',
        value: 'Software Developer',
        originalPattern: "/{{position_title}}/g"
      },
      {
        name: 'start_date',
        value: 'January 1, 2023',
        originalPattern: "/{{start_date}}/g"
      },
      {
        name: 'contract_term',
        value: '12 months',
        originalPattern: "/{{contract_term}}/g"
      },
      {
        name: 'salary_amount',
        value: '$120,000',
        originalPattern: "/{{salary_amount}}/g"
      },
      {
        name: 'payment_period',
        value: 'year',
        originalPattern: "/{{payment_period}}/g"
      },
      {
        name: 'benefits_description',
        value: 'Health insurance, 401(k) matching, and 15 days PTO annually',
        originalPattern: "/{{benefits_description}}/g"
      },
      {
        name: 'notice_period',
        value: '30 days',
        originalPattern: "/{{notice_period}}/g"
      }
    ],
    appliedRules: rules
  };
  
  res.json({
    message: 'Rules applied successfully',
    document: mockDocument
  });
});

// Context analysis endpoint
app.post('/api/customization/context/analyze', (req, res) => {
  console.log('Analyzing document context');
  
  // Mock response for context analysis
  const contextAnalysis = {
    contextAnalysis: {
      alignment: "The document has moderate alignment with the provided context.",
      keyFactors: [
        "Contract is for a standard employment position",
        "No specific industry compliance requirements detected",
        "General terms are appropriate for the context"
      ]
    },
    suggestions: [
      {
        type: "add",
        target: "remote_work_clause",
        reason: "Context indicates remote work is applicable",
        content: "Employee may work remotely as agreed upon by both parties. Employer will provide necessary equipment for remote work."
      },
      {
        type: "modify",
        target: "compensation_section",
        reason: "Context suggests additional performance incentives",
        content: "As full compensation for all services provided, Employee shall receive:\na) Salary: {{salary_amount}} per {{payment_period}}\nb) Benefits: {{benefits_description}}\nc) Performance Bonus: Employee may be eligible for performance bonuses as outlined in the company's incentive plan."
      }
    ],
    riskFactors: [
      {
        risk: "Missing data protection clause",
        severity: "medium",
        mitigation: "Add a data protection clause to address handling of sensitive information."
      },
      {
        risk: "Vague termination terms",
        severity: "low",
        mitigation: "Consider specifying what constitutes 'cause' for immediate termination."
      }
    ]
  };
  
  res.json(contextAnalysis);
});

// Context adaptation endpoint
app.post('/api/customization/context/adapt', (req, res) => {
  console.log('Adapting document based on context');
  const { documentId, adaptations } = req.body;
  
  if (!documentId || !adaptations) {
    return res.status(400).json({ message: 'Document ID and adaptations are required' });
  }
  
  // In a real implementation, this would modify the document based on adaptations
  // For the demo, we'll just return a modified document
  const mockDocument = {
    _id: documentId,
    name: 'Employment Contract (Adapted)',
    template: {
      _id: '64a2c41b5dc92f1234567891',
      name: 'Standard Employment Agreement'
    },
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and effective as of January 1, 2023, by and between ABC Technologies, Inc. ("Employer") and John Smith ("Employee").

1. POSITION AND DUTIES
Employer hereby employs Employee as Software Developer to perform duties as described in the attached job description. Employee accepts such employment and agrees to perform the duties specified in a satisfactory and proper manner.

2. TERM
This Agreement shall be for a term of 12 months beginning on January 1, 2023.

3. COMPENSATION
As full compensation for all services provided, Employee shall receive:
a) Salary: $120,000 per year
b) Benefits: Health insurance, 401(k) matching, and 15 days PTO annually
c) Performance Bonus: Employee may be eligible for performance bonuses as outlined in the company's incentive plan.

4. CONFIDENTIALITY
Employee acknowledges that they will have access to proprietary information, trade secrets, and confidential business information. Employee agrees that during employment and thereafter, they will not disclose such information without the Employer's consent.

5. REMOTE WORK PROVISIONS
Employee may work remotely as agreed upon by both parties. Employer will provide necessary equipment for remote work. Employee agrees to maintain a safe and productive home office environment.

6. TERMINATION
This Agreement may be terminated by Employer upon 30 days notice to Employee. Employer may terminate this Agreement immediately for cause.

7. DATA PROTECTION AND PRIVACY
Employee agrees to comply with all company data protection policies and applicable data privacy laws, including keeping all customer and employee data strictly confidential.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.

________________________
Employer

________________________
Employee`,
    status: 'draft',
    creator: '64a2c41b5dc92f3456789012',
    createdAt: '2023-08-01T10:00:00.000Z',
    filledVariables: [
      {
        name: 'employer_name',
        value: 'ABC Technologies, Inc.',
        originalPattern: "/{{employer_name}}/g"
      },
      {
        name: 'employee_name',
        value: 'John Smith',
        originalPattern: "/{{employee_name}}/g"
      },
      {
        name: 'position_title',
        value: 'Software Developer',
        originalPattern: "/{{position_title}}/g"
      },
      {
        name: 'start_date',
        value: 'January 1, 2023',
        originalPattern: "/{{start_date}}/g"
      }
    ],
    appliedRules: []
  };
  
  res.json({
    message: 'Document adapted successfully',
    document: mockDocument
  });
});

// Add document preview endpoint
app.post('/api/documents/preview', (req, res) => {
  console.log('Generating document preview');
  const { documentId, rules } = req.body;
  
  if (!documentId) {
    return res.status(400).json({ message: 'Document ID is required' });
  }
  
  // For the demo, we'll just return a modified content based on rules
  let content = `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and effective as of January 1, 2023, by and between ABC Technologies, Inc. ("Employer") and John Smith ("Employee").

1. POSITION AND DUTIES
Employer hereby employs Employee as Software Developer to perform duties as described in the attached job description. Employee accepts such employment and agrees to perform the duties specified in a satisfactory and proper manner.

2. TERM
This Agreement shall be for a term of 12 months beginning on January 1, 2023.`;

  // Add content based on rules
  if (rules && rules.length > 0) {
    // Just checking if we have specific rules we want to show in preview
    const hasRemoteWorkRule = rules.some(rule => 
      rule.targetVariables && rule.targetVariables.includes('remote_work_clause'));
    
    const hasNonCompeteRule = rules.some(rule => 
      rule.targetVariables && rule.targetVariables.includes('non_compete_clause'));
    
    const hasPerformanceBonusRule = rules.some(rule => 
      rule.action === 'insertText' && rule.targetVariables && 
      rule.targetVariables.some(target => target.includes('benefits_description')));
    
    // Add sections based on rules
    content += `

3. COMPENSATION
As full compensation for all services provided, Employee shall receive:
a) Salary: $120,000 per year
b) Benefits: Health insurance, 401(k) matching, and 15 days PTO annually`;

    if (hasPerformanceBonusRule) {
      content += `
c) Performance Bonus: Employee may be eligible for performance bonuses as outlined in the company's incentive plan.`;
    }

    content += `

4. CONFIDENTIALITY
Employee acknowledges that they will have access to proprietary information, trade secrets, and confidential business information. Employee agrees that during employment and thereafter, they will not disclose such information without the Employer's consent.`;

    if (hasRemoteWorkRule) {
      content += `

5. REMOTE WORK PROVISIONS
Employee may work remotely as agreed upon by both parties. Employer will provide necessary equipment for remote work. Employee agrees to maintain a safe and productive home office environment.`;
    }

    if (hasNonCompeteRule) {
      content += `

6. NON-COMPETE
Employee agrees that for a period of 12 months following termination of employment, Employee shall not engage in any business that competes with Employer in any geographic area where Employer operates.`;
    }

    content += `

7. TERMINATION
This Agreement may be terminated by Employer upon 30 days notice to Employee. Employer may terminate this Agreement immediately for cause.

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.

________________________
Employer

________________________
Employee`;
  }
  
  res.json({ content });
});

// Add document text generation endpoint
app.post('/api/documents/generate-text', (req, res) => {
  console.log('Generating text for document');
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }
  
  // Sample generated texts based on common prompts
  const sampleTexts = {
    'data protection': 'Employee agrees to comply with all applicable data protection laws and regulations, including but not limited to GDPR, CCPA, and other relevant privacy legislation. Employee will maintain strict confidentiality of all personal data processed during the course of employment and will follow company security protocols when handling such information.',
    'disclaimer': 'This document is provided for informational purposes only and does not constitute legal advice. The terms contained herein may not be appropriate for all situations. Parties are advised to seek independent legal counsel before signing this agreement.',
    'compliance': 'This agreement complies with all relevant employment laws and regulations as of the effective date. Both parties acknowledge their obligation to maintain compliance with any changes in applicable laws that may occur during the term of this agreement.',
    'performance bonus': 'Employee shall be eligible for performance bonuses based on the achievement of individual, team, and company objectives as defined in the company\'s incentive compensation plan. Such bonuses shall be at the discretion of the Employer and may be modified from time to time with reasonable notice to Employee.',
    'remote work': 'Employee may perform duties remotely from a location other than Employer\'s premises, subject to Employer\'s remote work policy. Employee shall maintain a safe working environment, ensure the security of company information, and remain accessible during agreed-upon working hours.'
  };
  
  // Look for keywords in the prompt
  let generatedText = 'This is a generated text placeholder. In a production environment, this would be generated by an AI service based on your specific prompt.';
  
  Object.entries(sampleTexts).forEach(([key, text]) => {
    if (prompt.toLowerCase().includes(key)) {
      generatedText = text;
    }
  });
  
  res.json({ generatedText });
});

// Mock data API routes for testing
app.get('/api/documents', (req, res) => {
  const mockDocuments = [
    {
      _id: '64a2c41b5dc92f1234567890',
      name: 'Employment Contract',
      template: {
        _id: '64a2c41b5dc92f1234567891',
        name: 'Standard Employment Agreement'
      },
      content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and effective as of {{start_date}}, by and between {{employer_name}} ("Employer") and {{employee_name}} ("Employee").

1. POSITION AND DUTIES
<!-- BEGIN employment_duties -->
Employer hereby employs Employee as {{position_title}} to perform duties as described in the attached job description. Employee accepts such employment and agrees to perform the duties specified in a satisfactory and proper manner.
<!-- END employment_duties -->

2. TERM
<!-- BEGIN employment_term -->
This Agreement shall be for a term of {{contract_term}} beginning on {{start_date}}.
<!-- END employment_term -->

3. COMPENSATION
<!-- BEGIN compensation_section -->
As full compensation for all services provided, Employee shall receive:
a) Salary: {{salary_amount}} per {{payment_period}}
b) Benefits: {{benefits_description}}
<!-- END compensation_section -->

4. CONFIDENTIALITY
<!-- BEGIN confidentiality_clause -->
Employee acknowledges that they will have access to proprietary information, trade secrets, and confidential business information. Employee agrees that during employment and thereafter, they will not disclose such information without the Employer's consent.
<!-- END confidentiality_clause -->

5. TERMINATION
<!-- BEGIN termination_section -->
This Agreement may be terminated by Employer upon {{notice_period}} notice to Employee. Employer may terminate this Agreement immediately for cause.
<!-- END termination_section -->

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.

{{employer_signature}}
Employer

{{employee_signature}}
Employee`,
      status: 'draft',
      creator: '64a2c41b5dc92f3456789012',
      createdAt: '2023-08-01T10:00:00.000Z',
      filledVariables: [
        {
          name: 'employer_name',
          value: 'ABC Technologies, Inc.',
          originalPattern: "/{{employer_name}}/g"
        },
        {
          name: 'position_title',
          value: 'Software Developer',
          originalPattern: "/{{position_title}}/g"
        }
      ]
    },
    {
      _id: '64a2c41b5dc92f1234567892',
      name: 'Non-Disclosure Agreement',
      template: {
        _id: '64a2c41b5dc92f1234567893',
        name: 'Standard NDA'
      },
      content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into by and between {{party_1_name}} ("Disclosing Party") and {{party_2_name}} ("Receiving Party") as of {{effective_date}}.

1. PURPOSE
<!-- BEGIN purpose_section -->
The Receiving Party wishes to receive certain confidential information from the Disclosing Party for the purpose of {{business_purpose}}.
<!-- END purpose_section -->

2. CONFIDENTIAL INFORMATION
<!-- BEGIN confidential_info_section -->
"Confidential Information" means any information disclosed by the Disclosing Party to the Receiving Party, either directly or indirectly, in writing, orally or by inspection of tangible objects, which is designated as "Confidential" or would reasonably be understood to be confidential.
<!-- END confidential_info_section -->

3. TERM
<!-- BEGIN term_section -->
This Agreement shall remain in effect for a period of {{agreement_term}} from the Effective Date.
<!-- END term_section -->

4. OBLIGATIONS
<!-- BEGIN obligations_section -->
The Receiving Party shall:
a) Use the Confidential Information only for the Purpose described above;
b) Restrict disclosure of Confidential Information to its employees with a need to know;
c) Advise such employees of their obligations with respect to the Confidential Information;
d) Copy the Confidential Information only as necessary for the Purpose;
e) Protect the Confidential Information with at least the same degree of care used to protect its own confidential information.
<!-- END obligations_section -->

5. RETURN OF MATERIALS
<!-- BEGIN return_section -->
Upon the termination of this Agreement, the Receiving Party shall return all confidential materials provided by the Disclosing Party.
<!-- END return_section -->

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

{{party_1_signature}}
{{party_1_name}}

{{party_2_signature}}
{{party_2_name}}`,
      status: 'draft',
      creator: '64a2c41b5dc92f3456789012',
      createdAt: '2023-08-05T14:30:00.000Z',
      filledVariables: [
        {
          name: 'party_1_name',
          value: 'XYZ Corporation',
          originalPattern: "/{{party_1_name}}/g"
        },
        {
          name: 'party_2_name',
          value: 'Acme Consulting',
          originalPattern: "/{{party_2_name}}/g"
        }
      ]
    }
  ];
  
  res.json(mockDocuments);
});

app.get('/api/documents/:id', (req, res) => {
  const documentId = req.params.id;
  
  // For demo purposes, we'll return a mock document based on ID
  const mockDocument = {
    _id: documentId,
    name: 'Employment Contract',
    template: {
      _id: '64a2c41b5dc92f1234567891',
      name: 'Standard Employment Agreement',
      variables: [
        {
          name: 'employer_name',
          pattern: "/{{employer_name}}/g",
          dataType: 'text',
          required: true,
          description: 'Name of the employer'
        },
        {
          name: 'employee_name',
          pattern: "/{{employee_name}}/g",
          dataType: 'text',
          required: true,
          description: 'Name of the employee'
        },
        {
          name: 'position_title',
          pattern: "/{{position_title}}/g",
          dataType: 'text',
          required: true,
          description: 'Job title of the employee'
        },
        {
          name: 'contract_term',
          pattern: "/{{contract_term}}/g",
          dataType: 'text',
          required: true,
          description: 'Duration of the employment contract'
        }
      ]
    },
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and effective as of {{start_date}}, by and between {{employer_name}} ("Employer") and {{employee_name}} ("Employee").

1. POSITION AND DUTIES
<!-- BEGIN employment_duties -->
Employer hereby employs Employee as {{position_title}} to perform duties as described in the attached job description. Employee accepts such employment and agrees to perform the duties specified in a satisfactory and proper manner.
<!-- END employment_duties -->

2. TERM
<!-- BEGIN employment_term -->
This Agreement shall be for a term of {{contract_term}} beginning on {{start_date}}.
<!-- END employment_term -->

3. COMPENSATION
<!-- BEGIN compensation_section -->
As full compensation for all services provided, Employee shall receive:
a) Salary: {{salary_amount}} per {{payment_period}}
b) Benefits: {{benefits_description}}
<!-- END compensation_section -->

4. CONFIDENTIALITY
<!-- BEGIN confidentiality_clause -->
Employee acknowledges that they will have access to proprietary information, trade secrets, and confidential business information. Employee agrees that during employment and thereafter, they will not disclose such information without the Employer's consent.
<!-- END confidentiality_clause -->

5. TERMINATION
<!-- BEGIN termination_section -->
This Agreement may be terminated by Employer upon {{notice_period}} notice to Employee. Employer may terminate this Agreement immediately for cause.
<!-- END termination_section -->

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.

{{employer_signature}}
Employer

{{employee_signature}}
Employee`,
    status: 'draft',
    creator: '64a2c41b5dc92f3456789012',
    createdAt: '2023-08-01T10:00:00.000Z',
    filledVariables: [
      {
        name: 'employer_name',
        value: 'ABC Technologies, Inc.',
        originalPattern: "/{{employer_name}}/g"
      },
      {
        name: 'employee_name',
        value: 'John Smith',
        originalPattern: "/{{employee_name}}/g"
      },
      {
        name: 'position_title',
        value: 'Software Developer',
        originalPattern: "/{{position_title}}/g"
      },
      {
        name: 'start_date',
        value: 'January 1, 2023',
        originalPattern: "/{{start_date}}/g"
      }
    ],
    appliedRules: []
  };
  
  res.json(mockDocument);
});

app.post('/api/customization/context/analyze', (req, res) => {
  // Mock response for context analysis
  const contextAnalysis = {
    contextAnalysis: {
      alignment: "The document has moderate alignment with the provided context.",
      keyFactors: [
        "Contract is for a standard employment position",
        "No specific industry compliance requirements detected",
        "General terms are appropriate for the context"
      ]
    },
    suggestions: [
      {
        type: "add",
        target: "remote_work_clause",
        reason: "Context indicates remote work is applicable",
        content: "Employee may work remotely as agreed upon by both parties. Employer will provide necessary equipment for remote work."
      },
      {
        type: "modify",
        target: "compensation_section",
        reason: "Context suggests additional performance incentives",
        content: "As full compensation for all services provided, Employee shall receive:\na) Salary: {{salary_amount}} per {{payment_period}}\nb) Benefits: {{benefits_description}}\nc) Performance Bonus: Employee may be eligible for performance bonuses as outlined in the company's incentive plan."
      }
    ],
    riskFactors: [
      {
        risk: "Missing data protection clause",
        severity: "medium",
        mitigation: "Add a data protection clause to address handling of sensitive information."
      },
      {
        risk: "Vague termination terms",
        severity: "low",
        mitigation: "Consider specifying what constitutes 'cause' for immediate termination."
      }
    ]
  };
  
  res.json(contextAnalysis);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Connect to MongoDB if USE_MONGODB is true in .env
if (process.env.USE_MONGODB === 'true') {
  console.log('Connecting to MongoDB...');
  // Connect to MongoDB
  mongoose
    .connect(config.mongodb.uri, config.mongodb.options)
    .then(() => {
      console.log('Connected to MongoDB at:', config.mongodb.uri);
      startServer();
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB', err);
      console.log('Starting server without database...');
      startServer();
    });
} else {
  console.log('Starting server without database (USE_MONGODB not enabled)...');
  startServer();
}

function startServer() {
  // Start server with explicit port - no auto-detection
  app.listen(PORT, () => {
    console.log(`Server running on fixed port ${PORT}`);
  }).on('error', (err) => {
    console.error('Server error:', err);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server, just log the error
});

module.exports = app;
