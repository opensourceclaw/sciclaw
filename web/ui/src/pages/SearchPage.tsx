import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/search/SearchBar';
import { SearchEngineSelector } from '../components/search/SearchEngineSelector';
import { SearchParamsPanel } from '../components/search/SearchParamsPanel';
import { useResearchStore } from '../store/useResearchStore';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    setQuery,
    engine,
    setEngine,
    executeSearch,
    isSearching
  } = useResearchStore();
  
  const [maxResults, setMaxResults] = useState(20);
  const [includeMarkdown, setIncludeMarkdown] = useState(true);
  const [showParams, setShowParams] = useState(false);
  
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    await executeSearch(searchQuery);
    navigate('/results');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('searchPage.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('searchPage.subtitle')}
          </p>
        </div>
        
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        
        <div className="flex flex-wrap justify-center gap-4">
          <SearchEngineSelector selected={engine} onChange={setEngine} />
        </div>
        
        <SearchParamsPanel
          maxResults={maxResults}
          onMaxResultsChange={setMaxResults}
          includeMarkdown={includeMarkdown}
          onIncludeMarkdownChange={setIncludeMarkdown}
          isExpanded={showParams}
          onToggle={() => setShowParams(!showParams)}
        />
      </div>
    </div>
  );
};

export default SearchPage;
