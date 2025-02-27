import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './DocumentCustomizer.css';

/**
 * Component for customizing documents with conditional rules
 */
const DocumentCustomizer = ({ documentId, onDocumentUpdate }) => {
  const [document, setDocument] = useState(null);
  const [template, setTemplate] = useState(null);
  const [rules, setRules] = useState([]);
  const [suggestedRules, setSuggestedRules] = useState([]);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isApplyingRules, setIsApplyingRules] = useState(false);
  const [contextData, setContextData] = useState({});
  const [contextAnalysis, setContextAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');

  // Load document data
  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  /**
   * Load document and template data
   */
  const loadDocument = async () => {
    try {
      setIsLoadingDocument(true);
      const response = await axios.get(`/api/documents/${documentId}`);
      setDocument(response.data);
      setTemplate(response.data.template);
      
      // Set any existing rules
      if (response.data.appliedRules && response.data.appliedRules.length > 0) {
        setRules(response.data.appliedRules);
      }
      
      setIsLoadingDocument(false);
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
      setIsLoadingDocument(false);
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
    } catch (error) {
      console.error('Error suggesting rules:', error);
      toast.error('Failed to suggest rules');
      setIsLoadingRules(false);
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
      toast.success('Rules applied successfully');
      
      // Notify parent component
      if (onDocumentUpdate) {
        onDocumentUpdate(response.data.document);
      }
      
      setIsApplyingRules(false);
    } catch (error) {
      console.error('Error applying rules:', error);
      toast.error('Failed to apply rules');
      setIsApplyingRules(false);
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
        return prevRules;
      }
      return [...prevRules, { ...rule, active: true }];
    });
  };

  /**
   * Remove a rule from the list
   */
  const removeRule = (ruleName) => {
    setRules(prevRules => prevRules.filter(rule => rule.name !== ruleName));
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
   * Analyze document in current context
   */
  const analyzeContext = async () => {
    if (!document) return;
    
    try {
      const response = await axios.post('/api/customization/context/analyze', {
        documentId: document._id,
        contextData
      });
      
      setContextAnalysis(response.data);
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
      toast.success('Document adapted successfully');
      
      // Notify parent component
      if (onDocumentUpdate) {
        onDocumentUpdate(response.data.document);
      }
      
      setIsApplyingRules(false);
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
      </div>
      
      {activeTab === 'rules' && (
        <div className="rules-tab">
          <div className="rules-container">
            <div className="section-header">
              <h3>Conditional Rules</h3>
              <button 
                className="suggest-button"
                onClick={suggestRules}
                disabled={isLoadingRules}
              >
                {isLoadingRules ? 'Suggesting...' : 'Suggest Rules'}
              </button>
            </div>
            
            {rules.length === 0 ? (
              <p className="no-rules">No rules defined. Use the "Suggest Rules" button to get started.</p>
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
                        />
                        <span>{rule.name}</span>
                      </div>
                      <button 
                        className="remove-rule"
                        onClick={() => removeRule(rule.name)}
                      >
                        ✕
                      </button>
                    </div>
                    <p className="rule-description">{rule.description}</p>
                    <div className="rule-details">
                      <div className="condition">
                        <strong>Condition:</strong> 
                        {rule.condition.type === 'simple' 
                          ? `${rule.condition.variable} ${rule.condition.operator} ${rule.condition.value}`
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
            
            <button
              className="apply-button"
              onClick={applyRules}
              disabled={isApplyingRules || rules.length === 0}
            >
              {isApplyingRules ? 'Applying...' : 'Apply Rules'}
            </button>
          </div>
          
          {suggestedRules.length > 0 && (
            <div className="suggested-rules">
              <h3>Suggested Rules</h3>
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
            <div className="context-fields">
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
                + Add Field
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
                  
                  <button
                    className="apply-adaptations-button"
                    onClick={applyContextAdaptations}
                  >
                    Apply Adaptations
                  </button>
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
    </div>
  );
};

export default DocumentCustomizer;