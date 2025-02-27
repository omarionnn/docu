import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './UserDataManager.css';

/**
 * Component for managing user data and profile
 */
const UserDataManager = ({ onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [personalInfo, setPersonalInfo] = useState({});
  const [preferences, setPreferences] = useState({});
  const [frequentVariables, setFrequentVariables] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validationResults, setValidationResults] = useState({});
  const [duplicateResults, setDuplicateResults] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);
  const [publicSearchParams, setPublicSearchParams] = useState({
    dataType: 'company',
    name: ''
  });
  const [publicDataResults, setPublicDataResults] = useState(null);

  // Load user profile and data on component mount
  useEffect(() => {
    loadUserData();
    if (activeTab === 'sources') {
      loadDataSources();
    } else if (activeTab === 'variables') {
      loadFrequentVariables();
    } else if (activeTab === 'history') {
      loadDataHistory();
    }
  }, [activeTab]);

  /**
   * Load user profile data
   */
  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/data/profile');
      
      // Set profile data
      if (response.data) {
        setPersonalInfo(response.data.personalInfo || {});
        setPreferences(response.data.preferences || {});
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
      setLoading(false);
    }
  };

  /**
   * Load frequently used variables
   */
  const loadFrequentVariables = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/data/variables/frequent');
      setFrequentVariables(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading frequent variables:', error);
      toast.error('Failed to load frequent variables');
      setLoading(false);
    }
  };

  /**
   * Load data sources
   */
  const loadDataSources = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/data/sources');
      setDataSources(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data sources:', error);
      toast.error('Failed to load data sources');
      setLoading(false);
    }
  };

  /**
   * Load data history
   */
  const loadDataHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/data/history');
      setDataHistory(response.data.history);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data history:', error);
      toast.error('Failed to load data history');
      setLoading(false);
    }
  };

  /**
   * Handle personal info field change
   */
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset validation for this field
    setValidationResults(prev => ({
      ...prev,
      [name]: null
    }));
  };

  /**
   * Handle preferences field change
   */
  const handlePreferencesChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Save user profile
   */
  const saveProfile = async () => {
    try {
      setLoading(true);
      
      // Save personal info
      await axios.post('/api/data/store', {
        data: personalInfo,
        category: 'personalInfo'
      });
      
      // Save preferences
      await axios.post('/api/data/store', {
        data: preferences,
        category: 'preferences'
      });
      
      toast.success('Profile saved successfully');
      
      // Notify parent component
      if (onProfileUpdate) {
        onProfileUpdate({ personalInfo, preferences });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
      setLoading(false);
    }
  };

  /**
   * Validate field data
   */
  const validateField = async (field, dataType) => {
    try {
      setLoading(true);
      
      // Create data object for validation
      const data = { [field]: personalInfo[field] };
      
      const response = await axios.post('/api/data/validate', {
        data,
        dataType
      });
      
      // Update validation results
      setValidationResults(prev => ({
        ...prev,
        [field]: response.data
      }));
      
      // Show validation result
      if (response.data.isValid) {
        toast.success(`${field} is valid`);
      } else if (response.data.errors.length > 0) {
        toast.error(response.data.errors[0]);
      }
      
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error('Error validating field:', error);
      toast.error('Failed to validate field');
      setLoading(false);
      return null;
    }
  };

  /**
   * Detect and merge duplicates
   */
  const detectDuplicates = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/data/deduplicate');
      setDuplicateResults(response.data);
      
      if (response.data.duplicatesDetected > 0) {
        toast.success(`${response.data.duplicatesDetected} duplicates detected and merged`);
        // Reload personal info to get merged data
        loadUserData();
      } else {
        toast.info('No duplicates detected');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      toast.error('Failed to detect duplicates');
      setLoading(false);
    }
  };

  /**
   * Search public data
   */
  const searchPublicData = async () => {
    try {
      setLoading(true);
      
      const { dataType, ...params } = publicSearchParams;
      const queryParams = new URLSearchParams(params).toString();
      
      const response = await axios.get(
        `/api/data/public?dataType=${dataType}&${queryParams}`
      );
      
      setPublicDataResults(response.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error searching public data:', error);
      toast.error('Failed to search public data');
      setLoading(false);
    }
  };

  /**
   * Import data from public source
   */
  const importPublicData = () => {
    if (!publicDataResults) return;
    
    // Merge with personal info
    setPersonalInfo(prev => ({
      ...prev,
      ...publicDataResults
    }));
    
    toast.success('Data imported to form');
  };

  /**
   * Handle public search params change
   */
  const handleSearchParamsChange = (e) => {
    const { name, value } = e.target;
    setPublicSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Add new data source
   */
  const addDataSource = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const type = formData.get('type');
    const description = formData.get('description');
    
    if (!name || !type) {
      toast.error('Name and type are required');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.post('/api/data/sources', {
        name,
        type,
        description,
        configuration: {}
      });
      
      // Reset form
      e.target.reset();
      
      // Reload data sources
      loadDataSources();
      
      toast.success('Data source added successfully');
      
      setLoading(false);
    } catch (error) {
      console.error('Error adding data source:', error);
      toast.error('Failed to add data source');
      setLoading(false);
    }
  };

  return (
    <div className="user-data-manager">
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data Tools
        </button>
        <button 
          className={`tab-button ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          Data Sources
        </button>
        <button 
          className={`tab-button ${activeTab === 'variables' ? 'active' : ''}`}
          onClick={() => setActiveTab('variables')}
        >
          Frequent Variables
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>
      
      {loading && <div className="loading-overlay">Loading...</div>}
      
      {activeTab === 'profile' && (
        <div className="profile-tab">
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={personalInfo.name || ''}
                  onChange={handlePersonalInfoChange}
                  className={validationResults.name?.isValid === false ? 'invalid' : ''}
                />
                {validationResults.name?.errors?.length > 0 && (
                  <div className="validation-error">{validationResults.name.errors[0]}</div>
                )}
                {validationResults.name?.suggestions?.length > 0 && (
                  <div className="validation-suggestions">
                    Did you mean: {validationResults.name.suggestions[0]}?
                  </div>
                )}
                <button 
                  type="button" 
                  className="validate-button"
                  onClick={() => validateField('name', 'text')}
                >
                  Validate
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={personalInfo.email || ''}
                  onChange={handlePersonalInfoChange}
                  className={validationResults.email?.isValid === false ? 'invalid' : ''}
                />
                {validationResults.email?.errors?.length > 0 && (
                  <div className="validation-error">{validationResults.email.errors[0]}</div>
                )}
                {validationResults.email?.suggestions?.length > 0 && (
                  <div className="validation-suggestions">
                    Did you mean: {validationResults.email.suggestions[0]}?
                  </div>
                )}
                <button 
                  type="button" 
                  className="validate-button"
                  onClick={() => validateField('email', 'email')}
                >
                  Validate
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={personalInfo.phone || ''}
                  onChange={handlePersonalInfoChange}
                  className={validationResults.phone?.isValid === false ? 'invalid' : ''}
                />
                {validationResults.phone?.errors?.length > 0 && (
                  <div className="validation-error">{validationResults.phone.errors[0]}</div>
                )}
                {validationResults.phone?.suggestions?.length > 0 && (
                  <div className="validation-suggestions">
                    Suggested format: {validationResults.phone.suggestions[0]}
                  </div>
                )}
                <button 
                  type="button" 
                  className="validate-button"
                  onClick={() => validateField('phone', 'phone')}
                >
                  Validate
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={personalInfo.company || ''}
                  onChange={handlePersonalInfoChange}
                  className={validationResults.company?.isValid === false ? 'invalid' : ''}
                />
                {validationResults.company?.suggestions?.length > 0 && (
                  <div className="validation-suggestions">
                    Suggestions: {validationResults.company.suggestions.join(', ')}
                  </div>
                )}
                <button 
                  type="button" 
                  className="validate-button"
                  onClick={() => validateField('company', 'company')}
                >
                  Validate
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor="title">Job Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={personalInfo.title || ''}
                  onChange={handlePersonalInfoChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={personalInfo.address || ''}
                  onChange={handlePersonalInfoChange}
                />
                <button 
                  type="button" 
                  className="validate-button"
                  onClick={() => validateField('address', 'address')}
                >
                  Validate
                </button>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Preferences</h3>
            <div className="fields-grid">
              <div className="form-group">
                <label htmlFor="language">Preferred Language</label>
                <select
                  id="language"
                  name="language"
                  value={preferences.language || 'English'}
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
              
              <div className="form-group">
                <label htmlFor="dateFormat">Date Format</label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  value={preferences.dateFormat || 'MM/DD/YYYY'}
                  onChange={handlePreferencesChange}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="timeZone">Time Zone</label>
                <select
                  id="timeZone"
                  name="timeZone"
                  value={preferences.timeZone || 'UTC'}
                  onChange={handlePreferencesChange}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="save-button"
              onClick={saveProfile}
              disabled={loading}
            >
              Save Profile
            </button>
            
            <button 
              type="button" 
              className="detect-duplicates-button"
              onClick={detectDuplicates}
              disabled={loading}
            >
              Detect Duplicates
            </button>
          </div>
          
          {duplicateResults && duplicateResults.duplicatesDetected > 0 && (
            <div className="duplicate-results">
              <h4>Duplicate Detection Results</h4>
              <p>{duplicateResults.duplicatesDetected} duplicates detected and merged.</p>
              <p>Fields affected: {duplicateResults.fieldsAffected.join(', ')}</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'data' && (
        <div className="data-tools-tab">
          <div className="public-data-section">
            <h3>Search Public Data</h3>
            <p className="section-description">
              Search for data from public sources to complement your profile information.
            </p>
            
            <div className="public-data-form">
              <div className="form-group">
                <label htmlFor="dataType">Data Type</label>
                <select
                  id="dataType"
                  name="dataType"
                  value={publicSearchParams.dataType}
                  onChange={handleSearchParamsChange}
                >
                  <option value="company">Company</option>
                  <option value="address">Address</option>
                  <option value="legal">Legal Entity</option>
                </select>
              </div>
              
              {publicSearchParams.dataType === 'company' && (
                <div className="form-group">
                  <label htmlFor="name">Company Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={publicSearchParams.name}
                    onChange={handleSearchParamsChange}
                    placeholder="Enter company name"
                  />
                </div>
              )}
              
              {publicSearchParams.dataType === 'address' && (
                <>
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={publicSearchParams.zipCode || ''}
                      onChange={handleSearchParamsChange}
                      placeholder="Enter ZIP code"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={publicSearchParams.city || ''}
                      onChange={handleSearchParamsChange}
                      placeholder="Enter city"
                    />
                  </div>
                </>
              )}
              
              {publicSearchParams.dataType === 'legal' && (
                <div className="form-group">
                  <label htmlFor="entity">Entity Name</label>
                  <input
                    type="text"
                    id="entity"
                    name="entity"
                    value={publicSearchParams.entity || ''}
                    onChange={handleSearchParamsChange}
                    placeholder="Enter entity name"
                  />
                </div>
              )}
              
              <button 
                type="button" 
                className="search-button"
                onClick={searchPublicData}
                disabled={loading}
              >
                Search
              </button>
            </div>
            
            {publicDataResults && (
              <div className="public-data-results">
                <h4>Search Results</h4>
                <div className="result-card">
                  <div className="result-header">
                    <strong>{publicDataResults.name || publicDataResults.formatted || 'Result'}</strong>
                    <span className="result-source">Source: {publicDataResults.source}</span>
                  </div>
                  
                  <div className="result-properties">
                    {Object.entries(publicDataResults)
                      .filter(([key]) => !['source', 'name', 'formatted'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="result-property">
                          <span className="property-name">{key}:</span>
                          <span className="property-value">
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                  
                  <button 
                    type="button" 
                    className="import-button"
                    onClick={importPublicData}
                  >
                    Import Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'sources' && (
        <div className="data-sources-tab">
          <div className="add-source-section">
            <h3>Add Data Source</h3>
            <form className="add-source-form" onSubmit={addDataSource}>
              <div className="form-group">
                <label htmlFor="sourceName">Name</label>
                <input
                  type="text"
                  id="sourceName"
                  name="name"
                  placeholder="Enter data source name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sourceType">Type</label>
                <select
                  id="sourceType"
                  name="type"
                  required
                >
                  <option value="">Select source type</option>
                  <option value="api">API</option>
                  <option value="database">Database</option>
                  <option value="file">File</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="sourceDescription">Description</label>
                <textarea
                  id="sourceDescription"
                  name="description"
                  placeholder="Enter data source description"
                  rows="3"
                />
              </div>
              
              <button 
                type="submit" 
                className="add-button"
                disabled={loading}
              >
                Add Source
              </button>
            </form>
          </div>
          
          <div className="sources-list-section">
            <h3>Your Data Sources</h3>
            {dataSources.length === 0 ? (
              <p className="no-items">No data sources found. Add one to get started.</p>
            ) : (
              <div className="sources-list">
                {dataSources.map(source => (
                  <div key={source._id} className="source-card">
                    <div className="source-header">
                      <strong>{source.name}</strong>
                      <span className={`source-type type-${source.type}`}>{source.type}</span>
                    </div>
                    
                    {source.description && (
                      <p className="source-description">{source.description}</p>
                    )}
                    
                    <div className="source-meta">
                      <span>Priority: {source.priority}</span>
                      <span className={`source-status ${source.isActive ? 'active' : 'inactive'}`}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="source-actions">
                      <button className="edit-button">Edit</button>
                      <button className="delete-button">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'variables' && (
        <div className="variables-tab">
          <h3>Frequently Used Variables</h3>
          <p className="section-description">
            These are variables you've frequently used in documents. They can be automatically filled in future documents.
          </p>
          
          {frequentVariables.length === 0 ? (
            <p className="no-items">No frequently used variables found. As you fill out documents, your common data will appear here.</p>
          ) : (
            <div className="variables-list">
              {frequentVariables
                .sort((a, b) => b.frequency - a.frequency)
                .map((variable, index) => (
                  <div key={index} className="variable-card">
                    <div className="variable-header">
                      <strong>{variable.name}</strong>
                      <span className="variable-frequency">Used {variable.frequency} times</span>
                    </div>
                    
                    <div className="variable-value">
                      Value: <span>{variable.value || '(empty)'}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="history-tab">
          <h3>Data History</h3>
          <p className="section-description">
            Track changes to your data over time.
          </p>
          
          {dataHistory.length === 0 ? (
            <p className="no-items">No history records found.</p>
          ) : (
            <div className="history-list">
              {dataHistory.map((record, index) => (
                <div key={index} className="history-card">
                  <div className="history-header">
                    <div className="history-action">
                      <span className={`action-badge action-${record.action}`}>
                        {record.action}
                      </span>
                      <span className="history-entity">
                        {record.entityType}
                      </span>
                    </div>
                    <span className="history-date">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="history-data">
                    {record.newData && Object.keys(record.newData).length > 0 && (
                      <div className="data-changes">
                        <strong>Changes:</strong>
                        <ul>
                          {Object.entries(record.newData).map(([key, value]) => (
                            <li key={key}>
                              <span className="property-name">{key}:</span> 
                              <span className="property-value">
                                {typeof value === 'object' ? JSON.stringify(value) : value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {record.source && (
                      <div className="history-source">Source: {record.source}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDataManager;