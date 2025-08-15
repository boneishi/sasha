
import React from 'react';
import type { Client, Quote, SystemSettings } from '../types';
import { QuoteStatus } from '../types';
import { ArrowLeftIcon, PlusIcon, FileTextIcon } from './icons';
import { Button } from './common';
import { getClientName } from '../utils';

interface QuoteListViewProps {
    client: Client;
    quotes: Quote[];
    onBack: () => void;
    onEditQuote: (quoteId: string) => void;
    onCreateQuote: (clientId: string) => void;
    systemSettings: SystemSettings;
}

const QuoteStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusClasses: Record<string, string> = {
        [QuoteStatus.NEW]: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        [QuoteStatus.APPOINTMENT_BOOKED]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        [QuoteStatus.QUOTED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        [QuoteStatus.FOLLOW_UP_1]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        [QuoteStatus.FOLLOW_UP_2]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        [QuoteStatus.WON]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        [QuoteStatus.LOST]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        [QuoteStatus.SURVEY]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        [QuoteStatus.READY_FOR_PRODUCTION]: 'bg-indigo-500 text-white dark:bg-indigo-700 dark:text-gray-200',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

export const QuoteListView: React.FC<QuoteListViewProps> = ({ client, quotes, onBack, onEditQuote, onCreateQuote, systemSettings }) => {

    const formatCurrency = (value: number) => {
        return value.toLocaleString(undefined, { style: 'currency', currency: systemSettings.currency });
    };

    const sortedQuotes = [...quotes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-stone-50 dark:bg-gray-900 min-h-full overflow-y-auto">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-stone-200 dark:border-gray-700 z-10 sticky top-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700">
                             <ArrowLeftIcon className="w-6 h-6 text-stone-600 dark:text-stone-300"/>
                        </button>
                        <div>
                             <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">Quotes for {getClientName(client)}</h1>
                             <p className="text-sm text-stone-500 dark:text-stone-400">
                                {client.leadNumber}
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => onCreateQuote(client.id)} icon={PlusIcon}>
                        Create New Quote
                    </Button>
                </div>
            </header>
            <main className="p-8">
                 <div className="max-w-5xl mx-auto">
                    {sortedQuotes.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-stone-200 dark:border-gray-700">
                                    <tr>
                                        <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Quote #</th>
                                        <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Date</th>
                                        <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Project Ref.</th>
                                        <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Status</th>
                                        <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400 text-right">Value</th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                                    {sortedQuotes.map(quote => {
                                        const totalValue = quote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                                        return (
                                            <tr key={quote.id} className="hover:bg-stone-50 dark:hover:bg-gray-700/50">
                                                <td className="p-4 font-medium text-stone-800 dark:text-stone-100">{quote.quoteNumber}</td>
                                                <td className="p-4 text-stone-600 dark:text-stone-300">{new Date(quote.date).toLocaleDateString()}</td>
                                                <td className="p-4 text-stone-600 dark:text-stone-300">{quote.projectReference || <span className="text-stone-400 dark:text-stone-500">N/A</span>}</td>
                                                <td className="p-4"><QuoteStatusBadge status={quote.status} /></td>
                                                <td className="p-4 text-right font-semibold">{formatCurrency(totalValue)}</td>
                                                <td className="p-4 text-right">
                                                    <Button onClick={() => onEditQuote(quote.id)}>
                                                        Open
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-20 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-stone-200 dark:border-gray-700">
                            <FileTextIcon className="w-12 h-12 mx-auto text-stone-400 dark:text-stone-500" />
                            <h3 className="mt-4 text-lg font-medium text-stone-800 dark:text-stone-100">No Quotes Found</h3>
                            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                This client doesn't have any quotes yet.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
