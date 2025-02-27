const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const documentParser = require('../services/documentParser');
const { Template, Document } = require('../models/Document');
const auth = require('../middleware/auth'); // Assuming you'll create authentication middleware

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

// File filter for allowed document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * @route POST /api/templates/upload
 * @desc Upload document and create template
 * @access Private
 */
router.post('/templates/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const parsedDocument = await documentParser.parseDocument(filePath);
    
    // Create template from parsed document
    const template = new Template({
      name: req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      description: req.body.description || '',
      content: parsedDocument.content,
      fileType: path.extname(req.file.originalname).substring(1),
      originalFileName: req.file.originalname,
      variables: parsedDocument.variables,
      metadata: parsedDocument.metadata,
      category: req.body.category || 'General',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      owner: req.user._id
    });

    await template.save();
    
    res.status(201).json({ 
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/templates
 * @desc Get all templates for the current user
 * @access Private
 */
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = await Template.find({ 
      $or: [
        { owner: req.user._id },
        { isPublic: true }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/templates/:id
 * @desc Get template by ID
 * @access Private
 */
router.get('/templates/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user has access to this template
    if (!template.isPublic && template.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/templates/:id
 * @desc Update template
 * @access Private
 */
router.put('/templates/:id', auth, async (req, res) => {
  try {
    let template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user owns this template
    if (template.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Fields to update
    const { 
      name, 
      description, 
      category, 
      tags, 
      isPublic, 
      variables 
    } = req.body;
    
    // Update template
    if (name) template.name = name;
    if (description) template.description = description;
    if (category) template.category = category;
    if (tags) template.tags = tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) template.isPublic = isPublic;
    if (variables) template.variables = variables;
    
    await template.save();
    
    res.json({ 
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route DELETE /api/templates/:id
 * @desc Delete template
 * @access Private
 */
router.delete('/templates/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user owns this template
    if (template.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await template.remove();
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/documents/create
 * @desc Create document from template
 * @access Private
 */
router.post('/documents/create', auth, async (req, res) => {
  try {
    const { templateId, name, filledVariables } = req.body;
    
    if (!templateId || !name) {
      return res.status(400).json({ message: 'Template ID and document name are required' });
    }
    
    // Get the template
    const template = await Template.findById(templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user has access to this template
    if (!template.isPublic && template.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create content with filled variables
    let content = template.content;
    const processedVariables = [];
    
    // Process each filled variable
    if (filledVariables && Array.isArray(filledVariables)) {
      filledVariables.forEach(variable => {
        const { name, value } = variable;
        // Find the template variable to get its pattern
        const templateVar = template.variables.find(v => v.name === name);
        
        if (templateVar) {
          // Replace the variable in the content
          const patternStr = templateVar.pattern;
          const pattern = new RegExp(patternStr.substring(1, patternStr.lastIndexOf('/')), 'g');
          content = content.replace(pattern, value);
          
          // Add to processed variables
          processedVariables.push({
            name,
            value,
            originalPattern: templateVar.pattern
          });
        }
      });
    }
    
    // Create new document
    const document = new Document({
      name,
      template: templateId,
      content,
      filledVariables: processedVariables,
      creator: req.user._id,
      status: 'draft'
    });
    
    await document.save();
    
    res.status(201).json({
      message: 'Document created successfully',
      document
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/documents
 * @desc Get all documents for the current user
 * @access Private
 */
router.get('/documents', auth, async (req, res) => {
  try {
    const documents = await Document.find({ creator: req.user._id })
      .populate('template', 'name')
      .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/documents/:id
 * @desc Get document by ID
 * @access Private
 */
router.get('/documents/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('template')
      .populate('creator', 'name email');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has access to this document
    if (document.creator._id.toString() !== req.user._id.toString()) {
      // Check if user is a signer
      const isSigner = document.signers.some(
        signer => signer.user && signer.user.toString() === req.user._id.toString()
      );
      
      if (!isSigner) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/documents/:id
 * @desc Update document
 * @access Private
 */
router.put('/documents/:id', auth, async (req, res) => {
  try {
    let document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user owns this document
    if (document.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Fields to update
    const { name, status, filledVariables, signers } = req.body;
    
    // Update document
    if (name) document.name = name;
    if (status) document.status = status;
    
    // Update variables and regenerate content if needed
    if (filledVariables && Array.isArray(filledVariables)) {
      // Get the template
      const template = await Template.findById(document.template);
      
      if (template) {
        let content = template.content;
        const processedVariables = [];
        
        // Process each filled variable
        filledVariables.forEach(variable => {
          const { name, value } = variable;
          // Find the template variable to get its pattern
          const templateVar = template.variables.find(v => v.name === name);
          
          if (templateVar) {
            // Replace the variable in the content
            const patternStr = templateVar.pattern;
            const pattern = new RegExp(patternStr.substring(1, patternStr.lastIndexOf('/')), 'g');
            content = content.replace(pattern, value);
            
            // Add to processed variables
            processedVariables.push({
              name,
              value,
              originalPattern: templateVar.pattern
            });
          }
        });
        
        document.content = content;
        document.filledVariables = processedVariables;
      }
    }
    
    // Update signers
    if (signers && Array.isArray(signers)) {
      document.signers = signers;
    }
    
    await document.save();
    
    res.json({ 
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route DELETE /api/documents/:id
 * @desc Delete document
 * @access Private
 */
router.delete('/documents/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user owns this document
    if (document.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await document.remove();
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;