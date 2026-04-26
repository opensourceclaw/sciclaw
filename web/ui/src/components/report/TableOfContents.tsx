import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  activeId: string;
  onHeadingClick: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  activeId,
  onHeadingClick,
}) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  
  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings: Heading[] = [];
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      extractedHeadings.push({ id, text, level });
    }
    
    setHeadings(extractedHeadings);
  }, [content]);
  
  if (headings.length === 0) return null;
  
  return (
    <nav className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Table of Contents</h4>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <button
              onClick={() => onHeadingClick(heading.id)}
              className={clsx(
                'text-left hover:text-blue-600 transition-colors',
                activeId === heading.id ? 'text-blue-600 font-medium' : 'text-gray-600'
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
