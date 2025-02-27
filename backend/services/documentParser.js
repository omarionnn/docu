const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Document Parser Service
 * Handles parsing different document types and extracting variable patterns
 */
class DocumentParserService {
  /**
   * Parse document based on file type
   * @param {String} filePath - Path to the document
   * @returns {Promise<Object>} - Parsed document content and metadata
   */
  async parseDocument(filePath) {
    try {
      const extension = path.extname(filePath).toLowerCase();
      let content = '';
      let metadata = {};

      switch (extension) {
        case '.pdf':
          const pdfData = await this.parsePdf(filePath);
          content = pdfData.content;
          metadata = pdfData.metadata;
          break;
        case '.docx':
          const docxData = await this.parseDocx(filePath);
          content = docxData.content;
          metadata = docxData.metadata;
          break;
        case '.txt':
          content = await fs.promises.readFile(filePath, 'utf8');
          metadata = { type: 'text/plain' };
          break;
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }

      return {
        content,
        metadata,
        variables: this.extractVariables(content)
      };
    } catch (error) {
      console.error('Error parsing document:', error);
      throw error;
    }
  }

  /**
   * Parse PDF document
   * @param {String} filePath - Path to PDF file
   * @returns {Promise<Object>} - Extracted text and metadata
   */
  async parsePdf(filePath) {
    try {
      const dataBuffer = await fs.promises.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      return {
        content: data.text,
        metadata: {
          info: data.info,
          pageCount: data.numpages,
          type: 'application/pdf'
        }
      };
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw error;
    }
  }

  /**
   * Parse DOCX document
   * @param {String} filePath - Path to DOCX file
   * @returns {Promise<Object>} - Extracted text and metadata
   */
  async parseDocx(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      return {
        content: result.value,
        metadata: {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      };
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw error;
    }
  }

  /**
   * Extract variables from document content
   * @param {String} content - Document text content
   * @returns {Array} - Array of identified variables
   */
  extractVariables(content) {
    const variables = [];
    
    // Common variable patterns
    const patterns = [
      // Basic placeholders with various bracket styles
      /\{\{([^{}]+)\}\}/g, // {{variable}}
      /\{([^{}]+)\}/g,     // {variable}
      /\[\[([^\[\]]+)\]\]/g, // [[variable]]
      /\[([^\[\]]+)\]/g,    // [variable]
      
      // Form field patterns
      /__([A-Za-z0-9_]+)__/g, // __FieldName__
      /___+/g,               // Underline spaces _____
      
      // Common named entities
      /\b(Name|Address|City|State|ZIP|Email|Phone|Date|Signature)\s*:/g,
      
      // Legal document specific patterns
      /\b(party of the first part|party of the second part)\b/gi,
      /\b(lessor|lessee|tenant|landlord)\b/gi,
      /\b(buyer|seller|purchaser|vendor)\b/gi
    ];

    // Extract variables from each pattern
    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          variables.push({
            name: match[1].trim(),
            pattern: pattern.toString(),
            value: '',
            required: true
          });
        } else if (match[0]) {
          // For patterns without capture groups like ___+
          variables.push({
            name: `Field_${variables.length + 1}`,
            pattern: pattern.toString(),
            rawMatch: match[0],
            value: '',
            required: true
          });
        }
      }
    });

    // Remove duplicates
    return Array.from(new Set(variables.map(v => JSON.stringify(v))))
      .map(v => JSON.parse(v));
  }

  /**
   * Create template from parsed document
   * @param {Object} parsedDocument - Document parsing result
   * @returns {Object} - Template object
   */
  createTemplate(parsedDocument) {
    return {
      content: parsedDocument.content,
      metadata: parsedDocument.metadata,
      variables: parsedDocument.variables,
      created: new Date(),
      modified: new Date()
    };
  }
}

module.exports = new DocumentParserService();