import React from 'react';
import { PriorityTag } from '../types';

interface FilterControlsProps {
  selectedFilter: PriorityTag | 'ALL' | 'SISTE';
  onSelectFilter: (filter: PriorityTag | 'ALL' | 'SISTE') => void;
  sources: string[];
  selectedSource: string;
  onSelectSource: (source: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
  selectedFilter, 
  onSelectFilter, 
  sources,
  selectedSource,
  onSelectSource
}) => {
  const filters: { label: string; value: PriorityTag | 'ALL' | 'SISTE'; range?: string }[] = [
    { label: 'Siste', value: 'SISTE', range: '(9 saker)' },
    { label: 'Rød', value: PriorityTag.RED, range: '(8-10)' },
    { label: 'Gul', value: PriorityTag.YELLOW, range: '(4-7)' },
    { label: 'Grønn', value: PriorityTag.GREEN, range: '(1-3)' },
    { label: 'Alle', value: 'ALL' }, // Moved to the end
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center" role="group" aria-label="Filter nyheter etter prioritet">
        <span className="text-gray-400 mr-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter:
        </span>
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onSelectFilter(filter.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
              selectedFilter === filter.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            aria-pressed={selectedFilter === filter.value}
          >
            {filter.label} {filter.range && <span className="text-xs opacity-75">{filter.range}</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Kilde:</span>
          <select
            value={selectedSource}
            onChange={(e) => onSelectSource(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none max-w-[150px]"
          >
            <option value="ALL">Alle kilder</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;