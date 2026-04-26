import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { SearchEngine } from '../../types';
import { useTranslation } from '../../i18n';

interface SearchEngineSelectorProps {
  selected: SearchEngine;
  onChange: (engine: SearchEngine) => void;
}

const getEngines = (t: (key: string) => string) => [
  { id: 'duckduckgo' as SearchEngine, name: t('searchEngine.duckduckgo'), description: t('searchEngine.duckduckgoDesc') },
  { id: 'serpapi' as SearchEngine, name: t('searchEngine.serpapi'), description: t('searchEngine.serpapiDesc') },
  { id: 'tavily' as SearchEngine, name: t('searchEngine.tavily'), description: t('searchEngine.tavilyDesc') },
];

export const SearchEngineSelector: React.FC<SearchEngineSelectorProps> = ({
  selected,
  onChange,
}) => {
  const { t } = useTranslation();
  const engines = getEngines(t);
  const selectedEngine = engines.find((e) => e.id === selected);
  
  return (
    <div className="w-64">
      <Listbox value={selected} onChange={onChange}>
        <div className="relative">
          <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
            {t('searchEngine.label')}
          </Listbox.Label>
          <Listbox.Button
            className={clsx(
              'relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left',
              'border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <span className="block truncate">
              <span className="font-medium">{selectedEngine?.name}</span>
              <span className="text-gray-500 text-sm ml-2">
                {selectedEngine?.description}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>
          <Transition
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              {engines.map((engine) => (
                <Listbox.Option
                  key={engine.id}
                  value={engine.id}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-pointer select-none py-2 pl-10 pr-4',
                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx('block truncate', selected && 'font-medium')}>
                        {engine.name}
                      </span>
                      <span className="text-gray-500 text-sm">{engine.description}</span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default SearchEngineSelector;
