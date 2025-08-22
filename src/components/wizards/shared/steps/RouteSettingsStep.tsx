import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  Trash2,
  X,
  Search,
  Plus,
  GripVertical,
  MapPin,
  Clock,
  FileText,
  Lightbulb,
  Pencil,
  Loader2,
  Square,
  AlertCircle,
} from 'lucide-react';
import { useWizardStore } from '../../../../store/wizardStore';

// --- Type Definitions ---
interface FleetSettings {
  vehicleLimit: number;
  maxWorkingTime: number; // in hours
  startDepot: string;
  recycler: string;
}

interface PriorityArea {
  id: string;
  name: string;
  type: 'template' | 'suggestion' | 'drawn';
  sourceId?: string; // To link back to the original template/suggestion
}

interface TimeWindow {
  id: string;
  name: string;
  type: 'address' | 'area';
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
}

interface Template<T> {
  id: string;
  name: string;
  items: T[];
}

interface AddressSuggestion {
  id: string;
  name: string;
}

// --- Mock Data ---
const savedTemplates: Omit<PriorityArea, 'id'>[] = [
  { sourceId: 'template-1', name: 'Downtown Core', type: 'template' },
  { sourceId: 'template-2', name: 'Industrial Park', type: 'template' },
  { sourceId: 'template-3', name: 'Residential West', type: 'template' },
];

const suggestions: Omit<PriorityArea, 'id'>[] = [
  { sourceId: 'suggestion-1', name: 'City Center', type: 'suggestion' }
];

const mockAddresses: AddressSuggestion[] = [
  { id: 'addr-1', name: '123 Main St, Anytown' },
  { id: 'addr-2', name: '456 Oak Ave, Sometown' },
  { id: 'addr-3', name: '789 Pine Ln, Anytown' },
  { id: 'addr-4', name: '101 Maple Rd, Otherville' },
  { id: 'addr-5', name: '212 Birch Blvd, Anytown' },
];

const RouteSettingsStep: React.FC = () => {
  const {
    selectedClusterId,
    selectedClusterName,
    cancelRouteSettings,
    saveRouteSettings,
    setFooterOverrides,
    project,
  } = useWizardStore(state => ({
    selectedClusterId: state.selectedClusterId,
    selectedClusterName: state.selectedClusterName,
    cancelRouteSettings: state.cancelRouteSettings,
    saveRouteSettings: state.saveRouteSettings,
    setFooterOverrides: state.setFooterOverrides,
    project: state.project,
  }));

  // --- State Management ---
  const [isFleetSettingsExpanded, setIsFleetSettingsExpanded] = useState(false);
  const [fleetSettings, setFleetSettings] = useState<FleetSettings>({
    vehicleLimit: 10,
    maxWorkingTime: 8,
    startDepot: 'Main Depot',
    recycler: 'City Recycler',
  });
  const [tempFleetSettings, setTempFleetSettings] = useState(fleetSettings);

  const [priorityType, setPriorityType] = useState<'priorityAreas' | 'timeWindows'>('priorityAreas');

  // --- Priority Areas State ---
  const [priorityAreas, setPriorityAreas] = useState<PriorityArea[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);
  const [filteredTemplates, setFilteredTemplates] = useState<Omit<PriorityArea, 'id'>[]>([]);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [showSavePriorityForm, setShowSavePriorityForm] = useState(false);
  const [savedPrioritySets, setSavedPrioritySets] = useState<Template<PriorityArea>[]>([]);
  const [prioritySetName, setPrioritySetName] = useState('');

  // --- Time Windows State ---
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressResults, setAddressResults] = useState<AddressSuggestion[]>([]);
  const [showSaveTimeWindowForm, setShowSaveTimeWindowForm] = useState(false);
  const [savedTimeWindowSets, setSavedTimeWindowSets] = useState<Template<TimeWindow>[]>([]);
  const [timeWindowSetName, setTimeWindowSetName] = useState('');

  // --- Footer Overrides ---
  useEffect(() => {
    setFooterOverrides({
      onBack: cancelRouteSettings,
      backText: 'Cancel',
      onNext: () => saveRouteSettings({ fleetSettings, priorityAreas, timeWindows, clusterId: selectedClusterId }),
      nextText: 'Save Settings',
      isNextDisabled: false, // Can add validation if needed
    });
    return () => setFooterOverrides(null);
  }, [setFooterOverrides, cancelRouteSettings, saveRouteSettings, fleetSettings, priorityAreas, timeWindows, selectedClusterId]);

  // --- Mock Backend Fetch for Fleet Settings ---
  useEffect(() => {
    // Simulate fetching fleet settings for the cluster
    const fetchFleetSettings = () => {
      // Mock API call
      setTimeout(() => {
        // If no cluster-specific settings, use wizard defaults from project
        const wizardDefaults = project?.projectData || {};
        setFleetSettings({
          vehicleLimit: wizardDefaults.maxVehicles || 10,
          maxWorkingTime: 8, // Default, as maxWorkingTime might not be in wizard
          startDepot: wizardDefaults.startDepot || 'Main Depot',
          recycler: wizardDefaults.recycler || 'City Recycler',
        });
      }, 500); // Simulate delay
    };
    fetchFleetSettings();
  }, [selectedClusterId, project]);

  // --- Effects for Debounced Search ---
  useEffect(() => {
    if (templateSearch.trim() === '') {
      setFilteredTemplates([]);
      return;
    }
    setIsSearchingTemplates(true);
    const handler = setTimeout(() => {
      setFilteredTemplates(savedTemplates.filter(t =>
        t.name.toLowerCase().includes(templateSearch.toLowerCase())
      ));
      setIsSearchingTemplates(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [templateSearch]);

  useEffect(() => {
    if (addressSearch.trim() === '') {
      setAddressResults([]);
      return;
    }
    setIsSearchingAddress(true);
    const handler = setTimeout(() => {
      setAddressResults(mockAddresses.filter(a =>
        a.name.toLowerCase().includes(addressSearch.toLowerCase())
      ));
      setIsSearchingAddress(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [addressSearch]);

  // --- Handlers: Fleet Settings ---
  const handleEditFleetSettings = () => {
    setTempFleetSettings(fleetSettings);
    setIsFleetSettingsExpanded(true);
  };

  const handleSaveFleetSettings = () => {
    setFleetSettings(tempFleetSettings);
    setIsFleetSettingsExpanded(false);
  };

  const handleCancelFleetSettings = () => {
    setIsFleetSettingsExpanded(false);
  };

  const handleFleetSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempFleetSettings(prev => ({ ...prev, [name]: name === 'vehicleLimit' || name === 'maxWorkingTime' ? Number(value) : value }));
  };

  // --- Handlers: Priority Areas ---
  const handleTogglePriorityArea = (area: Omit<PriorityArea, 'id'>, isAdded: boolean) => {
    if (!area.sourceId) return;
    setLoadingItems(prev => ({ ...prev, [area.sourceId!]: true }));
    
    setTimeout(() => { // Simulate API delay
      if (isAdded) {
        setPriorityAreas(prev => prev.filter(p => p.sourceId !== area.sourceId));
      } else {
        setPriorityAreas(prev => [...prev, { ...area, id: Date.now().toString() }]);
      }
      setLoadingItems(prev => ({ ...prev, [area.sourceId!]: false }));
    }, 500);
  };

  const handleAddDrawnPriorityArea = () => {
    const newArea: PriorityArea = {
      id: Date.now().toString(),
      name: `Custom Zone ${priorityAreas.filter(p => p.type === 'drawn').length + 1}`,
      type: 'drawn'
    };
    setPriorityAreas(prev => [...prev, newArea]);
    // This would also trigger map drawing mode
  };

  const handleDeletePriorityArea = (id: string) => {
    setPriorityAreas(prev => prev.filter(p => p.id !== id));
  };

  const handleStartEdit = (area: PriorityArea) => {
    setEditingAreaId(area.id);
    setEditingAreaName(area.name);
  };

  const handleSaveEdit = () => {
    if (!editingAreaId) return;
    setPriorityAreas(prev => prev.map(p => p.id === editingAreaId ? { ...p, name: editingAreaName } : p));
    setEditingAreaId(null);
    setEditingAreaName('');
  };

  const handleCancelEdit = () => {
    setEditingAreaId(null);
    setEditingAreaName('');
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const areasCopy = [...priorityAreas];
    const draggedItemContent = areasCopy.splice(dragItem.current, 1)[0];
    areasCopy.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setPriorityAreas(areasCopy);
  };

  const handleSavePrioritySet = () => {
    if (prioritySetName.trim() && priorityAreas.length > 0) {
      const newSet: Template<PriorityArea> = {
        id: Date.now().toString(),
        name: prioritySetName,
        items: priorityAreas
      };
      setSavedPrioritySets(prev => [...prev, newSet]);
      setPrioritySetName('');
      setShowSavePriorityForm(false);
    }
  };

  // --- Handlers: Time Windows ---
  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setTimeWindows(prev => prev.map(tw => tw.id === id ? { ...tw, [field]: value } : tw));
  };

  const handleAddTimeWindow = (item: AddressSuggestion) => {
    const newTimeWindow: TimeWindow = {
      id: Date.now().toString(),
      name: item.name,
      type: 'address',
      startTime: '07:00',
      endTime: '09:00',
    };
    setTimeWindows(prev => [...prev, newTimeWindow]);
  };

  const handleAddAllAddresses = () => {
    const newWindows = addressResults.map(addr => ({
      id: Date.now().toString() + addr.id,
      name: addr.name,
      type: 'address' as const,
      startTime: '07:00',
      endTime: '09:00',
    }));
    setTimeWindows(prev => [...prev, ...newWindows]);
    setAddressResults([]);
    setAddressSearch('');
  };

  const handleAddTimeWindowArea = () => {
    const newTimeWindow: TimeWindow = {
      id: Date.now().toString(),
      name: `Custom Area ${timeWindows.filter(tw => tw.type === 'area').length + 1}`,
      type: 'area',
      startTime: '07:00',
      endTime: '09:00',
    };
    setTimeWindows(prev => [...prev, newTimeWindow]);
  };

  const handleDeleteTimeWindow = (id: string) => {
    setTimeWindows(prev => prev.filter(tw => tw.id !== id));
  };

  const handleSaveTimeWindowSet = () => {
    if (timeWindowSetName.trim() && timeWindows.length > 0) {
      const newSet: Template<TimeWindow> = {
        id: Date.now().toString(),
        name: timeWindowSetName,
        items: timeWindows
      };
      setSavedTimeWindowSets(prev => [...prev, newSet]);
      setTimeWindowSetName('');
      setShowSaveTimeWindowForm(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Route Settings</h3>
        <p className="text-sm text-gray-600">
          Configure route optimization settings for <span className="font-medium">{selectedClusterName || 'the selected cluster'}</span>.
        </p>
      </div>

      {/* 1. Fleet Settings Panel */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Fleet Settings</h3>
          {!isFleetSettingsExpanded ? (
            <button onClick={handleEditFleetSettings} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
              <Edit className="w-4 h-4 mr-2" />Edit
            </button>
          ) : (
            <div className="space-x-3">
              <button onClick={handleSaveFleetSettings} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                Save
              </button>
              <button onClick={handleCancelFleetSettings} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          )}
        </div>
        {(isFleetSettingsExpanded ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle Limit</label>
              <input
                type="number"
                name="vehicleLimit"
                value={tempFleetSettings.vehicleLimit}
                onChange={handleFleetSettingChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Working Time (hours)</label>
              <input
                type="number"
                name="maxWorkingTime"
                value={tempFleetSettings.maxWorkingTime}
                onChange={handleFleetSettingChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Depot</label>
              <input
                type="text"
                name="startDepot"
                value={tempFleetSettings.startDepot}
                onChange={handleFleetSettingChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Recycler</label>
              <input
                type="text"
                name="recycler"
                value={tempFleetSettings.recycler}
                onChange={handleFleetSettingChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle Limit</label>
              <p className="mt-1 text-sm text-gray-900">{fleetSettings.vehicleLimit}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Working Time (hours)</label>
              <p className="mt-1 text-sm text-gray-900">{fleetSettings.maxWorkingTime}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Depot</label>
              <p className="mt-1 text-sm text-gray-900">{fleetSettings.startDepot}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Recycler</label>
              <p className="mt-1 text-sm text-gray-900">{fleetSettings.recycler}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm p-4 rounded-lg">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <p>You can use either Priority Areas to guide the optimizer, or specific Time Windows. These settings will be added in a future step.</p>
      </div>

      {/* Switch like in SaveTourStep */}
      <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setPriorityType('priorityAreas')}
          className={`flex items-center justify-center gap-2 flex-1 text-sm p-2 rounded-md ${priorityType === 'priorityAreas' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
        >
          Priority Areas
        </button>
        <button
          type="button"
          onClick={() => setPriorityType('timeWindows')}
          className={`flex items-center justify-center gap-2 flex-1 text-sm p-2 rounded-md ${priorityType === 'timeWindows' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
        >
          Time Windows
        </button>
      </div>

      {/* Priority Areas Panel */}
      {priorityType === 'priorityAreas' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-6">Add Priority Areas</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Saved Templates</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={templateSearch} 
                    onChange={e => setTemplateSearch(e.target.value)} 
                    placeholder="Search templates..." 
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {isSearchingTemplates ? (
                  <div className="p-2 text-center text-sm text-gray-500">Searching...</div>
                ) : (
                  filteredTemplates.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      {filteredTemplates.map(template => (
                        <div key={template.sourceId} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <span className="text-sm">{template.name}</span>
                          <button 
                            onClick={() => handleTogglePriorityArea(template, priorityAreas.some(p => p.sourceId === template.sourceId))} 
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-blue-600 hover:bg-blue-50 border border-blue-200"
                          >
                            {loadingItems[template.sourceId || ''] ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : priorityAreas.some(p => p.sourceId === template.sourceId) ? (
                              'Remove'
                            ) : (
                              <><Plus className="w-3 h-3 mr-1" />Add</>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suggestions</label>
                <div className="space-y-2">
                  {suggestions.map(sugg => (
                    <div key={sugg.sourceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-medium">{sugg.name}</span>
                      </div>
                      <button 
                        onClick={() => handleTogglePriorityArea(sugg, priorityAreas.some(p => p.sourceId === sugg.sourceId))} 
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-blue-600 hover:bg-blue-50 border border-blue-200"
                      >
                        {loadingItems[sugg.sourceId || ''] ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : priorityAreas.some(p => p.sourceId === sugg.sourceId) ? (
                          'Remove'
                        ) : (
                          <><Plus className="w-3 h-3 mr-1" />Add</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Draw Custom Priority Area</label>
                <button 
                  onClick={handleAddDrawnPriorityArea} 
                  className="w-full py-2.5 border rounded-md text-sm font-medium transition-colors duration-200 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Draw Area on Map
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Active Priority Areas</h3>
              <button 
                onClick={() => setShowSavePriorityForm(true)} 
                disabled={priorityAreas.length === 0} 
                className="p-2 text-gray-400 hover:text-green-600 disabled:opacity-50 transition-colors duration-200 rounded-full hover:bg-gray-100" 
                title="Save current set as template"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
            {showSavePriorityForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Save as Template</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={prioritySetName} 
                    onChange={(e) => setPrioritySetName(e.target.value)} 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Enter template name..." 
                  />
                  <button 
                    onClick={handleSavePrioritySet} 
                    disabled={!prioritySetName.trim()} 
                    className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setShowSavePriorityForm(false)} 
                    className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {priorityAreas.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No priority areas added.</p>
            ) : (
              <div className="space-y-2" onDragOver={e => e.preventDefault()}>
                {priorityAreas.map((area, index) => (
                  <div 
                    key={area.id} 
                    className="flex items-center p-3 bg-gray-50 rounded-md cursor-move"
                    draggable
                    onDragStart={() => (dragItem.current = index)}
                    onDragEnter={() => (dragOverItem.current = index)}
                    onDragEnd={handleDragSort}
                  >
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 font-bold rounded-full mr-3 flex-shrink-0">{index + 1}</span>
                    <GripVertical className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      {editingAreaId === area.id ? (
                        <input 
                          type="text" 
                          value={editingAreaName} 
                          onChange={e => setEditingAreaName(e.target.value)} 
                          className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900 truncate block" title={area.name}>{area.name}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                      {editingAreaId === area.id ? (
                        <>
                          <button 
                            onClick={handleSaveEdit} 
                            className="p-2 text-green-600 rounded-full hover:bg-green-100"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            className="p-2 text-red-600 rounded-full hover:bg-red-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleStartEdit(area)} 
                            className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePriorityArea(area.id)} 
                            className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Windows Panel */}
      {priorityType === 'timeWindows' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-6">Add Time Windows</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Specific Collection Point</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={addressSearch} 
                    onChange={e => setAddressSearch(e.target.value)} 
                    placeholder="Search for an address..." 
                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {isSearchingAddress ? (
                  <div className="p-2 text-center text-sm text-gray-500">Searching...</div>
                ) : (
                  addressResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      <div className="p-2 bg-gray-50 flex justify-end">
                        <button 
                          onClick={handleAddAllAddresses} 
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          ADD ALL ({addressResults.length})
                        </button>
                      </div>
                      {addressResults.map(addr => (
                        <div key={addr.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                          <span className="text-sm">{addr.name}</span>
                          <button 
                            onClick={() => handleAddTimeWindow(addr)} 
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded text-blue-600 hover:bg-blue-50 border border-blue-200"
                          >
                            <Plus className="w-3 h-3 mr-1" />Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Draw Custom Time Window Area</label>
                <button 
                  onClick={handleAddTimeWindowArea} 
                  className="w-full py-2.5 border rounded-md text-sm font-medium transition-colors duration-200 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Draw Area on Map
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Active Time Windows</h3>
              <button 
                onClick={() => setShowSaveTimeWindowForm(true)} 
                disabled={timeWindows.length === 0} 
                className="p-2 text-gray-400 hover:text-green-600 disabled:opacity-50 transition-colors duration-200 rounded-full hover:bg-gray-100" 
                title="Save current set as template"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
            {showSaveTimeWindowForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Save as Template</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={timeWindowSetName} 
                    onChange={(e) => setTimeWindowSetName(e.target.value)} 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Enter template name..." 
                  />
                  <button 
                    onClick={handleSaveTimeWindowSet} 
                    disabled={!timeWindowSetName.trim()} 
                    className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => setShowSaveTimeWindowForm(false)} 
                    className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {timeWindows.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No time windows added.</p>
            ) : (
              <div className="space-y-2">
                {timeWindows.map(tw => (
                  <div key={tw.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3 flex-grow min-w-0">
                      {tw.type === 'address' ? (
                        <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate" title={tw.name}>{tw.name}</p>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                      <div className="flex items-center gap-1">
                        <input 
                          type="time" 
                          value={tw.startTime} 
                          onChange={e => handleTimeChange(tw.id, 'startTime', e.target.value)} 
                          className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-gray-500 text-xs">-</span>
                        <input 
                          type="time" 
                          value={tw.endTime} 
                          onChange={e => handleTimeChange(tw.id, 'endTime', e.target.value)} 
                          className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button 
                        onClick={() => handleDeleteTimeWindow(tw.id)} 
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-200 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteSettingsStep;