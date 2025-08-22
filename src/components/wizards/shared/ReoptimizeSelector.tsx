import React, { useState, useEffect, useCallback } from 'react';
import { useController, Control } from 'react-hook-form';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import type { NewProject } from '../../../types';
import * as api from '../../../lib/graphql/api';
import type { TourSummary } from '../../../lib/graphql/api';

interface ReoptimizeSelectorProps {
  control: Control<NewProject>;
}

const tourColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
const getTourColor = (index: number) => tourColors[index % tourColors.length];

export const ReoptimizeSelector: React.FC<ReoptimizeSelectorProps> = ({ control }) => {
  const { field } = useController({ name: 'selectedTours', control, rules: { validate: (value) => value.length > 0 || 'At least one tour must be selected.' } });
  const { fieldState } = useController({ name: 'selectedTours', control });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<TourSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allTours, setAllTours] = useState<TourSummary[]>([]);

  useEffect(() => {
    // In a real app, this might fetch all tours initially or be smarter.
    // For now, we pre-fetch the mock tours to get details for selected IDs.
    const fetchAllTours = async () => {
      const tours = await api.searchTours('a'); // A simple way to get all mock tours
      setAllTours(tours);
    };
    fetchAllTours();
  }, []);

  const handleTourSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await api.searchTours(term);
    setSearchResults(results);
    setIsSearching(false);
  }, []);

  const handleAddTour = (tourId: string) => {
    if (field.value.length < 5 && !field.value.includes(tourId)) {
      field.onChange([...field.value, tourId]);
    }
  };

  const handleRemoveTour = (tourId: string) => {
    field.onChange(field.value.filter(id => id !== tourId));
  };

  const getSelectedTourDetails = (tourId: string) => {
    return allTours.find(t => t.id === tourId);
  };
  
  const selectedToursCount = field.value.length;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Existing Tours <span className="text-xs text-gray-500 font-normal ml-2">(Maximum 5 tours)</span>
      </label>
      <div className="relative mb-2">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => handleTourSearch(e.target.value)}
          className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search for tour names..."
        />
      </div>
      
      {field.value.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Selected Tours ({selectedToursCount}/5)</div>
          <div className="space-y-2">
            {field.value.map((tourId, index) => {
              const tour = getSelectedTourDetails(tourId);
              if (!tour) return null;
              return (
                <div key={tourId} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className={`w-3 h-3 rounded-full ${getTourColor(index)} mr-3 flex-shrink-0`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                    <div className="text-xs text-gray-500">{tour.addresses.toLocaleString()} addresses</div>
                  </div>
                  <button onClick={() => handleRemoveTour(tourId)} className="ml-2 p-1 text-gray-400 hover:text-red-600" aria-label={`Remove ${tour.name}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fieldState.error && <span className="text-xs text-red-600">{fieldState.error.message}</span>}

      {isSearching ? (
        <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</div>
      ) : searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          {searchResults.map((tour) => {
            const isSelected = field.value.includes(tour.id);
            const canAdd = !isSelected && field.value.length < 5;
            return (
              <div key={tour.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 border-gray-100">
                <div className={`w-3 h-3 rounded-full ${isSelected ? getTourColor(field.value.indexOf(tour.id)) : 'bg-gray-300'} mr-3 flex-shrink-0`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                  <div className="text-xs text-gray-500">{tour.addresses.toLocaleString()} addresses</div>
                </div>
                <button onClick={() => handleAddTour(tour.id)} disabled={!canAdd} className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${canAdd ? 'text-blue-600 hover:bg-blue-50 border border-blue-200' : 'text-gray-400 cursor-not-allowed'}`}>
                  {isSelected ? 'Added' : <><Plus className="w-3 h-3 mr-1" /> Add</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};