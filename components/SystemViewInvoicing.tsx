import React, { useState, useEffect } from 'react';
import type { SystemSettings, Permission } from '../types';
import { Button, Select } from './common';
import { SectionHeader } from './SystemViewCommon';

interface SystemViewInvoicingProps {
    systemSettings: SystemSettings;
    setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
    hasPermission: (permission: Permission) => boolean;
}

export const SystemViewInvoicing: React.FC<SystemViewInvoicingProps> = ({ systemSettings, setSystemSettings, hasPermission }) => {
    const [settings, setSettings] = useState(systemSettings);
    const canEdit = hasPermission('manageSettings');

    useEffect(() => {
        setSettings(systemSettings);
    }, [systemSettings]);

    const handleChange = (field: keyof SystemSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        setSystemSettings(settings);
    };

    return (
        <div>
            <SectionHeader 
                title="Quotes & Invoicing Settings"
                subtitle="Configure tax rates, payment terms, and currency."
            />
            <div className="max-w-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 space-y-4">
                    <Select
                        label="Default Currency"
                        value={settings.currency}
                        onChange={e => handleChange('currency', e.target.value)}
                        disabled={!canEdit}
                    >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                    </Select>
                    {/* Other invoicing settings can go here */}
                     <div className="pt-4 border-t dark:border-gray-600 flex justify-end">
                        <Button onClick={handleSave} disabled={!canEdit}>
                            Save Invoicing Settings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};