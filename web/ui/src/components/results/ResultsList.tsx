import React from 'react';
import type { SearchResult } from '../../types';
import { ResultItem } from './ResultItem';

interface ResultsListProps {
  results: SearchResult[];
  loading?: boolean;
  onSelectResult: (result: SearchResult) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({
  results,
  loading = false,
  onSelectResult,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No results found. Try a different search query.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {results.map((result) => (
        <ResultItem
          key={result.id}
          result={result}
          onSelect={() => onSelectResult(result)}
        />
      ))}
    </div>
  );
};

export default ResultsList;
