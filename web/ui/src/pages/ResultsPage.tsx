import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ResultsList } from '../components/results/ResultsList';
import { Pagination } from '../components/results/Pagination';
import { FilterPanel } from '../components/results/FilterPanel';
import { Button } from '../components/common/Button';
import { useResearchStore } from '../store/useResearchStore';
import type { SearchResult } from '../types';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    query,
    results,
    isSearching,
    filters,
    setFilters,
    pagination,
    setPage,
  } = useResearchStore();
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Apply filters to results (client-side filtering)
  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      if (filters.scoreMin && result.score < filters.scoreMin) return false;
      if (filters.dateRange?.start) {
        const resultDate = result.publishedAt ? new Date(result.publishedAt) : null;
        if (resultDate && resultDate < new Date(filters.dateRange.start)) return false;
      }
      if (filters.dateRange?.end) {
        const resultDate = result.publishedAt ? new Date(result.publishedAt) : null;
        if (resultDate && resultDate > new Date(filters.dateRange.end)) return false;
      }
      return true;
    });
  }, [results, filters]);
  
  // Paginate results
  const paginatedResults = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredResults.slice(start, end);
  }, [filteredResults, pagination.page, pagination.pageSize]);
  
  const handleSelectResult = (result: SearchResult) => {
    // TODO: Open result detail or generate report
    console.log('Selected result:', result);
  };
  
  const handlePageChange = (page: number) => {
    setPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const totalPages = Math.ceil(filteredResults.length / pagination.pageSize);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft size={18} className="mr-2" />
              New Search
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Search Results</h1>
              <p className="text-sm text-gray-500">
                {filteredResults.length} results for "{query}"
              </p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              isExpanded={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />
          </aside>
          
          {/* Results List */}
          <div className="flex-1">
            <ResultsList
              results={paginatedResults}
              loading={isSearching}
              onSelectResult={handleSelectResult}
            />
            
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
