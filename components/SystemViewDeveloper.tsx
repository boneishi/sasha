import React from 'react';
import type { SystemSettings, Module } from '../types';
import { SectionHeader } from './SystemViewCommon';
import { ALL_MODULES } from '../constants';

interface SystemViewDeveloperProps {
    systemSettings: SystemSettings;
    setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

const ToggleSwitch: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}> = ({ label, checked, onChange, disabled }) => (
    <label htmlFor={label} className={`flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="relative">
            <input 
                type="checkbox" 
                id={label}
                className="sr-only" 
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={`block w-14 h-8 rounded-full ${disabled ? 'bg-gray-400' : 'bg-gray-600'}`}></div>
            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform"></div>
        </div>
        <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
            {label}
        </div>
        <style>{`
            input:checked ~ .dot {
                transform: translateX(100%);
            }
            input:checked ~ .block {
                background-color: #2563eb;
            }
        `}</style>
    </label>
);

export const SystemViewDeveloper: React.FC<SystemViewDeveloperProps> = ({ systemSettings, setSystemSettings }) => {
    
    const handleModuleToggle = (moduleId: Module, isEnabled: boolean) => {
        setSystemSettings(prev => {
            const enabledModules = new Set(prev.enabledModules);
            if (isEnabled) {
                enabledModules.add(moduleId);
            } else {
                enabledModules.delete(moduleId);
            }
            return {
                ...prev,
                enabledModules: Array.from(enabledModules)
            };
        });
    };

    return (
        <div>
            <SectionHeader 
                title="Developer Settings"
                subtitle="Enable or disable application modules for all users."
            />
            <div className="max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-lg mb-4">Module Management</h3>
                    <div className="space-y-4">
                        {ALL_MODULES.map(module => (
                             <ToggleSwitch
                                key={module.id}
                                label={module.name}
                                checked={systemSettings.enabledModules.includes(module.id)}
                                onChange={(checked) => handleModuleToggle(module.id, checked)}
                                disabled={module.disabled}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};