const mongoose = require('mongoose');
const { UserProfile } = require('../models/Document');
const axios = require('axios');

/**
 * Data Manager Service
 * Handles intelligent data management, storage, retrieval, and deduplication
 */
class DataManagerService {
  /**
   * Store user data
   * @param {String} userId - User ID
   * @param {Object} data - Data to store
   * @param {String} category - Data category
   * @returns {Promise<Object>} - Updated user profile
   */
  async storeUserData(userId, data, category = 'personalInfo') {
    try {
      // Validate data
      if (!data || Object.keys(data).length === 0) {
        throw new Error('No data provided');
      }

      // Get user profile
      let userProfile = await UserProfile.findOne({ user: userId });
      
      if (!userProfile) {
        userProfile = new UserProfile({
          user: userId,
          [category]: {}
        });
      }
      
      // Update frequency of used variables if applicable
      if (category === 'personalInfo') {
        Object.entries(data).forEach(([key, value]) => {
          if (value) {
            this.updateVariableFrequency(userProfile, key, value);
          }
        });
      }

      // Merge new data with existing data
      userProfile[category] = {
        ...userProfile[category],
        ...data
      };
      
      // Add to saved data with timestamp
      userProfile.savedData = {
        ...userProfile.savedData,
        [`${category}_${Date.now()}`]: data
      };

      await userProfile.save();
      return userProfile;
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  /**
   * Retrieve user data
   * @param {String} userId - User ID
   * @param {String} category - Data category
   * @param {Array} fields - Specific fields to retrieve (optional)
   * @returns {Promise<Object>} - Retrieved data
   */
  async retrieveUserData(userId, category = 'personalInfo', fields = null) {
    try {
      // Get user profile
      const userProfile = await UserProfile.findOne({ user: userId });
      
      if (!userProfile) {
        return {};
      }
      
      // Return requested category data
      const categoryData = userProfile[category] || {};
      
      // Filter by specific fields if provided
      if (fields && Array.isArray(fields)) {
        return Object.fromEntries(
          Object.entries(categoryData).filter(([key]) => fields.includes(key))
        );
      }
      
      return categoryData;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      throw error;
    }
  }

  /**
   * Auto-fill document variables with user data
   * @param {Object} template - Document template
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Auto-filled variables
   */
  async autoFillDocument(template, userId) {
    try {
      // Get user profile
      const userProfile = await UserProfile.findOne({ user: userId });
      
      if (!userProfile || !template.variables) {
        return {};
      }
      
      const filledVariables = {};
      
      // Match template variables with user profile data
      for (const variable of template.variables) {
        const { name } = variable;
        
        // Check direct match in personal info
        if (userProfile.personalInfo && userProfile.personalInfo[name]) {
          filledVariables[name] = userProfile.personalInfo[name];
          continue;
        }
        
        // Check preferences
        if (userProfile.preferences && userProfile.preferences[name]) {
          filledVariables[name] = userProfile.preferences[name];
          continue;
        }
        
        // Check saved data (most recent first)
        const savedDataEntries = Object.entries(userProfile.savedData || {})
          .sort(([keyA], [keyB]) => {
            const timeA = parseInt(keyA.split('_')[1]);
            const timeB = parseInt(keyB.split('_')[1]);
            return timeB - timeA; // Sort by timestamp descending
          });
        
        for (const [, data] of savedDataEntries) {
          if (data[name]) {
            filledVariables[name] = data[name];
            break;
          }
        }
        
        // Check frequently used variables
        const frequentVar = userProfile.frequentlyUsedVariables
          .find(v => v.name === name);
        
        if (frequentVar && !filledVariables[name]) {
          filledVariables[name] = frequentVar.value;
        }
        
        // Use variable metadata mappings if available
        if (!filledVariables[name] && variable.metadata && variable.metadata.mappings) {
          for (const mapping of variable.metadata.mappings) {
            if (userProfile.personalInfo && userProfile.personalInfo[mapping]) {
              filledVariables[name] = userProfile.personalInfo[mapping];
              break;
            }
          }
        }
      }
      
      return filledVariables;
    } catch (error) {
      console.error('Error auto-filling document:', error);
      throw error;
    }
  }

  /**
   * Update frequency of used variables
   * @param {Object} userProfile - User profile object
   * @param {String} name - Variable name
   * @param {String} value - Variable value
   */
  updateVariableFrequency(userProfile, name, value) {
    const existingVar = userProfile.frequentlyUsedVariables
      .find(v => v.name === name);
    
    if (existingVar) {
      existingVar.frequency += 1;
      existingVar.value = value; // Update to the most recent value
    } else {
      userProfile.frequentlyUsedVariables.push({
        name,
        value,
        frequency: 1
      });
    }
  }

  /**
   * Detect and merge duplicate data
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Deduplication results
   */
  async detectAndMergeDuplicates(userId) {
    try {
      // Get user profile
      const userProfile = await UserProfile.findOne({ user: userId });
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      
      const personalInfo = userProfile.personalInfo || {};
      const results = {
        duplicatesDetected: 0,
        fieldsAffected: [],
        mergedData: {}
      };
      
      // Helper function to normalize text for comparison
      const normalize = (text) => {
        if (!text) return '';
        return text.toLowerCase().trim().replace(/\s+/g, ' ');
      };
      
      // Check for similar fields in saved data
      const savedDataEntries = Object.entries(userProfile.savedData || {});
      const processedValues = new Map();
      
      // Find duplicates across saved data
      for (const [key, data] of savedDataEntries) {
        Object.entries(data).forEach(([field, value]) => {
          const normalizedValue = normalize(value);
          
          if (!normalizedValue) return;
          
          if (processedValues.has(field)) {
            const existing = processedValues.get(field);
            
            // Check if values are similar but not identical
            if (existing.normalized !== normalizedValue &&
                (normalizedValue.includes(existing.normalized) || 
                 existing.normalized.includes(normalizedValue) ||
                 this.calculateSimilarity(existing.normalized, normalizedValue) > 0.8)) {
              
              results.duplicatesDetected++;
              results.fieldsAffected.push(field);
              
              // Choose the most complete/recent value
              const mergedValue = value.length > existing.value.length ? value : existing.value;
              results.mergedData[field] = mergedValue;
              processedValues.set(field, { 
                value: mergedValue,
                normalized: normalize(mergedValue)
              });
            }
          } else {
            processedValues.set(field, { value, normalized: normalizedValue });
          }
        });
      }
      
      // Update personal info with merged data if duplicates found
      if (results.duplicatesDetected > 0) {
        userProfile.personalInfo = {
          ...personalInfo,
          ...results.mergedData
        };
        
        await userProfile.save();
      }
      
      return results;
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      throw error;
    }
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance based)
   * @param {String} str1 - First string
   * @param {String} str2 - Second string
   * @returns {Number} - Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0) return 0.0;
    if (str2.length === 0) return 0.0;
    
    const longer = str1.length >= str2.length ? str1 : str2;
    const shorter = str1.length >= str2.length ? str2 : str1;
    
    // Calculate Levenshtein distance
    const costs = Array(shorter.length + 1);
    for (let i = 0; i <= shorter.length; i++) {
      costs[i] = i;
    }
    
    for (let i = 0; i < longer.length; i++) {
      let lastValue = i + 1;
      for (let j = 0; j < shorter.length; j++) {
        const val = longer[i] === shorter[j] ? costs[j] : costs[j] + 1;
        costs[j] = lastValue;
        lastValue = val;
      }
      costs[shorter.length] = lastValue;
    }
    
    return 1.0 - costs[shorter.length] / Math.max(longer.length, shorter.length);
  }

  /**
   * Fetch data from public sources
   * @param {String} dataType - Type of data to fetch
   * @param {Object} parameters - Search parameters
   * @returns {Promise<Object>} - Retrieved data
   */
  async fetchPublicData(dataType, parameters) {
    try {
      let data = {};
      
      switch (dataType) {
        case 'company':
          data = await this.fetchCompanyData(parameters);
          break;
        case 'address':
          data = await this.fetchAddressData(parameters);
          break;
        case 'legal':
          data = await this.fetchLegalData(parameters);
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error);
      throw error;
    }
  }

  /**
   * Fetch company data from public sources
   * @param {Object} parameters - Search parameters
   * @returns {Promise<Object>} - Company data
   */
  async fetchCompanyData(parameters) {
    // This would typically integrate with APIs like:
    // - OpenCorporates API for company information
    // - LinkedIn API for professional data
    // - Crunchbase for startup/funding data
    
    // Simulate API call for demonstration
    try {
      if (!parameters.name) {
        throw new Error('Company name is required');
      }
      
      // Mocked response - in a real implementation, this would be an API call
      return {
        name: parameters.name,
        foundingYear: '2010', // Example data
        industry: 'Technology',
        description: `${parameters.name} is a technology company focused on AI solutions.`,
        employeeCount: '100-500',
        headquarters: 'New York, NY',
        website: `https://www.${parameters.name.toLowerCase().replace(/\s+/g, '')}.com`,
        source: 'Public company registry'
      };
    } catch (error) {
      console.error('Error fetching company data:', error);
      throw error;
    }
  }

  /**
   * Fetch address data from public sources
   * @param {Object} parameters - Search parameters
   * @returns {Promise<Object>} - Address data
   */
  async fetchAddressData(parameters) {
    // This would typically integrate with APIs like:
    // - Google Places API for address completion
    // - USPS Address Validation API
    // - Geocoding services
    
    // Simulate API call for demonstration
    try {
      if (!parameters.zipCode && !parameters.city) {
        throw new Error('Zip code or city is required');
      }
      
      // Mocked response - in a real implementation, this would be an API call
      if (parameters.zipCode) {
        return {
          city: 'New York',
          state: 'NY',
          country: 'USA',
          formatted: '123 Main St, New York, NY 10001, USA',
          verified: true,
          source: 'Address verification service'
        };
      } else {
        return {
          zipCodes: ['10001', '10002', '10003'],
          state: 'NY',
          country: 'USA',
          source: 'Geocoding service'
        };
      }
    } catch (error) {
      console.error('Error fetching address data:', error);
      throw error;
    }
  }

  /**
   * Fetch legal data from public sources
   * @param {Object} parameters - Search parameters
   * @returns {Promise<Object>} - Legal data
   */
  async fetchLegalData(parameters) {
    // This would typically integrate with APIs like:
    // - Government legal databases
    // - Court record systems
    // - Regulatory compliance databases
    
    // Simulate API call for demonstration
    try {
      if (!parameters.entity) {
        throw new Error('Entity name is required');
      }
      
      // Mocked response - in a real implementation, this would be an API call
      return {
        entityType: 'Corporation',
        registrationNumber: '12345678',
        registrationDate: '2010-01-01',
        jurisdiction: 'Delaware',
        status: 'Active',
        filings: [
          { type: 'Annual Report', date: '2022-01-15' },
          { type: 'Certificate of Good Standing', date: '2021-03-22' }
        ],
        source: 'State business registry'
      };
    } catch (error) {
      console.error('Error fetching legal data:', error);
      throw error;
    }
  }

  /**
   * Validate data against known sources
   * @param {Object} data - Data to validate
   * @param {String} dataType - Type of data to validate
   * @returns {Promise<Object>} - Validation results
   */
  async validateData(data, dataType) {
    try {
      let validationResults = {
        isValid: false,
        errors: [],
        suggestions: [],
        confidence: 0
      };
      
      switch (dataType) {
        case 'email':
          validationResults = this.validateEmail(data.email);
          break;
        case 'phone':
          validationResults = this.validatePhone(data.phone);
          break;
        case 'address':
          validationResults = await this.validateAddress(data);
          break;
        case 'company':
          validationResults = await this.validateCompany(data.company);
          break;
        default:
          throw new Error(`Unsupported validation type: ${dataType}`);
      }
      
      return validationResults;
    } catch (error) {
      console.error(`Error validating ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Validate email format
   * @param {String} email - Email to validate
   * @returns {Object} - Validation results
   */
  validateEmail(email) {
    if (!email) {
      return {
        isValid: false,
        errors: ['Email is required'],
        suggestions: [],
        confidence: 0
      };
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isFormatValid = emailRegex.test(email);
    
    // Common domain validation
    const domain = email.split('@')[1];
    const commonTLDs = ['.com', '.org', '.net', '.edu', '.gov', '.co'];
    const isCommonDomain = domain && commonTLDs.some(tld => domain.endsWith(tld));
    
    // Common typos check
    const commonTypos = {
      'gmial.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'hotmial.com': 'hotmail.com',
      'yaho.com': 'yahoo.com',
      'yahoocom': 'yahoo.com',
      'outlok.com': 'outlook.com'
    };
    
    const suggestions = [];
    if (domain && commonTypos[domain]) {
      const correctedEmail = email.replace(domain, commonTypos[domain]);
      suggestions.push(correctedEmail);
    }
    
    // Calculate confidence score
    let confidence = 0;
    if (isFormatValid) confidence += 0.5;
    if (isCommonDomain) confidence += 0.3;
    if (suggestions.length === 0) confidence += 0.2;
    
    return {
      isValid: isFormatValid,
      errors: isFormatValid ? [] : ['Invalid email format'],
      suggestions,
      confidence
    };
  }

  /**
   * Validate phone number format
   * @param {String} phone - Phone number to validate
   * @returns {Object} - Validation results
   */
  validatePhone(phone) {
    if (!phone) {
      return {
        isValid: false,
        errors: ['Phone number is required'],
        suggestions: [],
        confidence: 0
      };
    }
    
    // Remove non-numeric characters for validation
    const cleaned = phone.replace(/\D/g, '');
    
    // Check basic length requirements
    const isValidLength = cleaned.length >= 10 && cleaned.length <= 15;
    
    // Format suggestions
    const suggestions = [];
    if (cleaned.length === 10) {
      // US format suggestion
      suggestions.push(`(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`);
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US with country code suggestion
      suggestions.push(`+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`);
    }
    
    return {
      isValid: isValidLength,
      errors: isValidLength ? [] : ['Invalid phone number length'],
      suggestions,
      confidence: isValidLength ? 0.8 : 0.2
    };
  }

  /**
   * Validate address data
   * @param {Object} addressData - Address data to validate
   * @returns {Promise<Object>} - Validation results
   */
  async validateAddress(addressData) {
    // This would typically use an address verification API
    // For this example, we'll perform basic validation

    if (!addressData || !addressData.address) {
      return {
        isValid: false,
        errors: ['Address is required'],
        suggestions: [],
        confidence: 0
      };
    }
    
    const required = ['address', 'city', 'state', 'zipCode'];
    const missing = required.filter(field => !addressData[field]);
    
    let confidence = 0;
    
    // Basic validation checks
    if (missing.length === 0) {
      confidence = 0.6;
      
      // Additional checks for ZIP code format
      if (addressData.zipCode && /^\d{5}(-\d{4})?$/.test(addressData.zipCode)) {
        confidence += 0.2;
      }
      
      // Check if state is a valid US state code
      const usStateCodes = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                           'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
                           'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
                           'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
                           'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
      
      if (addressData.state && usStateCodes.includes(addressData.state.toUpperCase())) {
        confidence += 0.2;
      }
    }
    
    return {
      isValid: missing.length === 0,
      errors: missing.map(field => `Missing ${field}`),
      suggestions: [],
      confidence
    };
  }

  /**
   * Validate company name
   * @param {String} company - Company name to validate
   * @returns {Promise<Object>} - Validation results
   */
  async validateCompany(company) {
    if (!company) {
      return {
        isValid: false,
        errors: ['Company name is required'],
        suggestions: [],
        confidence: 0
      };
    }
    
    // This would typically use a company registry API
    // For this example, we'll perform basic validation
    const commonSuffixes = ['Inc', 'LLC', 'Corp', 'Ltd', 'GmbH', 'Co', 'Corporation'];
    const hasSuffix = commonSuffixes.some(suffix => 
      company.endsWith(` ${suffix}`) || company.endsWith(`, ${suffix}`)
    );
    
    return {
      isValid: true,
      errors: [],
      suggestions: hasSuffix ? [] : commonSuffixes.map(suffix => `${company}, ${suffix}`),
      confidence: hasSuffix ? 0.8 : 0.5
    };
  }
}

module.exports = new DataManagerService();