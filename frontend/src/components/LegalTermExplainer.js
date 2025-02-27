import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './LegalTermExplainer.css';

/**
 * Component for explaining legal terms in documents
 */
const LegalTermExplainer = ({ documentContent, documentId }) => {
  const [legalTerms, setLegalTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch legal terms when document content changes
  useEffect(() => {
    if (documentContent) {
      identifyLegalTerms();
    } else {
      setInitialLoading(false);
    }
  }, [documentContent]);

  /**
   * Identify legal terms in the document
   */
  const identifyLegalTerms = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      const response = await axios.post('/api/ai/identify-legal-terms', {
        content: documentContent,
        documentId
      });
      
      setLegalTerms(response.data);
    } catch (err) {
      console.error('Error identifying legal terms:', err);
      setError('Failed to identify legal terms. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  /**
   * Get explanation for a specific term
   */
  const getExplanation = useCallback(async (term) => {
    try {
      setLoading(true);
      setError(null);
      
      // Find the term context
      const termData = legalTerms.find(t => t.term === term);
      const context = termData?.context || '';
      
      const response = await axios.post('/api/ai/explain-legal-term', {
        term,
        context,
        documentId
      });
      
      setExplanation(response.data);
    } catch (err) {
      console.error('Error getting term explanation:', err);
      setError('Failed to get explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [legalTerms, documentId]);

  /**
   * Handle term selection
   */
  const handleTermSelect = (term) => {
    setSelectedTerm(term);
    getExplanation(term);
  };

  // Sort terms by complexity (highest first)
  const sortedTerms = [...legalTerms].sort((a, b) => b.complexity - a.complexity);

  if (initialLoading) {
    return <div className="legal-term-explainer loading">Analyzing document for legal terms...</div>;
  }

  if (error && !legalTerms.length) {
    return (
      <div className="legal-term-explainer error">
        <p>{error}</p>
        <button onClick={identifyLegalTerms}>Try Again</button>
      </div>
    );
  }

  if (!documentContent) {
    return <div className="legal-term-explainer empty">No document content to analyze</div>;
  }

  return (
    <div className="legal-term-explainer">
      <div className="term-list-container">
        <h3>Legal Terms &amp; Jargon</h3>
        {legalTerms.length === 0 ? (
          <p className="no-terms">No complex legal terms identified in this document.</p>
        ) : (
          <ul className="term-list">
            {sortedTerms.map((term, index) => (
              <li 
                key={index} 
                className={`term-item complexity-${term.complexity} ${selectedTerm === term.term ? 'selected' : ''}`}
                onClick={() => handleTermSelect(term.term)}
              >
                <span className="term-text">{term.term}</span>
                <span className="complexity-indicator" title={`Complexity: ${term.complexity}/5`}>
                  {Array(term.complexity).fill('●').join('')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="explanation-container">
        {selectedTerm ? (
          loading ? (
            <div className="loading-explanation">Loading explanation...</div>
          ) : explanation ? (
            <div className="term-explanation">
              <h3>{explanation.term}</h3>
              <div className="explanation-section">
                <h4>Simple Explanation</h4>
                <p>{explanation.explanation}</p>
              </div>
              <div className="explanation-section">
                <h4>Why It's Important</h4>
                <p>{explanation.importance}</p>
              </div>
              <div className="explanation-section">
                <h4>What It Means For You</h4>
                <p>{explanation.implications}</p>
              </div>
              {explanation.relatedTerms?.length > 0 && (
                <div className="related-terms">
                  <h4>Related Terms</h4>
                  <ul>
                    {explanation.relatedTerms.map((term, index) => (
                      <li key={index} onClick={() => handleTermSelect(term)}>
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="error-explanation">
              <p>{error}</p>
              <button onClick={() => getExplanation(selectedTerm)}>Try Again</button>
            </div>
          ) : null
        ) : (
          <div className="no-term-selected">
            <p>Select a legal term from the list to get a simple explanation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalTermExplainer;