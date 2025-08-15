import React from 'react';
import type { ComponentTemplate, Permission } from '../types';
import { SectionHeader } from './SystemViewCommon';
import { Button } from './common';
import { PencilIcon, TrashIcon, PlusIcon, DocumentDuplicateIcon } from './icons';
import { ComponentTemplatePreview } from './ComponentTemplatePreview';

interface SystemViewComponentTemplatesProps {
    componentTemplates: ComponentTemplate[];
    setComponentTemplates: React.Dispatch<React.SetStateAction<ComponentTemplate[]>>;
    hasPermission: (permission: Permission) => boolean;
    navigateTo: (view: any) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const formatApplicableTo = (applicableTo: ('Sash' | 'Casement' | 'Door' | 'Screen')[]) => {
    if (!applicableTo || applicableTo.length === 0) {
        return 'Component';
    }
    if (applicableTo.length === 1) {
        return `${applicableTo[0]} Component`;
    }
    const last = applicableTo[applicableTo.length - 1];
    const rest = applicableTo.slice(0, -1);
    return `${rest.join(', ')} and ${last} Component`;
};

export const SystemViewComponentTemplates: React.FC<SystemViewComponentTemplatesProps> = ({
    componentTemplates,
    setComponentTemplates,
    hasPermission,
    navigateTo,
    addToast
}) => {
    const canEdit = hasPermission('manageProductConfigurations');

    const handleAdd = () => {
        navigateTo({ view: 'componentEditor' });
    };

    const handleEdit = (template: ComponentTemplate) => {
        navigateTo({ view: 'componentEditor', templateId: template.id });
    };

    const handleDelete = (template: ComponentTemplate) => {
        if (window.confirm(`Are you sure you want to delete the component "${template.name}"?`)) {
            setComponentTemplates(prev => prev.filter(t => t.id !== template.id));
            addToast("Component template deleted.", "info");
        }
    };

    const handleCopy = (templateToCopy: ComponentTemplate) => {
        if (!canEdit) return;

        const newTemplate: ComponentTemplate = JSON.parse(JSON.stringify(templateToCopy));

        newTemplate.id = `ct-${Date.now()}`;
        newTemplate.name = `${templateToCopy.name} (Copy)`;

        if (newTemplate.layout) {
            const layout = newTemplate.layout;

            if (layout.instances) {
                const instanceIdMap = new Map<string, string>();
                layout.instances = layout.instances.map(instance => {
                    const oldInstanceId = instance.id;
                    const newInstanceId = `inst-ct-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    instanceIdMap.set(oldInstanceId, newInstanceId);
                    return { ...instance, id: newInstanceId };
                });

                if (layout.placedSashes) {
                    layout.placedSashes = layout.placedSashes.map(sash => {
                        let newPaneId = sash.paneId;
                        for (const [oldId, newId] of instanceIdMap.entries()) {
                            if (sash.paneId.startsWith(oldId)) {
                                newPaneId = sash.paneId.replace(oldId, newId);
                                break;
                            }
                        }

                        const newGlazingBars = sash.glazingBars?.map(bar => ({
                            ...bar,
                            id: `gb-ct-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                        }));

                        return { ...sash, paneId: newPaneId, glazingBars: newGlazingBars };
                    });
                }
            }

            if (layout.mullions) {
                layout.mullions = layout.mullions.map(m => ({
                    ...m,
                    id: `m-ct-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                }));
            }

            if (layout.transoms) {
                layout.transoms = layout.transoms.map(t => ({
                    ...t,
                    id: `t-ct-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                }));
            }
        }

        setComponentTemplates(prev => [...prev, newTemplate]);
        addToast(`Component copied. Now editing "${newTemplate.name}".`, 'success');
        navigateTo({ view: 'componentEditor', templateId: newTemplate.id });
    };
    
    return (
        <div>
            <SectionHeader
                title="Component Templates"
                subtitle="Manage reusable window and door components like sashes, leafs, or fixed lights."
                onAdd={handleAdd}
                addLabel="Add Component"
                addDisabled={!canEdit}
            />
            {componentTemplates.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {componentTemplates.map(t => {
                        const applicableToString = formatApplicableTo(t.applicableTo);
                        return (
                        <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col">
                            <div className="h-48">
                                <ComponentTemplatePreview template={t} />
                            </div>
                            <div className="p-3 border-t dark:border-gray-700 flex-grow">
                                <p className="font-semibold truncate" title={t.name}>{t.name}</p>
                                <p className="text-xs text-stone-500 dark:text-stone-400 truncate" title={applicableToString}>{applicableToString}</p>
                            </div>
                            <div className="p-2 border-t dark:border-gray-700 mt-auto bg-stone-50 dark:bg-gray-800/50 flex justify-end gap-1">
                                <button onClick={() => handleCopy(t)} disabled={!canEdit} className="p-2 text-stone-500 hover:text-green-600 disabled:opacity-50" title="Copy"><DocumentDuplicateIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleEdit(t)} disabled={!canEdit} className="p-2 text-stone-500 hover:text-blue-600 disabled:opacity-50" title="Edit"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(t)} disabled={!canEdit} className="p-2 text-stone-500 hover:text-red-600 disabled:opacity-50" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                 <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-dashed border-stone-200 dark:border-gray-700">
                    <p className="text-sm text-stone-500 dark:text-stone-400">No component templates found.</p>
                </div>
            )}
        </div>
    )
};