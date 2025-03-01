 const mongoose = require('mongoose');

  /**
   * Condition Schema - For conditional logic in templates and documents
   */
  const conditionSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['simple', 'compound'],
      default: 'simple'
    },
    variable: String, // For simple conditions
    operator: {
      type: String,
      enum: ['equals', 'notEquals', 'contains', 'startsWith', 'endsWith',
             'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty']
    },
    value: mongoose.Schema.Types.Mixed,
    subConditions: [{ type: mongoose.Schema.Types.Mixed }], // For compound conditions
    logicalOperator: {
      type: String,
      enum: ['AND', 'OR']
    }
  });

  /**
   * Rule Schema - For document customization rules
   */
  const ruleSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    description: String,
    condition: {
      type: conditionSchema,
      required: true
    },
    action: {
      type: String,
      enum: ['show', 'hide', 'insertText', 'generateText'],
      required: true
    },
    targetVariables: [String], // Variables or sections affected by this rule
    active: {
      type: Boolean,
      default: true
    }
  });

  /**
   * Template Schema - Represents a document template with variables
   */
  const templateSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true,
      enum: ['pdf', 'docx', 'txt']
    },
    originalFileName: {
      type: String
    },
    variables: [{
      name: {
        type: String,
        required: true
      },
      pattern: {
        type: String,
        required: true
      },
      rawMatch: String,
      value: String,
      required: {
        type: Boolean,
        default: true
      },
      description: String,
      dataType: {
        type: String,
        enum: ['text', 'number', 'date', 'boolean', 'select'],
        default: 'text'
      },
      options: [String], // For select type variables
      metadata: {
        type: mongoose.Schema.Types.Mixed, // Additional data about this variable
        default: {}
      },
      dependencies: [String], // Other variables that depend on this one
      validation: {
        type: mongoose.Schema.Types.Mixed, // Validation rules for this variable
        default: {}
      }
    }],
    conditionalSections: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      rules: [ruleSchema]
    }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    category: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    isPublic: {
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
  templateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  /**
   * Document Schema - Represents a filled template instance
   */
  const documentSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    filledVariables: [{
      name: {
        type: String,
        required: true
      },
      value: String,
      originalPattern: String,
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    }],
    appliedRules: [ruleSchema], // Rules that have been applied to this document
    customizationHistory: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      action: {
        type: String,
        enum: ['rule_applied', 'personalization', 'manual_edit', 'context_adaptation']
      },
      description: String,
      details: mongoose.Schema.Types.Mixed
    }],
    contextData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'completed', 'archived'],
      default: 'draft'
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    signers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      email: String,
      name: String,
      status: {
        type: String,
        enum: ['invited', 'viewed', 'signed', 'declined'],
        default: 'invited'
      },
      signedAt: Date,
      signatureId: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  });

  // Set updatedAt on save
  documentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  // Methods for Document model
  documentSchema.methods.applyRule = function(rule) {
    // Add the rule to applied rules if not already there
    const ruleExists = this.appliedRules.some(r => r.name === rule.name);
    if (!ruleExists) {
      this.appliedRules.push(rule);
    }

    // Add to customization history
    this.customizationHistory.push({
      action: 'rule_applied',
      description: `Applied rule: ${rule.name}`,
      details: rule
    });
  };

  // User Profile Schema - For personalization
  const userProfileSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    personalInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    savedData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    frequentlyUsedVariables: [{
      name: String,
      value: String,
      frequency: Number
    }],
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
  userProfileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  // Create models
  const Template = mongoose.model('Template', templateSchema);
  const Document = mongoose.model('Document', documentSchema);
  const UserProfile = mongoose.model('UserProfile', userProfileSchema);

  module.exports = {
    Template,
    Document,
    UserProfile
  };

