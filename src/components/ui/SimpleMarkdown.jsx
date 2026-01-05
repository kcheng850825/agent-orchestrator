import React from 'react';
import DOMPurify from 'dompurify';

/**
 * SimpleMarkdown - A secure markdown renderer component
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks
 */
const SimpleMarkdown = ({ children }) => {
  if (!children || typeof children !== 'string') return null;

  const lines = children.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeContent = [];
  let codeLanguage = '';

  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
        codeContent = [];
      } else {
        elements.push(
          <pre key={idx} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2 text-sm">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        inCodeBlock = false;
        codeContent = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={idx} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={idx} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={idx} className="ml-4">{line.slice(2)}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={idx} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={idx} className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-2">{line.slice(2)}</blockquote>);
    } else if (line.trim() === '') {
      elements.push(<br key={idx} />);
    } else {
      // Apply inline formatting with proper sanitization
      let formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');

      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(formatted, {
        ALLOWED_TAGS: ['strong', 'em', 'code', 'b', 'i'],
        ALLOWED_ATTR: ['class']
      });

      elements.push(<p key={idx} className="my-1" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />);
    }
  });

  return <div className="prose prose-sm max-w-none">{elements}</div>;
};

export default SimpleMarkdown;
