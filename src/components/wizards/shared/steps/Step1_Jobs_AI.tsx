import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFormContext, Controller, useController } from 'react-hook-form';
import { useWizardStore } from '../../../../store/wizardStore';
import { useDebouncedSave } from '../../../../hooks/useDebouncedSave';
import { ProjectData } from '../../../../lib/graphql/api';
import * as api from '../../../../lib/graphql/api';
import type { GeographicArea } from '../../../../lib/graphql/api';
import { Sparkles, Info, Search, X, MapPin, Loader2, Plus, GripVertical } from 'lucide-react';
import debounce from 'lodash.debounce';

const defaultValues: Partial<ProjectData> = {
  selectedMaterial: '',
  customMaterialName: '',
  geographicArea: null,
  binDensity: 'medium',
  containerTypes: ['120L', '360L', '1100L'],
  containerDistribution: { '120L': 33.33, '360L': 33.33, '1100L': 33.34 },
};

const materialOptions = [
  { id: '', label: 'Select Material' }, { id: 'residential', label: 'Residential Waste' },
  { id: 'biogenic', label: 'Biogenic Waste' }, { id: 'recyclable', label: 'Recyclable Materials' },
  { id: 'commercial', label: 'Commercial Waste' }, { id: 'other', label: 'Other' },
];

const containerOptions = [
  { id: '120L', label: '120L Bins', description: 'Small residential bins' },
  { id: '360L', label: '360L Bins', description: 'Medium residential bins' },
  { id: '1100L', label: '1100L Containers', description: 'Large commercial containers' },
];

const Step1_Jobs_AI: React.FC = () => {
  // We don't need to initialize the form here anymore.
  // We just get the context.
  const methods = useFormContext<ProjectData>();

  // The debounced save hook will work automatically with the context.
  //useDebouncedSave<ProjectData>();

  return (
    // No FormProvider wrapper needed
    <div className="space-y-6">
      <AIInfoHeader />
      <GeographicAreaSection />
      <MaterialSection />
      <BinDensitySection />
      <ContainerTypeSection />
    </div>
  );
};

// --- Sub-components ---

const AIInfoHeader: React.FC = () => {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
      <button onClick={() => setShow(false)} className="absolute top-2 right-2 text-amber-600 hover:text-amber-800"><X size={18} /></button>
      <div className="flex items-start space-x-4">
        <Sparkles className="w-8 h-8 text-amber-600 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-amber-900 mb-2">AI Data Generation</h3>
          <p className="text-sm text-amber-800">Generate realistic collection data by configuring the parameters below to match your operational needs.</p>
        </div>
      </div>
    </div>
  );
};

const GeographicAreaSection: React.FC = () => {
    const { control } = useFormContext<ProjectData>();
    const { field } = useController({ name: 'geographicArea', control });
    
    const [searchTerm, setSearchTerm] = useState(field.value?.name || '');
    const [results, setResults] = useState<GeographicArea[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useCallback(debounce(async (query: string) => {
        if (query.length < 2) { setResults([]); return; }
        setIsLoading(true);
        const searchResults = await api.searchGeographicArea(query);
        setResults(searchResults);
        setIsLoading(false);
    }, 400), []);

    const handleSelect = (area: GeographicArea) => {
        field.onChange(area);
        setSearchTerm(area.name);
        setResults([]);
    };
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-3">Geographic Area (Optional)</h3>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                <input type="text" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); debouncedSearch(e.target.value);}} className="block w-full pl-9 pr-12 py-3 border border-gray-300 rounded-lg" placeholder="Search city or district (e.g., Graz)" />
                {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />}
            </div>
            {results.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">{results.map(area => <div key={area.id} onClick={() => handleSelect(area)} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"><MapPin className="w-4 h-4 text-gray-500 mr-3" /><span className="text-sm font-medium">{area.name}</span></div>)}</div>
            )}
        </div>
    );
};

const MaterialSection: React.FC = () => {
    const { control, watch } = useFormContext<ProjectData>();
    const selectedMaterial = watch('selectedMaterial');
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-3">Material Type</h3>
            <Controller name="selectedMaterial" control={control} rules={{ required: "Material is required." }} render={({ field, fieldState }) => (
                <>
                    <select {...field} className={`block w-full px-3 py-2 border rounded-md ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`}>
                        {materialOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                    {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                </>
            )}/>
            {selectedMaterial === 'other' && (
                <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Name</label>
                    <Controller name="customMaterialName" control={control} rules={{ required: 'Custom name is required.' }} render={({ field, fieldState }) => (
                        <>
                            <input {...field} type="text" placeholder="Enter custom material name" className={`block w-full px-3 py-2 border rounded-md ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`} />
                            {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                        </>
                    )}/>
                </div>
            )}
        </div>
    );
};

const BinDensitySection: React.FC = () => {
    const { control } = useFormContext<ProjectData>();
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-3">Bin Density</h3>
            <p className="text-sm text-gray-600 mb-4">Average containers generated per household/address.</p>
            <Controller name="binDensity" control={control} render={({ field }) => (
                <div className="flex space-x-2">
                    <button type="button" onClick={() => field.onChange('low')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${field.value === 'low' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Low (1)</button>
                    <button type="button" onClick={() => field.onChange('medium')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${field.value === 'medium' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Medium (2-3)</button>
                    <button type="button" onClick={() => field.onChange('high')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${field.value === 'high' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>High (4-5)</button>
                </div>
            )}/>
        </div>
    );
};

const ContainerTypeSection: React.FC = () => {
    const { setValue, watch } = useFormContext<ProjectData>();
    const containerTypes = watch('containerTypes');

    const evenlyDistribute = (types: string[]) => {
        const newDist: Record<string, number> = {};
        containerOptions.forEach(opt => newDist[opt.id] = 0);
        if (types.length > 0) {
            const base = 100 / types.length; let total = 0;
            types.forEach((type, index) => {
                const value = parseFloat(base.toFixed(2));
                newDist[type] = value;
                total += value;
            });
            if (types.length > 0) {
                const lastType = types[types.length - 1];
                newDist[lastType] = parseFloat((100 - (total - newDist[lastType])).toFixed(2));
            }
        }
        setValue('containerDistribution', newDist, { shouldDirty: true });
    };

    const handleToggle = (typeId: string) => {
        const newTypes = containerTypes.includes(typeId) ? containerTypes.filter(t => t !== typeId) : [...containerTypes, typeId];
        newTypes.sort((a, b) => parseInt(a) - parseInt(b));
        setValue('containerTypes', newTypes, { shouldDirty: true });
        evenlyDistribute(newTypes);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-3">Container Types</h3>
            <div className="space-y-3 mb-4">
                {containerOptions.map(opt => (
                    <label key={opt.id} className="flex items-start space-x-3 cursor-pointer">
                        <input type="checkbox" checked={containerTypes.includes(opt.id)} onChange={() => handleToggle(opt.id)} className="mt-1 h-4 w-4 rounded" />
                        <div><div className="text-sm font-medium">{opt.label}</div><div className="text-sm text-gray-500">{opt.description}</div></div>
                    </label>
                ))}
            </div>
            {containerTypes.length > 1 && <DistributionSlider onReset={() => evenlyDistribute(containerTypes)} />}
        </div>
    );
};

const DistributionSlider: React.FC<{onReset: () => void}> = ({ onReset }) => {
    const { control, watch } = useFormContext<ProjectData>();
    const { field } = useController({ name: 'containerDistribution', control });
    const containerTypes = watch('containerTypes');

    const sliderRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef({ isDragging: false, handleIndex: 0, initialDist: {}, clientX: 0, leftBoundary: 0, rightBoundary: 0 });

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        const sliderRect = sliderRef.current!.getBoundingClientRect();
        
        dragInfo.current = {
            isDragging: true, handleIndex: index, initialDist: { ...field.value }, clientX: e.clientX,
            leftBoundary: containerTypes.slice(0, index).reduce((acc, t) => acc + (field.value[t] || 0), 0) / 100 * sliderRect.width,
            rightBoundary: containerTypes.slice(0, index + 2).reduce((acc, t) => acc + (field.value[t] || 0), 0) / 100 * sliderRect.width
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragInfo.current.isDragging) return;
        const { handleIndex, initialDist, leftBoundary, rightBoundary } = dragInfo.current;
        const sliderRect = sliderRef.current!.getBoundingClientRect();
        const newX = Math.max(leftBoundary, Math.min(e.clientX - sliderRect.left, rightBoundary));
        
        const leftType = containerTypes[handleIndex];
        const rightType = containerTypes[handleIndex + 1];
        const combinedPercent = (initialDist[leftType] || 0) + (initialDist[rightType] || 0);

        const leftPct = (newX - leftBoundary) / sliderRect.width * 100;
        
        let newLeftPercent = Math.max(0, Math.min(leftPct, combinedPercent));
        let newRightPercent = combinedPercent - newLeftPercent;
        
        field.onChange({ ...initialDist, [leftType]: newLeftPercent, [rightType]: newRightPercent });
    };

    const handleMouseUp = () => {
        dragInfo.current.isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
    };

    return (
        <div className="pt-6">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">Distribution</span>
                <button type="button" onClick={onReset} className="text-sm text-blue-600 hover:text-blue-700">Reset</button>
            </div>
            <div ref={sliderRef} className="relative h-2 w-full bg-gray-200 rounded-full flex touch-none">
                {containerTypes.map(type => <div key={type} style={{ width: `${field.value[type] || 0}%` }} className="h-full bg-blue-500 first:rounded-l-full last:rounded-r-full transition-all duration-75" />)}
                {containerTypes.slice(0, -1).map((_, index) => {
                    const leftOffset = containerTypes.slice(0, index + 1).reduce((acc, t) => acc + (field.value[t] || 0), 0);
                    return <div key={`handle-${index}`} onMouseDown={e => handleMouseDown(e, index)} style={{ left: `${leftOffset}%` }} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-2 flex items-center justify-center cursor-col-resize z-10"><div className="h-4 w-1 bg-white rounded-full shadow" /></div>
                })}
            </div>
            <div className="flex justify-between mt-2">
                {containerTypes.map(type => (
                    <div key={`label-${type}`} className="text-center text-xs text-gray-600">
                        <div>{type}</div>
                        <div>{`${(field.value[type] || 0).toFixed(1)}%`}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Step1_Jobs_AI;