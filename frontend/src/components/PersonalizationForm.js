import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PersonalizationForm.css';

/**
 * Component for personalizing documents based on user profile
 */
const PersonalizationForm = ({ templateId, onDocumentCreate }) => {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileData, setProfileData] = useState({
    personalInfo: {},
    preferences: {}
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  // Load template and user profile on component mount
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
    loadUserProfile();
  }, [templateId]);

  /**
   * Load template data
   */
  const loadTemplate = async () => {
    try {
      setIsLoadingTemplate(true);
      const response = await axios.get(`/api/templates/${templateId}`);
      setTemplate(response.data);
      setIsLoadingTemplate(false);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
      setIsLoadingTemplate(false);
    }
  };

  /**
   * Load user profile data
   */
  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await axios.get('/api/customization/profile');
      setUserProfile(response.data);
      
      // Set initial form values from profile
      if (response.data) {
        setProfileData({
          personalInfo: response.data.personalInfo || {},
          preferences: response.data.preferences || {}
        });
      }
      
      setIsLoadingProfile(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
      setIsLoadingProfile(false);
    }
  };

  /**
   * Handle personal info field change
   */
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      personalInfo: {
        ...prevData.personalInfo,
        [name]: value
      }
    }));
  };

  /**
   * Handle preferences field change
   */
  const handlePreferencesChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      preferences: {
        ...prevData.preferences,
        [name]: value
      }
    }));
  };

  /**
   * Save user profile
   */
  const saveProfile = async () => {
    try {
      setLoading(true);
      
      const response = await axios.put('/api/customization/profile', {
        personalInfo: profileData.personalInfo,
        preferences: profileData.preferences
      });
      
      setUserProfile(response.data.profile);
      toast.success('Profile saved successfully');
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
      setLoading(false);
    }
  };

  /**
   * Create personalized document
   */
  const createPersonalizedDocument = async () => {
    if (!templateId) return;
    
    try {
      setLoading(true);
      
      // First, save the profile
      await saveProfile();
      
      // Then create the personalized document
      const response = await axios.post('/api/customization/personalize', {
        templateId,
        personalInfo: profileData.personalInfo
      });
      
      toast.success('Personalized document created successfully');
      
      // Notify parent component
      if (onDocumentCreate) {
        onDocumentCreate(response.data.document);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating personalized document:', error);
      toast.error('Failed to create personalized document');
      setLoading(false);
    }
  };

  /**
   * Determine variable fields needed by the template
   */
  const getTemplateVariableFields = () => {
    if (!template || !template.variables) return [];
    
    return template.variables.map(variable => ({
      name: variable.name,
      label: variable.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      description: variable.description || `Enter ${variable.name}`,
      required: variable.required || false,
      dataType: variable.dataType || 'text',
      options: variable.options || []
    }));
  };

  if (isLoadingProfile || isLoadingTemplate) {
    return <div className="personalization-form loading">Loading...</div>;
  }

  if (!template && templateId) {
    return <div className="personalization-form error">Template not found</div>;
  }

  const templateVariables = templateId ? getTemplateVariableFields() : [];

  return (
    <div className="personalization-form">
      <h3>Document Personalization</h3>
      <p className="form-description">
        Personalize this document based on your profile information. This data can be saved to your profile for future use.
      </p>
      
      <div className="form-sections">
        <div className="form-section">
          <h4>Personal Information</h4>
          <div className="field-grid">
            <div className="form-field">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.personalInfo.name || ''}
                onChange={handlePersonalInfoChange}
                placeholder="Your full name"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={profileData.personalInfo.title || ''}
                onChange={handlePersonalInfoChange}
                placeholder="Your professional title"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={profileData.personalInfo.company || ''}
                onChange={handlePersonalInfoChange}
                placeholder="Your company name"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.personalInfo.email || ''}
                onChange={handlePersonalInfoChange}
                placeholder="Your email address"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={profileData.personalInfo.phone || ''}
                onChange={handlePersonalInfoChange}
                placeholder="Your phone number"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={profileData.personalInfo.address || ''}
                onChange={handlePersonalInfoChange}
                placeholder="Your address"
              />
            </div>
          </div>
        </div>
        
        {template && templateVariables.length > 0 && (
          <div className="form-section">
            <h4>Template Variables</h4>
            <p className="section-description">
              These fields are specific to the "{template.name}" template.
            </p>
            
            <div className="field-grid">
              {templateVariables.map((variable, index) => (
                <div className="form-field" key={index}>
                  <label htmlFor={variable.name}>
                    {variable.label}
                    {variable.required && <span className="required-marker">*</span>}
                  </label>
                  
                  {variable.dataType === 'select' ? (
                    <select
                      id={variable.name}
                      name={variable.name}
                      value={profileData.personalInfo[variable.name] || ''}
                      onChange={handlePersonalInfoChange}
                      required={variable.required}
                    >
                      <option value="">Select an option</option>
                      {variable.options.map((option, optIdx) => (
                        <option key={optIdx} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : variable.dataType === 'date' ? (
                    <input
                      type="date"
                      id={variable.name}
                      name={variable.name}
                      value={profileData.personalInfo[variable.name] || ''}
                      onChange={handlePersonalInfoChange}
                      placeholder={variable.description}
                      required={variable.required}
                    />
                  ) : variable.dataType === 'number' ? (
                    <input
                      type="number"
                      id={variable.name}
                      name={variable.name}
                      value={profileData.personalInfo[variable.name] || ''}
                      onChange={handlePersonalInfoChange}
                      placeholder={variable.description}
                      required={variable.required}
                    />
                  ) : variable.dataType === 'boolean' ? (
                    <select
                      id={variable.name}
                      name={variable.name}
                      value={profileData.personalInfo[variable.name] || ''}
                      onChange={handlePersonalInfoChange}
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
                      value={profileData.personalInfo[variable.name] || ''}
                      onChange={handlePersonalInfoChange}
                      placeholder={variable.description}
                      required={variable.required}
                    />
                  )}
                  
                  {variable.description && (
                    <div className="field-description">{variable.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="form-section">
          <h4>Document Preferences</h4>
          <div className="field-grid">
            <div className="form-field">
              <label htmlFor="language">Preferred Language</label>
              <select
                id="language"
                name="language"
                value={profileData.preferences.language || 'English'}
                onChange={handlePreferencesChange}
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
            
            <div className="form-field">
              <label htmlFor="formalityLevel">Formality Level</label>
              <select
                id="formalityLevel"
                name="formalityLevel"
                value={profileData.preferences.formalityLevel || 'Standard'}
                onChange={handlePreferencesChange}
              >
                <option value="Casual">Casual</option>
                <option value="Standard">Standard</option>
                <option value="Formal">Formal</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
            
            <div className="form-field">
              <label htmlFor="complexityLevel">Complexity Level</label>
              <select
                id="complexityLevel"
                name="complexityLevel"
                value={profileData.preferences.complexityLevel || 'Standard'}
                onChange={handlePreferencesChange}
              >
                <option value="Simple">Simple</option>
                <option value="Standard">Standard</option>
                <option value="Detailed">Detailed</option>
                <option value="Technical">Technical</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button
          type="button"
          className="save-profile-button"
          onClick={saveProfile}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        
        {templateId && (
          <button
            type="button"
            className="create-document-button"
            onClick={createPersonalizedDocument}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Personalized Document'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PersonalizationForm;