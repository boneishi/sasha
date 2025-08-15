import React, { useState, useMemo } from 'react';
import type { Client, Quote, QuoteItem } from '../types';
import { Modal } from './Modal';

interface AssignFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileToAssign: { name: string; dataUrl: string; } | null;
    client: Client | null;
    quotes: Quote[];
    onAssign: (file: { name: string; dataUrl: string; }, quoteId: string, itemId: string) => void;
}

export const AssignFileModal: React.FC<AssignFileModalProps> = ({ isOpen, onClose, fileToAssign, client, quotes, onAssign }) => {
    const [selectedQuoteId, setSelectedQuoteId] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');

    const clientQuotes = useMemo(() => {
        if (!client) return [];
        return quotes.filter(q => q.clientId === client.id);
    }, [client, quotes]);

    const quoteItems = useMemo(() => {
        const selectedQuote = clientQuotes.find(q => q.id === selectedQuoteId);
        return selectedQuote?.items || [];
    }, [selectedQuoteId, clientQuotes]);

    const handleAssign = () => {
        if (fileToAssign && selectedQuoteId && selectedItemId) {
            onAssign(fileToAssign, selectedQuoteId, selectedItemId);
            onClose();
        }
    };
    
    // Reset state when modal opens
    useState(() => {
        if (isOpen) {
            setSelectedQuoteId('');
            setSelectedItemId('');
        }
    });

    if (!isOpen || !fileToAssign || !client) return null;

    const primaryContact = client.contacts.find(c => c.isPrimary);
    const clientName = client.companyName || (primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'this client');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Assign File: ${fileToAssign.name}`}>
            <div className="space-y-4">
                <p>Assign this file to a specific item in one of {clientName}'s quotes.</p>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">1. Select Quote</label>
                    <select
                        value={selectedQuoteId}
                        onChange={e => {
                            setSelectedQuoteId(e.target.value);
                            setSelectedItemId(''); // Reset item when quote changes
                        }}
                        className="mt-1 w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md bg-white"
                    >
                        <option value="">-- Select a Quote --</option>
                        {clientQuotes.map(quote => (
                            <option key={quote.id} value={quote.id}>
                                {quote.quoteNumber} - {quote.projectReference || 'No Reference'}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedQuoteId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">2. Select Item</label>
                        <select
                            value={selectedItemId}
                            onChange={e => setSelectedItemId(e.target.value)}
                            disabled={quoteItems.length === 0}
                            className="mt-1 w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md bg-white"
                        >
                            <option value="">-- Select an Item --</option>
                            {quoteItems.map(item => (
                                <option key={item.id} value={item.id}>
                                    Item #{item.itemNumber} - {item.location}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                    <button
                        type="button"
                        onClick={handleAssign}
                        disabled={!selectedQuoteId || !selectedItemId}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
                    >
                        Assign File
                    </button>
                </div>
            </div>
        </Modal>
    );
};