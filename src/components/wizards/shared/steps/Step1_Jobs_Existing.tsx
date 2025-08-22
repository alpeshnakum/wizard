import React, { useState, useEffect, useCallback } from 'react';
import { useFormContext, Controller, useController } from 'react-hook-form';
import { ProjectData, GeographicArea } from '../../../../lib/graphql/api';
import * as api from '../../../../lib/graphql/api';
import { Database, Search, MapPin, Loader2, CheckCircle, Package } from 'lucide-react';
import debounce from 'lodash.debounce';

// --- Types ---

interface AvailableMaterial {
  id: string;
  label: string;
  addresses: number;
  containers: number;
}

// --- Main Step Component ---

const Step1_Jobs_Existing: React.FC = () => {
  // Consume form context from the Wizard parent
  const methods = useFormContext<ProjectData>();

  // The useDebouncedSave hook is no longer needed here.
  // The parent Wizard component handles all data synchronization.

  return (
    // No FormProvider here
    <div className="space-y-6">
      <GeographicAreaSelector />
      <MaterialSelector />
    </div>
  );
};

// --- Sub-components ---

const GeographicAreaSelector: React.FC = () => {
    const { control, watch, formState: { errors } } = useFormContext<ProjectData>();
    const { field } = useController({ name: 'geographicArea', control, rules: { required: 'You must select a geographic area.'} });
    const selectedTown = watch('geographicArea');

    const [searchTerm, setSearchTerm] = useState(selectedTown?.name || '');
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
            <h3 className="text-base font-semibold mb-3">Select Town/City</h3>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {setSearchTerm(e.target.value); debouncedSearch(e.target.value);}}
                  className={`block w-full pl-9 pr-12 py-3 border rounded-lg shadow-sm ${errors.geographicArea ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Search for towns with available data..."
                  aria-invalid={!!errors.geographicArea}
                />
                {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />}
            </div>
            {errors.geographicArea && <p className="mt-1 text-xs text-red-600">{errors.geographicArea.message?.toString()}</p>}

            {results.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto shadow-lg z-10 bg-white">
                    {results.map(area => (
                        <div key={area.id} onClick={() => handleSelect(area)} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <MapPin className="w-4 h-4 text-gray-500 mr-3" />
                            <span className="text-sm font-medium">{area.name}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {selectedTown && !isLoading && results.length === 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <div>
                            <div className="text-sm font-medium text-blue-900">{selectedTown.name}</div>
                            <div className="text-xs text-blue-700">Area selected. Please choose a material below.</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MaterialSelector: React.FC = () => {
    const { watch, control, setValue } = useFormContext<ProjectData>();
    const selectedTown = watch('geographicArea');
    const selectedMaterial = watch('selectedMaterial');

    const [availableMaterials, setAvailableMaterials] = useState<AvailableMaterial[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedTown?.id) {
            setIsLoading(true);
            setTimeout(() => {
                const materials: AvailableMaterial[] = (selectedTown.districts || []).map((d: any, i: number) => ({
                    id: `mat-${d.id}`,
                    label: `${d.name.split(',')[0]} Waste`,
                    addresses: 15000 + (i * 5000),
                    containers: 30000 + (i * 10000),
                }));
                materials.push({ id: 'other', label: 'Other', addresses: 0, containers: 0 });
                setAvailableMaterials(materials);
                setIsLoading(false);
            }, 800);
        } else {
            setAvailableMaterials([]);
        }
        setValue('selectedMaterial', '');
    }, [selectedTown, setValue]);

    if (!selectedTown) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Town or City</h3>
                <p className="text-sm text-gray-600">Available materials will be shown here once an area is selected.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Loading available materials...</span>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold mb-3">Available Materials</h3>
            <Controller name="selectedMaterial" control={control} rules={{ required: "You must select a material."}}
                render={({ field, fieldState }) => (
                    <div className="space-y-3">
                        {availableMaterials.map(mat => (
                            <label key={mat.id} className={`flex items-start space-x-3 p-3 border rounded-md cursor-pointer transition-colors ${field.value === mat.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input type="radio" {...field} value={mat.id} checked={field.value === mat.id} className="mt-1 h-4 w-4 text-blue-600" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{mat.label}</div>
                                    {mat.id !== 'other' && <div className="text-xs text-gray-500">{mat.addresses.toLocaleString()} addresses • {mat.containers.toLocaleString()} containers</div>}
                                </div>
                            </label>
                        ))}
                        {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                    </div>
                )}
            />
            {selectedMaterial === 'other' && (
                <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Material Name</label>
                    <Controller name="customMaterialName" control={control} rules={{ required: 'Custom name is required.' }} render={({ field, fieldState }) => (
                        <>
                            <input {...field} type="text" placeholder="Enter custom name" className={`block w-full px-3 py-2 border rounded-md ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`} />
                            {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                        </>
                    )}/>
                </div>
            )}
        </div>
    );
};

export default Step1_Jobs_Existing;