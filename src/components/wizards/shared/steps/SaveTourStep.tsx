// File: src/components/wizards/shared/steps/SaveTourStep.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFormContext, Controller, useController } from 'react-hook-form';
import { useWizardStore } from '../../../../store/wizardStore';
import * as api from '../../../../lib/graphql/api';
import type { TourSummary, ClusterResult } from '../../../../lib/graphql/api';
import { Save, Search, X, FilePlus, Copy, Info, Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

// --- Main Component ---

const SaveTourStep: React.FC = () => {
    // --- UPDATED: Get the correct actions and state from the store ---
    const { selectedClusterId, cancelSaveTour, saveTour } = useWizardStore(state => ({
        selectedClusterId: state.selectedClusterId,
        cancelSaveTour: state.cancelSaveTour, // Use the new cancel action
        saveTour: state.saveTour,
    }));
    
    // Find the full cluster data from the project state
    const cluster = useWizardStore(state => 
        state.project?.projectData.clusteringResults?.clusters.find((c: ClusterResult) => c.id === selectedClusterId)
    );

    const methods = useForm({
        defaultValues: {
            saveMode: 'new',
            validFrom: new Date().toISOString().split('T')[0],
            newTourName: cluster?.name || '',
            overwriteTour: null,
            collectionPointTarget: '', // Add this field for the other form
            splitAtDeloading: false,
        }
    });

    // Effect to reset the form's default tour name when the cluster changes
    useEffect(() => {
        if (cluster) {
            methods.reset({
                ...methods.getValues(),
                newTourName: cluster.name
            });
        }
    }, [cluster, methods]);


    if (!cluster) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Info className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No Cluster Selected</p>
                <p className="text-sm">Please go back to the results page and choose a cluster to save.</p>
            </div>
        );
    }
    
    const onSubmit = (data: any) => {
        // This correctly calls the saveTour action from the store
        saveTour(data);
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
                <Header cluster={cluster} />
                {cluster.isOptimized ? <OptimizedSaveOptions /> : <ClusterSaveOptions />}
            </form>
        </FormProvider>
    );
};

// --- Sub-components (No changes needed below this line) ---

const Header: React.FC<{ cluster: ClusterResult }> = ({ cluster }) => {
    const [showInfo, setShowInfo] = useState(true);
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Result for "{cluster.name}"</h3>
                <p className="text-sm text-gray-500">Finalize and save this tour or cluster.</p>
            </div>
            {showInfo && (
                <div className="relative bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <button type="button" onClick={() => setShowInfo(false)} className="absolute top-3 right-3"><X className="w-5 h-5 text-blue-600" /></button>
                    <div className="flex items-start space-x-4">
                        <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium text-base mb-2">About Saving Tours</p>
                            <p>Finalize your result by saving as new, overwriting an existing tour, or assigning it as a collection point.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const OptimizedSaveOptions: React.FC = () => {
    const { watch } = useFormContext();
    const saveMode = watch('saveMode');
    const hasDeloadingPoints = true; // Placeholder for real logic
    const splitAtDeloading = watch('splitAtDeloading');

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h4 className="text-base font-medium text-gray-800">Save Optimized Tour</h4>
            {hasDeloadingPoints && <Controller name="splitAtDeloading" render={({ field }) => (
                <label className="flex items-start space-x-3"><input type="checkbox" {...field} checked={field.value} className="h-4 w-4 mt-1 rounded" /><div><div className="font-medium text-gray-900">Split at deloading points</div><p className="text-gray-500 text-sm">Save each leg of the tour as a separate entry.</p></div></label>
            )} />}
            
            {splitAtDeloading ? <SubTourSaveUI /> : <SingleTourSaveUI />}
        </div>
    );
};

const SingleTourSaveUI: React.FC = () => {
    const { control, register, watch } = useFormContext();
    const saveMode = watch('saveMode');
    return (
        <div className="space-y-6">
            <Controller name="saveMode" control={control} render={({ field }) => (
                <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
                    <button type="button" onClick={() => field.onChange('new')} className={`flex items-center justify-center gap-2 flex-1 text-sm p-2 rounded-md ${saveMode === 'new' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><FilePlus className="w-4 h-4" /> Save as New</button>
                    <button type="button" onClick={() => field.onChange('overwrite')} className={`flex items-center justify-center gap-2 flex-1 text-sm p-2 rounded-md ${saveMode === 'overwrite' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><Copy className="w-4 h-4" /> Overwrite Existing</button>
                </div>
            )}/>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                <input type="date" {...register('validFrom')} className="block w-full px-4 py-3 border border-gray-300 rounded-md"/>
            </div>
            {saveMode === 'new' && <div><label className="block text-sm font-medium text-gray-700 mb-2">New Tour Name</label><input type="text" {...register('newTourName', { required: true })} className="block w-full px-4 py-3 border border-gray-300 rounded-md"/></div>}
            {saveMode === 'overwrite' && <OverwriteSelector />}
        </div>
    );
};

const OverwriteSelector: React.FC = () => {
    const { control } = useFormContext();
    const { field } = useController({ name: 'overwriteTour', control, rules: { required: 'You must select a tour to overwrite.' } });
    const { fieldState } = useController({ name: 'overwriteTour', control });
    
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<TourSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useCallback(debounce(async (query: string) => {
        if (query.length < 2) { setResults([]); return; }
        setIsLoading(true);
        const searchResults = await api.searchTours(query);
        setResults(searchResults);
        setIsLoading(false);
    }, 400), []);

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Tour to Overwrite</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); debouncedSearch(e.target.value);}} placeholder="Search by name..." className="block w-full pl-9 pr-3 py-3 border border-gray-300 rounded-md" />
                </div>
                {fieldState.error && <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>}
            </div>
            {isLoading ? <Loader2 className="animate-spin" /> : results.length > 0 && (
                <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">{results.map(t => (
                    <div key={t.id} onClick={() => field.onChange(t)} className="flex justify-between p-3 hover:bg-gray-50 cursor-pointer"><span className="font-medium">{t.name}</span><button type="button" className="text-blue-600 text-xs">Select</button></div>
                ))}</div>
            )}
            {field.value && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">Replacing: <strong>{(field.value as TourSummary).name}</strong></div>
            )}
        </div>
    );
};

const SubTourSaveUI: React.FC = () => (
    <div className="p-4 border-l-4 border-amber-400 bg-amber-50">
        <p className="text-amber-800 font-medium">Sub-Tour Saving UI</p>
        <p className="text-amber-700 text-sm">This section would contain a form for each sub-tour, allowing independent naming and saving options.</p>
    </div>
);


const ClusterSaveOptions: React.FC = () => {
    const { register, formState: { errors } } = useFormContext();
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div>
                <h4 className="text-base font-medium text-gray-800 mb-3">Assign Cluster to Collection Points</h4>
                <p className="text-sm text-gray-600">Save this group of addresses as a logical collection area.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to</label>
                <input type="text" {...register('collectionPointTarget', { required: 'Target is required.' })} className={`block w-full px-4 py-3 border rounded-md ${errors.collectionPointTarget ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., 'North Zone', 'Recycling Route B'" />
                {errors.collectionPointTarget && <p className="text-xs text-red-600 mt-1">{(errors.collectionPointTarget.message as string)}</p>}
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                <input type="date" {...register('validFrom')} className="block w-full px-4 py-3 border border-gray-300 rounded-md"/>
            </div>
        </div>
    );
};


export default SaveTourStep;