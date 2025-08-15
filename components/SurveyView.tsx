

import React, { useState, useMemo } from 'react';
import type { Client, Quote, QuoteItem, Material, Staff, Role, SystemSettings } from '../types';
import { ArrowLeftIcon, CheckmarkIcon, ClipboardCheckIcon, PencilIcon, UserCircleIcon, FileTextIcon, CalendarIcon } from './icons';
import { Input, Select, StatusBadge } from './common';
import { getClientName } from '../utils';

interface SurveyViewProps {
    quote: Quote;
    client: Client;
    materials: Material[];
    staff: Staff[];
    roles: Role[];
    onEditSurveyItem: (quoteId: string, itemId: string) => void;
    onCompleteSurvey: (quote: Quote) => void;
    onAssignSurveyor: (quoteId: string, surveyorId: string) => void;
    onBack: () => void;
    systemSettings: SystemSettings;
    onUpdateQuote: (quote: Quote, showToast?: boolean) => void;
}

const ItemStatusBadge: React.FC<{ complete?: boolean }> = ({ complete }) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full inline-flex items-center gap-1.5";
    if (complete) {
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`}><CheckmarkIcon className="w-3 h-3"/> Complete</span>
    }
    return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`}>Pending</span>
}

export const SurveyView: React.FC<SurveyViewProps> = ({ quote, client, materials, staff, roles, onEditSurveyItem, onCompleteSurvey, onAssignSurveyor, onBack, systemSettings, onUpdateQuote }) => {
    
    const allItemsComplete = quote.items.every(item => item.surveyComplete);
    const readyForProductionStatus = systemSettings.labels.survey.find(s => s.name.toLowerCase().includes('ready for production'))?.name || 'Ready for Production';


    const handleComplete = () => {
        if (!quote.surveyorId) {
            alert("Please assign a surveyor before completing the survey.");
            return;
        }
        if(window.confirm("Are you sure you want to mark this survey as complete and send it to production?")) {
            onCompleteSurvey({ ...quote, status: 'Ready for Production', surveyStatus: readyForProductionStatus });
            onBack();
        }
    }
    
    const getMaterialName = (id: string) => materials.find(m => m.id === id)?.name || 'N/A';

    const surveyors = useMemo(() => {
        const surveyorRole = roles.find(r => r.permissions.includes('conductSurveys'));
        if (!surveyorRole) return [];
        return staff.filter(s => s.roleId === surveyorRole.id);
    }, [staff, roles]);

    const handleSurveyStatusChange = (newStatus: string) => {
        onUpdateQuote({ ...quote, surveyStatus: newStatus });
    };

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-gray-900">
            {/* Header */}
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700">
                             <ArrowLeftIcon className="w-6 h-6 text-stone-600 dark:text-stone-300"/>
                        </button>
                        <div>
                             <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">Survey: {quote.quoteNumber}</h1>
                             <p className="text-sm text-stone-500 dark:text-stone-400">
                                For <span className="font-medium text-stone-700 dark:text-stone-200">{getClientName(client)}</span>
                            </p>
                        </div>
                    </div>
                     <button 
                        onClick={handleComplete}
                        disabled={!allItemsComplete}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed">
                        <CheckmarkIcon className="w-5 h-5" />
                        Mark Survey as Complete
                    </button>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-grow p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 mb-6">
                        <h3 className="font-semibold text-lg mb-2 text-stone-800 dark:text-stone-100">Survey Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Assigned Surveyor</label>
                                <Select value={quote.surveyorId || ''} onChange={(e) => onAssignSurveyor(quote.id, e.target.value)}>
                                    <option value="">-- Unassigned --</option>
                                    {surveyors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </Select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Project Number</label>
                                <Input
                                    type="text"
                                    value={quote.projectReference || (quote.surveyorId ? "Generating..." : "Assign surveyor to generate")}
                                    disabled
                                    className="bg-stone-100 dark:bg-gray-700/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Survey Status</label>
                                 <Select value={quote.surveyStatus || ''} onChange={(e) => handleSurveyStatusChange(e.target.value)}>
                                    <option value="">-- No Status --</option>
                                    {systemSettings.labels.survey.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>

                    <ul className="space-y-4">
                        {quote.items.map(item => {
                            const firstInstance = item.windowInstances[0];
                            const uniqueGlassTypeIds = [...new Set(item.paneGlassTypes?.map(p => p.glassTypeId) || [])];
                            const glassNames = uniqueGlassTypeIds
                                .map(id => getMaterialName(id))
                                .filter(Boolean)
                                .join(', ');

                            return (
                                <li key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-gray-700 flex items-start justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-lg text-stone-800 dark:text-stone-100">Item #{item.itemNumber}: {item.location}</h3>
                                            <ItemStatusBadge complete={item.surveyComplete} />
                                        </div>

                                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm text-stone-600 dark:text-stone-300">
                                            <div><strong>Type:</strong> {item.itemType} ({item.windowInstances.length})</div>
                                            <div><strong>Width:</strong> {firstInstance.overallWidth}mm</div>
                                            <div><strong>Height:</strong> {firstInstance.overallHeight}mm</div>
                                            <div><strong>Frame:</strong> {getMaterialName(item.materialFrameId)}</div>
                                            <div><strong>Sash:</strong> {getMaterialName(item.materialSashId)}</div>
                                            <div><strong>Cill:</strong> {getMaterialName(item.materialCillId)}</div>
                                            <div className="col-span-3"><strong>Glass:</strong> {glassNames || 'N/A'}</div>
                                            <div className="col-span-3"><strong>Hinges:</strong> {item.ironmongery.hinges}</div>
                                            <div className="col-span-3"><strong>Locking:</strong> {item.ironmongery.mpls}</div>
                                            {item.trims && <div className="col-span-3"><strong>Trims:</strong> {item.trims}</div>}
                                            {item.surveyorNotes && <div className="col-span-3 mt-2 pt-2 border-t dark:border-gray-700"><strong>Notes:</strong> <span className="italic">{item.surveyorNotes}</span></div>}
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => onEditSurveyItem(quote.id, item.id)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 text-stone-700 dark:text-stone-200 font-semibold rounded-md hover:bg-stone-50 dark:hover:bg-gray-600">
                                        <PencilIcon className="w-4 h-4" />
                                        {item.surveyComplete ? 'Re-Survey' : 'Open Survey Editor'}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </main>
        </div>
    );
};