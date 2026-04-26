import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useTranslation } from '../../i18n';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchBar.placeholder')}
            disabled={isLoading}
            className="text-lg py-3"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isLoading || !query.trim()}
          className="px-8"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {t('searchBar.searching')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search size={20} />
              {t('searchBar.search')}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
