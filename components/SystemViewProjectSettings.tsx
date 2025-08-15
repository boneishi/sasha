import React, { useState, useEffect } from 'react';
import type { SystemSettings, Permission, CustomLabel } from '../types';
import { Button, Input, Select } from './common';
import { SaveIcon, TrashIcon, PlusIcon, ShieldCheckIcon } from './icons';
import { SectionHeader } from './SystemViewCommon';

interface SystemViewProjectSettingsProps {
    systemSettings: SystemSettings;
    setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
    hasPermission: (permission: Permission) => boolean;
    onBack: () => void;
}

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="px-6 py-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
        </div>
        <div className="p-6 space-y-4">
            {children}
        </div>
    </div>
);

const StatusEditor: React.FC<{
    title: string;
    labels: CustomLabel[];
    onUpdate: (newLabels: CustomLabel[]) => void;
    canEdit: boolean;
}> = ({ title, labels, onUpdate, canEdit }) => {
    const [newStatusName, setNewStatusName] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#E5E7EB');

    const handleAdd = () => {
        if (newStatusName.trim() && !labels.some(s => s.name.toLowerCase() === newStatusName.trim().toLowerCase())) {
            const newStatus: CustomLabel = {
                id: `status-${Date.now()}`,
                name: newStatusName.trim(),
                color: newStatusColor,
            };
            onUpdate([...labels, newStatus]);
            setNewStatusName('');
            setNewStatusColor('#E5E7EB');
        }
    };

    const handleUpdate = (id: string, field: 'name' | 'color', value: string) => {
        onUpdate(labels.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleDelete = (idToDelete: string) => {
        if (window.confirm("Are you sure you want to delete this status? This could affect existing records.")) {
            onUpdate(labels.filter(s => s.id !== idToDelete));
        }
    };

    return (
        <div>
            <h4 className="font-semibold text-stone-700 dark:text-stone-200 mb-3">{title}</h4>
            <div className="space-y-2">
                {labels.map(status => (
                    <div key={status.id} className="flex items-center gap-2">
                        <Input
                            type="text"
                            value={status.name}
                            onChange={e => handleUpdate(status.id, 'name', e.target.value)}
                            disabled={!canEdit || status.isProtected}
                            className="flex-grow"
                        />
                        <Input
                            type="color"
                            value={status.color}
                            onChange={e => handleUpdate(status.id, 'color', e.target.value)}
                            disabled={!canEdit || status.isProtected}
                            className="p-1 h-10 w-10"
                        />
                        {status.isProtected ? (
                             <span title="This status is protected and cannot be deleted." className="p-2 text-stone-400">
                                <ShieldCheckIcon className="w-5 h-5 text-amber-500" />
                            </span>
                        ) : (
                            <Button variant="secondary" size="sm" onClick={() => handleDelete(status.id)} disabled={!canEdit} icon={TrashIcon} />
                        )}
                    </div>
                ))}
            </div>
            {canEdit && (
                <div className="flex items-center gap-2 pt-2 mt-2 border-t dark:border-gray-700">
                    <Input
                        type="text"
                        placeholder="Add new status..."
                        value={newStatusName}
                        onChange={e => setNewStatusName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="flex-grow"
                    />
                    <Input
                        type="color"
                        value={newStatusColor}
                        onChange={e => setNewStatusColor(e.target.value)}
                        className="p-1 h-10 w-10"
                    />
                    <Button onClick={handleAdd} icon={PlusIcon} />
                </div>
            )}
        </div>
    );
};

export const SystemViewProjectSettings: React.FC<SystemViewProjectSettingsProps> = ({ systemSettings, setSystemSettings, hasPermission, onBack }) => {
    const [settings, setSettings] = useState(systemSettings);
    const canEdit = hasPermission('manageSettings');

    useEffect(() => {
        setSettings(systemSettings);
    }, [systemSettings]);
    
    const handleChange = (field: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateLabels = (pipeline: keyof SystemSettings['labels'], newLabels: CustomLabel[]) => {
        setSettings(prev => ({
            ...prev,
            labels: {
                ...prev.labels,
                [pipeline]: newLabels,
            },
        }));
    };
    
    const handleSave = () => {
        setSystemSettings(settings);
        onBack();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <SectionHeader
                    title="Edit Project Settings"
                    subtitle="Manage numbering, prefixes, and pipeline statuses for projects."
                />
                 <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={!canEdit} icon={SaveIcon}>Save Changes</Button>
                </div>
            </div>

            <div className="max-w-[600px] mx-auto">
                <div className="space-y-8">
                    <SettingsCard title="Numbering & Prefixes">
                        <div className="space-y-4">
                            <Input label="Lead Number Prefix" value={settings.leadNumberPrefix} onChange={e => handleChange('leadNumberPrefix', e.target.value)} disabled={!canEdit} />
                            <Input label="Next Lead Number" type="number" value={settings.leadNextNumber} onChange={e => handleChange('leadNextNumber', parseInt(e.target.value))} disabled={!canEdit} />
                            <Input label="Project Number Prefix" value={settings.projectNumberPrefix} onChange={e => handleChange('projectNumberPrefix', e.target.value)} disabled={!canEdit} />
                            <Input label="Next Project Number" type="number" value={settings.projectNextNumber} onChange={e => handleChange('projectNextNumber', parseInt(e.target.value))} disabled={!canEdit} />
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Pipeline Statuses">
                        <div className="space-y-8">
                            <StatusEditor
                                title="Leads Pipeline"
                                labels={settings.labels.leads}
                                onUpdate={(newLabels) => handleUpdateLabels('leads', newLabels)}
                                canEdit={canEdit}
                            />
                            <StatusEditor
                                title="Sales Pipeline"
                                labels={settings.labels.sales}
                                onUpdate={(newLabels) => handleUpdateLabels('sales', newLabels)}
                                canEdit={canEdit}
                            />
                            <StatusEditor
                                title="Survey Pipeline"
                                labels={settings.labels.survey}
                                onUpdate={(newLabels) => handleUpdateLabels('survey', newLabels)}
                                canEdit={canEdit}
                            />
                            <StatusEditor
                                title="Production Pipeline"
                                labels={settings.labels.production}
                                onUpdate={(newLabels) => handleUpdateLabels('production', newLabels)}
                                canEdit={canEdit}
                            />
                        </div>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};