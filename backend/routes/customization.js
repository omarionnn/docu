const express = require('express');
const router = express.Router();
const { Template, Document, UserProfile } = require('../models/Document');
const documentCustomizer = require('../services/documentCustomizer');
const aiService = require('../services/aiService');
const auth = require('../middleware/auth');

/**
 * @route POST /api/customization/rules/apply
 * @desc Apply conditional rules to a document
 * @access Private
 */
router.post('/rules/apply', auth, async (req, res) => {
  try {
    const { documentId, rules } = req.body;
    
    if (!documentId || !rules) {
      return res.status(400).json({ message: 'Document ID and rules are required' });
    }
    
    // Apply rules to the document
    const updatedDocument = await documentCustomizer.applyConditionalRules(documentId, rules);
    
    res.json({
      message: 'Rules applied successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error applying rules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/customization/personalize
 * @desc Generate a personalized document based on user profile
 * @access Private
 */
router.post('/personalize', auth, async (req, res) => {
  try {
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ message: 'Template ID is required' });
    }
    
    // Get or create user profile
    let userProfile = await UserProfile.findOne({ user: req.user._id });
    
    if (!userProfile) {
      userProfile = new UserProfile({
        user: req.user._id,
        personalInfo: req.body.personalInfo || {}
      });
      await userProfile.save();
    }
    
    // Generate personalized document
    const document = await documentCustomizer.generatePersonalizedDocument(templateId, {
      _id: req.user._id,
      ...userProfile.personalInfo,
      preferences: userProfile.preferences,
      savedData: userProfile.savedData
    });
    
    // Add to customization history
    document.customizationHistory.push({
      action: 'personalization',
      description: 'Document personalized based on user profile'
    });
    
    await document.save();
    
    res.status(201).json({
      message: 'Personalized document created',
      document
    });
  } catch (error) {
    console.error('Error personalizing document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/customization/context/analyze
 * @desc Analyze document in a given context
 * @access Private
 */
router.post('/context/analyze', auth, async (req, res) => {
  try {
    const { documentId, contextData } = req.body;
    
    if (!documentId || !contextData) {
      return res.status(400).json({ message: 'Document ID and context data are required' });
    }
    
    // Analyze the context
    const analysis = await documentCustomizer.analyzeContext(documentId, contextData);
    
    // Save context data to document
    const document = await Document.findById(documentId);
    if (document) {
      document.contextData = contextData;
      await document.save();
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing context:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/customization/context/adapt
 * @desc Adapt document based on context analysis
 * @access Private
 */
router.post('/context/adapt', auth, async (req, res) => {
  try {
    const { documentId, adaptations } = req.body;
    
    if (!documentId || !adaptations) {
      return res.status(400).json({ message: 'Document ID and adaptations are required' });
    }
    
    // Get the document
    const document = await Document.findById(documentId)
      .populate('template');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has access to this document
    if (document.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Convert adaptations to rules
    const rules = adaptations.map(adaptation => ({
      name: adaptation.name || `Adaptation_${Date.now()}`,
      description: adaptation.description || 'Document adapted based on context analysis',
      condition: adaptation.condition,
      action: adaptation.action,
      targetVariables: adaptation.targetVariables
    }));
    
    // Apply rules
    const updatedDocument = await documentCustomizer.applyConditionalRules(documentId, rules);
    
    // Add to customization history
    updatedDocument.customizationHistory.push({
      action: 'context_adaptation',
      description: 'Document adapted based on context analysis',
      details: { adaptations }
    });
    
    await updatedDocument.save();
    
    res.json({
      message: 'Document adapted successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error adapting document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/customization/templates/rules/suggest
 * @desc Suggest conditional rules for a template
 * @access Private
 */
router.post('/templates/rules/suggest', auth, async (req, res) => {
  try {
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ message: 'Template ID is required' });
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
    
    // Get rule suggestions
    const suggestions = await aiService.suggestConditionalRules(template);
    
    res.json({
      template,
      suggestions
    });
  } catch (error) {
    console.error('Error suggesting rules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/customization/templates/sections/add
 * @desc Add a conditional section to a template
 * @access Private
 */
router.post('/templates/sections/add', auth, async (req, res) => {
  try {
    const { templateId, section } = req.body;
    
    if (!templateId || !section) {
      return res.status(400).json({ message: 'Template ID and section data are required' });
    }
    
    // Get the template
    const template = await Template.findById(templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Check if user owns this template
    if (template.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Add the conditional section
    const updatedTemplate = await documentCustomizer.addConditionalSection(templateId, section);
    
    res.json({
      message: 'Conditional section added successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Error adding conditional section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/customization/profile
 * @desc Get user profile for personalization
 * @access Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    // Get user profile
    let userProfile = await UserProfile.findOne({ user: req.user._id });
    
    if (!userProfile) {
      userProfile = new UserProfile({
        user: req.user._id
      });
      await userProfile.save();
    }
    
    res.json(userProfile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/customization/profile
 * @desc Update user profile for personalization
 * @access Private
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { personalInfo, preferences, savedData } = req.body;
    
    // Get user profile
    let userProfile = await UserProfile.findOne({ user: req.user._id });
    
    if (!userProfile) {
      userProfile = new UserProfile({
        user: req.user._id
      });
    }
    
    // Update profile data
    if (personalInfo) userProfile.personalInfo = { ...userProfile.personalInfo, ...personalInfo };
    if (preferences) userProfile.preferences = { ...userProfile.preferences, ...preferences };
    if (savedData) userProfile.savedData = { ...userProfile.savedData, ...savedData };
    
    await userProfile.save();
    
    res.json({
      message: 'Profile updated successfully',
      profile: userProfile
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;