import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { ProjectData } from '../../../../lib/graphql/api';
import type { Location } from '../../../../lib/graphql/api';
import * as api from '../../../../lib/graphql/api';
import { Info, MapPin, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

const Step2_Fleet: React.FC = () => {
  // The useDebouncedSave hook is no longer needed here.
  // The parent Wizard component handles all data synchronization.
  return (
    <div className="space-y-4">
      <VehicleSection />
      <LimitsSection />
      <BreakSection />
      <DepotSection />
      <RecyclerSection />
    </div>
  );
};

const VehicleSection: React.FC = () => {
  const { control, watch, setValue, register } = useFormContext<ProjectData>();
  const vehicleType = watch('vehicleType');
  const maxWorkingTime = watch('maxWorkingTime');

  const formatTime = (minutes: number): string => {
    if (isNaN(minutes)) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const parseTime = (input: string): number => {
    const cleaned = input.replace(/[^0-9:.]/g, '');
    if (cleaned.includes(':')) {
      const [h, m] = cleaned.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 60);
  };
  
  const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const minutes = parseTime(e.target.value);
    setValue('maxWorkingTime', minutes, { shouldValidate: true, shouldDirty: true });
    e.target.value = formatTime(minutes);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-base font-semibold mb-3">Vehicle</h3>
      <div className="space-y-3">
        <Controller name="vehicleType" control={control} render={({ field }) => (
          <div className="flex gap-3">
            <VehicleTypeButton type="rearloader" current={field.value} onChange={field.onChange} />
            <VehicleTypeButton type="sideloader" current={field.value} onChange={field.onChange} />
          </div>
        )}/>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="maxVehicles" className="block text-xs mb-1">Max Number</label>
            <input {...register('maxVehicles', { valueAsNumber: true, required: true, min: 1, max: 10 })} id="maxVehicles" type="number" min="1" max="10" className="w-full p-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div className="flex-1">
            <label htmlFor="maxWorkingTime" className="block text-xs mb-1">Max Working Time</label>
            <input id="maxWorkingTime" type="text" defaultValue={formatTime(maxWorkingTime)} onBlur={handleTimeBlur} placeholder="hh:mm" className="w-full p-2 border border-gray-300 rounded-md text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

const VehicleTypeButton: React.FC<{type: 'rearloader' | 'sideloader', current: string, onChange: (v: string) => void}> = ({type, current, onChange}) => {
    const isSelected = type === current;
    const text = type === 'rearloader' ? 'Rearloader' : 'Sideloader';
    const infoText = type === 'rearloader' ? 'Can collect on both sides of the street' : 'Collects only in the driving direction';
    return (
        <button type="button" onClick={() => onChange(type)} className={`flex-1 p-3 border rounded-md text-sm text-left relative cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="font-medium">{text}</div>
            <div className="absolute top-2 right-2 group"><Info className="w-4 h-4 text-gray-400" />
                <div className="absolute right-0 top-full mt-1 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{infoText}</div>
            </div>
        </button>
    )
}

const LimitsSection: React.FC = () => {
  const { control, watch } = useFormContext<ProjectData>();
  // THE FIX IS HERE: Add a fallback to an empty object.
  const { type, weight, volume, containers } = watch('limitSettings') || {};
  
  const isComplete = (type === 'weight_volume' && (weight || volume)) || (type === 'containers' && containers);

  const equivalentText = useMemo(() => {
    if (type === 'weight_volume') {
      const eqWeight = weight ? Math.round(weight / 20) : Infinity;
      const eqVolume = volume ? Math.round(volume / 120) : Infinity;
      const smaller = Math.min(eqWeight, eqVolume);
      return smaller < Infinity ? `Approx. ${smaller.toLocaleString()} (120L) containers` : '';
    }
    return '';
  }, [type, weight, volume]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
      <h3 className="text-base font-semibold mb-3">Limits</h3>
      <Controller name="limitSettings" control={control}
        render={({ field }) => (
          <div className="space-y-3">
            <div className="flex gap-3">
              <button type="button" onClick={() => field.onChange({...field.value, type: 'weight_volume'})} className={`flex-1 p-2 border rounded-md text-sm ${type === 'weight_volume' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>Weight/Volume</button>
              <button type="button" onClick={() => field.onChange({...field.value, type: 'containers'})} className={`flex-1 p-2 border rounded-md text-sm ${type === 'containers' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>Containers</button>
            </div>
            {type === 'weight_volume' && (
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-xs mb-1">Weight (kg)</label><input type="number" value={field.value.weight || ''} onChange={(e) => field.onChange({...field.value, weight: parseInt(e.target.value) || undefined})} className="w-full p-2 border rounded-md text-sm" /></div>
                <div className="flex-1"><label className="block text-xs mb-1">Volume (L)</label><input type="number" value={field.value.volume || ''} onChange={(e) => field.onChange({...field.value, volume: parseInt(e.target.value) || undefined})} className="w-full p-2 border rounded-md text-sm" /></div>
              </div>
            )}
            {type === 'containers' && (
              <div><label className="block text-xs mb-1">Containers</label><input type="number" value={field.value.containers || ''} onChange={(e) => field.onChange({...field.value, containers: parseInt(e.target.value) || undefined})} className="w-full p-2 border rounded-md text-sm" /></div>
            )}
            {equivalentText && <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-blue-800 text-xs">{equivalentText}</div>}
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={field.value.strict} onChange={(e) => field.onChange({...field.value, strict: e.target.checked})} />Strict</label>
          </div>
        )}
      />
      {isComplete ? <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-green-500" /> : <AlertCircle className="absolute top-4 right-4 w-5 h-5 text-red-500" />}
    </div>
  );
};

const BreakSection: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { control, register } = useFormContext<ProjectData>();
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-base font-semibold"><span>Break</span>{isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button>
            {isOpen && (
                <div className="mt-3 flex gap-3">
                    <div className="flex-1"><label className="block text-xs mb-1">Duration (min)</label><input {...register('breakDuration', {valueAsNumber: true})} type="number" className="w-full p-2 border rounded-md text-sm" /></div>
                    <div className="flex-1"><label className="block text-xs mb-1">After (hours)</label><Controller name="breakAfter" control={control} render={({field}) => <input type="number" step="0.5" className="w-full p-2 border rounded-md text-sm" onChange={e => field.onChange(parseFloat(e.target.value)*60)} value={(field.value || 0)/60} />}/></div>
                </div>
            )}
        </div>
    )
}

const DepotSection: React.FC = () => {
  const { control, watch } = useFormContext<ProjectData>();
  const { startDepot, endDepot, differentEndLocation, lastUsedDepots } = watch();
  const isComplete = startDepot && (differentEndLocation ? endDepot : true);
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
      <h3 className="text-base font-semibold mb-3">Depot</h3>
      <div className="space-y-3">
        <LocationInput name="startDepot" placeholder="Start Depot" lastUsedItems={lastUsedDepots} />
        <Controller name="differentEndLocation" control={control} render={({ field }) => (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...field} checked={field.value} />Different End</label>
        )}/>
        {differentEndLocation && <LocationInput name="endDepot" placeholder="End Depot" lastUsedItems={lastUsedDepots}/>}
      </div>
      {isComplete ? <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-green-500" /> : <AlertCircle className="absolute top-4 right-4 w-5 h-5 text-red-500" />}
    </div>
  );
};

const RecyclerSection: React.FC = () => {
    const { watch, control, register } = useFormContext<ProjectData>();
    const { recycler, lastUsedRecyclers } = watch();
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
            <h3 className="text-base font-semibold mb-3">Recycler</h3>
            <div className="space-y-3">
                <LocationInput name="recycler" placeholder="Recycler Location" lastUsedItems={lastUsedRecyclers}/>
                <div><label className="block text-sm mb-1">Manipulation Time (min)</label><input {...register('recyclerTime', {valueAsNumber: true})} type="number" className="w-full p-2 border rounded-md text-sm" /></div>
            </div>
            {recycler ? <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-green-500" /> : <AlertCircle className="absolute top-4 right-4 w-5 h-5 text-red-500" />}
        </div>
    )
}

const LocationInput: React.FC<{name: 'startDepot'|'endDepot'|'recycler', placeholder: string, lastUsedItems?: string[]}> = ({name, placeholder, lastUsedItems}) => {
    const { control } = useFormContext<ProjectData>();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useCallback(debounce(async (query: string) => {
        if (query.length < 2) { setResults([]); return; }
        setIsLoading(true);
        const searchResults = await api.searchLocations(query);
        setResults(searchResults);
        setIsLoading(false);
    }, 300), []);

    return (
        <Controller name={name} control={control} rules={{ required: `${placeholder} is required.` }}
            render={({ field, fieldState }) => (
                <div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input {...field} type="text" placeholder={placeholder} 
                            onChange={e => { field.onChange(e.target.value); setSearchTerm(e.target.value); debouncedSearch(e.target.value); }}
                            className={`w-full pl-10 p-2 border rounded-md text-sm ${fieldState.error ? 'border-red-500' : 'border-gray-300'}`} />
                        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                    </div>
                    {results.length > 0 && searchTerm && (
                        <ul className="absolute z-10 w-[530px] bg-white border rounded-md mt-1 max-h-40 overflow-auto text-sm shadow-lg">
                            {results.map(loc => (
                                <li key={loc.id} onMouseDown={() => { field.onChange(loc.name); setSearchTerm(''); setResults([]); }} className="p-2 hover:bg-gray-100 cursor-pointer">{loc.name} <span className="text-gray-500 text-xs">- {loc.address}</span></li>
                            ))}
                        </ul>
                    )}
                    {fieldState.error && <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>}
                    {lastUsedItems && <div className="flex flex-wrap gap-2 mt-2">{lastUsedItems.map((item, i) => <button type="button" key={i} onClick={() => field.onChange(item)} className="px-2 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200">{item}</button>)}</div>}
                </div>
            )}
        />
    )
}

export default Step2_Fleet;