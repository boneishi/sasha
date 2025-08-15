import React from 'react';
import { Cog6ToothIcon } from './icons';

interface DevelopmentProps {
    title: string;
    description: string;
    icon?: React.ElementType;
}

export const Development: React.FC<DevelopmentProps> = ({ title, description, icon: Icon = Cog6ToothIcon }) => {
    return (
        <div className="bg-stone-50 dark:bg-gray-900 h-full flex items-center justify-center text-center p-4">
            <div>
                <Icon className="w-16 h-16 mx-auto text-stone-400 dark:text-stone-500" />
                <h2 className="mt-6 text-2xl font-bold text-stone-800 dark:text-stone-100">{title}</h2>
                <p className="mt-2 text-lg text-stone-500 dark:text-stone-400">
                    This feature is coming soon.
                </p>
                <p className="mt-1 text-sm text-stone-400 dark:text-stone-500 max-w-md mx-auto">
                    {description}
                </p>
            </div>
        </div>
    );
};
