require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const documentRoutes = require('./routes/documents');
const customizationRoutes = require('./routes/customization');
const dataManagementRoutes = require('./routes/dataManagement');
// We'll add more routes as we implement other components

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // Logging

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', documentRoutes);
app.use('/api/customization', customizationRoutes);
app.use('/api/data', dataManagementRoutes);

// Define AI routes
app.post('/api/ai/identify-legal-terms', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Document content is required' });
    }
    
    const aiService = require('./services/aiService');
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
    
    const aiService = require('./services/aiService');
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
    
    if (!prompt || !document) {
      return res.status(400).json({ message: 'Prompt and document context are required' });
    }
    
    const aiService = require('./services/aiService');
    const generatedText = await aiService.generateText(prompt, document);
    
    res.json({ text: generatedText });
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
    
    const aiService = require('./services/aiService');
    const rules = await aiService.suggestConditionalRules(template);
    
    res.json({ rules });
  } catch (error) {
    console.error('Error suggesting rules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server, just log the error
});

module.exports = app;