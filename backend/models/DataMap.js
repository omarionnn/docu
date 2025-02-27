const mongoose = require('mongoose');

/**
 * Data Source Schema
 * Represents configuration for external data sources
 */
const dataSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['api', 'database', 'file', 'manual'],
    default: 'api'
  },
  description: String,
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  credentials: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 10
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt on save
dataSourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Field Mapping Schema
 * Represents mapping between document variables and data source fields
 */
const fieldMappingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  documentVariable: {
    type: String,
    required: true
  },
  sourceField: {
    type: String,
    required: true
  },
  dataSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource',
    required: true
  },
  transformations: [{
    type: {
      type: String,
      enum: ['replace', 'format', 'combine', 'split', 'conditional', 'custom'],
      required: true
    },
    parameters: mongoose.Schema.Types.Mixed
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt on save
fieldMappingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Data Integration Schema
 * Represents a set of mappings for a specific template
 */
const dataIntegrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  mappings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldMapping'
  }],
  dataSources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataSource'
  }],
  autoExecute: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt on save
dataIntegrationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Variable Dictionary Schema
 * Represents standardized variable definitions
 */
const variableDictionarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: String,
  category: {
    type: String,
    enum: ['personal', 'business', 'legal', 'financial', 'medical', 'other'],
    default: 'other'
  },
  dataType: {
    type: String,
    enum: ['text', 'number', 'date', 'boolean', 'select', 'complex'],
    default: 'text'
  },
  format: String,
  validation: mongoose.Schema.Types.Mixed,
  examples: [String],
  synonyms: [String],
  mappings: [{
    source: String,
    field: String
  }],
  isStandard: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt on save
variableDictionarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Data History Schema
 * Tracks history of data changes for audit purposes
 */
const dataHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'import', 'export', 'merge'],
    required: true
  },
  entityType: {
    type: String,
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  previousData: mongoose.Schema.Types.Mixed,
  newData: mongoose.Schema.Types.Mixed,
  source: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: String,
  userAgent: String
});

// Create models
const DataSource = mongoose.model('DataSource', dataSourceSchema);
const FieldMapping = mongoose.model('FieldMapping', fieldMappingSchema);
const DataIntegration = mongoose.model('DataIntegration', dataIntegrationSchema);
const VariableDictionary = mongoose.model('VariableDictionary', variableDictionarySchema);
const DataHistory = mongoose.model('DataHistory', dataHistorySchema);

module.exports = {
  DataSource,
  FieldMapping,
  DataIntegration,
  VariableDictionary,
  DataHistory
};