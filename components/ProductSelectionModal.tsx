

import React from 'react';
import { Modal } from './Modal';
import type { ProductProfile, ProductRange } from '../types';
import { SashWindowIcon, CasementWindowIcon, DoorIcon, PlusIcon, ViewColumnsIcon } from './icons';

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: ProductProfile[];
    onSelect: (profile: ProductProfile) => void;
    itemType: 'Sash' | 'Casement' | 'Door' | 'Screen';
    navigateToSystem: () => void;
    productRanges: ProductRange[];
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, profiles, onSelect, itemType, navigateToSystem, productRanges }) => {

    const typeNameMap = {
        Sash: 'Sash Window',
        Casement: 'Casement Window',
        Door: 'Door',
        Screen: 'Screen'
    };
    
    const IconMap = {
        Sash: SashWindowIcon,
        Casement: CasementWindowIcon,
        Door: DoorIcon,
        Screen: ViewColumnsIcon,
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Select a ${typeNameMap[itemType]} Configuration`}
            size="2xl"
        >
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
                {profiles.length > 0 ? (
                    profiles.map(profile => {
                        const rangeName = productRanges.find(r => r.id === profile.productRangeId)?.name || 'Custom';
                        return (
                        <button
                            key={profile.id}
                            onClick={() => onSelect(profile)}
                            className="w-full flex items-center gap-4 p-4 text-left border dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-500 transition-all"
                        >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                                {React.createElement(IconMap[itemType], { className: "w-8 h-8 text-blue-600 dark:text-blue-400" })}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{profile.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{rangeName}</p>
                            </div>
                        </button>
                    )})
                ) : (
                    <div className="text-center py-10">
                         <p className="text-gray-500 dark:text-gray-400">No product profiles found for this item type.</p>
                         <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">You can create new configurations in the System Hub.</p>
                         <button
                            onClick={navigateToSystem}
                            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700"
                         >
                            <PlusIcon className="w-5 h-5"/>
                            Create New Configuration
                         </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
