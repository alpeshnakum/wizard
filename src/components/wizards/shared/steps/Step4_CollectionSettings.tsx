import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { ProjectData, CollectionRoad, SuggestedRoad, CollectionRoadTemplate } from '../../../../lib/graphql/api';
import * as api from '../../../../lib/graphql/api';
import { Info, Plus, Edit2, Trash2, Save, MapPin, Pencil, AlertCircle, X, Loader2, Search, FileText, Gauge } from 'lucide-react';
import debounce from 'lodash.debounce';

// --- Main Step Component ---
const Step4_CollectionSettings: React.FC = () => {
  const { watch, setValue, getValues } = useFormContext<ProjectData>();

  useEffect(() => {
    if (!getValues('suggestedRoads')) {
      setValue('suggestedRoads', [
        { type: 'multilane', label: 'Multilane Roads', available: true, selected: false },
        { type: 'highspeed', label: 'Roads >= 60 km/h speed limit', available: true, selected: false },
      ]);
    }
  }, [getValues, setValue]);

  const vehicleType = watch('vehicleType');

  if (vehicleType === 'sideloader') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Collection Settings Step Skipped</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            This step is not applicable for 'Sideloader' vehicle types.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <InfoSection />
      <AddCollectionRoadsSection />
      <ActiveCollectionRoadsSection />
    </div>
  );
};

// --- Sub-components ---

const InfoSection: React.FC = () => {
  const [showInfo, setShowInfo] = useState(true);
  if (!showInfo) return null;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 relative">
      <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 text-blue-600 hover:text-blue-800" aria-label="Dismiss info panel">
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start space-x-4">
        <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium text-base mb-2">About Collection Settings</p>
          <p className="mb-3">
            Indicate roads where the vehicle can only collect in the driving direction. This is useful for multilane roads or highways where crossing the street is not feasible.
          </p>
        </div>
      </div>
    </div>
  );
};

const AddCollectionRoadsSection: React.FC = () => {
  const { control, setValue, getValues } = useFormContext<ProjectData>();
  
  const collectionRoads = useWatch({ control, name: 'collectionRoads' }) || [];
  const suggestedRoads = useWatch({ control, name: 'suggestedRoads' }) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CollectionRoadTemplate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingRoadType, setLoadingRoadType] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestedRoadToggle = (type: 'multilane' | 'highspeed') => {
    setLoadingRoadType(type);
    const currentRoads = getValues('collectionRoads') || [];
    const currentSuggested = getValues('suggestedRoads') || [];

    const updatedSuggested = currentSuggested.map(road =>
      road.type === type ? { ...road, selected: !road.selected } : road
    );
    setValue('suggestedRoads', updatedSuggested, { shouldDirty: true });

    const toggledRoad = updatedSuggested.find(r => r.type === type);
    if (toggledRoad?.selected) {
      const newRoad: CollectionRoad = {
        id: `suggested_${type}_${Date.now()}`,
        name: toggledRoad.label,
        type: toggledRoad.type,
        isActive: true,
      };
      setValue('collectionRoads', [...currentRoads, newRoad], { shouldDirty: true });
    } else {
      setValue('collectionRoads', currentRoads.filter(r => !(r.type === type && r.id.startsWith('suggested_'))), { shouldDirty: true });
    }
    setLoadingRoadType(null);
  };

  const debouncedSearch = useCallback(debounce(async (query: string) => {
    if (!query.trim()) { 
      setSearchResults([]); 
      return; 
    }
    setIsSearching(true);
    const results = await api.searchCollectionRoads(query);
    setSearchResults(results);
    setIsSearching(false);
  }, 300), []);
  
  const handleTemplateToggle = (template: CollectionRoadTemplate) => {
    const currentRoads = getValues('collectionRoads') || [];
    const isAdded = currentRoads.some(r => r.templateId === template.id);

    if (isAdded) {
      setValue('collectionRoads', currentRoads.filter(r => r.templateId !== template.id), { shouldDirty: true });
    } else {
      const newRoad = { 
        id: `temp_${Date.now()}`, 
        name: template.name, 
        type: 'set', 
        isActive: true, 
        templateId: template.id
      };
      setValue('collectionRoads', [...currentRoads, newRoad], { shouldDirty: true });
    }
  };

  const handleDrawToggle = () => setIsDrawingMode(!isDrawingMode);

  const handleAddDrawnRoad = () => {
    const currentRoads = getValues('collectionRoads') || [];
    const newRoad = { id: `drawn_${Date.now()}`, name: `Custom Road ${currentRoads.length + 1}`, type: 'drawn', isActive: true };
    setValue('collectionRoads', [...currentRoads, newRoad], { shouldDirty: true });
    setIsDrawingMode(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">Add Collection Roads</h3>
      <div className="space-y-8">
        <div>
          <label htmlFor="road-template-search" className="block text-sm font-medium text-gray-700 mb-3">Load Template</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input id="road-template-search" type="search" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); debouncedSearch(e.target.value);}} className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md" placeholder="Search saved road sets..." />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
          </div>
          
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            <div ref={searchResultsRef} className="border border-gray-200 rounded-md max-h-72 overflow-auto">
              {searchResults.map(t => {
                const isAdded = collectionRoads.some(r => r.templateId === t.id);
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-green-500" />
                          <div>
                              <div className="text-sm font-medium">{t.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{t.type.replace('-', ' ')}</div>
                          </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTemplateToggle(t)}
                        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                          isAdded ? 'text-red-600 hover:bg-red-50 border border-red-200' : 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                        }`}
                      >
                        {isAdded ? 'Remove' : (<><Plus className="w-3 h-3 mr-1" />Add</>)}
                      </button>
                  </div>
                )
              })}
            </div>
          ) : searchTerm.trim().length > 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No templates found.</div>
          ) : null}

        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Suggestions</label>
            <div className="divide-y divide-gray-100 border rounded-md">
              {suggestedRoads.map((road) => (
                <div key={road.type} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    {road.type === 'multilane' ? <MapPin className="w-4 h-4 text-blue-500" /> : <Gauge className="w-4 h-4 text-gray-600" />}
                    <div className="text-sm font-medium text-gray-900">{road.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSuggestedRoadToggle(road.type)}
                    disabled={!road.available || loadingRoadType === road.type}
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                      road.selected ? 'text-red-600 hover:bg-red-50 border border-red-200' : 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    {loadingRoadType === road.type ? <Loader2 className="w-3 h-3 animate-spin" /> : road.selected ? 'Remove' : (<><Plus className="w-3 h-3 mr-1" /> Add</>)}
                  </button>
                </div>
              ))}
            </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Draw Custom Road</label>
          <button
            type="button"
            onClick={handleDrawToggle}
            className={`w-full py-3 border rounded-md text-sm font-medium transition-colors duration-200 ${
              isDrawingMode
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isDrawingMode ? 'Drawing Mode Active (Click map to draw)' : 'Start Drawing on Map'}
          </button>
          {isDrawingMode && (
            <button
              type="button"
              onClick={handleAddDrawnRoad}
              className="w-full mt-3 py-3 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors duration-200"
            >
              Finish Drawing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ActiveCollectionRoadsSection: React.FC = () => {
    const { control, getValues, setValue } = useFormContext<ProjectData>();
    const collectionRoads = useWatch({ control, name: 'collectionRoads' }) || [];

    const [editingId, setEditingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveName, setSaveName] = useState('');

    const getIcon = (type: string) => {
        switch(type) {
            case 'multilane': return <MapPin className="w-4 h-4 text-blue-500" />;
            case 'highspeed': return <Gauge className="w-4 h-4 text-gray-600" />;
            case 'drawn': return <Pencil className="w-4 h-4 text-purple-500" />;
            case 'set': return <FileText className="w-4 h-4 text-green-500" />;
            default: return <MapPin className="w-4 h-4 text-gray-400" />;
        }
    }

    const handleEdit = (road: CollectionRoad) => {
      setEditingId(road.id);
      setRenameValue(road.name);
    }
    
    const handleSaveEdit = (roadId: string) => {
      if (!renameValue.trim()) { setEditingId(null); return; }
      const currentRoads = getValues('collectionRoads') || [];
      const updatedRoads = currentRoads.map(r => r.id === roadId ? {...r, name: renameValue} : r);
      setValue('collectionRoads', updatedRoads, { shouldDirty: true });
      setEditingId(null);
    }

    const handleRemove = (roadId: string) => {
      const currentRoads = getValues('collectionRoads') || [];
      const roadToRemove = currentRoads.find(r => r.id === roadId);
      
      if (!roadToRemove) return;

      if (roadToRemove.type === 'multilane' || roadToRemove.type === 'highspeed') {
        const currentSuggested = getValues('suggestedRoads') || [];
        const updatedSuggested = currentSuggested.map(s => s.type === roadToRemove.type ? {...s, selected: false} : s);
        setValue('suggestedRoads', updatedSuggested, { shouldDirty: true });
      }

      setValue('collectionRoads', currentRoads.filter(r => r.id !== roadId), { shouldDirty: true });
    }

    const handleSaveCurrentSet = () => {
      if (!saveName.trim() || collectionRoads.length === 0) return;
      console.log('Saving set:', saveName, collectionRoads);
      setSaveName('');
      setShowSaveForm(false);
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Active Collection Roads</h3>
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                disabled={collectionRoads.length === 0}
                className="p-2 text-gray-400 hover:text-green-600 disabled:opacity-50 transition-colors duration-200 rounded-full hover:bg-gray-100"
                title="Save current set as template"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
            {showSaveForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Save as Template</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm"
                    placeholder="Enter template name..."
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrentSet}
                    disabled={!saveName.trim()}
                    className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {collectionRoads.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No active collection roads yet. Add from above.</p>
            ) : (
                <div className="space-y-3">
                    {collectionRoads.map((road) => (
                        <div key={road.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                            <div className="flex items-center space-x-4 flex-1">
                                {getIcon(road.type)}
                                {editingId === road.id ? (
                                    <input 
                                      value={renameValue} 
                                      onChange={e => setRenameValue(e.target.value)} 
                                      autoFocus 
                                      onBlur={() => handleSaveEdit(road.id)} 
                                      onKeyDown={(e) => { 
                                        if (e.key === 'Enter') handleSaveEdit(road.id); 
                                        if (e.key === 'Escape') setEditingId(null); 
                                      }} 
                                      className="text-sm font-medium text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent" 
                                    />
                                ) : (
                                    <div className="text-sm font-medium text-gray-900">{road.name}</div>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                              {editingId !== road.id ? (
                                <>
                                  <button type="button" onClick={() => handleEdit(road)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => handleRemove(road.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={() => handleSaveEdit(road.id)} className="p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50" title="Save"><Save className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => setEditingId(null)} className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50" title="Cancel"><X className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Step4_CollectionSettings;