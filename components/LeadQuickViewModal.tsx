import React from 'react';
import type { Client, Quote, Appointment, Contact, Address } from '../types';
import { Modal } from './Modal';
import { Button } from './common';
import { getClientName, formatAddress } from '../utils';
import { UserCircleIcon, MapPinIcon, ClockIcon, PencilIcon, PlusIcon, CalendarIcon, FileTextIcon } from './icons';
import { QuoteStatus } from '../types';

interface LeadQuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    quotes: Quote[];
    appointments: Appointment[];
    onEditLead: (clientId: string) => void;
    onCreateQuote: (clientId: string) => void;
    onBookAppointment: (clientId: string) => void;
}

const InfoSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; }> = ({ title, icon: Icon, children }) => (
    <div>
        <h3 className="text-sm font-semibold uppercase text-stone-500 dark:text-stone-400 flex items-center gap-2 mb-3 border-b dark:border-gray-600 pb-2">
            <Icon className="w-5 h-5" />
            {title}
        </h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
    <div className="text-sm">
        <p className="font-semibold text-stone-800 dark:text-stone-100">{contact.firstName} {contact.lastName} {contact.isPrimary && <span className="text-xs font-bold text-green-600">(Primary)</span>}</p>
        <p className="text-stone-600 dark:text-stone-300">{contact.email}</p>
        <p className="text-stone-600 dark:text-stone-300">{contact.phone}</p>
    </div>
);

const QuoteStatusBadgeSmall: React.FC<{ status: QuoteStatus }> = ({ status }) => {
    const statusClasses: Record<QuoteStatus, string> = {
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

export const LeadQuickViewModal: React.FC<LeadQuickViewModalProps> = ({ isOpen, onClose, client, quotes, appointments, onEditLead, onCreateQuote, onBookAppointment }) => {
    if (!isOpen || !client) return null;

    const clientQuotes = quotes.filter(q => q.clientId === client.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    const clientAppointments = appointments.filter(a => a.clientId === client.id).sort((a,b) => new Date(b.start).getTime() - new Date(a.start).getTime()).slice(0, 3);
    const latestNote = [...(client.activity || [])]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .find(a => a.type === 'note');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Quick View: ${getClientName(client)}`} size="4xl">
            <div className="flex flex-col" style={{height: '70vh'}}>
                 {/* Fixed Header within Modal */}
                 <div className="flex-shrink-0 p-4 border-b dark:border-gray-700 flex justify-between items-center bg-stone-50 dark:bg-gray-800 -m-4 mb-0">
                    <div>
                        <p className="text-sm text-stone-500 dark:text-stone-400">Lead #{client.leadNumber} | Created: {new Date(client.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => onBookAppointment(client.id)} icon={CalendarIcon}>Book Appointment</Button>
                        <Button onClick={() => onCreateQuote(client.id)} icon={PlusIcon}>Add Quote</Button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 overflow-y-auto -mx-6 px-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <InfoSection title="Contacts" icon={UserCircleIcon}>
                            {client.contacts.map(c => <ContactCard key={c.id} contact={c} />)}
                        </InfoSection>

                        <InfoSection title="Addresses" icon={MapPinIcon}>
                            <div>
                                <h4 className="font-semibold text-stone-700 dark:text-stone-200">Office / Billing</h4>
                                <p className="text-sm text-stone-600 dark:text-stone-300">{formatAddress(client.officeAddress)}</p>
                            </div>
                            {client.installationAddress && (
                                <div className="mt-3">
                                    <h4 className="font-semibold text-stone-700 dark:text-stone-200">Installation</h4>
                                    <p className="text-sm text-stone-600 dark:text-stone-300">{formatAddress(client.installationAddress)}</p>
                                </div>
                            )}
                        </InfoSection>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                         <InfoSection title="Recent Activity" icon={ClockIcon}>
                            {clientQuotes.length === 0 && clientAppointments.length === 0 && <p className="text-sm text-stone-500">No recent activity.</p>}
                            {clientQuotes.map(q => (
                                <div key={q.id} className="text-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{q.quoteNumber} <span className="font-normal text-stone-500 dark:text-stone-400">- {new Date(q.date).toLocaleDateString()}</span></p>
                                        <p className="text-stone-600 dark:text-stone-300">{q.projectReference || 'No Reference'}</p>
                                    </div>
                                    <QuoteStatusBadgeSmall status={q.status as QuoteStatus} />
                                </div>
                            ))}
                             {clientAppointments.map(a => (
                                <div key={a.id} className="text-sm">
                                    <p className="font-semibold">{a.title} <span className="font-normal text-stone-500 dark:text-stone-400">- {new Date(a.start).toLocaleDateString()}</span></p>
                                </div>
                            ))}
                        </InfoSection>

                        <InfoSection title="Notes" icon={FileTextIcon}>
                            <div className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap bg-stone-50 dark:bg-gray-700/50 p-3 rounded-md max-h-48 overflow-y-auto">
                                {latestNote?.content || 'No notes for this lead.'}
                            </div>
                        </InfoSection>
                    </div>
                </div>

                {/* Fixed Footer within Modal */}
                <div className="flex-shrink-0 p-4 border-t dark:border-gray-700 flex justify-end -m-4 mt-0">
                    <Button variant="secondary" onClick={() => onEditLead(client.id)} icon={PencilIcon}>
                        View Full Details
                    </Button>
                </div>
            </div>
        </Modal>
    );
};