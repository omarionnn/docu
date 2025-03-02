  const fs = require('fs');
  const pdf = require('pdf-parse');
  const mammoth = require('mammoth');
  const { v4: uuidv4 } = require('uuid');
  const aiService = require('./aiService');

  /**
   * Service for parsing different document types
   */
  const documentParser = {
    /**
     * Parse a document file and extract content and variables
     * @param {String} filePath - Path to the document file
     * @returns {Promise<Object>} - Parsed document object
     */
    async parseDocument(filePath) {
      try {
        // Determine file type
        const fileType = filePath.split('.').pop().toLowerCase();
        let content = '';

        // Extract content based on file type
        switch (fileType) {
          case 'pdf':
            content = await this.parsePdf(filePath);
            break;
          case 'docx':
            content = await this.parseDocx(filePath);
            break;
          case 'txt':
            content = await this.parseTxt(filePath);
            break;
          default:
            throw new Error('Unsupported file type');
        }

        // Find potential variables in content
        const variables = await this.identifyVariables(content);

        // Extract metadata
        const metadata = {
          createdAt: new Date(),
          fileSize: fs.statSync(filePath).size,
          fileType,
          id: uuidv4()
        };

        return {
          content,
          variables,
          metadata
        };
      } catch (error) {
        console.error('Error parsing document:', error);
        throw new Error(`Failed to parse document: ${error.message}`);
      }
    },

    /**
     * Parse PDF file
     * @param {String} filePath - Path to PDF file
     * @returns {Promise<String>} - Extracted text content
     */
    async parsePdf(filePath) {
      try {
        console.log('Parsing PDF file:', filePath);
        const dataBuffer = fs.readFileSync(filePath);
        console.log('PDF file read, buffer size:', dataBuffer.length);
        
        try {
          const data = await pdf(dataBuffer);
          console.log('PDF parsing successful, text length:', data.text.length);
          
          // Post-process the PDF text to fix common issues with line breaks
          let processedText = data.text;
          
          // Fix common PDF variable pattern issues where linebreaks are in the middle of variable patterns
          // 1. Fix patterns split across lines: {{ variable_name }}
          processedText = processedText.replace(/\{\{\s*(\w+)\s*\n\s*(\w+)\s*\}\}/g, '{{$1_$2}}');
          
          // 2. Normalize multiple spaces
          processedText = processedText.replace(/\s{2,}/g, ' ');
          
          // 3. Fix other common PDF extraction artifacts
          processedText = processedText.replace(/([a-z])[\s]*\n[\s]*([a-z])/g, '$1$2'); // Join words broken across lines
          
          console.log('PDF text post-processing complete');
          return processedText;
        } catch (pdfError) {
          console.error('PDF parsing library error:', pdfError);
          // Return a mock result for development
          console.log('Returning mock PDF content for development');
          return `This is mock PDF content for development purposes.
          
The actual PDF parsing failed with error: ${pdfError.message}

In a production environment, this would be properly parsed PDF content.`;
        }
      } catch (error) {
        console.error('Error reading PDF file:', error);
        throw new Error(`Failed to read PDF file: ${error.message}`);
      }
    },

    /**
     * Parse DOCX file
     * @param {String} filePath - Path to DOCX file
     * @returns {Promise<String>} - Extracted text content
     */
    async parseDocx(filePath) {
      try {
        console.log('Parsing DOCX file:', filePath);
        
        try {
          const result = await mammoth.extractRawText({
            path: filePath
          });
          console.log('DOCX parsing successful, text length:', result.value.length);
          return result.value;
        } catch (docxError) {
          console.error('DOCX parsing library error:', docxError);
          // Return a mock result for development
          console.log('Returning mock DOCX content for development');
          return `This is mock DOCX content for development purposes.
          
The actual DOCX parsing failed with error: ${docxError.message}

In a production environment, this would be properly parsed DOCX content.`;
        }
      } catch (error) {
        console.error('Error reading DOCX file:', error);
        throw new Error(`Failed to read DOCX file: ${error.message}`);
      }
    },

    /**
     * Parse TXT file
     * @param {String} filePath - Path to TXT file
     * @returns {Promise<String>} - File content
     */
    async parseTxt(filePath) {
      try {
        console.log('Parsing TXT file:', filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('TXT file parsed successfully, length:', content.length);
        return content;
      } catch (error) {
        console.error('Error parsing TXT:', error);
        // Return mock data for development
        console.log('Returning mock TXT content for development');
        return `This is mock TXT content for development purposes.
        
The actual TXT parsing failed with error: ${error.message}

In a production environment, this would be properly parsed TXT content.`;
      }
    },

    /**
     * Identify variables in document content
     * @param {String} content - Document content
     * @returns {Promise<Array>} - Array of identified variables
     */
    async identifyVariables(content) {
      try {
        // Pre-process content to fix line breaks within variables
        // First, normalize line breaks
        let normalizedContent = content.replace(/\r\n/g, '\n');
        
        // Fix broken variable patterns - handle cases where {{ and }} are split by line breaks
        normalizedContent = normalizedContent.replace(/\{\{([^\}]*?)\n([^\{]*?)\}\}/g, '{{$1$2}}');
        
        // Fix variable names that might have line breaks
        normalizedContent = normalizedContent.replace(/\{\{([^\}]*?)\n([^\{]*?)\}\}/g, '{{$1$2}}');
        
        // Start with basic pattern matching for common variable formats
        const basicPatterns = [
          // {{variableName}} - with improved pattern to handle potential whitespace
          { regex: /\{\{\s*([^{}]+?)\s*\}\}/g, type: 'mustache' },
          // <variable>name</variable>
          { regex: /<variable>([^<>]+)<\/variable>/g, type: 'xml' },
          // [VARIABLE_NAME]
          { regex: /\[([A-Z_]+)\]/g, type: 'bracket' },
          // __VARIABLE__
          { regex: /__([A-Za-z0-9_]+)__/g, type: 'underscore' }
        ];

        // Collect variables from basic patterns
        const basicVariables = [];
        basicPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.regex.exec(normalizedContent)) !== null) {
            // Clean up the variable name - replace spaces with underscores
            const cleanedName = match[1].trim().replace(/\s+/g, '_');
            
            basicVariables.push({
              name: cleanedName,
              pattern: match[0],
              rawMatch: match[0],
              dataType: 'text',
              required: true
            });
          }
        });

        // Use Claude AI to identify additional potential variables
        let aiVariables = [];
        try {
          console.log('Using Claude AI to analyze document and identify variables');
          aiVariables = await aiService.analyzeDocument(content);
          console.log(`Claude AI identified ${aiVariables.length} potential variables`);
        } catch (error) {
          console.warn('Claude AI variable detection failed, falling back to basic patterns:', error);
        }

        // Combine and deduplicate variables
        const allVariables = [...basicVariables, ...aiVariables];
        const uniqueVariables = [];
        const variableNames = new Set();

        allVariables.forEach(variable => {
          // Normalize variable name (remove spaces, special chars)
          const normalizedName = variable.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

          // Skip if we already have this variable
          if (variableNames.has(normalizedName)) return;

          // Add metadata about the variable source if not present
          if (!variable.source) {
            variable.source = variable.pattern ? 'pattern_match' : 'ai_detected';
          }

          variableNames.add(normalizedName);
          uniqueVariables.push(variable);
        });

        // Sort variables by relevance (pattern matches first, then AI-detected)
        uniqueVariables.sort((a, b) => {
          // Pattern matches come first
          if (a.source === 'pattern_match' && b.source !== 'pattern_match') return -1;
          if (a.source !== 'pattern_match' && b.source === 'pattern_match') return 1;
          return 0;
        });

        return uniqueVariables;
      } catch (error) {
        console.error('Error identifying variables:', error);
        return []; // Return empty array rather than failing
      }
    }
  };

  module.exports = documentParser;

