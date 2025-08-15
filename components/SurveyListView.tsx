import React from 'react';
import type { Quote, Client, Staff, Address } from '../types';
import { ClipboardCheckIcon, CalendarIcon } from './icons';
import { Button, StatusBadge } from './common';
import { getClientName, formatAddress } from '../utils';

interface SurveyListViewProps {
    quotes: Quote[];
    clients: Client[];
    staff: Staff[];
    navigateTo: (view: any) => void;
}

export const SurveyListView: React.FC<SurveyListViewProps> = ({ quotes, clients, staff, navigateTo }) => {
    return (
        <div className="bg-stone-50 dark:bg-gray-900 flex flex-col h-full">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <ClipboardCheckIcon className="w-8 h-8 text-stone-600 dark:text-stone-300" />
                        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Surveys in Progress</h1>
                    </div>
                </div>
            </header>
            
            <main className="flex-grow p-8 overflow-y-auto">
                {quotes.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-stone-200 dark:border-gray-700">
                                <tr>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Quote #</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Client</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Project Ref.</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Surveyor</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Survey Status</th>
                                    <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400 text-center">Items</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                                {quotes.map(quote => {
                                    const client = clients.find(c => c.id === quote.clientId);
                                    const assignedSurveyor = staff.find(s => s.id === quote.surveyorId);
                                    return (
                                        <tr key={quote.id} className="hover:bg-stone-50 dark:hover:bg-gray-700/50">
                                            <td className="p-4 font-medium text-stone-800 dark:text-stone-100">{quote.quoteNumber}</td>
                                            <td className="p-4 text-stone-600 dark:text-stone-300">
                                                {client && (
                                                    <>
                                                        <p className="font-medium">{getClientName(client)}</p>
                                                        <p className="text-xs text-stone-500 dark:text-stone-400">{formatAddress(client.installationAddress || client.officeAddress)}</p>
                                                    </>
                                                )}
                                            </td>
                                            <td className="p-4 text-stone-600 dark:text-stone-300">{quote.projectReference || <span className="text-stone-400 dark:text-stone-500">Unassigned</span>}</td>
                                            <td className="p-4 text-stone-600 dark:text-stone-300">{assignedSurveyor?.name || <span className="text-stone-400 dark:text-stone-500">Unassigned</span>}</td>
                                            <td className="p-4"><StatusBadge status={quote.surveyStatus} /></td>
                                            <td className="p-4 text-center text-stone-600 dark:text-stone-300">{quote.items.length}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => navigateTo({ view: 'surveyBooking', quoteId: quote.id })}
                                                        icon={CalendarIcon}
                                                        title="Book Survey Appointment"
                                                    />
                                                    <Button
                                                        onClick={() => navigateTo({ view: 'surveyEditor', quoteId: quote.id })}
                                                    >
                                                        Open Survey
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-stone-200 dark:border-gray-700">
                        <ClipboardCheckIcon className="w-12 h-12 mx-auto text-stone-400 dark:text-stone-500" />
                        <h3 className="mt-4 text-lg font-medium text-stone-800 dark:text-stone-100">All Surveys Complete</h3>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                            There are no quotes currently awaiting survey.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};
