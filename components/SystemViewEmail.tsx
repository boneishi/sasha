import React from 'react';
import type { SystemSettings, Permission } from '../types';
import { Input, Select, Button } from './common';
import { ArrowLeftIcon } from './icons';

interface SystemViewEmailProps {
    systemSettings: SystemSettings;
    setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
    hasPermission: (permission: Permission) => boolean;
    onBack: () => void;
}

export const SystemViewEmail: React.FC<SystemViewEmailProps> = ({ systemSettings, setSystemSettings, hasPermission, onBack }) => {
    
    const canEdit = hasPermission('manageSettings');

    const handleChange = (field: keyof SystemSettings, value: any) => {
        setSystemSettings(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        // In a real app, you'd save to a backend here.
        onBack();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Email Integration (SMTP)</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Configure your own email server to send emails directly from the app.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={onBack} icon={ArrowLeftIcon}>Back to Settings</Button>
                </div>
            </div>

            <div className="max-w-2xl">
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Server</label>
                            <Input type="text" placeholder="smtp.example.com" value={systemSettings.smtpServer || ''} onChange={e => handleChange('smtpServer', e.target.value)} disabled={!canEdit} className="mt-1"/>
                        </div>

                         <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Port</label>
                                <Input type="number" placeholder="587" value={systemSettings.smtpPort || ''} onChange={e => handleChange('smtpPort', Number(e.target.value))} disabled={!canEdit} className="mt-1"/>
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Encryption</label>
                                <Select value={systemSettings.smtpEncryption || 'starttls'} onChange={e => handleChange('smtpEncryption', e.target.value)} disabled={!canEdit} className="mt-1">
                                    <option value="none">None</option>
                                    <option value="ssl">SSL/TLS</option>
                                    <option value="starttls">STARTTLS</option>
                                </Select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                            <Input type="text" placeholder="your-email@example.com" value={systemSettings.smtpUser || ''} onChange={e => handleChange('smtpUser', e.target.value)} disabled={!canEdit} className="mt-1"/>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <Input type="password" placeholder="••••••••••••" value={systemSettings.smtpPass || ''} onChange={e => handleChange('smtpPass', e.target.value)} disabled={!canEdit} className="mt-1"/>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">"From" Address</label>
                            <Input type="email" placeholder="sales@example.com" value={systemSettings.smtpFromAddress || ''} onChange={e => handleChange('smtpFromAddress', e.target.value)} disabled={!canEdit} className="mt-1"/>
                        </div>

                        <div className="pt-4 border-t dark:border-gray-600 flex justify-end gap-3">
                            <Button variant="secondary" disabled={!canEdit} onClick={() => alert("Test connection not implemented.")}>
                                Test Connection
                            </Button>
                            <Button disabled={!canEdit} onClick={handleSave}>
                                Save SMTP Settings
                            </Button>
                        </div>

                    </div>
                 </div>
            </div>
        </div>
    );
};