import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form'; // Removed useFieldArray
import { ProjectData, BoundaryTemplate, NaturalBarrier } from '../../../../lib/graphql/api';
import * as api from '../../../../lib/graphql/api';
import {
  Info, Plus, Edit2, Trash2, Save, Waves, Train, Pencil,
  AlertCircle, X, Loader2, Search, FileText, MapPin
} from 'lucide-react';
import debounce from 'lodash.debounce';

// Step3_Boundaries, InfoSection, and AddBoundariesSection are unchanged from the previous correct version.
// I will include them for completeness.

const Step3_Boundaries: React.FC = () => {
  const { watch, setValue, getValues } = useFormContext<ProjectData>();
  const maxVehicles = watch('maxVehicles');

  useEffect(() => {
    api.fetchNaturalBarriers().then(barriers => {
      const existing = getValues('naturalBarriers') || [];
      const updated = barriers.map(b => {
        const ex = existing.find(e => e.id === b.id);
        return { ...b, selected: ex ? ex.selected : false };
      });
      setValue('naturalBarriers', updated, { shouldTouch: true });
    });
  }, [getValues, setValue]);

  if (maxVehicles <= 1) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Boundaries Step Skipped</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Since you've configured only one vehicle, boundary definition is not necessary.
            Boundaries are used to guide clustering when multiple vehicles are involved.
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> If you need multiple vehicles in the future, you can increase
              the vehicle count in the Fleet step to access boundary configuration options.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <InfoSection />
      <AddBoundariesSection />
      <ActiveBoundariesSection />
    </div>
  );
};

const InfoSection: React.FC = () => {
  const [showInfo, setShowInfo] = useState(true);
  if (!showInfo) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 relative">
      <button
        onClick={() => setShowInfo(false)}
        className="absolute top-3 right-3 text-blue-600 hover:text-blue-800"
        aria-label="Dismiss info panel"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start space-x-4">
        <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium text-base mb-2">About Boundaries</p>
          <p className="mb-3">
            Boundaries guide clustering for multiple vehicles. Draw along streets for better splits.
          </p>
          <ul className="space-y-2 list-disc pl-5 text-xs">
            <li>Soft guidelines; system may adjust</li>
            <li>Skip if not needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const AddBoundariesSection: React.FC = () => {
  const { control, setValue, getValues } = useFormContext<ProjectData>();

  const boundaries = useWatch({ control, name: 'boundaries' }) || [];
  const naturalBarriers = useWatch({ control, name: 'naturalBarriers' }) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BoundaryTemplate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [loadingBarrierId, setLoadingBarrierId] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) { setSearchResults([]); return; }
      setIsSearching(true);
      const results = await api.searchBoundaryTemplates(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 300),
    []
  );

  const handleTemplateToggle = (template: BoundaryTemplate) => {
    setLoadingTemplateId(template.id);
    const currentBoundaries = getValues('boundaries') || [];
    const isAdded = currentBoundaries.some(b => b.templateId === template.id);

    if (isAdded) {
      setValue('boundaries', currentBoundaries.filter(b => b.templateId !== template.id), { shouldDirty: true });
    } else {
      const newBoundary = {
        id: `boundary_tpl_${template.id}`,
        name: template.name,
        type: template.type,
        isActive: true,
        templateId: template.id,
      };
      setValue('boundaries', [...currentBoundaries, newBoundary], { shouldDirty: true });
    }
    setLoadingTemplateId(null);
  };

  const handleNaturalBarrierToggle = (barrierId: string) => {
    setLoadingBarrierId(barrierId);
    const currentBarriers = getValues('naturalBarriers') || [];
    const currentBoundaries = getValues('boundaries') || [];
    
    const updatedBarriers = currentBarriers.map(b => 
      b.id === barrierId ? { ...b, selected: !b.selected } : b
    );
    setValue('naturalBarriers', updatedBarriers, { shouldDirty: true });

    const toggledBarrier = updatedBarriers.find(b => b.id === barrierId);
    
    if (toggledBarrier?.selected) {
      const newBoundary = {
        id: `boundary_nat_${barrierId}`,
        name: toggledBarrier.label,
        type: toggledBarrier.type,
        isActive: true,
        naturalBarrierId: barrierId,
      };
      setValue('boundaries', [...currentBoundaries, newBoundary], { shouldDirty: true });
    } else {
      setValue('boundaries', currentBoundaries.filter(b => b.naturalBarrierId !== barrierId), { shouldDirty: true });
    }
    setLoadingBarrierId(null);
  };
  
  const handleAddDrawnBoundary = () => {
    const currentBoundaries = getValues('boundaries') || [];
    const newBoundary = {
      id: `drawn_${Date.now()}`,
      name: `Custom Boundary ${boundaries.length + 1}`,
      type: 'drawn',
      isActive: true,
    };
    setValue('boundaries', [...currentBoundaries, newBoundary], { shouldDirty: true });
    setIsDrawingMode(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">Add Boundaries</h3>
      <div className="space-y-8">
        {/* Load Template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Load Template</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="template-search"
              type="search"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); debouncedSearch(e.target.value); }}
              className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Search saved templates..."
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
          </div>
          {isSearching ? ( <div className="p-4 text-center text-sm text-gray-500">Searching...</div> ) 
          : searchResults.length > 0 ? (
            <div ref={resultsRef} className="divide-y divide-gray-100 border rounded-md">
              {searchResults.map(template => {
                const isAdded = boundaries.some(b => b.templateId === template.id);
                return (
                  <div key={template.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-sm font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500 capitalize">Template</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTemplateToggle(template)}
                      disabled={loadingTemplateId === template.id}
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                        isAdded ? 'text-red-600 hover:bg-red-50 border border-red-200' : 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                      }`}
                    >
                      {loadingTemplateId === template.id ? <Loader2 className="w-3 h-3 animate-spin" /> : isAdded ? 'Remove' : (<><Plus className="w-3 h-3 mr-1" /> Add</>)}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : searchTerm ? ( <div className="p-4 text-center text-sm text-gray-500">No templates found.</div> ) : null}
        </div>
        {/* Natural Barriers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Natural Barriers</label>
          <div className="divide-y divide-gray-100 border rounded-md">
            {naturalBarriers.map(barrier => (
              <div key={barrier.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {barrier.type === 'rivers' ? <Waves className="w-4 h-4 text-blue-500" /> : <Train className="w-4 h-4 text-gray-600" />}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{barrier.label}</div>
                    <div className="text-xs text-gray-500 capitalize">{barrier.type}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNaturalBarrierToggle(barrier.id)}
                  disabled={!barrier.available || loadingBarrierId === barrier.id}
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                    barrier.selected ? 'text-red-600 hover:bg-red-50 border border-red-200' : 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  {loadingBarrierId === barrier.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : barrier.selected ? 'Remove' : (<><Plus className="w-3 h-3 mr-1" /> Add</>)}
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* Draw Custom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Draw Custom Boundary</label>
          <button type="button" onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`w-full py-3 border rounded-md text-sm font-medium transition-colors duration-200 ${
              isDrawingMode ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isDrawingMode ? 'Drawing Mode Active (Click map to draw)' : 'Start Drawing on Map'}
          </button>
          {isDrawingMode && (
            <button type="button" onClick={handleAddDrawnBoundary} className="w-full mt-3 py-3 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors duration-200">
              Finish Drawing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ActiveBoundariesSection: React.FC = () => {
  const { control, setValue, getValues } = useFormContext<ProjectData>();
  
  const boundaries = useWatch({ control, name: 'boundaries' }) || [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleEditBoundary = (id: string, currentName: string) => {
    setEditingId(id);
    setRenameValue(currentName);
  };

  // THE FIX IS HERE: This function now uses `setValue` to be consistent with the component's architecture.
  const handleSaveEdit = (boundaryId: string) => {
    if (!renameValue.trim()) {
      setEditingId(null);
      return; // Do nothing if the name is empty
    }

    const currentBoundaries = getValues('boundaries') || [];
    const updatedBoundaries = currentBoundaries.map(boundary => {
      if (boundary.id === boundaryId) {
        return { ...boundary, name: renameValue };
      }
      return boundary;
    });

    setValue('boundaries', updatedBoundaries, { shouldDirty: true });
    setEditingId(null);
  };
  
  const handleRemoveBoundary = (boundaryId: string) => {
    const currentBoundaries = getValues('boundaries') || [];
    const boundaryToRemove = currentBoundaries.find(b => b.id === boundaryId);
    
    if (boundaryToRemove?.naturalBarrierId) {
      const currentBarriers = getValues('naturalBarriers') || [];
      const updatedBarriers = currentBarriers.map(b => 
        b.id === boundaryToRemove.naturalBarrierId ? { ...b, selected: false } : b
      );
      setValue('naturalBarriers', updatedBarriers, { shouldDirty: true });
    }
    
    setValue('boundaries', currentBoundaries.filter(b => b.id !== boundaryId), { shouldDirty: true });
  };
  
  const handleResetEdit = () => setEditingId(null);

  const handleSaveCurrentSet = async () => {
    if (!saveName.trim() || boundaries.length === 0) return;
    await api.saveBoundaryTemplate(saveName, 'set');
    setSaveName('');
    setShowSaveForm(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'rivers': return <Waves className="w-4 h-4 text-blue-500" />;
      case 'railways': return <Train className="w-4 h-4 text-gray-600" />;
      case 'drawn': return <Pencil className="w-4 h-4 text-purple-500" />;
      case 'set': return <FileText className="w-4 h-4 text-green-500" />;
      default: return <MapPin className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Active Boundaries</h3>
        <button
          type="button"
          onClick={() => setShowSaveForm(true)}
          disabled={boundaries.length === 0}
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
      {boundaries.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No active boundaries yet. Add from above.</p>
      ) : (
        <div className="space-y-3">
          {boundaries.map((boundary) => (
            <div key={boundary.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-4 flex-1">
                {getIcon(boundary.type)}
                {editingId === boundary.id ? (
                  <input
                    type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(boundary.id);
                      if (e.key === 'Escape') handleResetEdit();
                    }}
                    autoFocus
                    className="text-sm font-medium text-gray-900 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  />
                ) : ( <div className="text-sm font-medium text-gray-900">{boundary.name}</div> )}
              </div>
              <div className="flex items-center space-x-3">
                {editingId !== boundary.id ? (
                  <button type="button" onClick={() => handleEditBoundary(boundary.id, boundary.name)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200 rounded-full hover:bg-gray-100" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => handleSaveEdit(boundary.id)} className="p-2 text-green-600 hover:text-green-700 transition-colors duration-200 rounded-full hover:bg-green-50" title="Save">
                      <Save className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleResetEdit} className="p-2 text-red-600 hover:text-red-700 transition-colors duration-200 rounded-full hover:bg-red-50" title="Abort">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {editingId !== boundary.id && (
                  <button type="button" onClick={() => handleRemoveBoundary(boundary.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded-full hover:bg-gray-100" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Step3_Boundaries;