
import React, { useState, useRef } from 'react';
import type { ProductProfile, Permission, Material, ProductRange } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, DocumentDuplicateIcon } from './icons';
import { SectionHeader } from './SystemViewCommon';
import { Button } from './common';
import { ProductProfilePreview } from './ProductProfilePreview';

interface SystemViewProductTemplatesProps {
    productProfiles: ProductProfile[];
    materials: Material[];
    productRanges: ProductRange[];
    onSaveProfile: (profile: ProductProfile) => void;
    onDeleteProfile: (profileId: string) => void;
    hasPermission: (permission: Permission) => boolean;
    navigateTo: (view: any) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    productType: 'Sash' | 'Casement' | 'Door' | 'Screen';
}

const itemTypeToNameMap = {
    'Sash': 'Sash Window',
    'Casement': 'Casement Window',
    'Door': 'Door',
    'Screen': 'Screen'
};

export const SystemViewProductTemplates: React.FC<SystemViewProductTemplatesProps> = ({ 
    productProfiles, materials, productRanges, onSaveProfile, onDeleteProfile,
    hasPermission, navigateTo, addToast, productType
}) => {
    const canEdit = hasPermission('manageProductConfigurations');
    const profiles = productProfiles.filter(p => p.itemType === productType);

    const handleEditProfile = (profile: ProductProfile) => {
        navigateTo({ view: 'profileEditor', profileId: profile.id });
    };
    const handleAddProfile = () => {
        navigateTo({ view: 'profileEditor', newItemType: productType });
    };
    const handleDeleteProfile = (profileId: string) => {
        const profile = productProfiles.find(p => p.id === profileId);
        if (profile && window.confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
            onDeleteProfile(profileId);
        }
    }

    const handleCopyProfile = (profileToCopy: ProductProfile) => {
        if (!canEdit) return;
        const newProfile: ProductProfile = JSON.parse(JSON.stringify(profileToCopy));
        
        newProfile.id = `pp-${Date.now()}`;
        newProfile.name = `${profileToCopy.name} (Copy)`;
    
        if (newProfile.defaultLayout) {
            const layout = newProfile.defaultLayout;
            
            if (layout.instances) {
                const instanceIdMap = new Map<string, string>();
                layout.instances = layout.instances.map(instance => {
                    const oldInstanceId = instance.id;
                    const newInstanceId = `inst-ppc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    instanceIdMap.set(oldInstanceId, newInstanceId);
                    return { ...instance, id: newInstanceId };
                });
    
                if (layout.placedSashes) {
                    layout.placedSashes = layout.placedSashes.map(sash => {
                        let newPaneId = sash.paneId;
                        for (const [oldId, newId] of instanceIdMap.entries()) {
                            if (sash.paneId.startsWith(oldId)) {
                                newPaneId = sash.paneId.replace(oldId, newId);
                                break;
                            }
                        }
    
                        const newGlazingBars = sash.glazingBars?.map(bar => ({
                            ...bar,
                            id: `gb-pp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                        }));
    
                        return { ...sash, paneId: newPaneId, glazingBars: newGlazingBars };
                    });
                }
            }
    
            if (layout.mullions) {
                layout.mullions = layout.mullions.map(m => ({
                    ...m,
                    id: `m-ppc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                }));
            }
    
            if (layout.transoms) {
                layout.transoms = layout.transoms.map(t => ({
                    ...t,
                    id: `t-ppc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                }));
            }
        }
        
        onSaveProfile(newProfile);
        addToast(`Profile copied. Now editing "${newProfile.name}".`, 'success');
        navigateTo({ view: 'profileEditor', profileId: newProfile.id });
    };

    return (
         <div>
            <SectionHeader 
                title={`${itemTypeToNameMap[productType]} Profiles`}
                subtitle={`Manage default profiles for ${itemTypeToNameMap[productType].toLowerCase()} products.`}
            />
             <div className="flex justify-end items-end mb-8">
                <div className="flex gap-2">
                    <Button onClick={handleAddProfile} disabled={!canEdit} icon={PlusIcon}>
                        Add {itemTypeToNameMap[productType]} Profile
                    </Button>
                </div>
            </div>
            
            {profiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {profiles.map(p => {
                        const rangeName = productRanges.find(r => r.id === p.productRangeId)?.name || 'Custom';
                        return (
                            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col">
                                <div className="h-48">
                                  <ProductProfilePreview profile={p} materials={materials} productRanges={productRanges} />
                                </div>
                                <div className="p-3 border-t dark:border-gray-700 flex-grow">
                                    <p className="font-semibold truncate" title={p.name}>{p.name}</p>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate" title={rangeName}>{rangeName}</p>
                                </div>
                                <div className="p-2 border-t dark:border-gray-700 mt-auto bg-stone-50 dark:bg-gray-800/50 flex justify-end gap-1">
                                    <button onClick={() => handleCopyProfile(p)} disabled={!canEdit} className="p-2 text-stone-500 hover:text-green-600 disabled:opacity-50" title="Copy"><DocumentDuplicateIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleEditProfile(p)} disabled={!canEdit} className="p-2 text-stone-500 hover:text-blue-600 disabled:opacity-50" title="Edit"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteProfile(p.id)} disabled={!canEdit} className="p-2 text-stone-500 hover:text-red-600 disabled:opacity-50" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-dashed border-stone-200 dark:border-gray-700">
                    <p className="text-sm text-stone-500 dark:text-stone-400">No product profiles found for {itemTypeToNameMap[productType]}.</p>
                </div>
            )}
        </div>
    );
};
