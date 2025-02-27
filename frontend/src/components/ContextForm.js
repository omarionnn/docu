import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ContextForm.css';

/**
 * Form component for collecting situational context data
 */
const ContextForm = ({ documentId, onContextSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState(null);
  const [contextData, setContextData] = useState({
    industry: '',
    region: '',
    partyType: '',
    contractValue: '',
    timeConstraints: '',
    regulatoryEnvironment: '',
    relationshipType: '',
    additionalNotes: ''
  });
  const [customFields, setCustomFields] = useState([]);

  // Load document if ID is provided
  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  /**
   * Load document data
   */
  const loadDocument = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/documents/${documentId}`);
      setDocument(response.data);
      
      // If document has previous context data, load it
      if (response.data.contextData && Object.keys(response.data.contextData).length > 0) {
        setContextData(prevData => ({
          ...prevData,
          ...response.data.contextData
        }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document context');
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Combine standard fields with custom fields
    const allContextData = {
      ...contextData,
      ...Object.fromEntries(
        customFields.map(field => [field.key, field.value])
      )
    };
    
    try {
      setLoading(true);
      
      // Save context data to document
      await axios.post('/api/customization/context/analyze', {
        documentId,
        contextData: allContextData
      });
      
      toast.success('Context data saved successfully');
      
      // Notify parent component
      if (onContextSubmit) {
        onContextSubmit(allContextData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving context data:', error);
      toast.error('Failed to save context data');
      setLoading(false);
    }
  };

  /**
   * Handle standard field change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setContextData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  /**
   * Handle custom field change
   */
  const handleCustomFieldChange = (index, value) => {
    setCustomFields(prevFields => {
      const updatedFields = [...prevFields];
      updatedFields[index] = {
        ...updatedFields[index],
        value
      };
      return updatedFields;
    });
  };

  /**
   * Add new custom field
   */
  const addCustomField = () => {
    setCustomFields(prevFields => [
      ...prevFields,
      { key: '', value: '' }
    ]);
  };

  /**
   * Update custom field key
   */
  const updateCustomFieldKey = (index, key) => {
    setCustomFields(prevFields => {
      const updatedFields = [...prevFields];
      updatedFields[index] = {
        ...updatedFields[index],
        key
      };
      return updatedFields;
    });
  };

  /**
   * Remove custom field
   */
  const removeCustomField = (index) => {
    setCustomFields(prevFields => 
      prevFields.filter((_, i) => i !== index)
    );
  };

  if (loading && !document) {
    return <div className="context-form loading">Loading document context...</div>;
  }

  return (
    <div className="context-form">
      <h3>Situational Context</h3>
      <p className="form-description">
        Provide details about the situation in which this document will be used. 
        This information helps our AI customize the document to be more relevant.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="industry">Industry</label>
            <select 
              id="industry" 
              name="industry" 
              value={contextData.industry}
              onChange={handleChange}
            >
              <option value="">Select industry</option>
              <option value="Technology">Technology</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Legal Services">Legal Services</option>
              <option value="Construction">Construction</option>
              <option value="Energy">Energy</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="region">Region</label>
            <select 
              id="region" 
              name="region" 
              value={contextData.region}
              onChange={handleChange}
            >
              <option value="">Select region</option>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia Pacific">Asia Pacific</option>
              <option value="Latin America">Latin America</option>
              <option value="Middle East & Africa">Middle East & Africa</option>
              <option value="Global">Global</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="partyType">Party Type</label>
            <select 
              id="partyType" 
              name="partyType" 
              value={contextData.partyType}
              onChange={handleChange}
            >
              <option value="">Select party type</option>
              <option value="Individual">Individual</option>
              <option value="Small Business">Small Business</option>
              <option value="Medium Enterprise">Medium Enterprise</option>
              <option value="Large Corporation">Large Corporation</option>
              <option value="Non-profit">Non-profit</option>
              <option value="Government">Government</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="contractValue">Contract Value</label>
            <select 
              id="contractValue" 
              name="contractValue" 
              value={contextData.contractValue}
              onChange={handleChange}
            >
              <option value="">Select value range</option>
              <option value="Under $10,000">Under $10,000</option>
              <option value="$10,000 - $50,000">$10,000 - $50,000</option>
              <option value="$50,000 - $100,000">$50,000 - $100,000</option>
              <option value="$100,000 - $500,000">$100,000 - $500,000</option>
              <option value="$500,000 - $1 million">$500,000 - $1 million</option>
              <option value="Over $1 million">Over $1 million</option>
              <option value="N/A">Not Applicable</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="timeConstraints">Time Constraints</label>
            <select 
              id="timeConstraints" 
              name="timeConstraints" 
              value={contextData.timeConstraints}
              onChange={handleChange}
            >
              <option value="">Select time constraint</option>
              <option value="Urgent (within days)">Urgent (within days)</option>
              <option value="Short term (within weeks)">Short term (within weeks)</option>
              <option value="Standard (within months)">Standard (within months)</option>
              <option value="Long term (6+ months)">Long term (6+ months)</option>
              <option value="Ongoing relationship">Ongoing relationship</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="regulatoryEnvironment">Regulatory Environment</label>
            <select 
              id="regulatoryEnvironment" 
              name="regulatoryEnvironment" 
              value={contextData.regulatoryEnvironment}
              onChange={handleChange}
            >
              <option value="">Select regulatory environment</option>
              <option value="Highly regulated">Highly regulated</option>
              <option value="Moderately regulated">Moderately regulated</option>
              <option value="Minimally regulated">Minimally regulated</option>
              <option value="Industry self-regulation">Industry self-regulation</option>
              <option value="Evolving regulation">Evolving regulation</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="relationshipType">Relationship Type</label>
            <select 
              id="relationshipType" 
              name="relationshipType" 
              value={contextData.relationshipType}
              onChange={handleChange}
            >
              <option value="">Select relationship type</option>
              <option value="New relationship">New relationship</option>
              <option value="Existing relationship">Existing relationship</option>
              <option value="Renewal/extension">Renewal/extension</option>
              <option value="Vendor/supplier">Vendor/supplier</option>
              <option value="Partner/collaboration">Partner/collaboration</option>
              <option value="Internal">Internal</option>
            </select>
          </div>
        </div>
        
        <div className="form-group full-width">
          <label htmlFor="additionalNotes">Additional Notes</label>
          <textarea 
            id="additionalNotes" 
            name="additionalNotes" 
            value={contextData.additionalNotes}
            onChange={handleChange}
            placeholder="Any additional context or special circumstances..."
            rows={4}
          />
        </div>
        
        {customFields.length > 0 && (
          <div className="custom-fields">
            <h4>Custom Fields</h4>
            {customFields.map((field, index) => (
              <div key={index} className="custom-field">
                <input
                  type="text"
                  placeholder="Field name"
                  value={field.key}
                  onChange={(e) => updateCustomFieldKey(index, e.target.value)}
                  className="field-key"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => handleCustomFieldChange(index, e.target.value)}
                  className="field-value"
                />
                <button 
                  type="button" 
                  className="remove-field"
                  onClick={() => removeCustomField(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="button"
            className="add-field-button"
            onClick={addCustomField}
          >
            + Add Custom Field
          </button>
          
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Context Data'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContextForm;