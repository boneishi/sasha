import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ProductRange, Material } from '../types';
import { SectionHeader } from './SystemViewCommon';
import { Button, Input, Select } from './common';
import { TrashIcon } from './icons';

const materialOptions = (materials: Material[], type: Material['type']) => {
    return materials.filter(m => m.type === type).map(m => <option key={m.id} value={m.id}>{m.name}</option>);
};

const BulkEditPanel: React.FC<{
    onBulkUpdate: (field: keyof ProductRange, value: any) => void;
    materials: Material[];
    selectedCount: number;
    itemType: 'Sash' | 'Casement' | 'Door' | 'Screen' | null;
}> = ({ onBulkUpdate, materials, selectedCount, itemType }) => {
    const [fieldToUpdate, setFieldToUpdate] = useState<keyof ProductRange | ''>('');
    const [value, setValue] = useState<any>('');

    const handleApply = () => {
        if (fieldToUpdate && value !== '') {
            onBulkUpdate(fieldToUpdate, value);
        }
    };
    
    const allFields: { value: keyof ProductRange, label: string, type: 'number' | 'select' | 'select_custom', options?: any, itemTypes?: ('Sash' | 'Casement' | 'Door' | 'Screen')[] }[] = [
        { value: 'frameThickness', label: 'Frame Thickness', type: 'number' },
        { value: 'rebateWidth', label: 'Rebate Width', type: 'number' },
        { value: 'rebateDepth', label: 'Rebate Depth', type: 'number' },
        { value: 'outerHeadHeight', label: 'Outer Head', type: 'number' },
        { value: 'outerCillHeight', label: 'Outer Cill', type: 'number' },
        { value: 'outerLeftJambWidth', label: 'Outer Left Jamb', type: 'number' },
        { value: 'outerRightJambWidth', label: 'Outer Right Jamb', type: 'number' },
        { value: 'outerMullionWidth', label: 'Outer Mullion', type: 'number' },
        { value: 'outerTransomHeight', label: 'Outer Transom', type: 'number' },
        { value: 'innerHeightHeight', label: 'Inner Head', type: 'number' },
        { value: 'innerCillHeight', label: 'Inner Cill', type: 'number' },
        { value: 'innerLeftJambWidth', label: 'Inner Left Jamb', type: 'number' },
        { value: 'innerRightJambWidth', label: 'Inner Right Jamb', type: 'number' },
        { value: 'innerMullionWidth', label: 'Inner Mullion', type: 'number' },
        { value: 'innerTransomHeight', label: 'Inner Transom', type: 'number' },
        { value: 'topRailHeight', label: 'Top Rail', type: 'number' },
        { value: 'stileWidth', label: 'Stile', type: 'number' },
        { value: 'bottomRailHeight', label: 'Bottom Rail', type: 'number' },
        { value: 'meetingRailHeight', label: 'Meeting Rail', type: 'number', itemTypes: ['Sash'] },
        { value: 'openingDirection', label: 'Opening Direction', type: 'select_custom', options: ['inward', 'outward'], itemTypes: ['Casement', 'Door', 'Screen'] },
        { value: 'glazingType', label: 'Glazing Type', type: 'select_custom', options: ['internally', 'externally'], itemTypes: ['Casement', 'Door', 'Screen'] },
        { value: 'materialFrameId', label: 'Frame Material', type: 'select', options: 'Timber' },
        { value: 'materialSashId', label: 'Sash Material', type: 'select', options: 'Timber' },
        { value: 'materialCillId', label: 'Cill Material', type: 'select', options: 'Cill' },
        { value: 'defaultGlassTypeId', label: 'Default Glass', type: 'select', options: 'Glass' },
    ];
    
    const fields = allFields.filter(f => !f.itemTypes || (itemType && f.itemTypes.includes(itemType)));
    const selectedField = fields.find(f => f.value === fieldToUpdate);

    return (
        <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">{`Bulk Edit (${selectedCount} selected)`}</h4>
            <div className="flex items-end gap-2">
                <Select label="Field to Update" value={fieldToUpdate} onChange={e => { setFieldToUpdate(e.target.value as any); setValue(''); }}>
                    <option value="">-- Select Field --</option>
                    {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
                {selectedField?.type === 'number' && (
                    <Input label="New Value" type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
                )}
                {selectedField?.type === 'select' && (
                    <Select label="New Value" value={value} onChange={e => setValue(e.target.value)}>
                        <option value="">-- Select --</option>
                        {materialOptions(materials, selectedField.options!)}
                    </Select>
                )}
                 {selectedField?.type === 'select_custom' && (
                    <Select label="New Value" value={value} onChange={e => setValue(e.target.value)}>
                        <option value="">-- Select --</option>
                        {selectedField.options!.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                )}
                <Button onClick={handleApply} disabled={!fieldToUpdate}>Apply to Selected</Button>
            </div>
        </div>
    );
};

const AddRangeDropdown: React.FC<{ onAdd: (itemType: 'Sash' | 'Casement' | 'Door' | 'Screen') => void; disabled: boolean }> = ({ onAdd, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const options: ('Sash' | 'Casement' | 'Door' | 'Screen')[] = ['Sash', 'Casement', 'Door', 'Screen'];

    return (
        <div className="relative" ref={dropdownRef}>
            <Button onClick={() => setIsOpen(!isOpen)} disabled={disabled}>Add Range</Button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-10">
                    <ul className="py-1">
                        {options.map(opt => (
                            <li key={opt}>
                                <button
                                    onClick={() => { onAdd(opt); setIsOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    New {opt} Range
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

interface SystemViewRangesProps {
    productRanges: ProductRange[];
    setProductRanges: React.Dispatch<React.SetStateAction<ProductRange[]>>;
    materials: Material[];
    canEdit: boolean;
}

export const SystemViewRanges: React.FC<SystemViewRangesProps> = ({ productRanges, setProductRanges, materials, canEdit }) => {
    const [editableRanges, setEditableRanges] = useState<ProductRange[]>([]);
    const [selectedRangeIds, setSelectedRangeIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setEditableRanges(JSON.parse(JSON.stringify(productRanges)));
    }, [productRanges]);

    const hasChanges = JSON.stringify(productRanges) !== JSON.stringify(editableRanges);

    const handleAddRow = (itemType: 'Sash' | 'Casement' | 'Door' | 'Screen') => {
        const newRange: ProductRange = {
            id: `range-${Date.now()}`,
            name: `New ${itemType} Range`,
            itemType: itemType,
            frameThickness: 70,
            rebateWidth: 12,
            rebateDepth: 15,
            openingDirection: itemType !== 'Sash' ? 'outward' : undefined,
            glazingType: itemType !== 'Sash' ? 'externally' : undefined,
            outerHeadHeight: 80, outerCillHeight: 80, outerLeftJambWidth: 80, outerRightJambWidth: 80, outerTransomHeight: 80, outerMullionWidth: 80,
            innerHeightHeight: 80, innerCillHeight: 80, innerLeftJambWidth: 80, innerRightJambWidth: 80, innerTransomHeight: 80, innerMullionWidth: 80,
            topRailHeight: 80, bottomRailHeight: 80, 
            meetingRailHeight: itemType === 'Sash' ? 30 : 0,
            stileWidth: 80,
            materialSashId: materials.find(m => m.type === 'Timber')?.id || '',
            materialFrameId: materials.find(m => m.type === 'Timber')?.id || '',
            materialCillId: materials.find(m => m.type === 'Cill')?.id || '',
            defaultGlassTypeId: materials.find(m => m.type === 'Glass')?.id || ''
        };
        setEditableRanges(prev => [...prev, newRange]);
    };

    const handleUpdateCell = (rangeId: string, field: keyof ProductRange, value: any) => {
        setEditableRanges(prev => prev.map(range =>
            range.id === rangeId ? { ...range, [field]: value } : range
        ));
    };
    
    const handleSelectRow = (rangeId: string, isSelected: boolean) => {
        setSelectedRangeIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) newSet.add(rangeId);
            else newSet.delete(rangeId);
            return newSet;
        });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedRangeIds(new Set(editableRanges.map(r => r.id)));
        } else {
            setSelectedRangeIds(new Set());
        }
    };
    
    const handleDeleteSelected = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedRangeIds.size} range(s)?`)) {
            setEditableRanges(prev => prev.filter(r => !selectedRangeIds.has(r.id)));
            setSelectedRangeIds(new Set());
        }
    };

    const handleBulkUpdate = (field: keyof ProductRange, value: any) => {
        setEditableRanges(prev =>
            prev.map(range =>
                selectedRangeIds.has(range.id)
                    ? { ...range, [field]: value }
                    : range
            )
        );
    };

    const handleSaveChanges = () => {
        setProductRanges(editableRanges);
    };
    
    const handleDiscardChanges = () => {
        if (window.confirm("Are you sure you want to discard all changes?")) {
            setEditableRanges(JSON.parse(JSON.stringify(productRanges)));
        }
    };
    
    const bulkEditItemType = useMemo(() => {
        if (selectedRangeIds.size === 0) return null;
        const selectedRanges = editableRanges.filter(r => selectedRangeIds.has(r.id));
        if (selectedRanges.length === 0) return null;
        const firstItemType = selectedRanges[0].itemType;
        const allSameType = selectedRanges.every(r => r.itemType === firstItemType);
        return allSameType ? firstItemType : null;
    }, [selectedRangeIds, editableRanges]);

    const sortedRanges = useMemo(() => {
        return [...editableRanges].sort((a, b) => 
            a.itemType.localeCompare(b.itemType) || a.name.localeCompare(b.name)
        );
    }, [editableRanges]);
    
    const allHeaders: {
        key: keyof ProductRange;
        label: string;
        type: 'number' | 'text' | 'select' | 'select_custom';
        options?: any;
        optional?: boolean;
        itemTypes?: ('Sash' | 'Casement' | 'Door' | 'Screen')[];
    }[] = [
        // Frame (3)
        { key: 'frameThickness', label: 'Thk', type: 'number' },
        { key: 'rebateWidth', label: 'Rb. W', type: 'number' },
        { key: 'rebateDepth', label: 'Rb. D', type: 'number' },
        // Outer Frame (6)
        { key: 'outerHeadHeight', label: 'Head', type: 'number' },
        { key: 'outerCillHeight', label: 'Cill', type: 'number' },
        { key: 'outerLeftJambWidth', label: 'L Jamb', type: 'number' },
        { key: 'outerRightJambWidth', label: 'R Jamb', type: 'number' },
        { key: 'outerMullionWidth', label: 'Mullion', type: 'number' },
        { key: 'outerTransomHeight', label: 'Transom', type: 'number' },
        // Inner Frame (6)
        { key: 'innerHeightHeight', label: 'Head', type: 'number' },
        { key: 'innerCillHeight', label: 'Cill', type: 'number' },
        { key: 'innerLeftJambWidth', label: 'L Jamb', type: 'number' },
        { key: 'innerRightJambWidth', label: 'R Jamb', type: 'number' },
        { key: 'innerMullionWidth', label: 'Mullion', type: 'number' },
        { key: 'innerTransomHeight', label: 'Transom', type: 'number' },
        // Sash (4)
        { key: 'topRailHeight', label: 'Top Rail', type: 'number' },
        { key: 'stileWidth', label: 'Stile', type: 'number' },
        { key: 'bottomRailHeight', label: 'Bottom', type: 'number' },
        { key: 'meetingRailHeight', label: 'Meeting', type: 'number', itemTypes: ['Sash'] },
        // Opening & Glazing (2)
        { key: 'openingDirection', label: 'Direction', type: 'select_custom', options: ['inward', 'outward'], itemTypes: ['Casement', 'Door', 'Screen'] },
        { key: 'glazingType', label: 'Type', type: 'select_custom', options: ['internally', 'externally'], itemTypes: ['Casement', 'Door', 'Screen'] },
        // Materials & Glass (4)
        { key: 'materialFrameId', label: 'Frame', type: 'select', options: 'Timber' },
        { key: 'materialSashId', label: 'Sash', type: 'select', options: 'Timber' },
        { key: 'materialCillId', label: 'Cill', type: 'select', options: 'Cill' },
        { key: 'defaultGlassTypeId', label: 'Glass', type: 'select', options: 'Glass', optional: true },
    ];
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <SectionHeader
                    title="Product Ranges"
                    subtitle="Manage reusable sets of specifications for your products in a grid."
                />
                <AddRangeDropdown onAdd={handleAddRow} disabled={!canEdit} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 space-y-4">
                 <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <Button variant="danger" onClick={handleDeleteSelected} disabled={!canEdit || selectedRangeIds.size === 0}>
                           Delete ({selectedRangeIds.size})
                        </Button>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleDiscardChanges} disabled={!hasChanges || !canEdit}>Discard Changes</Button>
                        <Button onClick={handleSaveChanges} disabled={!hasChanges || !canEdit}>Save Changes</Button>
                    </div>
                </div>
                {selectedRangeIds.size > 0 && (
                    bulkEditItemType ? (
                        <BulkEditPanel
                            materials={materials}
                            onBulkUpdate={handleBulkUpdate}
                            selectedCount={selectedRangeIds.size}
                            itemType={bulkEditItemType}
                        />
                    ) : (
                         <div className="p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Mixed item types selected. Bulk editing is disabled.</h4>
                        </div>
                    )
                )}
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
                <div className="overflow-x-auto border dark:border-gray-700 rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-stone-50 dark:bg-gray-700/50 text-xs uppercase tracking-wider">
                             <tr>
                                <th rowSpan={2} className="p-2 bg-stone-50 dark:bg-gray-700/50"><input type="checkbox" onChange={handleSelectAll} checked={selectedRangeIds.size === editableRanges.length && editableRanges.length > 0} disabled={editableRanges.length === 0} /></th>
                                <th rowSpan={2} className="p-2 font-semibold bg-stone-50 dark:bg-gray-700/50 min-w-[120px]">Range Name</th>
                                <th rowSpan={2} className="p-2 font-semibold bg-stone-50 dark:bg-gray-700/50 min-w-[100px]">Item Type</th>
                                <th colSpan={3} className="p-2 font-semibold text-center border-b border-l border-stone-200 dark:border-gray-600">Frame</th>
                                <th colSpan={6} className="p-2 font-semibold text-center border-b border-l border-stone-200 dark:border-gray-600">Outer Frame</th>
                                <th colSpan={6} className="p-2 font-semibold text-center border-b border-l border-stone-200 dark:border-gray-600">Inner Frame</th>
                                <th colSpan={4} className="p-2 font-semibold text-center border-b border-l border-stone-200 dark:border-gray-600">Sash</th>
                                <th colSpan={2} className="p-2 font-semibold text-center border-b border-l border-stone-200 dark:border-gray-600">Opening & Glazing</th>
                                <th colSpan={4} className="p-2 font-semibold text-center border-b border-l border-stone-200 dark:border-gray-600">Materials & Glass</th>
                            </tr>
                            <tr>
                                {allHeaders.map(h => <th key={h.key} className={`p-2 font-semibold border-l border-stone-200 dark:border-gray-600`}>{h.label}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                            {sortedRanges.map(range => (
                                <tr key={range.id} className={`${selectedRangeIds.has(range.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <td className="p-2"><input type="checkbox" checked={selectedRangeIds.has(range.id)} onChange={e => handleSelectRow(range.id, e.target.checked)} /></td>
                                    <td className="p-1 min-w-[120px]"><Input type="text" value={range.name || ''} onChange={e => handleUpdateCell(range.id, 'name', e.target.value)} disabled={!canEdit} className="text-sm p-1" /></td>
                                    <td className="p-2 min-w-[100px] text-stone-600 dark:text-stone-300">{range.itemType}</td>
                                    {allHeaders.map(header => {
                                        const value = range[header.key as keyof ProductRange];
                                        const isDisabled = !canEdit || (header.itemTypes && !header.itemTypes.includes(range.itemType));
                                        return (
                                        <td key={`${range.id}-${header.key}`} className="p-1 text-center border-l border-stone-100 dark:border-gray-700">
                                            {header.type === 'number' ? (
                                                <Input type="number" value={value as number ?? ''} onChange={e => handleUpdateCell(range.id, header.key as keyof ProductRange, e.target.value === '' ? undefined : Number(e.target.value))} disabled={isDisabled} className="text-sm p-1 w-16 text-center" />
                                            ) : header.type === 'select' ? (
                                                <Select value={value as string || ''} onChange={e => handleUpdateCell(range.id, header.key as keyof ProductRange, e.target.value)} disabled={isDisabled} className="text-sm p-1 w-32">
                                                    {header.optional && <option value="">-- None --</option>}
                                                    {materialOptions(materials, header.options as Material['type'])}
                                                </Select>
                                            ) : ( // select_custom
                                                <Select value={value as string || ''} onChange={e => handleUpdateCell(range.id, header.key as keyof ProductRange, e.target.value)} disabled={isDisabled} className="text-sm p-1 w-28 capitalize">
                                                    {(header.options as string[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </Select>
                                            )}
                                        </td>
                                    )})}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {editableRanges.length === 0 && <p className="text-center text-stone-500 py-8">No product ranges configured.</p>}
            </div>
        </div>
    );
};
