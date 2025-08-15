import React, { useState } from 'react';
import type { Quote, Client, Staff, SystemSettings, Appointment, Address, Contact } from '../types';
import { ArrowLeftIcon, CalendarIcon, SparklesIcon, UserCircleIcon, MapPinIcon } from './icons';
import { suggestSurveyAppointments } from '../services/geminiService';
import { Button } from './common';

interface SurveyBookingViewProps {
    quote: Quote;
    client: Client;
    surveyor: Staff | undefined;
    appointments: Appointment[];
    systemSettings: SystemSettings;
    onBack: () => void;
    onOpenAppointmentModal: (appointment: Appointment | null, prefilledClientId?: string) => void;
}

const formatAddress = (address?: Address) => {
    if (!address) return 'N/A';
    return [address.line1, address.line2, address.townCity, address.county, address.postcode].filter(Boolean).join(', ');
};

const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
    <div className="p-3 bg-stone-100 dark:bg-gray-700/50 rounded-lg">
        <p className="font-semibold">{contact.firstName} {contact.lastName} {contact.isPrimary && <span className="text-xs font-bold text-green-600">(Primary)</span>}</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{contact.email}</p>
        <p className="text-sm text-stone-500 dark:text-stone-400">{contact.phone}</p>
    </div>
);

type Suggestion = { start: string; end: string; justification: string };

export const SurveyBookingView: React.FC<SurveyBookingViewProps> = ({ quote, client, surveyor, appointments, systemSettings, onBack, onOpenAppointmentModal }) => {
    
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetSuggestions = async () => {
        if (!surveyor) {
            setError("A surveyor must be assigned to the project first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await suggestSurveyAppointments(surveyor, appointments, client, systemSettings);
            setSuggestions(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleBookSlot = (suggestion: Suggestion) => {
        if (!surveyor) return;
        const newAppointment: Appointment = {
            id: '', // Will be generated on save
            title: `Survey - ${quote.projectReference || quote.quoteNumber}`,
            start: suggestion.start,
            end: suggestion.end,
            staffId: surveyor.id,
            clientId: client.id,
            quoteId: quote.id,
            reason: 'Survey'
        };
        onOpenAppointmentModal(newAppointment, undefined);
    };

    return (
        <div className="bg-stone-50 dark:bg-gray-900 min-h-full overflow-y-auto">
            <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-stone-200 dark:border-gray-700 z-10 sticky top-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700">
                             <ArrowLeftIcon className="w-6 h-6 text-stone-600 dark:text-stone-300"/>
                        </button>
                        <div>
                             <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">Book Survey Appointment</h1>
                             <p className="text-sm text-stone-500 dark:text-stone-400">
                                For Project: {quote.projectReference || quote.quoteNumber}
                            </p>
                        </div>
                    </div>
                </div>
            </header>
            <main className="p-8 max-w-5xl mx-auto">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Project Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><MapPinIcon className="w-5 h-5"/> Site & Surveyor</h3>
                            <div className="space-y-3 text-sm">
                                <p><strong className="text-stone-500 dark:text-stone-400">Address:</strong> {formatAddress(client.installationAddress || client.officeAddress)}</p>
                                 <p><strong className="text-stone-500 dark:text-stone-400">Surveyor:</strong> {surveyor?.name || <span className="text-orange-500">Unassigned</span>}</p>
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><UserCircleIcon className="w-5 h-5"/> Project Contacts</h3>
                            <div className="space-y-2">
                               {client.contacts.map(c => <ContactCard key={c.id} contact={c} />)}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Scheduling */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
                            <h3 className="font-semibold text-lg mb-2">Schedule Appointment</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Get AI-powered suggestions based on the surveyor's availability and proximity to other jobs.</p>
                            
                            <Button size="lg" onClick={handleGetSuggestions} disabled={!surveyor || isLoading} icon={SparklesIcon}>
                                {isLoading ? 'Thinking...' : 'Get AI Suggestions'}
                            </Button>

                            {error && <p className="text-red-500 mt-4">{error}</p>}
                            
                            <div className="mt-6 space-y-3">
                                {suggestions.map((s, i) => (
                                    <div key={i} className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{new Date(s.start).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
                                            <p className="text-sm text-blue-700 dark:text-blue-300 italic">"{s.justification}"</p>
                                        </div>
                                        <Button size="md" onClick={() => handleBookSlot(s)} icon={CalendarIcon}>Book this slot</Button>
                                    </div>
                                ))}

                                {!isLoading && suggestions.length > 0 && (
                                     <p className="text-center text-sm text-stone-500 dark:text-stone-400 pt-4">...or book a different time manually in the main calendar.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}