/**
 * Utility helper functions
 */

/**
 * Download a file to the user's device
 * @param {string} fileName - Name of the file to download
 * @param {string} content - Content of the file
 * @param {string} mimeType - MIME type of the file
 */
export const downloadFile = (fileName, content, mimeType = 'text/markdown') => {
  let blob;

  if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
    // Handle binary content (base64 encoded)
    try {
      const byteCharacters = atob(content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } catch (e) {
      // Fallback to text if base64 decode fails
      blob = new Blob([content], { type: 'text/plain' });
    }
  } else {
    // Handle text content
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Read a file and return its content
 * @param {File} file - File object to read
 * @returns {Promise<object>} - File data with name, type, and content
 */
export const readFile = (file) => new Promise((resolve, reject) => {
  // Check file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    reject(new Error(`File "${file.name}" is too large. Maximum size is 10MB.`));
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    let content = e.target.result;
    if (typeof content === 'string' && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      // Extract base64 content from data URL
      content = content.split(',')[1];
    }
    resolve({ name: file.name, type: file.type, content });
  };

  reader.onerror = () => {
    reject(new Error(`Failed to read file: ${file.name}`));
  };

  if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
});

/**
 * Format a date for display
 * @param {number|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  downloadFile,
  copyToClipboard,
  readFile,
  formatDate,
  generateId,
  truncateText,
  debounce
};
