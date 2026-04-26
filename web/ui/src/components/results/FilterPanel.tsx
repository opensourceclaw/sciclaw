import React from 'react';
import { Filter } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import type { FilterState } from '../../types';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  isExpanded,
  onToggle,
}) => {
  const handleScoreChange = (value: string) => {
    onFiltersChange({
      ...filters,
      scoreMin: value ? Number(value) : undefined,
    });
  };
  
  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        start: filters.dateRange?.start || '',
        end: filters.dateRange?.end || '',
        [field]: value || undefined,
      },
    });
  };
  
  const handleClearFilters = () => {
    onFiltersChange({});
  };
  
  const hasActiveFilters = Object.keys(filters).length > 0;
  
  return (
    <div className="w-full">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="flex items-center gap-2 text-gray-600"
      >
        <Filter size={18} />
        {isExpanded ? 'Hide' : 'Show'} Filters
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </Button>
      
      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-32">
              <Input
                type="number"
                label="Min Score"
                value={filters.scoreMin || ''}
                onChange={(e) => handleScoreChange(e.target.value)}
                min={0}
                max={10}
                placeholder="0-10"
              />
            </div>
            
            <div className="w-40">
              <Input
                type="date"
                label="From Date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
            </div>
            
            <div className="w-40">
              <Input
                type="date"
                label="To Date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
          </div>
          
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
