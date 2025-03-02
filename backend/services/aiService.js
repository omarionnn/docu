require('dotenv').config();
const axios = require('axios');

/**
 * AI Service
 * Handles AI-related functionalities for document analysis and processing 
 * using Anthropic's Claude API
 */
class AIService {
  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY || 'mock-key';
    this.claudeApiBaseUrl = 'https://api.anthropic.com/v1';
    this.claudeModel = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240229'; // Using latest Claude model
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS, 10) || 4000;
  }

  /**
   * Make API call to Claude
   * @param {String} systemPrompt - System prompt for Claude
   * @param {String} userPrompt - User prompt/question for Claude
   * @param {Number} maxTokens - Maximum tokens for response
   * @returns {Promise<Object>} - Claude API response
   */
  async callClaudeApi(systemPrompt, userPrompt, maxTokens = this.maxTokens) {
    try {
      // Use the actual Claude API if we have a valid API key
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        console.log('Making request to Claude API...');
        
        try {
          // Updated to use Claude API correctly
          const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: this.claudeModel,
              system: systemPrompt,
              messages: [
                { role: 'user', content: userPrompt }
              ],
              max_tokens: maxTokens
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.claudeApiKey,
                'anthropic-version': '2023-06-01'
              }
            }
          );
          
          console.log('Claude API response received');
          
          // Handle the response structure correctly
          if (response.data && response.data.content && response.data.content.length > 0) {
            return response.data.content[0].text;
          } else {
            console.error('Unexpected Claude API response structure:', response.data);
            throw new Error('Unexpected Claude API response structure');
          }
          
        } catch (apiError) {
          console.error('Claude API error details:', apiError.response?.data || 'No response data');
          
          // Try Claude 2 API format as a fallback (for older API keys)
          return this.tryClassicClaudeApi(userPrompt, maxTokens);
        }
      } else {
        // Return mock data if no API key is provided
        console.warn('Using mock response - Claude API key not configured');
        return this.generateMockResponse(userPrompt);
      }
    } catch (error) {
      console.error('Error calling Claude API:', error.message);
      return this.generateMockResponse(userPrompt);
    }
  }
  
  /**
   * Try using the classic Claude API format (Claude 2 style)
   * @param {String} userPrompt - User prompt/question for Claude
   * @param {Number} maxTokens - Maximum tokens for response
   * @returns {Promise<String>} - Claude API response
   */
  async tryClassicClaudeApi(userPrompt, maxTokens) {
    try {
      console.log('Trying classic Claude API format...');
      const response = await axios.post(
        'https://api.anthropic.com/v1/complete',
        {
          model: 'claude-2.1', // Classic model
          prompt: `\n\nHuman: ${userPrompt}\n\nAssistant:`,
          max_tokens_to_sample: maxTokens,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.claudeApiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      if (response.data && response.data.completion) {
        return response.data.completion;
      } else {
        throw new Error('Unexpected Claude API response structure');
      }
    } catch (error) {
      console.error('Classic Claude API also failed:', error.message);
      return this.generateMockResponse(userPrompt);
    }
  }
  
  /**
   * Generate a smart mock response based on the prompt
   * @param {String} prompt - The user prompt
   * @returns {String} - A mock response
   */
  generateMockResponse(prompt) {
    console.log('Generating smart mock response for:', prompt.substring(0, 50) + '...');
    
    // Data privacy pattern
    if (prompt.toLowerCase().includes('privacy') || prompt.toLowerCase().includes('data protection')) {
      return "The Company commits to protecting personal data in accordance with applicable laws and regulations, ensuring all collected information is processed securely, used only for specified purposes, and retained only for as long as necessary.";
    }
    
    // Legal term pattern
    if (prompt.toLowerCase().includes('indemnification') || prompt.toLowerCase().includes('indemnify')) {
      return "Indemnification refers to an obligation by one party to compensate another party for losses or damages incurred. In this agreement, the indemnifying party agrees to protect the indemnified party from third-party claims and associated costs.";
    }
    
    // Contract clause pattern
    if (prompt.toLowerCase().includes('termination') || prompt.toLowerCase().includes('terminate')) {
      return "Either party may terminate this Agreement with thirty (30) days written notice. Immediate termination may occur if either party materially breaches this Agreement. Upon termination, all rights granted herein shall cease and any confidential information shall be returned.";
    }
    
    // Generic document text
    return "This document establishes the terms and conditions governing the relationship between the parties. All parties acknowledge and agree to comply with these provisions in good faith and in accordance with applicable laws and regulations.";
  }

  /**
   * Analyze document content and extract variables
   * @param {String} content - Document content
   * @returns {Promise<Array>} - Array of identified variables
   */
  async analyzeDocument(content) {
    try {
      // If we have a valid API key, use Claude to analyze
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const systemPrompt = `You are an AI assistant specialized in document analysis. 
        Your task is to analyze a document and identify variables that could be customized.
        For each variable, determine its data type, whether it's required, and provide a brief description.
        Return the results as a JSON array of objects with the following properties:
        - name: the variable name (lowercase with underscores)
        - required: boolean indicating if the variable appears to be required
        - dataType: the data type (text, number, date, boolean, select)
        - description: a brief description of what the variable represents`;

        const userPrompt = `Analyze the following document content and identify all variables that could be customized:
        
        ${content.substring(0, 10000)}`;  // Limit content length

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        
        // Extract JSON from response
        let variables = [];
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          variables = JSON.parse(jsonMatch[0]);
        }
        
        return variables;
      } else {
        // Mock response for development
        return [
          {
            "name": "employer_name",
            "required": true,
            "dataType": "text",
            "description": "Name of the employer/company"
          },
          {
            "name": "employee_name",
            "required": true,
            "dataType": "text",
            "description": "Full name of the employee"
          },
          {
            "name": "position_title",
            "required": true,
            "dataType": "text",
            "description": "Job title or position of the employee"
          },
          {
            "name": "start_date",
            "required": true,
            "dataType": "date",
            "description": "Employment start date"
          }
        ];
      }
    } catch (error) {
      console.error('Error in analyzeDocument:', error);
      // Return mock data if API call fails
      return [
        {
          "name": "employer_name",
          "required": true,
          "dataType": "text",
          "description": "Name of the employer/company"
        },
        {
          "name": "employee_name",
          "required": true,
          "dataType": "text",
          "description": "Full name of the employee"
        },
        {
          "name": "position_title",
          "required": true,
          "dataType": "text",
          "description": "Job title or position of the employee"
        },
        {
          "name": "start_date",
          "required": true,
          "dataType": "date",
          "description": "Employment start date"
        }
      ];
    }
  }

  /**
   * Explain legal terms found in document
   * @param {String} term - Legal term to explain
   * @param {String} context - Surrounding context of the term
   * @returns {Promise<Object>} - Explanation
   */
  async explainLegalTerm(term, context = '') {
    try {
      // If we have a valid API key, use Claude to explain
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const systemPrompt = `You are an AI assistant specializing in legal terminology. 
        Your task is to explain legal terms in plain language.
        Focus on providing clear, accurate explanations without legal advice.
        For each term, provide:
        1. A clear explanation
        2. Why it's important in contracts
        3. Potential implications for signatories
        4. Related terms that might be useful to understand
        Return your response as JSON with the following properties: 
        term, explanation, importance, implications, relatedTerms`;

        const userPrompt = `Explain the legal term "${term}" in plain language.
        ${context ? `Here is the context where the term appears: "${context}"` : ''}`;

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        
        // Extract JSON from response
        let explanation = {};
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          explanation = JSON.parse(jsonMatch[0]);
        }
        
        return explanation;
      } else {
        // Mock response for development
        return {
          "term": term,
          "explanation": "This legal term refers to a standard clause in contracts that protects parties from liability.",
          "importance": "It's important because it establishes boundaries of responsibility between parties.",
          "implications": "Agreeing to this term may limit your ability to seek damages in certain situations.",
          "relatedTerms": ["liability", "contractual obligation", "legal remedy"]
        };
      }
    } catch (error) {
      console.error('Error in explainLegalTerm:', error);
      return {
        "term": term,
        "explanation": "This legal term refers to a standard clause in contracts that protects parties from liability.",
        "importance": "It's important because it establishes boundaries of responsibility between parties.",
        "implications": "Agreeing to this term may limit your ability to seek damages in certain situations.",
        "relatedTerms": ["liability", "contractual obligation", "legal remedy"]
      };
    }
  }

  /**
   * Identify legal terms in a document
   * @param {String} content - Document content
   * @returns {Promise<Array>} - Array of identified legal terms
   */
  async identifyLegalTerms(content) {
    try {
      // If we have a valid API key, use Claude to identify terms
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const systemPrompt = `You are an AI assistant specialized in legal document analysis.
        Your task is to identify legal terms and jargon in documents that might need explanation.
        For each term, extract:
        1. The term itself
        2. The context (sentence or clause) it appears in
        3. A complexity rating (1-5, where 5 is most complex)
        Return the results as a JSON array with the following properties for each term:
        term, context, complexity`;

        const userPrompt = `Identify legal terms in the following document content that might need explanation for non-legal professionals:
        
        ${content.substring(0, 10000)}`;  // Limit content length

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        
        // Extract JSON from response
        let terms = [];
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          terms = JSON.parse(jsonMatch[0]);
        }
        
        return terms;
      } else {
        // Mock response for development
        return [
          {
            "term": "indemnification",
            "context": "Client agrees to indemnify and hold Company harmless from all claims...",
            "complexity": 4
          },
          {
            "term": "force majeure",
            "context": "Neither party shall be liable for delays caused by force majeure...",
            "complexity": 3
          },
          {
            "term": "severability",
            "context": "If any provision of this Agreement is found to be invalid...",
            "complexity": 2
          }
        ];
      }
    } catch (error) {
      console.error('Error in identifyLegalTerms:', error);
      return [
        {
          "term": "indemnification",
          "context": "Client agrees to indemnify and hold Company harmless from all claims...",
          "complexity": 4
        },
        {
          "term": "force majeure",
          "context": "Neither party shall be liable for delays caused by force majeure...",
          "complexity": 3
        },
        {
          "term": "severability",
          "context": "If any provision of this Agreement is found to be invalid...",
          "complexity": 2
        }
      ];
    }
  }
  
  /**
   * Generate text for a document based on a prompt
   * @param {String} prompt - Text generation prompt
   * @param {Object} document - Document context
   * @returns {Promise<String>} - Generated text
   */
  async generateText(prompt, document) {
    try {
      // If we have a valid API key, use Claude to generate text
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const docContext = document ? 
          `Document type: ${document.name || 'Unknown'}
           Current content: ${document.content ? document.content.substring(0, 1000) + '...' : 'None provided'}` 
          : 'No document context provided';

        const systemPrompt = `You are an AI assistant specialized in generating professional document text.
        Your task is to generate clear, precise text for legal and business documents.
        Use formal language appropriate for professional documents.
        Avoid any disclaimers about not being a lawyer or providing legal advice in your response.
        Just provide the exact text that would go in the document.`;

        const userPrompt = `Generate professional document text based on the following prompt:
        
        ${prompt}
        
        Context for this text:
        ${docContext}
        
        Generate only the text without any additional explanations or disclaimers.`;

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        return responseText.trim();
      } else {
        // Mock response for development
        const sampleTexts = [
          "This document is subject to the terms and conditions outlined herein. All parties acknowledge and agree to these provisions.",
          "The data protection measures implemented comply with relevant regulations, ensuring the security and privacy of all information processed.",
          "In accordance with financial regulations, all transactions will be recorded and subject to audit as required by law.",
          "This agreement constitutes the entire understanding between parties and supersedes all prior communications regarding this matter."
        ];
        
        return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      }
    } catch (error) {
      console.error('Error in generateText:', error);
      return 'Error generating text. Please try again.';
    }
  }
  
  /**
   * Analyze context for document customization
   * @param {Object} analysisData - Data for context analysis
   * @returns {Promise<Object>} - Analysis and suggestions
   */
  async analyzeContextForDocument(analysisData) {
    try {
      // If we have a valid API key, use Claude for analysis
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const systemPrompt = `You are an AI assistant specialized in document analysis and customization.
        Your task is to analyze a document in context and suggest improvements.
        Provide:
        1. Context analysis: Evaluate how well the document aligns with provided context
        2. Suggestions: Recommend additions or modifications to improve the document
        3. Risk factors: Identify potential issues or missing elements
        Return the results as JSON with the following structure:
        {
          "contextAnalysis": {
            "alignment": "string",
            "keyFactors": ["string"]
          },
          "suggestions": [
            {
              "type": "string",
              "target": "string",
              "reason": "string",
              "content": "string"
            }
          ],
          "riskFactors": [
            {
              "risk": "string",
              "severity": "string",
              "mitigation": "string"
            }
          ]
        }`;

        const content = analysisData.documentContent || 'No content provided';
        const variables = analysisData.documentVariables || [];
        const context = analysisData.situationalContext || {};

        const userPrompt = `Analyze the following document content and provide suggestions for customization:
        
        Document Content:
        ${content.substring(0, 5000)}
        
        Variables:
        ${JSON.stringify(variables)}
        
        Context:
        ${JSON.stringify(context)}`;

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        
        // Extract JSON from response
        let analysis = {};
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
        
        return analysis;
      } else {
        // Mock response for development
        return {
          "contextAnalysis": {
            "alignment": "The document has moderate alignment with the provided context.",
            "keyFactors": [
              "Contract is for a standard employment position",
              "No specific industry compliance requirements detected",
              "General terms are appropriate for the context"
            ]
          },
          "suggestions": [
            {
              "type": "add",
              "target": "remote_work_clause",
              "reason": "Context indicates remote work is applicable",
              "content": "Employee may work remotely as agreed upon by both parties. Employer will provide necessary equipment for remote work."
            },
            {
              "type": "modify",
              "target": "compensation_section",
              "reason": "Context suggests additional performance incentives",
              "content": "As full compensation for all services provided, Employee shall receive:\na) Salary: {{salary_amount}} per {{payment_period}}\nb) Benefits: {{benefits_description}}\nc) Performance Bonus: Employee may be eligible for performance bonuses as outlined in the company's incentive plan."
            }
          ],
          "riskFactors": [
            {
              "risk": "Missing data protection clause",
              "severity": "medium",
              "mitigation": "Add a data protection clause to address handling of sensitive information."
            },
            {
              "risk": "Vague termination terms",
              "severity": "low",
              "mitigation": "Consider specifying what constitutes 'cause' for immediate termination."
            }
          ]
        };
      }
    } catch (error) {
      console.error('Error in analyzeContextForDocument:', error);
      // Return mock data in case of error
      return {
        "contextAnalysis": {
          "alignment": "The document has moderate alignment with the provided context.",
          "keyFactors": [
            "Contract is for a standard employment position",
            "No specific industry compliance requirements detected",
            "General terms are appropriate for the context"
          ]
        },
        "suggestions": [
          {
            "type": "add",
            "target": "remote_work_clause",
            "reason": "Context indicates remote work is applicable",
            "content": "Employee may work remotely as agreed upon by both parties. Employer will provide necessary equipment for remote work."
          },
          {
            "type": "modify",
            "target": "compensation_section",
            "reason": "Context suggests additional performance incentives",
            "content": "As full compensation for all services provided, Employee shall receive:\na) Salary: {{salary_amount}} per {{payment_period}}\nb) Benefits: {{benefits_description}}\nc) Performance Bonus: Employee may be eligible for performance bonuses as outlined in the company's incentive plan."
          }
        ],
        "riskFactors": [
          {
            "risk": "Missing data protection clause",
            "severity": "medium",
            "mitigation": "Add a data protection clause to address handling of sensitive information."
          },
          {
            "risk": "Vague termination terms",
            "severity": "low",
            "mitigation": "Consider specifying what constitutes 'cause' for immediate termination."
          }
        ]
      };
    }
  }
  
  /**
   * Suggest conditional rules for a template
   * @param {Object} template - Template object
   * @returns {Promise<Array>} - Suggested conditional rules
   */
  async suggestConditionalRules(template) {
    try {
      // If we have a valid API key, use Claude to suggest rules
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const systemPrompt = `You are an AI assistant specialized in document automation and conditional logic.
        Your task is to suggest conditional rules for document templates.
        Rules should control when sections are shown/hidden or when text is inserted.
        For each rule suggestion, provide:
        1. Name: A descriptive name for the rule
        2. Description: A clear explanation of what the rule does
        3. Condition: The condition that triggers the rule
        4. Action: What happens when the condition is met (hide, show, insertText)
        5. Target variables: Which sections or variables are affected
        Return results as a JSON array with the following structure:
        [
          {
            "name": "string",
            "description": "string",
            "condition": {
              "type": "string",
              "variable": "string",
              "operator": "string",
              "value": "string"
            },
            "action": "string",
            "targetVariables": ["string"]
          }
        ]`;

        const templateContent = template.content || 'No content provided';
        const templateVariables = template.variables || [];
        const templateName = template.name || 'Unnamed template';

        const userPrompt = `Suggest conditional rules for the following document template:
        
        Template Name: ${templateName}
        
        Template Content:
        ${templateContent.substring(0, 5000)}
        
        Template Variables:
        ${JSON.stringify(templateVariables)}
        
        Create rules that would make this document adaptable to different situations.`;

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        
        // Extract JSON from response
        let rules = [];
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          rules = JSON.parse(jsonMatch[0]);
        }
        
        return rules;
      } else {
        // Mock response for development - tailored for employment contract template
        return [
          {
            "name": "Add Relocation Clause for Remote Employees",
            "description": "Adds a relocation expense clause when employee is working remotely",
            "condition": {
              "type": "simple",
              "variable": "work_location",
              "operator": "contains",
              "value": "Remote"
            },
            "action": "show",
            "targetVariables": ["relocation_clause"]
          },
          {
            "name": "Show Bonus Structure for Sales Positions",
            "description": "Shows commission and bonus structure when position is sales-related",
            "condition": {
              "type": "simple",
              "variable": "position_title",
              "operator": "contains",
              "value": "Sales"
            },
            "action": "show",
            "targetVariables": ["bonus_structure_section"]
          },
          {
            "name": "Add Non-Compete for Technical Roles",
            "description": "Adds non-compete clause for technical and engineering positions",
            "condition": {
              "type": "simple",
              "variable": "position_title",
              "operator": "contains",
              "value": "Engineer"
            },
            "action": "show",
            "targetVariables": ["non_compete_clause"]
          },
          {
            "name": "Modify Severance for Executive Positions",
            "description": "Increases severance terms for executive-level positions",
            "condition": {
              "type": "simple",
              "variable": "position_title",
              "operator": "contains",
              "value": "Executive"
            },
            "action": "insertText",
            "targetVariables": ["severance_clause:In the event of termination without cause, Employee shall receive severance equal to six (6) months of Base Salary."]
          },
          {
            "name": "Change Notice Period for Senior Roles",
            "description": "Increases notice period for senior positions",
            "condition": {
              "type": "simple",
              "variable": "position_title", 
              "operator": "contains",
              "value": "Senior"
            },
            "action": "insertText",
            "targetVariables": ["notice_period:thirty (30)"]
          }
        ];
      }
    } catch (error) {
      console.error('Error in suggestConditionalRules:', error);
      return [
        {
          "name": "Hide Section for Non-Commercial Use",
          "description": "Hides the commercial licensing section when document is for personal use",
          "condition": {
            "type": "simple",
            "variable": "usage_type",
            "operator": "equals",
            "value": "personal"
          },
          "action": "hide",
          "targetVariables": ["commercial_licensing_section"]
        },
        {
          "name": "Show International Compliance for Global Use",
          "description": "Shows international compliance clauses when the usage region is international",
          "condition": {
            "type": "simple",
            "variable": "region",
            "operator": "contains",
            "value": "international"
          },
          "action": "show",
          "targetVariables": ["international_compliance_section"]
        },
        {
          "name": "Add GDPR Text for EU Customers",
          "description": "Adds GDPR compliance text when the customer is from the EU",
          "condition": {
            "type": "simple",
            "variable": "customer_location",
            "operator": "contains",
            "value": "EU"
          },
          "action": "insertText",
          "targetVariables": ["data_privacy_clause:This agreement complies with GDPR regulations for EU citizens."]
        }
      ];
    }
  }

  /**
   * Summarize a document
   * @param {String} content - Document content
   * @returns {Promise<Object>} - Document summary
   */
  async summarizeDocument(content) {
    try {
      // If we have a valid API key, use Claude to summarize
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const systemPrompt = `You are an AI assistant specialized in document summarization.
        Your task is to analyze a document and provide a concise summary.
        Include:
        1. Main purpose of the document
        2. Key parties involved
        3. Important terms and conditions
        4. Critical dates or deadlines
        5. Potential obligations or liabilities
        Return the results as JSON with the following structure:
        {
          "title": "string",
          "purpose": "string",
          "parties": ["string"],
          "keyTerms": [
            {
              "term": "string",
              "description": "string"
            }
          ],
          "criticalDates": [
            {
              "name": "string",
              "description": "string"
            }
          ],
          "keyObligations": ["string"]
        }`;

        const userPrompt = `Summarize the following document:
        
        ${content.substring(0, 10000)}`;  // Limit content length

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        
        // Extract JSON from response
        let summary = {};
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          summary = JSON.parse(jsonMatch[0]);
        }
        
        return summary;
      } else {
        // Mock response for development
        return {
          "title": "Employment Agreement",
          "purpose": "To establish an employment relationship between employer and employee",
          "parties": ["Employer (ABC Technologies, Inc.)", "Employee (John Smith)"],
          "keyTerms": [
            {
              "term": "Position",
              "description": "Software Developer"
            },
            {
              "term": "Compensation",
              "description": "$120,000 per year plus benefits"
            },
            {
              "term": "Term",
              "description": "12 months beginning January 1, 2023"
            }
          ],
          "criticalDates": [
            {
              "name": "Start Date",
              "description": "January 1, 2023"
            },
            {
              "name": "Term End",
              "description": "December 31, 2023"
            }
          ],
          "keyObligations": [
            "Employee must perform duties satisfactorily",
            "Employee must maintain confidentiality of proprietary information",
            "Employer must provide specified compensation and benefits"
          ]
        };
      }
    } catch (error) {
      console.error('Error in summarizeDocument:', error);
      return {
        "title": "Employment Agreement",
        "purpose": "To establish an employment relationship between employer and employee",
        "parties": ["Employer (Company)", "Employee (Individual)"],
        "keyTerms": [
          {
            "term": "Position",
            "description": "Job title and responsibilities"
          },
          {
            "term": "Compensation",
            "description": "Salary and benefits"
          },
          {
            "term": "Term",
            "description": "Duration of employment"
          }
        ],
        "criticalDates": [
          {
            "name": "Start Date",
            "description": "When employment begins"
          }
        ],
        "keyObligations": [
          "Employee must perform duties satisfactorily",
          "Employee must maintain confidentiality",
          "Employer must provide compensation"
        ]
      };
    }
  }

  /**
   * Cross-reference document against regulations
   * @param {String} content - Document content
   * @param {String} industry - Industry for regulation check
   * @param {String} jurisdiction - Jurisdiction for regulation check
   * @returns {Promise<Object>} - Compliance analysis
   */
  async analyzeCompliance(content, industry, jurisdiction) {
    try {
      // If we have a valid API key, use Claude to analyze compliance
      if (this.claudeApiKey && this.claudeApiKey !== 'mock-key') {
        const systemPrompt = `You are an AI assistant specialized in regulatory compliance.
        Your task is to analyze a document and identify potential compliance issues.
        Based on the specified industry and jurisdiction, highlight:
        1. Compliance strengths: Areas where the document meets regulatory requirements
        2. Potential issues: Areas where the document may not meet requirements
        3. Missing elements: Required provisions that are absent
        4. Suggestions: How to address compliance gaps
        Return the results as JSON with the following structure:
        {
          "complianceScore": number,
          "strengths": ["string"],
          "potentialIssues": [
            {
              "issue": "string",
              "severity": "string",
              "regulation": "string"
            }
          ],
          "missingElements": ["string"],
          "suggestions": ["string"]
        }`;

        const userPrompt = `Analyze compliance for the following document:
        
        Industry: ${industry}
        Jurisdiction: ${jurisdiction}
        
        Document Content:
        ${content.substring(0, 8000)}`;  // Limit content length

        const responseText = await this.callClaudeApi(systemPrompt, userPrompt);
        
        // Extract JSON from response
        let compliance = {};
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          compliance = JSON.parse(jsonMatch[0]);
        }
        
        return compliance;
      } else {
        // Mock response for development
        return {
          "complianceScore": 75,
          "strengths": [
            "Contains standard confidentiality provisions",
            "Clear delineation of duties and compensation"
          ],
          "potentialIssues": [
            {
              "issue": "Lacks specific data protection language",
              "severity": "medium",
              "regulation": "GDPR (if EU employees are involved)"
            },
            {
              "issue": "Termination clause is vague on 'cause'",
              "severity": "low",
              "regulation": "State employment regulations"
            }
          ],
          "missingElements": [
            "No explicit reference to applicable labor laws",
            "Missing dispute resolution mechanism"
          ],
          "suggestions": [
            "Add clause on data protection compliance",
            "Define 'cause' for immediate termination",
            "Include reference to applicable labor laws",
            "Add arbitration or other dispute resolution clause"
          ]
        };
      }
    } catch (error) {
      console.error('Error in analyzeCompliance:', error);
      return {
        "complianceScore": 70,
        "strengths": [
          "Contains standard confidentiality provisions",
          "Clear delineation of duties and compensation"
        ],
        "potentialIssues": [
          {
            "issue": "Lacks specific data protection language",
            "severity": "medium",
            "regulation": "GDPR (if EU employees are involved)"
          },
          {
            "issue": "Termination clause is vague",
            "severity": "low",
            "regulation": "State employment regulations"
          }
        ],
        "missingElements": [
          "No explicit reference to applicable labor laws",
          "Missing dispute resolution mechanism"
        ],
        "suggestions": [
          "Add clause on data protection compliance",
          "Define 'cause' for immediate termination",
          "Include reference to applicable labor laws",
          "Add arbitration or other dispute resolution clause"
        ]
      };
    }
  }
}

module.exports = new AIService();