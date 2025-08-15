

import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import type { Material } from '../types';
import { GlassIcon } from './icons';
import { Input } from './common';

interface GlassSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    glassTypes: Material[];
    onSelect: (glassTypeId: string) => void;
}

export const GlassSelectionModal: React.FC<GlassSelectionModalProps> = ({ isOpen, onClose, glassTypes, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGlassTypes = useMemo(() => {
        if (!searchQuery) return glassTypes;
        const query = searchQuery.toLowerCase();
        return glassTypes.filter(g =>
            g.name.toLowerCase().includes(query) ||
            g.spec?.toLowerCase().includes(query)
        );
    }, [glassTypes, searchQuery]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Glass Specification" size="2xl">
            <div className="flex flex-col gap-3">
                <Input
                    type="text"
                    placeholder="Search by name or specification..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                />
                <ul className="space-y-1 max-h-[60vh] overflow-y-auto p-1 -mx-1">
                    {filteredGlassTypes.map(glass => (
                        <li key={glass.id}>
                            <button
                                onClick={() => onSelect(glass.id)}
                                className="w-full flex items-center gap-4 p-3 text-left rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <GlassIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <div className="flex-grow flex items-center justify-between gap-4 text-sm">
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">{glass.name}</span>
                                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                        <span>Spec: <span className="font-medium">{glass.spec || 'N/A'}</span></span>
                                        <span>U-Value: <span className="font-medium">{glass.uValue?.toFixed(2) || 'N/A'}</span></span>
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}
                    {filteredGlassTypes.length === 0 && (
                        <li className="text-center p-8 text-sm text-gray-500">
                            No glass types found matching your search.
                        </li>
                    )}
                </ul>
            </div>
        </Modal>
    );
};