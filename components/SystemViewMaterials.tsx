

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Material, Permission } from '../types';
import { Modal } from './Modal';
import { Input, Select, Button } from './common';
import { PencilIcon, TrashIcon, DownloadIcon, UploadIcon, PlusIcon } from './icons';
import { SectionHeader } from './SystemViewCommon';

const MATERIAL_TYPES: Material['type'][] = ['Timber', 'Cill', 'Finish', 'Glass', 'Ironmongery', 'Other'];

const MaterialModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (material: Material) => void;
    material: Material | null;
}> = ({ isOpen, onClose, onSave, material }) => {
    const [formData, setFormData] = useState<Partial<Material>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(material || { name: '', type: 'Timber', color: '#D3B48C' });
        }
    }, [isOpen, material]);

    const handleChange = (field: keyof Material, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleNumericChange = (field: keyof Material, value: string) => {
        const num = parseFloat(value);
        handleChange(field, isNaN(num) ? undefined : num);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.type) {
            alert('Please provide a name and type.');
            return;
        }
        onSave({ id: material?.id || `mat-${Date.now()}`, ...formData } as Material);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={material ? 'Edit Material' : 'Add New Material'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    type="text"
                    placeholder="Material Name"
                    value={formData.name || ''}
                    onChange={e => handleChange('name', e.target.value)}
                    required
                />
                <Select
                    value={formData.type || ''}
                    onChange={e => handleChange('type', e.target.value as Material['type'])}
                >
                    {MATERIAL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </Select>
                
                {(formData.type === 'Timber' || formData.type === 'Finish' || formData.type === 'Cill' || formData.type === 'Glass') && (
                     <div className="flex items-center gap-4">
                        <div className="flex-grow">
                            <label className="text-sm font-medium">Display Color</label>
                            <Input
                                type="text"
                                value={formData.color || ''}
                                onChange={e => handleChange('color', e.target.value)}
                                placeholder="#RRGGBB"
                            />
                        </div>
                        <Input
                            type="color"
                            value={formData.color || '#ffffff'}
                            onChange={e => handleChange('color', e.target.value)}
                            className="p-1 h-10 w-10 mt-5"
                        />
                    </div>
                )}

                {formData.type === 'Timber' && (
                    <div>
                        <label className="text-sm font-medium">Density (kg/m³)</label>
                        <Input
                            type="number"
                            placeholder="e.g. 510"
                            value={formData.density ?? ''}
                            onChange={e => handleNumericChange('density', e.target.value)}
                        />
                    </div>
                )}
                
                {formData.type === 'Glass' && (
                    <div className="space-y-4 pt-2 border-t dark:border-gray-600">
                         <div>
                            <label className="text-sm font-medium">Specification (e.g., 4-16-4T)</label>
                            <Input
                                type="text"
                                value={formData.spec || ''}
                                onChange={e => handleChange('spec', e.target.value)}
                            />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Thickness (mm)</label>
                                <Input type="number" value={formData.thickness ?? ''} onChange={e => handleNumericChange('thickness', e.target.value)}/>
                            </div>
                            <div>
                                <label className="text-sm font-medium">U-Value (W/m²K)</label>
                                <Input type="number" step="0.01" value={formData.uValue ?? ''} onChange={e => handleNumericChange('uValue', e.target.value)}/>
                            </div>
                         </div>
                    </div>
                )}


                 <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Material</Button>
                </div>
            </form>
        </Modal>
    );
};


interface SystemViewMaterialsProps {
    materials: Material[];
    setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
    onImportMaterials: (materials: Material[]) => void;
    hasPermission: (permission: Permission) => boolean;
}

const MaterialTypeTable: React.FC<{
    title: string;
    materials: Material[];
    onEdit: (material: Material) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
}> = ({ title, materials, onEdit, onDelete, canEdit }) => {

    if(materials.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
            <h3 className="font-semibold text-lg p-4 bg-stone-50 dark:bg-gray-700/50 border-b dark:border-gray-700">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b dark:border-gray-600">
                        <tr>
                            <th className="p-3 font-semibold uppercase text-xs text-stone-500 dark:text-stone-400">Name</th>
                            <th className="p-3 font-semibold uppercase text-xs text-stone-500 dark:text-stone-400">Color</th>
                            <th className="p-3 font-semibold uppercase text-xs text-stone-500 dark:text-stone-400">Spec</th>
                            <th className="p-3 font-semibold uppercase text-xs text-stone-500 dark:text-stone-400 text-right">U-Value</th>
                            <th className="p-3 font-semibold uppercase text-xs text-stone-500 dark:text-stone-400 text-right">Thickness</th>
                            <th className="p-3 font-semibold uppercase text-xs text-stone-500 dark:text-stone-400 text-right">Density</th>
                            <th className="p-3 font-semibold uppercase text-xs text-stone-500 dark:text-stone-400"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                        {materials.map(mat => (
                            <tr key={mat.id}>
                                <td className="p-3 font-medium whitespace-nowrap">{mat.name}</td>
                                <td className="p-3 whitespace-nowrap">
                                    {mat.color ? (
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded border dark:border-gray-600" style={{ backgroundColor: mat.color }}></span>
                                            <span className="font-mono">{mat.color}</span>
                                        </div>
                                    ) : <span className="text-gray-400">N/A</span>}
                                </td>
                                <td className="p-3 whitespace-nowrap">{mat.spec || <span className="text-gray-400">N/A</span>}</td>
                                <td className="p-3 text-right whitespace-nowrap">{mat.uValue?.toFixed(2) || <span className="text-gray-400">N/A</span>}</td>
                                <td className="p-3 text-right whitespace-nowrap">{mat.thickness || <span className="text-gray-400">N/A</span>}</td>
                                <td className="p-3 text-right whitespace-nowrap">{mat.density || <span className="text-gray-400">N/A</span>}</td>
                                <td className="p-3 text-right whitespace-nowrap">
                                    <button onClick={() => onEdit(mat)} disabled={!canEdit} className="p-1 text-stone-500 hover:text-blue-600 disabled:opacity-50"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => onDelete(mat.id)} disabled={!canEdit} className="p-1 text-stone-500 hover:text-red-600 disabled:opacity-50"><TrashIcon className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const SystemViewMaterials: React.FC<SystemViewMaterialsProps> = ({ materials, setMaterials, onImportMaterials, hasPermission }) => {
    
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    const canEdit = hasPermission('manageSettings');

    const materialsByType = useMemo(() => {
        return materials.reduce((acc, material) => {
            if (!acc[material.type]) {
                acc[material.type] = [];
            }
            acc[material.type].push(material);
            return acc;
        }, {} as Record<Material['type'], Material[]>);
    }, [materials]);

    const handleEdit = (material: Material) => {
        setEditingMaterial(material);
        setIsMaterialModalOpen(true);
    };

    const handleAdd = () => {
        setEditingMaterial(null);
        setIsMaterialModalOpen(true);
    };

    const handleSaveMaterial = (materialToSave: Material) => {
        const isNew = !materials.some(m => m.id === materialToSave.id);
        setMaterials(prev => {
            if (isNew) {
                return [...prev, materialToSave];
            }
            return prev.map(m => m.id === materialToSave.id ? materialToSave : m);
        });
        setIsMaterialModalOpen(false);
    };

    const handleDeleteMaterial = (materialId: string) => {
        const materialToDelete = materials.find(m => m.id === materialId);
        if (materialToDelete && window.confirm("Are you sure you want to delete this material? This may affect existing product profiles.")) {
            setMaterials(prev => prev.filter(m => m.id !== materialId));
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ["type", "name", "color", "spec", "uValue", "thickness", "density"];
        const rows = [
            headers.join(','),
            "Timber,Sample Oak,#B89F7E,,,,,720",
            "Finish,Sample Blue,#3B82F6,,,,,",
            "Glass,Sample Safety Glass,#e0f2fe,4T-16-4T,1.2,24,",
            "Ironmongery,Sample Handles,,,,,"
        ];
        const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "materials_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const newMaterials: Material[] = [];
            const lines = text.split('\n').slice(1); // Skip header
            
            lines.forEach(line => {
                const [type, name, color, spec, uValue, thickness, density] = line.split(',').map(s => s.trim());
                if (type && name && MATERIAL_TYPES.includes(type as any)) {
                    newMaterials.push({
                        id: `mat-${Date.now()}-${Math.random()}`,
                        type: type as Material['type'],
                        name,
                        color: color || undefined,
                        spec: spec || undefined,
                        uValue: uValue ? parseFloat(uValue) : undefined,
                        thickness: thickness ? parseFloat(thickness) : undefined,
                        density: density ? parseInt(density) : undefined,
                    });
                }
            });
            if(newMaterials.length > 0) {
                 onImportMaterials(newMaterials);
            } else {
                alert("No valid materials found in the file.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    return (
        <div>
            <input type="file" accept=".csv" ref={importFileRef} onChange={handleImport} className="hidden" />
            <SectionHeader 
                title="Materials Library"
                subtitle="Manage all materials available for use in products and quotes."
            />
            <div className="flex gap-2 mb-6">
                 <Button onClick={handleAdd} disabled={!canEdit} icon={PlusIcon}>
                    Add Manually
                </Button>
                <Button variant="secondary" onClick={() => importFileRef.current?.click()} disabled={!canEdit} icon={UploadIcon}>
                    Import from CSV
                </Button>
                 <Button variant="secondary" onClick={handleDownloadTemplate} icon={DownloadIcon}>
                    Download Template
                </Button>
            </div>


            <div className="space-y-6">
                 <MaterialTypeTable 
                    title="Timber"
                    materials={materialsByType['Timber'] || []}
                    onEdit={handleEdit}
                    onDelete={handleDeleteMaterial}
                    canEdit={canEdit}
                />
                 <MaterialTypeTable 
                    title="Cills"
                    materials={materialsByType['Cill'] || []}
                    onEdit={handleEdit}
                    onDelete={handleDeleteMaterial}
                    canEdit={canEdit}
                />
                <MaterialTypeTable 
                    title="Finishes"
                    materials={materialsByType['Finish'] || []}
                    onEdit={handleEdit}
                    onDelete={handleDeleteMaterial}
                    canEdit={canEdit}
                />
                <MaterialTypeTable 
                    title="Glass"
                    materials={materialsByType['Glass'] || []}
                    onEdit={handleEdit}
                    onDelete={handleDeleteMaterial}
                    canEdit={canEdit}
                />
                 <MaterialTypeTable 
                    title="Ironmongery"
                    materials={materialsByType['Ironmongery'] || []}
                    onEdit={handleEdit}
                    onDelete={handleDeleteMaterial}
                    canEdit={canEdit}
                />
                 <MaterialTypeTable 
                    title="Other"
                    materials={materialsByType['Other'] || []}
                    onEdit={handleEdit}
                    onDelete={handleDeleteMaterial}
                    canEdit={canEdit}
                />
            </div>
            
            <MaterialModal 
                isOpen={isMaterialModalOpen}
                onClose={() => setIsMaterialModalOpen(false)}
                material={editingMaterial}
                onSave={handleSaveMaterial}
            />
        </div>
    );
}