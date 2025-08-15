import React, { useState, useEffect } from 'react';
import type { SystemSettings, Permission } from '../types';
import { Button, Input, Select } from './common';
import { SaveIcon, ArrowLeftIcon, TrashIcon, PlusIcon, ShieldCheckIcon } from './icons';

interface SystemSettingsEditorProps {
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

const WeekdaySelector: React.FC<{
    selectedDays: string[];
    onChange: (days: string[]) => void;
    disabled?: boolean;
}> = ({ selectedDays, onChange, disabled }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleDayToggle = (day: string) => {
        const newSelection = new Set(selectedDays);
        if (newSelection.has(day)) {
            newSelection.delete(day);
        } else {
            newSelection.add(day);
        }
        onChange(Array.from(newSelection));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workdays</label>
            <div className="mt-2 flex flex-wrap gap-2">
                {days.map(day => (
                    <button
                        type="button"
                        key={day}
                        onClick={() => !disabled && handleDayToggle(day)}
                        disabled={disabled}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                            selectedDays.includes(day)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-gray-700 border-stone-300 dark:border-gray-600 hover:bg-stone-100 dark:hover:bg-gray-600'
                        }`}
                    >
                        {day.substring(0, 3)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const SystemSettingsEditor: React.FC<SystemSettingsEditorProps> = ({ systemSettings, setSystemSettings, hasPermission, onBack }) => {
    const [settings, setSettings] = useState(systemSettings);
    const canEdit = hasPermission('manageSettings');

    useEffect(() => {
        setSettings(systemSettings);
    }, [systemSettings]);

    const handleChange = (field: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (field: keyof NonNullable<SystemSettings['companyAddress']>, value: string) => {
        setSettings(prev => ({
            ...prev,
            companyAddress: {
                ...prev.companyAddress,
                [field]: value,
            } as any,
        }));
    };
    
    const handleSave = () => {
        setSystemSettings(settings);
        onBack();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Edit General Settings</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Update your company's general and profile settings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onBack} icon={ArrowLeftIcon}>Back to Overview</Button>
                    <Button onClick={handleSave} disabled={!canEdit} icon={SaveIcon}>Save Changes</Button>
                </div>
            </div>

            <div className="max-w-[600px] mx-auto">
                <div className="space-y-8">
                    <SettingsCard title="Company Profile">
                        <Input label="Company Name" value={settings.companyName || ''} onChange={e => handleChange('companyName', e.target.value)} disabled={!canEdit} />
                        <Input label="Address Line 1" value={settings.companyAddress?.line1 || ''} onChange={e => handleAddressChange('line1', e.target.value)} disabled={!canEdit} />
                        <Input label="Town/City" value={settings.companyAddress?.townCity || ''} onChange={e => handleAddressChange('townCity', e.target.value)} disabled={!canEdit} />
                        <Input label="County" value={settings.companyAddress?.county || ''} onChange={e => handleAddressChange('county', e.target.value)} disabled={!canEdit} />
                        <Input label="Postcode" value={settings.companyAddress?.postcode || ''} onChange={e => handleAddressChange('postcode', e.target.value)} disabled={!canEdit} />
                        <Input label="Phone" value={settings.companyPhone || ''} onChange={e => handleChange('companyPhone', e.target.value)} disabled={!canEdit} />
                        <Input label="Email" value={settings.companyEmail || ''} onChange={e => handleChange('companyEmail', e.target.value)} disabled={!canEdit} />
                        <Input label="Website" value={settings.companyWebsite || ''} onChange={e => handleChange('companyWebsite', e.target.value)} disabled={!canEdit} />
                    </SettingsCard>

                    <SettingsCard title="Regional & Calendar Settings">
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Time Zone" value={settings.timezone} onChange={e => handleChange('timezone', e.target.value)} disabled={!canEdit} />
                            <Input label="Working Hours Start" type="number" value={settings.workingHoursStart} onChange={e => handleChange('workingHoursStart', parseInt(e.target.value))} disabled={!canEdit} />
                            <Input label="Working Hours End" type="number" value={settings.workingHoursEnd} onChange={e => handleChange('workingHoursEnd', parseInt(e.target.value))} disabled={!canEdit} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Select
                                label="Date Format"
                                value={settings.dateFormat || 'MDY'}
                                onChange={e => handleChange('dateFormat', e.target.value as any)}
                                disabled={!canEdit}
                            >
                                <option value="MDY">Month Day, Year</option>
                                <option value="DMY">Day Month, Year</option>
                                <option value="YMD">Year, Month Day</option>
                            </Select>
                            <Select
                                label="Time Format"
                                value={settings.timeFormat || '24h'}
                                onChange={e => handleChange('timeFormat', e.target.value as any)}
                                disabled={!canEdit}
                            >
                                <option value="24h">24 hour clock</option>
                                <option value="12h">12 hour clock (am/pm)</option>
                            </Select>
                        </div>
                        <div className="mt-4">
                            <Select
                                label="First Day of the Week"
                                value={settings.firstDayOfWeek || 'Monday'}
                                onChange={e => handleChange('firstDayOfWeek', e.target.value as any)}
                                disabled={!canEdit}
                            >
                                <option value="Monday">Monday</option>
                                <option value="Sunday">Sunday</option>
                            </Select>
                        </div>
                        <div className="mt-4">
                            <WeekdaySelector
                                selectedDays={settings.workingWeek}
                                onChange={days => handleChange('workingWeek', days)}
                                disabled={!canEdit}
                            />
                        </div>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};