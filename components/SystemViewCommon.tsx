import React from 'react';
import { Button } from './common';
import { PlusIcon } from './icons';

export const TabButton: React.FC<{ icon: React.ElementType, label: string, isActive: boolean, onClick: () => void, disabled?: boolean }> = ({ icon: Icon, label, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <Icon className="w-5 h-5"/>
        <span>{label}</span>
    </button>
);

export const SectionHeader: React.FC<{ title: string, subtitle: string, onAdd?: () => void, addLabel?: string, addDisabled?: boolean }> = ({ title, subtitle, onAdd, addLabel, addDisabled=false }) => (
    <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{title}</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{subtitle}</p>
        </div>
        {onAdd && addLabel && (
            <Button onClick={onAdd} disabled={addDisabled} icon={PlusIcon}>
                {addLabel}
            </Button>
        )}
    </div>
);
