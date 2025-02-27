import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './DocumentAutoFill.css';

/**
 * Component for auto-filling document templates with user data
 */
const DocumentAutoFill = ({ templateId, onVariablesFilled }) => {
  const [template, setTemplate] = useState(null);
  const [variables, setVariables] = useState([]);
  const [filledValues, setFilledValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [autoFilling, setAutoFilling] = useState(false);
  const [dataState, setDataState] = useState('unfilled'); // unfilled, partial, filled

  // Load template and variables when component mounts
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  // Check fill status whenever filledValues changes
  useEffect(() => {
    if (variables.length > 0) {
      const requiredVars = variables.filter(v => v.required);
      const filledRequiredCount = requiredVars.filter(v => filledValues[v.name]).length;
      
      if (filledRequiredCount === 0) {
        setDataState('unfilled');
      } else if (filledRequiredCount < requiredVars.length) {
        setDataState('partial');
      } else {
        setDataState('filled');
      }
    }
  }, [filledValues, variables]);

  /**
   * Load template data
   */
  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/templates/${templateId}`);
      setTemplate(response.data);
      
      // Process variables
      if (response.data.variables) {
        const processedVars = response.data.variables.map(v => ({
          ...v,
          label: v.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          description: v.description || `Enter ${v.name}`
        }));
        
        setVariables(processedVars);
        
        // Initialize filled values
        const initialValues = {};
        processedVars.forEach(v => {
          initialValues[v.name] = '';
        });
        
        setFilledValues(initialValues);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
      setLoading(false);
    }
  };

  /**
   * Handle input change for a variable
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilledValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Auto-fill variables with user data
   */
  const autoFillVariables = async () => {
    try {
      setAutoFilling(true);
      
      const response = await axios.post('/api/data/autofill', {
        templateId
      });
      
      if (response.data.filledVariables) {
        // Update filled values
        setFilledValues(prev => ({
          ...prev,
          ...response.data.filledVariables
        }));
        
        const filledCount = Object.keys(response.data.filledVariables).length;
        toast.success(`Auto-filled ${filledCount} fields from your profile`);
      } else {
        toast.info('No matching data found for auto-fill');
      }
      
      setAutoFilling(false);
    } catch (error) {
      console.error('Error auto-filling document:', error);
      toast.error('Failed to auto-fill document');
      setAutoFilling(false);
    }
  };

  /**
   * Submit filled variables
   */
  const submitFilledVariables = () => {
    // Check if all required variables are filled
    const requiredVars = variables.filter(v => v.required);
    const missingRequired = requiredVars.filter(v => !filledValues[v.name]);
    
    if (missingRequired.length > 0) {
      toast.error(`Please fill in all required fields: ${missingRequired.map(v => v.label).join(', ')}`);
      return;
    }
    
    // Notify parent component
    if (onVariablesFilled) {
      onVariablesFilled(filledValues);
    }
    
    toast.success('Variables saved successfully');
  };

  /**
   * Clear all filled values
   */
  const clearValues = () => {
    const initialValues = {};
    variables.forEach(v => {
      initialValues[v.name] = '';
    });
    
    setFilledValues(initialValues);
    toast.info('All values cleared');
  };

  if (loading) {
    return <div className="document-auto-fill loading">Loading template variables...</div>;
  }

  if (!template) {
    return <div className="document-auto-fill error">Template not found</div>;
  }

  return (
    <div className="document-auto-fill">
      <div className="header">
        <h3>Fill Template Variables</h3>
        <div className="fill-status">
          <span className={`status-badge ${dataState}`}>
            {dataState === 'unfilled' && 'Not Started'}
            {dataState === 'partial' && 'Partially Filled'}
            {dataState === 'filled' && 'Complete'}
          </span>
        </div>
      </div>
      
      <p className="template-name">
        Template: <strong>{template.name}</strong>
      </p>
      
      <div className="auto-fill-controls">
        <button 
          className="auto-fill-button"
          onClick={autoFillVariables}
          disabled={autoFilling}
        >
          {autoFilling ? 'Auto-filling...' : 'Auto-fill from Profile'}
        </button>
        
        <button 
          className="clear-button"
          onClick={clearValues}
          disabled={autoFilling}
        >
          Clear All
        </button>
      </div>
      
      <div className="variables-form">
        {variables.length === 0 ? (
          <p className="no-variables">This template has no variables to fill.</p>
        ) : (
          <>
            <div className="variables-grid">
              {variables.map((variable, index) => (
                <div 
                  key={index} 
                  className={`variable-field ${variable.required ? 'required' : 'optional'}`}
                >
                  <label htmlFor={variable.name}>
                    {variable.label}
                    {variable.required && <span className="required-marker">*</span>}
                  </label>
                  
                  {variable.dataType === 'select' ? (
                    <select
                      id={variable.name}
                      name={variable.name}
                      value={filledValues[variable.name] || ''}
                      onChange={handleInputChange}
                      required={variable.required}
                    >
                      <option value="">Select an option</option>
                      {variable.options?.map((option, optIdx) => (
                        <option key={optIdx} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : variable.dataType === 'date' ? (
                    <input
                      type="date"
                      id={variable.name}
                      name={variable.name}
                      value={filledValues[variable.name] || ''}
                      onChange={handleInputChange}
                      required={variable.required}
                    />
                  ) : variable.dataType === 'number' ? (
                    <input
                      type="number"
                      id={variable.name}
                      name={variable.name}
                      value={filledValues[variable.name] || ''}
                      onChange={handleInputChange}
                      required={variable.required}
                    />
                  ) : variable.dataType === 'boolean' ? (
                    <select
                      id={variable.name}
                      name={variable.name}
                      value={filledValues[variable.name] || ''}
                      onChange={handleInputChange}
                      required={variable.required}
                    >
                      <option value="">Select an option</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      id={variable.name}
                      name={variable.name}
                      value={filledValues[variable.name] || ''}
                      onChange={handleInputChange}
                      placeholder={variable.description}
                      required={variable.required}
                    />
                  )}
                  
                  {variable.description && (
                    <div className="variable-description">{variable.description}</div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="variables-actions">
              <button 
                className="submit-button"
                onClick={submitFilledVariables}
                disabled={autoFilling}
              >
                Save and Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentAutoFill;