import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './DocumentCustomizer.css';

/**
 * Component for customizing documents with conditional rules
 */
const DocumentCustomizer = ({ documentId, template: initialTemplate, onDocumentUpdate }) => {
  const [document, setDocument] = useState(null);
  const [template, setTemplate] = useState(initialTemplate || null);
  const [rules, setRules] = useState([]);
  const [suggestedRules, setSuggestedRules] = useState([]);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isApplyingRules, setIsApplyingRules] = useState(false);
  const [contextData, setContextData] = useState({});
  const [contextAnalysis, setContextAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');
  const [showPreview, setShowPreview] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    condition: {
      type: 'simple',
      variable: '',
      operator: 'equals',
      value: ''
    },
    action: 'show',
    targetVariables: [''],
    active: true
  });
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [isAddingNewRule, setIsAddingNewRule] = useState(false);
  const [variables, setVariables] = useState([]);
  const [dynamicTextValue, setDynamicTextValue] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  const previewRef = useRef(null);

  // Load document data
  useEffect(() => {
    // If we have a template passed directly, use that
    if (initialTemplate) {
      console.log('Using provided template:', initialTemplate);
      setTemplate(initialTemplate);
      setIsLoadingDocument(false);
      
      // Create a document from this template
      if (!document) {
        const mockDocument = {
          _id: initialTemplate.id || Math.random().toString(36).substring(7),
          template: initialTemplate,
          content: initialTemplate.content || 'Template content will appear here',
          status: 'draft',
          createdAt: new Date().toISOString()
        };
        setDocument(mockDocument);
        setDocumentContent(mockDocument.content);
      }
    }
    // Otherwise load by ID or list
    else if (documentId) {
      loadDocument();
    } else {
      // If no specific document ID, load list of documents
      loadDocumentsList();
    }
  }, [documentId, initialTemplate]);

  // Load variables from template when template changes
  useEffect(() => {
    if (template && template.variables) {
      setVariables(template.variables);
    }
  }, [template]);

  /**
   * Load list of documents
   */
  const loadDocumentsList = async () => {
    try {
      setIsLoadingDocument(true);
      const response = await axios.get('/api/documents');
      if (response.data && response.data.length > 0) {
        // Load the first document as default
        await loadDocumentById(response.data[0]._id);
      } else {
        setIsLoadingDocument(false);
        toast.info('No documents found. Please upload a document first.');
      }
    } catch (error) {
      console.error('Error loading documents list:', error);
      toast.error('Failed to load documents');
      setIsLoadingDocument(false);
    }
  };

  /**
   * Helper function to handle API errors and retry with different ports if needed
   */
  const handleApiError = (error, operation) => {
    console.error(`Error ${operation}:`, error);
    
    // If connection refused, try alternative ports (helps in development)
    if (error.message && error.message.includes('Network Error')) {
      // Try alternative API ports
      const currentPort = window.location.port;
      const serverPort = currentPort === '3000' ? '5001' : 
                        currentPort === '3001' ? '5002' : '5003';
      
      toast.info(`Trying to connect to API on port ${serverPort}...`);
      axios.defaults.baseURL = `http://localhost:${serverPort}`;
      return true; // Return true to indicate retry might work
    }
    
    toast.error(`Failed to ${operation}. ${error.message}`);
    return false; // Return false to indicate no retry
  };

  /**
   * Load document by ID
   */
  const loadDocumentById = async (id) => {
    try {
      const response = await axios.get(`/api/documents/${id}`);
      setDocument(response.data);
      setDocumentContent(response.data.content);
      
      // Get template data
      if (response.data.template && typeof response.data.template === 'object') {
        setTemplate(response.data.template);
      } else if (response.data.template) {
        const templateResponse = await axios.get(`/api/documents/templates/${response.data.template}`);
        setTemplate(templateResponse.data);
      }
      
      // Set any existing rules
      if (response.data.appliedRules && response.data.appliedRules.length > 0) {
        setRules(response.data.appliedRules);
      }
      
      setIsLoadingDocument(false);
    } catch (error) {
      if (handleApiError(error, 'load document')) {
        // Try loading again with new port configuration after a short delay
        setTimeout(() => loadDocumentById(id), 1000);
      } else {
        setIsLoadingDocument(false);
      }
    }
  };

  /**
   * Load document and template data
   */
  const loadDocument = async () => {
    if (documentId) {
      await loadDocumentById(documentId);
    }
  };

  /**
   * Suggest rules based on template
   */
  const suggestRules = async () => {
    if (!template) return;
    
    try {
      setIsLoadingRules(true);
      const response = await axios.post('/api/customization/templates/rules/suggest', {
        templateId: template._id
      });
      
      setSuggestedRules(response.data.suggestions);
      setIsLoadingRules(false);
      
      if (response.data.suggestions.length === 0) {
        toast.info('No rule suggestions found for this template.');
      } else {
        toast.success(`${response.data.suggestions.length} rule suggestions found.`);
      }
    } catch (error) {
      if (handleApiError(error, 'suggest rules')) {
        // Try again with new port configuration after a short delay
        setTimeout(() => suggestRules(), 1000);
      } else {
        setIsLoadingRules(false);
      }
    }
  };

  /**
   * Apply selected rules to document
   */
  const applyRules = async () => {
    if (!document || rules.length === 0) return;
    
    // Filter only active rules
    const activeRules = rules.filter(rule => rule.active);
    
    if (activeRules.length === 0) {
      toast.info('No active rules to apply');
      return;
    }
    
    try {
      setIsApplyingRules(true);
      
      const response = await axios.post('/api/customization/rules/apply', {
        documentId: document._id,
        rules: activeRules
      });
      
      setDocument(response.data.document);
      setDocumentContent(response.data.document.content);
      toast.success('Rules applied successfully');
      
      // Notify parent component
      if (onDocumentUpdate) {
        onDocumentUpdate(response.data.document);
      }
      
      setIsApplyingRules(false);
      
      // Show preview after applying rules
      setShowPreview(true);
    } catch (error) {
      console.error('Error applying rules:', error);
      toast.error('Failed to apply rules');
      setIsApplyingRules(false);
    }
  };

  /**
   * Generate preview of document with rules applied
   */
  const generatePreview = async () => {
    if (!document) return;
    
    try {
      setIsLoadingPreview(true);
      
      // If we have active rules, use a preview endpoint
      if (rules.filter(rule => rule.active).length > 0) {
        const response = await axios.post('/api/documents/preview', {
          documentId: document._id,
          rules: rules.filter(rule => rule.active)
        });
        
        setDocumentContent(response.data.content);
      } else {
        // Otherwise show the current document content
        setDocumentContent(document.content);
      }
      
      setShowPreview(true);
      setIsLoadingPreview(false);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
      setIsLoadingPreview(false);
    }
  };

  /**
   * Add a rule to the list
   */
  const addRule = (rule) => {
    setRules(prevRules => {
      // Check if rule already exists
      const exists = prevRules.some(r => r.name === rule.name);
      if (exists) {
        toast.info(`Rule "${rule.name}" already exists`);
        return prevRules;
      }
      toast.success(`Rule "${rule.name}" added`);
      return [...prevRules, { ...rule, active: true }];
    });
  };

  /**
   * Add a new custom rule
   */
  const addCustomRule = () => {
    // Validate rule
    if (!newRule.name.trim()) {
      toast.error('Rule name is required');
      return;
    }
    
    if (!newRule.condition.variable.trim()) {
      toast.error('Condition variable is required');
      return;
    }
    
    if (!newRule.targetVariables[0].trim()) {
      toast.error('Target variable is required');
      return;
    }
    
    addRule(newRule);
    
    // Reset new rule form
    setNewRule({
      name: '',
      description: '',
      condition: {
        type: 'simple',
        variable: '',
        operator: 'equals',
        value: ''
      },
      action: 'show',
      targetVariables: [''],
      active: true
    });
    
    setShowRuleEditor(false);
  };

  /**
   * Remove a rule from the list
   */
  const removeRule = (ruleName) => {
    setRules(prevRules => prevRules.filter(rule => rule.name !== ruleName));
    toast.info(`Rule "${ruleName}" removed`);
  };

  /**
   * Toggle rule active state
   */
  const toggleRule = (ruleName) => {
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.name === ruleName 
          ? { ...rule, active: !rule.active } 
          : rule
      )
    );
  };

  /**
   * Handle change in new rule form
   */
  const handleRuleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('condition.')) {
      const conditionField = name.split('.')[1];
      setNewRule(prev => ({
        ...prev,
        condition: {
          ...prev.condition,
          [conditionField]: value
        }
      }));
    } else if (name === 'targetVariable') {
      setNewRule(prev => ({
        ...prev,
        targetVariables: [value]
      }));
    } else {
      setNewRule(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Analyze document in current context
   */
  const analyzeContext = async () => {
    if (!document) return;
    
    if (Object.keys(contextData).length === 0) {
      toast.warning('Please add at least one context field');
      return;
    }
    
    try {
      toast.info('Analyzing document context...');
      
      const response = await axios.post('/api/customization/context/analyze', {
        documentId: document._id,
        contextData
      });
      
      setContextAnalysis(response.data);
      toast.success('Context analysis complete');
    } catch (error) {
      console.error('Error analyzing context:', error);
      toast.error('Failed to analyze context');
    }
  };

  /**
   * Apply context adaptations
   */
  const applyContextAdaptations = async () => {
    if (!document || !contextAnalysis) return;
    
    try {
      setIsApplyingRules(true);
      
      const adaptations = contextAnalysis.suggestions.map(suggestion => ({
        name: `Adaptation_${Date.now()}_${suggestion.target}`,
        description: suggestion.reason,
        condition: {
          type: 'simple',
          variable: 'context',
          operator: 'equals',
          value: 'true'
        },
        action: suggestion.type === 'add' || suggestion.type === 'modify' ? 'insertText' : 'hide',
        targetVariables: [suggestion.target]
      }));
      
      const response = await axios.post('/api/customization/context/adapt', {
        documentId: document._id,
        adaptations
      });
      
      setDocument(response.data.document);
      setDocumentContent(response.data.document.content);
      toast.success('Document adapted successfully');
      
      // Notify parent component
      if (onDocumentUpdate) {
        onDocumentUpdate(response.data.document);
      }
      
      setIsApplyingRules(false);
      
      // Show preview after applying adaptations
      setShowPreview(true);
    } catch (error) {
      console.error('Error adapting document:', error);
      toast.error('Failed to adapt document');
      setIsApplyingRules(false);
    }
  };

  /**
   * Handle context data change
   */
  const handleContextChange = (e) => {
    const { name, value } = e.target;
    setContextData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  /**
   * Add new context field
   */
  const addContextField = () => {
    setContextData(prevData => ({
      ...prevData,
      [`field_${Object.keys(prevData).length + 1}`]: ''
    }));
  };

  /**
   * Generate dynamic text using AI
   */
  const generateDynamicText = async () => {
    if (!document) return;
    
    try {
      setIsGeneratingText(true);
      
      const response = await axios.post('/api/documents/generate-text', {
        documentId: document._id,
        prompt: dynamicTextValue
      });
      
      if (response.data.generatedText) {
        // Create a new rule to insert the generated text
        const insertRule = {
          name: `AI_Generated_Text_${Date.now()}`,
          description: `Insert AI-generated text based on: ${dynamicTextValue.substring(0, 30)}...`,
          condition: {
            type: 'simple',
            variable: 'context',
            operator: 'equals',
            value: 'true'
          },
          action: 'insertText',
          targetVariables: [`dynamic_text:${response.data.generatedText}`],
          active: true
        };
        
        addRule(insertRule);
        toast.success('AI-generated text rule created');
      }
      
      setIsGeneratingText(false);
      setDynamicTextValue('');
    } catch (error) {
      console.error('Error generating text:', error);
      toast.error('Failed to generate text');
      setIsGeneratingText(false);
    }
  };

  /**
   * Handle dynamic text prompt change
   */
  const handleDynamicTextChange = (e) => {
    setDynamicTextValue(e.target.value);
  };

  if (isLoadingDocument) {
    return <div className="document-customizer loading">Loading document...</div>;
  }

  if (!document) {
    return <div className="document-customizer error">Document not found</div>;
  }

  return (
    <div className="document-customizer">
      <div className="document-info">
        <h2>{document.name}</h2>
        <p>Template: {template ? template.name : 'N/A'}</p>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
        <button 
          className={`tab-button ${activeTab === 'context' ? 'active' : ''}`}
          onClick={() => setActiveTab('context')}
        >
          Context Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('preview');
            generatePreview();
          }}
        >
          Preview
        </button>
        <button 
          className={`tab-button ${activeTab === 'dynamic' ? 'active' : ''}`}
          onClick={() => setActiveTab('dynamic')}
        >
          Dynamic Text
        </button>
      </div>
      
      {activeTab === 'rules' && (
        <div className="rules-tab">
          <div className="rules-container">
            <div className="section-header">
              <h3>Conditional Rules</h3>
              <div className="rule-actions">
                <button 
                  className="create-rule-button"
                  onClick={() => setShowRuleEditor(!showRuleEditor)}
                >
                  {showRuleEditor ? 'Cancel' : '+ Create Rule'}
                </button>
                <button 
                  className="suggest-button"
                  onClick={suggestRules}
                  disabled={isLoadingRules}
                >
                  {isLoadingRules ? 'Suggesting...' : 'AI Suggest Rules'}
                </button>
              </div>
            </div>
            
            {showRuleEditor && (
              <div className="rule-editor">
                <h4>Create New Rule</h4>
                <div className="rule-form">
                  <div className="form-group">
                    <label htmlFor="rule-name">Rule Name:</label>
                    <input
                      type="text"
                      id="rule-name"
                      name="name"
                      value={newRule.name}
                      onChange={handleRuleChange}
                      placeholder="Enter rule name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="rule-description">Description:</label>
                    <textarea
                      id="rule-description"
                      name="description"
                      value={newRule.description}
                      onChange={handleRuleChange}
                      placeholder="Enter rule description"
                      rows="2"
                    />
                  </div>
                  
                  <div className="condition-section">
                    <h5>Condition</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="condition-variable">Variable:</label>
                        <select
                          id="condition-variable"
                          name="condition.variable"
                          value={newRule.condition.variable}
                          onChange={handleRuleChange}
                        >
                          <option value="">Select variable</option>
                          {variables.map((variable, index) => (
                            <option key={index} value={variable.name}>
                              {variable.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="condition-operator">Operator:</label>
                        <select
                          id="condition-operator"
                          name="condition.operator"
                          value={newRule.condition.operator}
                          onChange={handleRuleChange}
                        >
                          <option value="equals">equals</option>
                          <option value="notEquals">not equals</option>
                          <option value="contains">contains</option>
                          <option value="startsWith">starts with</option>
                          <option value="endsWith">ends with</option>
                          <option value="isEmpty">is empty</option>
                          <option value="isNotEmpty">is not empty</option>
                        </select>
                      </div>
                      
                      {newRule.condition.operator !== 'isEmpty' && 
                       newRule.condition.operator !== 'isNotEmpty' && (
                        <div className="form-group">
                          <label htmlFor="condition-value">Value:</label>
                          <input
                            type="text"
                            id="condition-value"
                            name="condition.value"
                            value={newRule.condition.value}
                            onChange={handleRuleChange}
                            placeholder="Enter value"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="action-section">
                    <h5>Action</h5>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="action-type">Action Type:</label>
                        <select
                          id="action-type"
                          name="action"
                          value={newRule.action}
                          onChange={handleRuleChange}
                        >
                          <option value="show">Show section</option>
                          <option value="hide">Hide section</option>
                          <option value="insertText">Insert text</option>
                          <option value="generateText">Generate text</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="target-variable">Target:</label>
                        <select
                          id="target-variable"
                          name="targetVariable"
                          value={newRule.targetVariables[0]}
                          onChange={handleRuleChange}
                        >
                          <option value="">Select target</option>
                          {variables.map((variable, index) => (
                            <option key={index} value={variable.name}>
                              {variable.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rule-form-actions">
                    <button
                      className="cancel-button"
                      onClick={() => setShowRuleEditor(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="add-rule-button"
                      onClick={addCustomRule}
                    >
                      Add Rule
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {rules.length === 0 ? (
              <p className="no-rules">No rules defined. Create a new rule or use the "AI Suggest Rules" button to get started.</p>
            ) : (
              <ul className="rules-list">
                {rules.map((rule, index) => (
                  <li key={index} className={`rule-item ${!rule.active ? 'inactive' : ''}`}>
                    <div className="rule-header">
                      <div className="rule-title">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => toggleRule(rule.name)}
                          id={`rule-check-${index}`}
                        />
                        <label htmlFor={`rule-check-${index}`}>{rule.name}</label>
                      </div>
                      <button 
                        className="remove-rule"
                        onClick={() => removeRule(rule.name)}
                        aria-label="Remove rule"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="rule-description">{rule.description}</p>
                    <div className="rule-details">
                      <div className="condition">
                        <strong>Condition:</strong> 
                        {rule.condition.type === 'simple' 
                          ? `${rule.condition.variable} ${rule.condition.operator} ${rule.condition.value !== undefined ? rule.condition.value : ''}`
                          : 'Compound condition'}
                      </div>
                      <div className="action">
                        <strong>Action:</strong> {rule.action} 
                        {rule.targetVariables && rule.targetVariables.length > 0 && (
                          <span> on {rule.targetVariables.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="action-buttons">
              <button
                className="preview-button"
                onClick={() => {
                  generatePreview();
                  setActiveTab('preview');
                }}
                disabled={isLoadingPreview}
              >
                {isLoadingPreview ? 'Loading...' : 'Preview Changes'}
              </button>
              
              <button
                className="apply-button"
                onClick={applyRules}
                disabled={isApplyingRules || rules.filter(r => r.active).length === 0}
              >
                {isApplyingRules ? 'Applying...' : 'Apply Rules'}
              </button>
            </div>
          </div>
          
          {suggestedRules.length > 0 && (
            <div className="suggested-rules">
              <h3>AI Suggested Rules</h3>
              <ul className="suggestions-list">
                {suggestedRules.map((rule, index) => (
                  <li key={index} className="suggestion-item">
                    <div className="suggestion-header">
                      <span>{rule.name}</span>
                      <button 
                        className="add-rule"
                        onClick={() => addRule(rule)}
                      >
                        + Add
                      </button>
                    </div>
                    <p>{rule.description}</p>
                    <div className="suggestion-details">
                      <div className="condition-preview">
                        <strong>Condition:</strong> {rule.condition.variable} {rule.condition.operator} {rule.condition.value}
                      </div>
                      <div className="action-preview">
                        <strong>Action:</strong> {rule.action} {rule.targetVariables && rule.targetVariables.join(', ')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'context' && (
        <div className="context-tab">
          <div className="context-data">
            <h3>Situational Context</h3>
            <p className="context-hint">Add situational context information to get AI-powered suggestions for document adaptations</p>
            <div className="context-fields">
              {Object.keys(contextData).length === 0 && (
                <p className="no-context">Add context fields to begin analysis.</p>
              )}
              
              {Object.keys(contextData).map(key => (
                <div className="context-field" key={key}>
                  <label htmlFor={key}>{key.split('_').join(' ')}</label>
                  <input
                    type="text"
                    id={key}
                    name={key}
                    value={contextData[key]}
                    onChange={handleContextChange}
                    placeholder="Enter context value"
                  />
                </div>
              ))}
              <button className="add-field-button" onClick={addContextField}>
                + Add Context Field
              </button>
            </div>
            
            <button
              className="analyze-button"
              onClick={analyzeContext}
              disabled={Object.keys(contextData).length === 0}
            >
              Analyze Context
            </button>
          </div>
          
          {contextAnalysis && (
            <div className="analysis-results">
              <h3>Analysis Results</h3>
              
              <div className="analysis-section">
                <h4>Context Alignment</h4>
                <p>{contextAnalysis.contextAnalysis.alignment}</p>
                <ul className="key-factors">
                  {contextAnalysis.contextAnalysis.keyFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
              
              {contextAnalysis.suggestions && contextAnalysis.suggestions.length > 0 && (
                <div className="analysis-section">
                  <h4>Suggested Adaptations</h4>
                  <ul className="adaptations-list">
                    {contextAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="adaptation-item">
                        <div className="adaptation-type">
                          <span className={`type-badge ${suggestion.type}`}>
                            {suggestion.type}
                          </span>
                        </div>
                        <div className="adaptation-details">
                          <strong>{suggestion.target}</strong>
                          <p>{suggestion.reason}</p>
                          {suggestion.content && (
                            <div className="content-preview">
                              {suggestion.content.substring(0, 100)}
                              {suggestion.content.length > 100 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="adaptation-buttons">
                    <button
                      className="preview-adaptations-button"
                      onClick={() => {
                        generatePreview();
                        setActiveTab('preview');
                      }}
                    >
                      Preview Adaptations
                    </button>
                    
                    <button
                      className="apply-adaptations-button"
                      onClick={applyContextAdaptations}
                      disabled={isApplyingRules}
                    >
                      {isApplyingRules ? 'Applying...' : 'Apply Adaptations'}
                    </button>
                  </div>
                </div>
              )}
              
              {contextAnalysis.riskFactors && contextAnalysis.riskFactors.length > 0 && (
                <div className="analysis-section">
                  <h4>Risk Factors</h4>
                  <ul className="risks-list">
                    {contextAnalysis.riskFactors.map((risk, index) => (
                      <li key={index} className={`risk-item ${risk.severity}`}>
                        <div className="risk-header">
                          <strong>{risk.risk}</strong>
                          <span className="severity-badge">
                            {risk.severity}
                          </span>
                        </div>
                        <p className="mitigation">{risk.mitigation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'preview' && (
        <div className="preview-tab">
          <h3>Document Preview</h3>
          <p className="preview-hint">
            This preview shows how your document will look with all selected rules applied
          </p>
          
          <div className="preview-controls">
            <button
              className="refresh-preview"
              onClick={generatePreview}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? 'Refreshing...' : 'Refresh Preview'}
            </button>
            
            <button
              className="apply-button"
              onClick={applyRules}
              disabled={isApplyingRules || rules.filter(r => r.active).length === 0}
            >
              {isApplyingRules ? 'Applying...' : 'Apply All Rules'}
            </button>
          </div>
          
          <div className="document-preview" ref={previewRef}>
            {isLoadingPreview ? (
              <div className="preview-loading">
                Loading document preview...
              </div>
            ) : (
              <div className="preview-content">
                {documentContent.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'dynamic' && (
        <div className="dynamic-tab">
          <h3>Dynamic Text Insertion</h3>
          <p className="dynamic-hint">
            Use AI to generate dynamic text based on your document content and context
          </p>
          
          <div className="dynamic-text-controls">
            <div className="dynamic-text-input">
              <label htmlFor="dynamic-text-prompt">Text generation prompt:</label>
              <textarea
                id="dynamic-text-prompt"
                name="dynamicTextPrompt"
                value={dynamicTextValue}
                onChange={handleDynamicTextChange}
                placeholder="Describe what kind of text you want to generate (e.g., 'Generate a paragraph about data protection that's relevant to this document')"
                rows="4"
              />
            </div>
            
            <button
              className="generate-text-button"
              onClick={generateDynamicText}
              disabled={isGeneratingText || !dynamicTextValue.trim()}
            >
              {isGeneratingText ? 'Generating...' : 'Generate Text with AI'}
            </button>
          </div>
          
          <div className="dynamic-text-examples">
            <h4>Example Prompts:</h4>
            <ul className="examples-list">
              <li>
                <button onClick={() => setDynamicTextValue('Generate a paragraph about data protection policies')}>
                  Generate a paragraph about data protection policies
                </button>
              </li>
              <li>
                <button onClick={() => setDynamicTextValue('Write a concise disclaimer section for a financial document')}>
                  Write a concise disclaimer section for a financial document
                </button>
              </li>
              <li>
                <button onClick={() => setDynamicTextValue('Create a compliance notice regarding GDPR requirements')}>
                  Create a compliance notice regarding GDPR requirements
                </button>
              </li>
            </ul>
          </div>
          
          {rules.some(rule => rule.name.startsWith('AI_Generated_Text')) && (
            <div className="ai-generated-rules">
              <h4>Your AI-Generated Text Rules:</h4>
              <ul className="ai-rules-list">
                {rules
                  .filter(rule => rule.name.startsWith('AI_Generated_Text'))
                  .map((rule, index) => (
                    <li key={index} className="ai-rule-item">
                      <div className="ai-rule-header">
                        <strong>{rule.description}</strong>
                        <div className="ai-rule-controls">
                          <input
                            type="checkbox"
                            checked={rule.active}
                            onChange={() => toggleRule(rule.name)}
                            id={`ai-rule-check-${index}`}
                          />
                          <label htmlFor={`ai-rule-check-${index}`}>Active</label>
                          <button 
                            className="remove-rule"
                            onClick={() => removeRule(rule.name)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {rule.targetVariables && rule.targetVariables[0] && rule.targetVariables[0].includes(':') && (
                        <div className="ai-text-preview">
                          {rule.targetVariables[0].split(':')[1]}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
              
              <button
                className="preview-button"
                onClick={() => {
                  generatePreview();
                  setActiveTab('preview');
                }}
              >
                Preview with Generated Text
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentCustomizer;