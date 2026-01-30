// Simple HTML sanitizer to prevent XSS attacks
// For production, consider using DOMPurify library for more robust sanitization

/**
 * Strips potentially dangerous HTML tags and attributes
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Create a temporary element
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  
  // Return text content which strips all HTML
  return tempDiv.innerHTML;
};

/**
 * Strips all HTML tags and returns plain text
 * @param {string} html - HTML string to convert
 * @returns {string} - Plain text
 */
export const stripHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  return html.replace(/<[^>]*>/g, '').trim();
};

/**
 * Truncates text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const plainText = stripHtml(text);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength) + '...';
};
