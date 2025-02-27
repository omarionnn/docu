require('dotenv').config();
const axios = require('axios');

/**
 * AI Service
 * Handles AI-related functionalities for document analysis and processing
 */
class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1';
    this.model = 'gpt-4'; // Using GPT-4 for better document understanding
  }

  /**
   * Analyze document content and extract variables
   * @param {String} content - Document content
   * @returns {Promise<Array>} - Array of identified variables
   */
  async analyzeDocument(content) {
    try {
      const prompt = `
        Analyze the following document and identify all potential variables or fields that would need to be filled in:
        
        ${content.substring(0, 8000)} ${content.length > 8000 ? '... [content truncated]' : ''}
        
        For each variable:
        1. Identify the name of the variable
        2. Determine if it's required or optional
        3. Suggest a data type (text, number, date, boolean, select)
        4. Provide a brief description of what the variable represents
        5. If it's a select type, suggest possible options
        
        Return the results as a JSON array of objects with the following structure:
        [
          {
            "name": "variable name",
            "required": true/false,
            "dataType": "text/number/date/boolean/select",
            "description": "brief description",
            "options": ["option1", "option2"] // only for select type
          }
        ]
      `;

      const response = await this.callOpenAI(prompt);
      
      // Parse the response as JSON
      let variables = [];
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const jsonString = jsonMatch[1] || response;
        variables = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing AI response as JSON:', error);
        throw new Error('Failed to parse AI response');
      }
      
      return variables;
    } catch (error) {
      console.error('Error analyzing document with AI:', error);
      throw error;
    }
  }

  /**
   * Analyze document template and suggest improvements
   * @param {Object} template - Template object
   * @returns {Promise<Object>} - Improvement suggestions
   */
  async analyzeTemplate(template) {
    try {
      const templateData = {
        content: template.content.substring(0, 8000),
        variables: template.variables
      };
      
      const prompt = `
        Analyze the following document template and its variables:
        
        TEMPLATE CONTENT:
        ${templateData.content} ${template.content.length > 8000 ? '... [content truncated]' : ''}
        
        VARIABLES:
        ${JSON.stringify(templateData.variables, null, 2)}
        
        Provide the following analysis:
        1. Are there any missing variables that should be identified?
        2. Are the variable names clear and descriptive?
        3. Are there any improvements to the document structure?
        4. Any potential compliance or legal issues to be aware of?
        
        Return the results as a JSON object with the following structure:
        {
          "missingVariables": [
            { "name": "suggested name", "description": "what this variable is for" }
          ],
          "variableNameImprovements": [
            { "current": "current name", "suggested": "better name", "reason": "why this is better" }
          ],
          "structureImprovements": [
            { "issue": "issue description", "suggestion": "how to improve" }
          ],
          "complianceIssues": [
            { "issue": "potential issue", "recommendation": "how to address" }
          ]
        }
      `;

      const response = await this.callOpenAI(prompt);
      
      // Parse the response as JSON
      let analysis = {};
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const jsonString = jsonMatch[1] || response;
        analysis = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing AI response as JSON:', error);
        throw new Error('Failed to parse AI response');
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing template with AI:', error);
      throw error;
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
      const prompt = `
        Explain the following legal term in simple language:
        
        TERM: ${term}
        
        ${context ? `CONTEXT: ${context}` : ''}
        
        Provide:
        1. A simple explanation (what it means in plain language)
        2. Why it's important
        3. Any potential implications for the signer
        
        Return the results as a JSON object with the following structure:
        {
          "term": "${term}",
          "explanation": "simple explanation",
          "importance": "why it matters",
          "implications": "what it means for the signer",
          "relatedTerms": ["related term 1", "related term 2"]
        }
      `;

      const response = await this.callOpenAI(prompt);
      
      // Parse the response as JSON
      let explanation = {};
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const jsonString = jsonMatch[1] || response;
        explanation = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing AI response as JSON:', error);
        throw new Error('Failed to parse AI response');
      }
      
      return explanation;
    } catch (error) {
      console.error('Error explaining legal term with AI:', error);
      throw error;
    }
  }

  /**
   * Identify legal terms in a document
   * @param {String} content - Document content
   * @returns {Promise<Array>} - Array of identified legal terms
   */
  async identifyLegalTerms(content) {
    try {
      const prompt = `
        Identify all legal terms and jargon in the following document content that might need explanation:
        
        ${content.substring(0, 8000)} ${content.length > 8000 ? '... [content truncated]' : ''}
        
        For each term:
        1. Extract the term
        2. Provide the context (surrounding text)
        3. Rate the complexity level (1-5, where 5 is most complex)
        
        Return the results as a JSON array of objects with the following structure:
        [
          {
            "term": "legal term",
            "context": "surrounding text where the term appears",
            "complexity": 1-5
          }
        ]
      `;

      const response = await this.callOpenAI(prompt);
      
      // Parse the response as JSON
      let terms = [];
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const jsonString = jsonMatch[1] || response;
        terms = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing AI response as JSON:', error);
        throw new Error('Failed to parse AI response');
      }
      
      return terms;
    } catch (error) {
      console.error('Error identifying legal terms with AI:', error);
      throw error;
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
      // Prepare context from document
      const documentContext = {
        variables: document.filledVariables,
        documentName: document.name,
        documentType: document.template ? document.template.category : 'Unknown'
      };
      
      const fullPrompt = `
        Generate text for the following document based on this prompt:
        
        PROMPT: ${prompt}
        
        DOCUMENT CONTEXT:
        ${JSON.stringify(documentContext, null, 2)}
        
        Generate appropriate text that would fit in a professional document. 
        Keep it concise, professional, and contextually appropriate.
        Return only the generated text without any explanations or formatting.
      `;

      const response = await this.callOpenAI(fullPrompt);
      
      // Clean up the response (removing quotes if present)
      return response.replace(/^["'](.*)["']$/s, '$1');
    } catch (error) {
      console.error('Error generating text:', error);
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
      const { documentContent, documentVariables, templateVariables, situationalContext } = analysisData;
      
      const prompt = `
        Analyze the following document in the given situational context:
        
        DOCUMENT CONTENT (excerpt):
        ${documentContent.substring(0, 5000)}${documentContent.length > 5000 ? '... [content truncated]' : ''}
        
        FILLED VARIABLES:
        ${JSON.stringify(documentVariables, null, 2)}
        
        TEMPLATE VARIABLES:
        ${JSON.stringify(templateVariables, null, 2)}
        
        SITUATIONAL CONTEXT:
        ${JSON.stringify(situationalContext, null, 2)}
        
        Based on this information, provide:
        1. An analysis of how the document aligns with the situational context
        2. Suggested adaptations or improvements to make the document more relevant
        3. Any risk factors or areas of concern given the context
        4. Specific conditional logic that should be applied
        
        Return the results as a JSON object with the following structure:
        {
          "contextAnalysis": {
            "alignment": "How well the document aligns with the context",
            "keyFactors": ["Important context factors that influence the document"]
          },
          "suggestions": [
            {
              "type": "add/modify/remove",
              "target": "section name or variable",
              "content": "suggested content",
              "reason": "why this change is suggested"
            }
          ],
          "riskFactors": [
            {
              "risk": "description of the risk",
              "severity": "high/medium/low",
              "mitigation": "suggested mitigation strategy"
            }
          ],
          "conditionalLogic": [
            {
              "condition": {
                "variable": "variable name",
                "operator": "equals/notEquals/contains/etc",
                "value": "test value"
              },
              "action": "show/hide/insertText/etc",
              "target": "section to show/hide or variable to modify",
              "reason": "why this condition is important"
            }
          ]
        }
      `;

      const response = await this.callOpenAI(prompt);
      
      // Parse the response as JSON
      let analysis = {};
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const jsonString = jsonMatch[1] || response;
        analysis = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing AI response as JSON:', error);
        throw new Error('Failed to parse AI response');
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing context:', error);
      throw error;
    }
  }
  
  /**
   * Identify potential conditional rules in a template
   * @param {Object} template - Template object
   * @returns {Promise<Array>} - Suggested conditional rules
   */
  async suggestConditionalRules(template) {
    try {
      const prompt = `
        Analyze the following document template and suggest conditional rules:
        
        TEMPLATE CONTENT (excerpt):
        ${template.content.substring(0, 5000)}${template.content.length > 5000 ? '... [content truncated]' : ''}
        
        TEMPLATE VARIABLES:
        ${JSON.stringify(template.variables, null, 2)}
        
        Based on this template, suggest conditional rules that could be applied to make the document more dynamic.
        Focus on:
        1. Optional sections that could be shown/hidden based on variable values
        2. Alternative text that could be inserted based on specific conditions
        3. Variables that might affect other parts of the document
        
        Return the results as a JSON array of objects with the following structure:
        [
          {
            "name": "rule name",
            "description": "what this rule does",
            "condition": {
              "type": "simple/compound",
              "variable": "variable name", // for simple conditions
              "operator": "equals/notEquals/contains/etc",
              "value": "test value",
              "subConditions": [], // for compound conditions
              "logicalOperator": "AND/OR" // for compound conditions
            },
            "action": "show/hide/insertText/etc",
            "targetVariables": ["affected variable or section"],
            "implementation": "how this could be implemented in the template"
          }
        ]
      `;

      const response = await this.callOpenAI(prompt);
      
      // Parse the response as JSON
      let rules = [];
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const jsonString = jsonMatch[1] || response;
        rules = JSON.parse(jsonString);
      } catch (error) {
        console.error('Error parsing AI response as JSON:', error);
        throw new Error('Failed to parse AI response');
      }
      
      return rules;
    } catch (error) {
      console.error('Error suggesting conditional rules:', error);
      throw error;
    }
  }

  /**
   * Make API call to OpenAI
   * @param {String} prompt - Prompt to send to OpenAI
   * @returns {Promise<String>} - AI response
   */
  async callOpenAI(prompt) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant with expertise in legal documents and contracts.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // Lower temperature for more deterministic results
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error.response?.data || error.message);
      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new AIService();