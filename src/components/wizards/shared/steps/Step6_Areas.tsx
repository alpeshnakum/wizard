import React, { useState } from 'react';
import { useWizardStore } from "../../../../store/wizardStore";
import { CheckCircle, Loader2, MapPin, Truck, Building, Settings, Save, Search, Pencil, Check, X } from "lucide-react";
import type { ClusteringResults, ClusterResult } from "../../../../lib/graphql/api";

const Step6_Areas: React.FC = () => {
  const { results } = useWizardStore((state) => ({
    results: state.project?.projectData.clusteringResults,
  }));

  if (results) {
    return <ResultsView resultsOverride={results} />;
  }

  return <PlanningView />;
};

// === PLANNING VIEW ===
const PlanningView: React.FC = () => {
  const progressStep = useWizardStore(
    (state) => state.project?.projectData.planningProgress?.step || 'start'
  );

  const planningSteps = [
    { id: "start", label: "Initiating Calculation", icon: Building },
    { id: "collecting-data", label: "Collecting Data", icon: Building },
    { id: "preparing-network", label: "Preparing Street Network", icon: MapPin },
    { id: "generating-areas", label: "Generating Areas", icon: Truck },
  ];

  const getStepStatus = (stepId: string) => {
    const currentIndex = Math.max(0, planningSteps.findIndex((s) => s.id === progressStep));
    const stepIndex = planningSteps.findIndex((s) => s.id === stepId);
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-md border border-gray-200">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Calculating Areas...</h1>
      <p className="text-sm text-gray-600 mb-6">This may take a few minutes. You can safely leave this page.</p>
      <div className="space-y-4">
        {planningSteps.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center space-x-3">
              {status === "completed" ? (
                <CheckCircle className="text-green-500" size={20} />
              ) : status === "active" ? (
                <Loader2 className="text-blue-500 animate-spin" size={20} />
              ) : (
                <Icon className="text-gray-400" size={20} />
              )}
              <span className={`text-sm ${status === "pending" ? "text-gray-400" : "text-gray-800"}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// === RESULTS VIEW ===
const ResultsView: React.FC<{ resultsOverride: ClusteringResults }> = ({ resultsOverride }) => {
  const { startRouteSettingsFlow, startSaveTourFlow } = useWizardStore((state) => ({
    startRouteSettingsFlow: state.startRouteSettingsFlow,
    startSaveTourFlow: state.startSaveTourFlow,
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [clusters, setClusters] = useState<ClusterResult[]>(resultsOverride.clusters);

  const filteredClusters = clusters.filter(cluster =>
    cluster.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCalculateRoute = (id: string) => {
    console.log("Triggering route calculation for cluster:", id);
  };

  const handleRename = (id: string, newName: string) => {
    setClusters(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Clustering Results</h1>
        <p className="text-gray-600">Review and manage your generated collection areas</p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-700">Total Clusters</h3>
              <p className="text-2xl font-bold text-blue-900">{resultsOverride.clustersGenerated}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-700">Addresses Assigned</h3>
              <p className="text-2xl font-bold text-green-900">{resultsOverride.addressesAssigned.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-700">Unassigned Points</h3>
              <p className="text-2xl font-bold text-yellow-900">{resultsOverride.unassignedPoints.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Generated Clusters</h2>
          <div className="text-sm text-gray-600">
            {filteredClusters.length} of {clusters.length} clusters
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search clusters by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Clusters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClusters.map((cluster: ClusterResult) => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            onSettings={() => startRouteSettingsFlow(cluster.id, cluster.name)}
            onRoute={() => handleCalculateRoute(cluster.id)}
            onSave={() => startSaveTourFlow(cluster.id)}
            onRename={(newName) => handleRename(cluster.id, newName)}
          />
        ))}
      </div>
    </div>
  );
};

// === CLUSTER CARD ===
const getColor = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500'];
  return colors[hash % colors.length];
};

const ClusterCard: React.FC<{
  cluster: ClusterResult;
  onSettings: () => void;
  onRoute: () => void;
  onSave: () => void;
  onRename: (newName: string) => void;
}> = ({ cluster, onSettings, onRoute, onSave, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(cluster.name);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedName.trim()) {
      onRename(editedName);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(cluster.name);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`w-4 h-4 ${getColor(cluster.id)} rounded-full flex-shrink-0`}></span>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 text-sm font-semibold border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                    autoFocus
                  />
                  <button onClick={handleSave} className="text-green-600 hover:text-green-700 p-1">
                    <Check size={14} />
                  </button>
                  <button onClick={handleCancel} className="text-red-600 hover:text-red-700 p-1">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{cluster.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    cluster.isOptimized 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {cluster.isOptimized ? "Optimized" : "Clustered"}
                  </span>
                  <button 
                    onClick={handleStartEdit} 
                    className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Addresses:</span>
              <span className="font-medium text-gray-900">{cluster.addresses}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bins:</span>
              <span className="font-medium text-gray-900">{cluster.bins}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Est. Time:</span>
              <span className="font-medium text-gray-900">{cluster.estimatedTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Load:</span>
              <span className="font-medium text-gray-900">{cluster.load}%</span>
            </div>
          </div>
        </div>

        {/* Progress bar for load */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Capacity</span>
            <span>{cluster.load}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                cluster.load > 90 ? 'bg-red-500' : 
                cluster.load > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(cluster.load, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRoute}
            className={`flex-1 px-3 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              cluster.isOptimized 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
            } focus:outline-none focus:ring-offset-2`}
          >
            {cluster.isOptimized ? "Re-optimize" : "Optimize"}
          </button>
          <button
            onClick={onSettings}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-1"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
          <button
            onClick={onSave}
            className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6_Areas;