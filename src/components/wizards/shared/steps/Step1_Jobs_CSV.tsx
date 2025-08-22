// src/components/wizards/shared/steps/Step1_Jobs_CSV.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { UploadedFile } from '../../../../store/wizardStore';
import { ProjectData } from '../../../../lib/graphql/api';
import { UploadCloud, Download, FileText, CheckCircle, AlertTriangle, Trash2, ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import Papa from 'papaparse';


// --- Type Definitions ---
type UploadStatus = 'idle' | 'uploading' | 'geocoding' | 'success' | 'error';
interface ProcessedCsvData {
  data: any[];
  hasFrequency: boolean;
  containerSettings: Record<string, any>;
}

// --- Constants ---
const defaultDensities: Record<string, number> = {
  residential: 0.15, biogenic: 0.2, recyclable: 0.1, commercial: 0.25,
};
const materialOptions = [
    { id: '', label: 'Select Material' }, { id: 'residential', label: 'Residential Waste' },
    { id: 'biogenic', label: 'Biogenic Waste' }, { id: 'recyclable', label: 'Recyclable Materials' },
    { id: 'commercial', label: 'Commercial Waste' }, { id: 'other', label: 'Other' },
];

// --- Main Component ---
const Step1_Jobs_CSV: React.FC = () => {
  const { control, watch, setValue } = useFormContext<ProjectData>();

  const uploadedFile = watch('uploadedFile');
  const selectedMaterial = watch('selectedMaterial');
  const hasFrequency = watch('hasFrequency');

  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset uploader if the file is removed from the form state elsewhere
  useEffect(() => {
    if (!uploadedFile) {
      setStatus('idle');
      setProgress(0);
      setProcessingMessage('');
      setError(null);
    } else if (uploadedFile && status === 'idle') {
      // Sync state if file exists on load
      setStatus('success');
    }
  }, [uploadedFile, status]);
  
  // --- Core Processing Logic ---
  const parseAndProcessFile = (file: File): Promise<ProcessedCsvData> => {
    return new Promise((resolve, reject) => {
      setStatus('uploading');
      setProcessingMessage('Uploading & Parsing...');
      
      // Simulate upload progress
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        setProgress(currentProgress);
        if (currentProgress >= 90) clearInterval(progressInterval);
      }, 50);

      Papa.parse(file, {
        header: true, skipEmptyLines: true, quoteChar: '"', escapeChar: '"',
        complete: (results) => {
          clearInterval(progressInterval);
          setProgress(100);

          const parsedData = results.data as any[];
          const newHasFrequency = parsedData.length > 0 && results.meta.fields.includes('Collection_Frequency');
          const uniqueContainers = Array.from(new Set(parsedData.map(row => row.Container_Type).filter(Boolean)));
          
          const currentSettings = watch('containerSettings') || {};
          const newContainerSettings = JSON.parse(JSON.stringify(currentSettings));
          uniqueContainers.forEach(type => {
            if (!newContainerSettings[type]) {
              const parsedVolume = parseInt(type, 10);
              newContainerSettings[type] = {
                manipulationTime: 45, volume: isNaN(parsedVolume) ? 0 : parsedVolume, weight: 0,
                manipulationTimeByVehicle: { 'Rear Loader': 45, 'Side Loader': 45 },
              };
            }
          });

          resolve({ data: parsedData, hasFrequency: newHasFrequency, containerSettings: newContainerSettings });
        },
        error: (error) => {
          clearInterval(progressInterval);
          reject(new Error(error.message));
        },
      });
    });
  };

  const simulateGeocoding = (parsedData: any[]): Promise<void> => {
    return new Promise((resolve) => {
      setStatus('geocoding');
      setProgress(0);
      const totalRows = parsedData.length;
      setProcessingMessage(`0 / ${totalRows} addresses geocoded...`);

      let processedRows = 0;
      const geocodingInterval = setInterval(() => {
        processedRows += Math.floor(Math.random() * (totalRows / 10)); // Process in random chunks
        if (processedRows > totalRows) processedRows = totalRows;

        const newProgress = Math.round((processedRows / totalRows) * 100);
        setProgress(newProgress);
        setProcessingMessage(`${processedRows} / ${totalRows} addresses geocoded...`);
        
        if (processedRows === totalRows) {
          clearInterval(geocodingInterval);
          setProcessingMessage(`Geocoding complete!`);
          setTimeout(resolve, 300); // Short delay for user to see "complete" message
        }
      }, 200);
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setProgress(0);
    
    setValue('uploadedFile', { file, name: file.name, size: file.size, type: file.type, status: 'uploading' });

    try {
      const { data, hasFrequency, containerSettings } = await parseAndProcessFile(file);
      await simulateGeocoding(data);

      // Finalize: Set all form values
      setValue('csvData', data, { shouldDirty: true });
      setValue('hasFrequency', hasFrequency, { shouldDirty: true });
      setValue('containerSettings', containerSettings, { shouldDirty: true });
      setValue('uploadedFile', { name: file.name, size: file.size, type: file.type, status: 'success', rowCount: data.length });
      
      setStatus('success');

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during processing.');
      setStatus('error');
      setValue('uploadedFile', { name: file.name, size: file.size, type: file.type, status: 'error', error: err.message });
    }
  }, [setValue, watch]);


  const handleRemoveFile = () => {
    setValue('uploadedFile', undefined, { shouldDirty: true });
    setValue('csvData', [], { shouldDirty: true });
    setValue('hasFrequency', false, { shouldDirty: true });
    setValue('containerSettings', {}, { shouldDirty: true });
    setValue('selectedTours', [], { shouldDirty: true });
  };
  
  // --- Effect for setting material density ---
  useEffect(() => {
    if (selectedMaterial && selectedMaterial !== 'other' && selectedMaterial !== '') {
      const density = defaultDensities[selectedMaterial];
      if (density > 0) {
        const currentSettings = watch('containerSettings') || {};
        const newSettings = JSON.parse(JSON.stringify(currentSettings));
        Object.keys(newSettings).forEach(key => {
          if (newSettings[key]) {
            newSettings[key].weight = (newSettings[key].volume || 0) * density;
          }
        });
        setValue('containerSettings', newSettings, { shouldDirty: true });
      }
    }
  }, [selectedMaterial, setValue, watch]);

  const isSettingsEnabled = status === 'success' && !!selectedMaterial && selectedMaterial !== '';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Upload Data</label>
          <button type="button" onClick={() => { /* ... download logic ... */ }} className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700">
            <Download className="w-3 h-3 mr-1" /> Download Template
          </button>
        </div>
        
        {status === 'success' ? (
           <FileDisplay uploadedFile={watch('uploadedFile')!} onRemove={handleRemoveFile} />
        ) : (
          <Uploader
            status={status}
            progress={progress}
            message={processingMessage}
            error={error}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            onFileUpload={handleFileUpload}
          />
        )}
      </div>

      <div>
        <label htmlFor="material-select" className="block text-sm font-medium text-gray-700 mb-2">Select Material</label>
        {/* ... Controller for selectedMaterial (unchanged) ... */}
        <Controller name="selectedMaterial" control={control} rules={{ required: "Material selection is required."}}
          render={({ field, fieldState }) => (
            <>
              <select {...field} id="material-select" className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}>
                {materialOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
              {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
            </>
          )}
        />
        {selectedMaterial === 'other' && (
          <div className="mt-2">
            <label htmlFor="custom-material-name" className="block text-sm font-medium text-gray-700 mb-2">Custom Material Name</label>
            <Controller name="customMaterialName" control={control} rules={{ required: 'Custom name is required when "Other" is selected.' }}
              render={({ field, fieldState }) => (
                <>
                  <input {...field} id="custom-material-name" type="text" className={`block w-full px-3 py-2 border rounded-md ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter custom material name" />
                  {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                </>
              )}
            />
          </div>
        )}
      </div>

      {hasFrequency && <ToursSection />}
      <AdvancedSettings isEnabled={isSettingsEnabled} />
    </div>
  );
};


// --- Sub-components (some are modified or new) ---

const Uploader: React.FC<{
  status: UploadStatus; progress: number; message: string; error: string | null; isDragOver: boolean;
  setIsDragOver: (isOver: boolean) => void; onFileUpload: (file: File) => void;
}> = ({ status, progress, message, error, isDragOver, setIsDragOver, onFileUpload }) => {

  const handleDragOverEvent = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeaveEvent = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const csvFile = Array.from(e.dataTransfer.files).find(f => f.type === 'text/csv' || f.name.endsWith('.csv'));
    if (csvFile) onFileUpload(csvFile);
  };
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = '';
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="text-center">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Drop your CSV file here, or{' '}
                <label htmlFor="file-upload" className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                  browse<input id="file-upload" type="file" accept=".csv" onChange={handleFileInputChange} className="sr-only"/>
                </label>
              </p>
              <p className="text-xs text-gray-500">Supports CSV files up to 10MB</p>
            </div>
          </div>
        );
      case 'uploading':
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-gray-200" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-blue-600" strokeWidth="4" strokeDasharray={`${progress}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-semibold text-blue-700">{`${progress}%`}</div>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-700">{message}</p>
            <p className="text-xs text-gray-500">First step: Uploading Data</p>
          </div>
        );
      case 'geocoding':
        return (
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-700">Processing addresses...</p>
              <p className="text-sm font-semibold text-blue-700">{`${progress}%`}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">{message}</p>
            <p className="mt-1 text-xs text-gray-500 text-center">Second step: Geocoding</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-sm font-semibold text-red-700">Upload Failed</p>
            <p className="text-xs text-gray-600 mt-1 mb-4">{error}</p>
            <label htmlFor="file-upload-retry" className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
              Try a different file
              <input id="file-upload-retry" type="file" accept=".csv" onChange={handleFileInputChange} className="sr-only"/>
            </label>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div onDragOver={handleDragOverEvent} onDragLeave={handleDragLeaveEvent} onDrop={handleDropEvent} 
      className={`border-2 border-dashed rounded-lg p-8 transition-colors ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
      {renderContent()}
    </div>
  );
};


const FileDisplay: React.FC<{ uploadedFile: UploadedFile; onRemove: () => void }> = ({ uploadedFile, onRemove }) => {
    const formatFileSize = (bytes: number = 0) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="border border-gray-200 rounded-lg">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{uploadedFile.name}</div>
                <div className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</div>
              </div>
            </div>
            <button type="button" onClick={onRemove} className="p-1 text-gray-400 hover:text-red-600" aria-label="Remove file"><Trash2 className="w-4 h-4" /></button>
          </div>
           <div className="border-t border-gray-200 p-3 bg-emerald-50 text-center">
             <p className="text-sm text-emerald-800">File processed successfully! Found {uploadedFile.rowCount} rows.</p>
           </div>
        </div>
    );
};



const ToursSection: React.FC = () => {
    const [openTours, setOpenTours] = useState(true);
    const { watch, setValue } = useFormContext<ProjectData>();
    const { csvData = [], containerSettings, fillPercent, selectedTours, selectedMaterial } = watch();

    const toursData = useMemo(() => {
        return (csvData || []).reduce((acc, row) => {
            const freq = row.Collection_Frequency;
            if (freq) {
                if (!acc[freq]) acc[freq] = { addresses: 0, bins: 0, totalWeight: 0, totalVolume: 0 };
                acc[freq].addresses++;
                acc[freq].bins++;
                const ct = row.Container_Type;
                if (containerSettings?.[ct]) {
                    acc[freq].totalWeight += containerSettings[ct].weight || 0;
                    acc[freq].totalVolume += containerSettings[ct].volume || 0;
                }
            }
            return acc;
        }, {} as Record<string, { addresses: number; bins: number; totalWeight: number; totalVolume: number }>);
    }, [csvData, containerSettings]);

    useEffect(() => {
        const allFrequencies = Object.keys(toursData);
        if ((!selectedTours || selectedTours.length === 0) && allFrequencies.length > 0) {
            setValue('selectedTours', allFrequencies, { shouldDirty: true });
        }
    }, [toursData, selectedTours, setValue]);

    const toggleTour = (frequency: string) => {
        const currentSelection = watch('selectedTours') || [];
        const newSelection = currentSelection.includes(frequency)
            ? currentSelection.filter((f: string) => f !== frequency)
            : [...currentSelection, frequency];
        setValue('selectedTours', newSelection, { shouldDirty: true });
    };

    const currentSelectedTours = watch('selectedTours') || [];

    if (Object.keys(toursData).length === 0) return null;

    return (
        <div className="border border-gray-200 rounded-md">
            <button type="button" onClick={() => setOpenTours(!openTours)} className="flex items-center justify-between w-full p-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <span>Tours ({Object.keys(toursData).length})</span>
                {openTours ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {openTours && (
                <div className="p-4 border-t border-gray-200">
                    <div className="space-y-2">
                        {Object.entries(toursData).map(([frequency, data]) => {
                            let weightStr = '-';
                            let volumeStr = '-';
                            if (selectedMaterial) {
                                const weight = Math.round((data.totalWeight || 0) * (fillPercent || 85) / 100);
                                const volume = Math.round((data.totalVolume || 0) * (fillPercent || 85) / 100);
                                weightStr = weight >= 1000 ? `${(weight / 1000).toFixed(1)} t` : `${weight} kg`;
                                volumeStr = volume >= 1000 ? `${(volume / 1000).toFixed(1)} m³` : `${volume} L`;
                            }
                            const showCheckbox = Object.keys(toursData).length > 1;
                            return (
                                <div key={frequency} className="flex items-center justify-between mb-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        {showCheckbox && <input type="checkbox" checked={currentSelectedTours.includes(frequency)} onChange={() => toggleTour(frequency)} className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />}
                                        <span className="text-sm font-medium text-gray-900">{frequency}</span>
                                    </label>
                                    <div className="flex items-baseline justify-end text-xs text-gray-500" style={{ minWidth: '320px' }}>
                                        <div className="w-28 text-right"><span>{data.addresses} addresses</span></div>
                                        <div className="w-20 text-right"><span>{data.bins} bins</span></div>
                                        <div className="flex w-36 items-baseline"><span className="flex-1 text-right pr-1">{weightStr}</span><span>/</span><span className="flex-1 text-left pl-1">{volumeStr}</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const AdvancedSettings: React.FC<{ isEnabled: boolean }> = ({ isEnabled }) => {
    const [openHandling, setOpenHandling] = useState(false);
    const [openAmounts, setOpenAmounts] = useState(false);
    const { watch, register, control } = useFormContext<ProjectData>();
    const { csvData = [], containerSettings = {}, generalSetupTime, fillPercent, selectedTours, hasFrequency } = watch();

    const filteredCsvData = useMemo(() => {
        if (hasFrequency && selectedTours?.length > 0) {
            return csvData.filter(row => selectedTours.includes(row.Collection_Frequency));
        }
        return csvData;
    }, [csvData, selectedTours, hasFrequency]);

    const uploadedContainerTypes: string[] = Array.from(
      new Set((csvData || []).map(row => row.Container_Type).filter(Boolean))
    ).sort();

    const avgManipulation = uploadedContainerTypes.reduce((sum, key) => sum + (containerSettings[key]?.manipulationTime || 45), 0) / (uploadedContainerTypes.length || 1);
    const avgTotalTimeSeconds = (generalSetupTime || 900) + avgManipulation;
    const totalHandlingDisplay = isEnabled && avgTotalTimeSeconds > 0 ? `${Math.floor(avgTotalTimeSeconds / 60)}m ${Math.round(avgTotalTimeSeconds % 60)}s` : '-';

    const { totalWeight, totalVolume } = useMemo(() => {
        return filteredCsvData.reduce((acc, row) => {
            const ct = row.Container_Type;
            if (containerSettings[ct]) {
                acc.totalWeight += containerSettings[ct].weight || 0;
                acc.totalVolume += containerSettings[ct].volume || 0;
            }
            return acc;
        }, { totalWeight: 0, totalVolume: 0 });
    }, [filteredCsvData, containerSettings]);

    const totalEffectiveWeight = Math.round(totalWeight * (fillPercent || 85) / 100);
    const totalEffectiveVolume = Math.round(totalVolume * (fillPercent || 85) / 100);
    const weightStr = totalEffectiveWeight >= 1000 ? `${(totalEffectiveWeight / 1000).toFixed(1)} t` : `${totalEffectiveWeight} kg`;
    const volumeStr = totalEffectiveVolume >= 1000 ? `${(totalEffectiveVolume / 1000).toFixed(1)} m³` : `${totalEffectiveVolume} L`;
    const totalAmountsDisplay = isEnabled ? `${weightStr} / ${volumeStr}` : '- / -';

    const useDifferentTimes = watch('useDifferentTimes');

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2 pt-4">
                <div className="text-sm font-medium text-gray-700">Advanced Settings</div>
                {!isEnabled && <div className="text-xs text-gray-500">(Upload data and select material to enable)</div>}
            </div>

            <div className="border border-gray-200 rounded-md">
                <button type="button" onClick={() => setOpenHandling(!openHandling)} disabled={!isEnabled} className={`flex items-center justify-between w-full p-3 text-sm font-medium text-left text-gray-700 ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <span>Handling</span>
                    <div className="flex items-center space-x-2"><span className="text-xs text-gray-500">{totalHandlingDisplay}</span>{openHandling ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </button>
                {openHandling && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                       <p className="text-xs text-gray-500 flex items-center"><Info className="w-3 h-3 mr-1 flex-shrink-0" />Time per job = General setup time + Manipulation time (per container type)</p>
                        {hasFrequency && (
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" {...register('useDifferentTimes')} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <span className="text-sm text-gray-700">Use different times for different vehicle types</span>
                            </label>
                        )}
                       <div className="flex justify-between items-center">
                         <label htmlFor="generalSetupTime" className="text-sm text-gray-600">General Setup Time (s)</label>
                         <input id="generalSetupTime" type="number" {...register('generalSetupTime', { valueAsNumber: true, value: 900 })} className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                       </div>
                       <div className="space-y-2 pt-2">
                         <div className="flex justify-between items-baseline mb-2">
                           <label className="block text-sm font-medium text-gray-700">Manipulation Time (s)</label>
                           {useDifferentTimes && (<div className="flex gap-4"><span className="w-20 text-center text-xs font-medium text-gray-700">Rear Loader</span><span className="w-20 text-center text-xs font-medium text-gray-700">Side Loader</span></div>)}
                         </div>
                         {uploadedContainerTypes.length > 0 ? uploadedContainerTypes.map(key => (
                           <div key={key} className="flex items-center justify-between">
                             <span className="text-sm font-medium text-gray-900">{key}</span>
                             {useDifferentTimes ? (
                               <div className="flex gap-4">
                                 <Controller name={`containerSettings.${key}.manipulationTimeByVehicle.Rear Loader`} control={control} defaultValue={45} render={({ field }) => <input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" />} />
                                 <Controller name={`containerSettings.${key}.manipulationTimeByVehicle.Side Loader`} control={control} defaultValue={45} render={({ field }) => <input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" />} />
                               </div>
                             ) : (
                                <Controller name={`containerSettings.${key}.manipulationTime`} control={control} defaultValue={45} render={({ field }) => <input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" />} />
                             )}
                           </div>
                         )) : <p className="text-xs text-gray-500 pl-4">No container types found in CSV file.</p>}
                       </div>
                    </div>
                )}
            </div>

            <div className="border border-gray-200 rounded-md">
                <button type="button" onClick={() => setOpenAmounts(!openAmounts)} disabled={!isEnabled} className={`flex items-center justify-between w-full p-3 text-sm font-medium text-left text-gray-700 ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    <span>Amounts</span>
                    <div className="flex items-center space-x-2"><span className="text-xs text-gray-500">{totalAmountsDisplay}</span>{openAmounts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </button>
                {openAmounts && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                       <p className="text-xs text-gray-500 flex items-center"><Info className="w-3 h-3 mr-1 flex-shrink-0" />Effective weight = base weight × (filling % / 100)</p>
                       <div className="flex justify-between items-center">
                         <label htmlFor="fillPercent" className="text-sm text-gray-600">Average Filling (%)</label>
                         <input id="fillPercent" type="number" {...register('fillPercent', { valueAsNumber: true, min: 1, max: 100, value: 85 })} className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                       </div>
                       <div className="space-y-2 pt-2">
                         <label className="block text-sm font-medium text-gray-700">Base Values per Container</label>
                         {uploadedContainerTypes.length > 0 ? uploadedContainerTypes.map(key => {
                            const weight = watch(`containerSettings.${key}.weight`) || 0;
                            const effectiveWeight = Math.round(weight * (fillPercent || 85) / 100);
                           return (
                             <div key={key} className="space-y-2 mb-2 p-2 border border-gray-100 rounded">
                               <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-gray-900">{key}</span>
                               </div>
                               <div className="flex items-center justify-between pl-4">
                                <label className="text-sm text-gray-600">Volume (L)</label>
                                <Controller name={`containerSettings.${key}.volume`} control={control} defaultValue={0} render={({ field }) => <input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" />} />
                               </div>
                               <div className="flex items-center justify-between pl-4">
                                 <label className="text-sm text-gray-600">Base Weight (kg)</label>
                                 <Controller name={`containerSettings.${key}.weight`} control={control} defaultValue={0} render={({ field }) => <input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" />} />
                               </div>
                               <div className="text-xs text-gray-500 text-right">Effective: {effectiveWeight} kg</div>
                             </div>
                           );
                         }) : <p className="text-xs text-gray-500 pl-4">No container types found in CSV file.</p>}
                       </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Step1_Jobs_CSV;