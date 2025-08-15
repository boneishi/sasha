import React from 'react';
import { ProductionIcon } from './icons';
import { Development } from './Development';

export const ProductionView: React.FC = () => {
    return (
        <div className="bg-stone-50 dark:bg-gray-900 flex flex-col h-full">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                 <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <ProductionIcon className="w-8 h-8 text-stone-600 dark:text-stone-300" />
                        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Production Schedule</h1>
                    </div>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto">
                <Development 
                    title="Production Planning"
                    description="Manage your manufacturing workflow, track job progress, and generate cutting lists."
                    icon={ProductionIcon}
                />
            </main>
        </div>
    );
};
