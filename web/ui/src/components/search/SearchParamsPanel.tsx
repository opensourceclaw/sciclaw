import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface SearchParamsPanelProps {
  maxResults: number;
  onMaxResultsChange: (value: number) => void;
  includeMarkdown: boolean;
  onIncludeMarkdownChange: (value: boolean) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const SearchParamsPanel: React.FC<SearchParamsPanelProps> = ({
  maxResults,
  onMaxResultsChange,
  includeMarkdown,
  onIncludeMarkdownChange,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="w-full">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="flex items-center gap-2 text-gray-600"
      >
        <SlidersHorizontal size={18} />
        {isExpanded ? 'Hide' : 'Show'} Search Options
      </Button>
      
      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <Input
                type="number"
                label="Max Results"
                value={maxResults}
                onChange={(e) => onMaxResultsChange(Number(e.target.value))}
                min={5}
                max={50}
              />
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMarkdown}
                  onChange={(e) => onIncludeMarkdownChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Generate Markdown Report</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchParamsPanel;
