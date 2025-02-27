const express = require('express');
const router = express.Router();
const { UserProfile } = require('../models/Document');
const { 
  DataSource, 
  FieldMapping, 
  DataIntegration, 
  VariableDictionary,
  DataHistory
} = require('../models/DataMap');
const dataManager = require('../services/dataManager');
const auth = require('../middleware/auth');

/**
 * @route GET /api/data/profile
 * @desc Get user data profile
 * @access Private
 */
router.get('/profile', auth, async (req, res) => {
  try {
    // Get or create user profile
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
 * @route POST /api/data/store
 * @desc Store user data
 * @access Private
 */
router.post('/store', auth, async (req, res) => {
  try {
    const { data, category = 'personalInfo' } = req.body;
    
    if (!data) {
      return res.status(400).json({ message: 'Data is required' });
    }
    
    // Store user data
    const userProfile = await dataManager.storeUserData(req.user._id, data, category);
    
    // Create history record
    const historyRecord = new DataHistory({
      user: req.user._id,
      action: 'update',
      entityType: 'UserProfile',
      entityId: userProfile._id,
      newData: { [category]: data },
      source: 'user-input'
    });
    
    await historyRecord.save();
    
    res.json({
      message: 'Data stored successfully',
      profile: userProfile
    });
  } catch (error) {
    console.error('Error storing user data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/retrieve
 * @desc Retrieve user data
 * @access Private
 */
router.get('/retrieve', auth, async (req, res) => {
  try {
    const { category = 'personalInfo', fields } = req.query;
    
    // Parse fields if provided
    const parsedFields = fields ? fields.split(',') : null;
    
    // Retrieve user data
    const data = await dataManager.retrieveUserData(
      req.user._id,
      category,
      parsedFields
    );
    
    res.json(data);
  } catch (error) {
    console.error('Error retrieving user data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/data/autofill
 * @desc Auto-fill document with user data
 * @access Private
 */
router.post('/autofill', auth, async (req, res) => {
  try {
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ message: 'Template ID is required' });
    }
    
    // Get template
    const Template = require('../models/Document').Template;
    const template = await Template.findById(templateId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Auto-fill document
    const filledVariables = await dataManager.autoFillDocument(template, req.user._id);
    
    res.json({
      message: 'Document auto-filled successfully',
      filledVariables,
      template
    });
  } catch (error) {
    console.error('Error auto-filling document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/data/deduplicate
 * @desc Detect and merge duplicate data
 * @access Private
 */
router.post('/deduplicate', auth, async (req, res) => {
  try {
    // Detect and merge duplicates
    const results = await dataManager.detectAndMergeDuplicates(req.user._id);
    
    if (results.duplicatesDetected > 0) {
      // Create history record
      const historyRecord = new DataHistory({
        user: req.user._id,
        action: 'merge',
        entityType: 'UserProfile',
        entityId: req.user._id,
        newData: results.mergedData,
        source: 'deduplication'
      });
      
      await historyRecord.save();
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error deduplicating data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/data/validate
 * @desc Validate user data
 * @access Private
 */
router.post('/validate', auth, async (req, res) => {
  try {
    const { data, dataType } = req.body;
    
    if (!data || !dataType) {
      return res.status(400).json({ message: 'Data and dataType are required' });
    }
    
    // Validate data
    const results = await dataManager.validateData(data, dataType);
    
    res.json(results);
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/public
 * @desc Fetch data from public sources
 * @access Private
 */
router.get('/public', auth, async (req, res) => {
  try {
    const { dataType, ...parameters } = req.query;
    
    if (!dataType) {
      return res.status(400).json({ message: 'Data type is required' });
    }
    
    // Fetch public data
    const data = await dataManager.fetchPublicData(dataType, parameters);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching public data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/variables/frequent
 * @desc Get frequently used variables
 * @access Private
 */
router.get('/variables/frequent', auth, async (req, res) => {
  try {
    // Get user profile
    const userProfile = await UserProfile.findOne({ user: req.user._id });
    
    if (!userProfile) {
      return res.json([]);
    }
    
    // Sort by frequency descending
    const frequentVariables = [...userProfile.frequentlyUsedVariables]
      .sort((a, b) => b.frequency - a.frequency);
    
    res.json(frequentVariables);
  } catch (error) {
    console.error('Error getting frequent variables:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Data source routes
/**
 * @route POST /api/data/sources
 * @desc Create a new data source
 * @access Private
 */
router.post('/sources', auth, async (req, res) => {
  try {
    const { name, type, description, configuration } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }
    
    // Create data source
    const dataSource = new DataSource({
      name,
      type,
      description,
      configuration,
      owner: req.user._id
    });
    
    await dataSource.save();
    
    res.status(201).json({
      message: 'Data source created successfully',
      dataSource
    });
  } catch (error) {
    console.error('Error creating data source:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/sources
 * @desc Get all data sources
 * @access Private
 */
router.get('/sources', auth, async (req, res) => {
  try {
    const dataSources = await DataSource.find({ owner: req.user._id });
    
    res.json(dataSources);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/sources/:id
 * @desc Get data source by ID
 * @access Private
 */
router.get('/sources/:id', auth, async (req, res) => {
  try {
    const dataSource = await DataSource.findById(req.params.id);
    
    if (!dataSource) {
      return res.status(404).json({ message: 'Data source not found' });
    }
    
    // Check if user owns this data source
    if (dataSource.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(dataSource);
  } catch (error) {
    console.error('Error fetching data source:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route PUT /api/data/sources/:id
 * @desc Update data source
 * @access Private
 */
router.put('/sources/:id', auth, async (req, res) => {
  try {
    const { name, description, configuration, isActive, priority } = req.body;
    
    // Find data source
    const dataSource = await DataSource.findById(req.params.id);
    
    if (!dataSource) {
      return res.status(404).json({ message: 'Data source not found' });
    }
    
    // Check if user owns this data source
    if (dataSource.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (name) dataSource.name = name;
    if (description) dataSource.description = description;
    if (configuration) dataSource.configuration = configuration;
    if (isActive !== undefined) dataSource.isActive = isActive;
    if (priority) dataSource.priority = priority;
    
    await dataSource.save();
    
    res.json({
      message: 'Data source updated successfully',
      dataSource
    });
  } catch (error) {
    console.error('Error updating data source:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route DELETE /api/data/sources/:id
 * @desc Delete data source
 * @access Private
 */
router.delete('/sources/:id', auth, async (req, res) => {
  try {
    const dataSource = await DataSource.findById(req.params.id);
    
    if (!dataSource) {
      return res.status(404).json({ message: 'Data source not found' });
    }
    
    // Check if user owns this data source
    if (dataSource.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await dataSource.remove();
    
    res.json({ message: 'Data source deleted successfully' });
  } catch (error) {
    console.error('Error deleting data source:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Field mapping routes
/**
 * @route POST /api/data/mappings
 * @desc Create a new field mapping
 * @access Private
 */
router.post('/mappings', auth, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      documentVariable, 
      sourceField, 
      dataSourceId,
      transformations
    } = req.body;
    
    if (!name || !documentVariable || !sourceField || !dataSourceId) {
      return res.status(400).json({ 
        message: 'Name, document variable, source field, and data source ID are required' 
      });
    }
    
    // Check if data source exists and user has access
    const dataSource = await DataSource.findById(dataSourceId);
    
    if (!dataSource) {
      return res.status(404).json({ message: 'Data source not found' });
    }
    
    if (dataSource.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to data source' });
    }
    
    // Create field mapping
    const fieldMapping = new FieldMapping({
      name,
      description,
      documentVariable,
      sourceField,
      dataSource: dataSourceId,
      transformations: transformations || []
    });
    
    await fieldMapping.save();
    
    res.status(201).json({
      message: 'Field mapping created successfully',
      fieldMapping
    });
  } catch (error) {
    console.error('Error creating field mapping:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/mappings
 * @desc Get all field mappings
 * @access Private
 */
router.get('/mappings', auth, async (req, res) => {
  try {
    // Get data sources owned by user
    const dataSources = await DataSource.find({ owner: req.user._id });
    const dataSourceIds = dataSources.map(ds => ds._id);
    
    // Get mappings that use these data sources
    const fieldMappings = await FieldMapping.find({
      dataSource: { $in: dataSourceIds }
    }).populate('dataSource', 'name type');
    
    res.json(fieldMappings);
  } catch (error) {
    console.error('Error fetching field mappings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/variables/dictionary
 * @desc Get variable dictionary entries
 * @access Private
 */
router.get('/variables/dictionary', auth, async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }
    
    // Search by name or synonyms if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { synonyms: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }
    
    const variables = await VariableDictionary.find(query);
    
    res.json(variables);
  } catch (error) {
    console.error('Error fetching variable dictionary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route POST /api/data/variables/dictionary
 * @desc Create a new variable dictionary entry
 * @access Private
 */
router.post('/variables/dictionary', auth, async (req, res) => {
  try {
    const { 
      name,
      description,
      category,
      dataType,
      format,
      validation,
      examples,
      synonyms
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Variable name is required' });
    }
    
    // Check if variable already exists
    const existingVariable = await VariableDictionary.findOne({ name });
    
    if (existingVariable) {
      return res.status(400).json({ message: 'Variable already exists' });
    }
    
    // Create variable
    const variable = new VariableDictionary({
      name,
      description,
      category,
      dataType,
      format,
      validation,
      examples,
      synonyms,
      isStandard: false // Custom variables are not standard
    });
    
    await variable.save();
    
    res.status(201).json({
      message: 'Variable dictionary entry created successfully',
      variable
    });
  } catch (error) {
    console.error('Error creating variable dictionary entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/data/history
 * @desc Get data history
 * @access Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const { entityType, entityId, action, limit = 10, skip = 0 } = req.query;
    
    let query = { user: req.user._id };
    
    // Filter by entity type if provided
    if (entityType) {
      query.entityType = entityType;
    }
    
    // Filter by entity ID if provided
    if (entityId) {
      query.entityId = entityId;
    }
    
    // Filter by action if provided
    if (action) {
      query.action = action;
    }
    
    // Get history records
    const history = await DataHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    // Get total count
    const total = await DataHistory.countDocuments(query);
    
    res.json({
      history,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching data history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;