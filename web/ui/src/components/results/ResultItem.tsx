import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Card } from '../common/Card';
import type { SearchResult } from '../../types';

interface ResultItemProps {
  result: SearchResult;
  onSelect: () => void;
}

export const ResultItem: React.FC<ResultItemProps> = ({ result, onSelect }) => {
  return (
    <Card hoverable onClick={onSelect} className="hover:border-blue-300">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer">
            <a href={result.url} target="_blank" rel="noopener noreferrer">
              {result.title}
            </a>
          </h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 shrink-0">
            <Star size={14} className="text-yellow-500" />
            <span>{result.score.toFixed(1)}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
        
        <div className="flex items-center justify-between">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
            {new URL(result.url).hostname}
          </a>
          
          {result.publishedAt && (
            <span className="text-sm text-gray-500">
              {new Date(result.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResultItem;
