const { Template, Document } = require('../models/Document');
const aiService = require('./aiService');
const mongoose = require('mongoose');

/**
 * Document Customizer Service
 * Handles dynamic document customization, rule-based adaptation, and personalization
 */
class DocumentCustomizerService {
  /**
   * Apply conditional rules to a document
   * @param {String} documentId - Document ID
   * @param {Array} rules - Array of rules to apply
   * @returns {Promise<Object>} - Updated document
   */
  async applyConditionalRules(documentId, rules) {
    try {
      // Validate document ID
      if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new Error('Invalid document ID');
      }

      // Get the document
      const document = await Document.findById(documentId)
        .populate('template');
      
      if (!document) {
        throw new Error('Document not found');
      }

      // Get the template and content
      const template = document.template;
      let content = document.content;
      
      // Process each rule
      for (const rule of rules) {
        const { condition, action, targetVariables } = rule;
        
        // Evaluate the condition
        const conditionMet = this.evaluateCondition(condition, document.filledVariables);
        
        if (conditionMet) {
          // Apply the action to the content and variables
          const result = await this.applyAction(action, content, targetVariables, document);
          content = result.content;
          
          // Update document variables if needed
          if (result.updatedVariables) {
            document.filledVariables = result.updatedVariables;
          }
        }
      }
      
      // Update the document content
      document.content = content;
      await document.save();
      
      return document;
    } catch (error) {
      console.error('Error applying conditional rules:', error);
      throw error;
    }
  }

  /**
   * Evaluate a condition based on document variables
   * @param {Object} condition - Condition to evaluate
   * @param {Array} variables - Document variables
   * @returns {Boolean} - Whether condition is met
   */
  evaluateCondition(condition, variables) {
    try {
      const { type, variable, operator, value, subConditions, logicalOperator } = condition;
      
      // Handle compound conditions (AND/OR)
      if (type === 'compound' && subConditions && subConditions.length > 0) {
        const results = subConditions.map(subCond => this.evaluateCondition(subCond, variables));
        
        if (logicalOperator === 'AND') {
          return results.every(result => result === true);
        } else if (logicalOperator === 'OR') {
          return results.some(result => result === true);
        }
      }
      
      // Handle simple conditions
      if (type === 'simple' && variable) {
        // Find the variable
        const varObj = variables.find(v => v.name === variable);
        
        if (!varObj) {
          return false;
        }
        
        const varValue = varObj.value;
        
        // Evaluate based on operator
        switch (operator) {
          case 'equals':
            return varValue === value;
          case 'notEquals':
            return varValue !== value;
          case 'contains':
            return varValue.includes(value);
          case 'startsWith':
            return varValue.startsWith(value);
          case 'endsWith':
            return varValue.endsWith(value);
          case 'greaterThan':
            return parseFloat(varValue) > parseFloat(value);
          case 'lessThan':
            return parseFloat(varValue) < parseFloat(value);
          case 'isEmpty':
            return !varValue || varValue.trim() === '';
          case 'isNotEmpty':
            return varValue && varValue.trim() !== '';
          default:
            return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Apply an action to the document content
   * @param {String} action - Action type
   * @param {String} content - Document content
   * @param {Array} targetVariables - Variables affected by the action
   * @param {Object} document - Document object
   * @returns {Promise<Object>} - Updated content and variables
   */
  async applyAction(action, content, targetVariables, document) {
    let updatedContent = content;
    let updatedVariables = [...document.filledVariables];
    
    switch (action) {
      case 'show':
        // Show sections related to the target variables
        targetVariables.forEach(targetVar => {
          const pattern = new RegExp(`<!--\\s*BEGIN\\s*${targetVar}\\s*-->([\\s\\S]*?)<!--\\s*END\\s*${targetVar}\\s*-->`, 'g');
          updatedContent = updatedContent.replace(pattern, (match, p1) => p1);
        });
        break;
      
      case 'hide':
        // Hide sections related to the target variables
        targetVariables.forEach(targetVar => {
          const pattern = new RegExp(`<!--\\s*BEGIN\\s*${targetVar}\\s*-->([\\s\\S]*?)<!--\\s*END\\s*${targetVar}\\s*-->`, 'g');
          updatedContent = updatedContent.replace(pattern, '');
        });
        break;
      
      case 'insertText':
        // Insert predefined text at the target variables
        targetVariables.forEach(targetVar => {
          const varData = targetVar.split(':');
          if (varData.length === 2) {
            const [variable, insertText] = varData;
            // Find the variable in the document
            const varObj = document.filledVariables.find(v => v.name === variable);
            if (varObj) {
              const pattern = new RegExp(varObj.originalPattern.substring(1, varObj.originalPattern.lastIndexOf('/')), 'g');
              updatedContent = updatedContent.replace(pattern, insertText);
              
              // Update the variable value
              const varIndex = updatedVariables.findIndex(v => v.name === variable);
              if (varIndex !== -1) {
                updatedVariables[varIndex].value = insertText;
              }
            }
          }
        });
        break;
      
      case 'generateText':
        // Generate text based on AI analysis for the target variables
        for (const targetVar of targetVariables) {
          const varData = targetVar.split(':');
          if (varData.length === 2) {
            const [variable, prompt] = varData;
            // Generate text using AI
            const generatedText = await aiService.generateText(prompt, document);
            
            // Find the variable in the document
            const varObj = document.filledVariables.find(v => v.name === variable);
            if (varObj) {
              const pattern = new RegExp(varObj.originalPattern.substring(1, varObj.originalPattern.lastIndexOf('/')), 'g');
              updatedContent = updatedContent.replace(pattern, generatedText);
              
              // Update the variable value
              const varIndex = updatedVariables.findIndex(v => v.name === variable);
              if (varIndex !== -1) {
                updatedVariables[varIndex].value = generatedText;
              }
            }
          }
        }
        break;
        
      default:
        // No action
        break;
    }
    
    return { content: updatedContent, updatedVariables };
  }
  
  /**
   * Generate a personalized document based on user profile
   * @param {String} templateId - Template ID
   * @param {Object} userProfile - User profile data
   * @returns {Promise<Object>} - Personalized document
   */
  async generatePersonalizedDocument(templateId, userProfile) {
    try {
      // Validate template ID
      if (!mongoose.Types.ObjectId.isValid(templateId)) {
        throw new Error('Invalid template ID');
      }

      // Get the template
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Create a new document from the template
      let content = template.content;
      const filledVariables = [];
      
      // Match template variables with user profile data
      for (const templateVar of template.variables) {
        const { name } = templateVar;
        let value = '';
        
        // Check if user profile has matching data
        if (userProfile[name]) {
          value = userProfile[name];
        } else if (userProfile.preferences && userProfile.preferences[name]) {
          value = userProfile.preferences[name];
        }
        
        // If no value found but we have metadata about this field, check mappings
        if (!value && templateVar.metadata && templateVar.metadata.mappings) {
          for (const mapping of templateVar.metadata.mappings) {
            if (userProfile[mapping]) {
              value = userProfile[mapping];
              break;
            }
          }
        }
        
        // Replace the variable in the content
        if (value) {
          const patternStr = templateVar.pattern;
          const pattern = new RegExp(patternStr.substring(1, patternStr.lastIndexOf('/')), 'g');
          content = content.replace(pattern, value);
          
          // Add to filled variables
          filledVariables.push({
            name,
            value,
            originalPattern: templateVar.pattern
          });
        }
      }
      
      // Create the personalized document
      const document = new Document({
        name: `${template.name} - Personalized for ${userProfile.name || 'User'}`,
        template: templateId,
        content,
        filledVariables,
        creator: userProfile._id,
        status: 'draft'
      });
      
      await document.save();
      
      return document;
    } catch (error) {
      console.error('Error generating personalized document:', error);
      throw error;
    }
  }
  
  /**
   * Analyze situation and suggest document adaptations
   * @param {String} documentId - Document ID
   * @param {Object} contextData - Situational context data
   * @returns {Promise<Object>} - Analysis and suggestions
   */
  async analyzeContext(documentId, contextData) {
    try {
      // Validate document ID
      if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new Error('Invalid document ID');
      }

      // Get the document
      const document = await Document.findById(documentId)
        .populate('template');
      
      if (!document) {
        throw new Error('Document not found');
      }
      
      // Combine document data with context data
      const analysisData = {
        documentContent: document.content,
        documentVariables: document.filledVariables,
        templateVariables: document.template.variables,
        situationalContext: contextData
      };
      
      // Use AI to analyze the context and suggest adaptations
      const analysis = await aiService.analyzeContextForDocument(analysisData);
      
      return {
        document,
        analysis,
        suggestions: analysis.suggestions
      };
    } catch (error) {
      console.error('Error analyzing context:', error);
      throw error;
    }
  }
  
  /**
   * Add conditional section to template
   * @param {String} templateId - Template ID
   * @param {Object} section - Conditional section data
   * @returns {Promise<Object>} - Updated template
   */
  async addConditionalSection(templateId, section) {
    try {
      // Validate template ID
      if (!mongoose.Types.ObjectId.isValid(templateId)) {
        throw new Error('Invalid template ID');
      }

      const { name, content, condition } = section;
      
      if (!name || !content || !condition) {
        throw new Error('Section name, content, and condition are required');
      }

      // Get the template
      const template = await Template.findById(templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Format the conditional section
      const conditionalSection = `<!-- BEGIN ${name} -->${content}<!-- END ${name} -->`;
      
      // Add the section to the template content
      template.content += `\n\n${conditionalSection}`;
      
      // Add condition metadata if not exists
      if (!template.metadata.conditionalSections) {
        template.metadata.conditionalSections = [];
      }
      
      // Add section data to metadata
      template.metadata.conditionalSections.push({
        name,
        condition
      });
      
      await template.save();
      
      return template;
    } catch (error) {
      console.error('Error adding conditional section:', error);
      throw error;
    }
  }
}

module.exports = new DocumentCustomizerService();