
import React, { useState, useMemo } from 'react';
import type { Client, Quote, Staff, Permission, SystemSettings, Address, CustomerType, Appointment, Contact, CustomLabel } from '../types';
import { QuoteStatus } from '../types';
import { CrmIcon, MagnifyingGlassIcon, Bars3Icon, ViewColumnsIcon, PencilIcon, MailIcon, PlusIcon, CalendarIcon } from './icons';
import { Button, StatusBadge } from './common';
import { getClientName, formatAddress } from '../utils';
import { CUSTOMER_TYPES } from '../constants';

type AugmentedQuote = Quote & {
    clientName: string;
    assignedStaffName: string;
    totalValue: number;
    primaryContactName: string;
    installationAddressFormatted: string;
};

const KANBAN_STATUSES: QuoteStatus[] = [
    QuoteStatus.QUOTED,
    QuoteStatus.FOLLOW_UP_1,
    QuoteStatus.FOLLOW_UP_2,
    QuoteStatus.WON,
    QuoteStatus.LOST,
];

const QuoteCard: React.FC<{
    quote: AugmentedQuote;
    client: Client;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, quoteId: string) => void;
    onEditQuote: (quoteId: string) => void;
    onGenerateEmail: (quote: Quote, client: Client) => void;
    hasPermission: (permission: Permission) => boolean;
    systemSettings: SystemSettings;
}> = ({ quote, client, onDragStart, onEditQuote, onGenerateEmail, hasPermission, systemSettings }) => {
    const assignedStaff = client.assignedTo ? quote.assignedStaffName.split(' ').map(n => n[0]).join('') : '?';
    
    return (
         <div 
            draggable 
            onDragStart={(e) => onDragStart(e, quote.id)}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100">{quote.clientName}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{quote.quoteNumber}</p>
                </div>
                 <div className="flex gap-1">
                    {hasPermission('sendFollowUpEmails') && [QuoteStatus.QUOTED, QuoteStatus.FOLLOW_UP_1, QuoteStatus.FOLLOW_UP_2].includes(quote.status as QuoteStatus) && (
                        <button onClick={() => onGenerateEmail(quote, client)} className="p-1.5 text-stone-500 hover:text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700" title="Generate Follow-up Email">
                            <MailIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={() => onEditQuote(quote.id)} className="p-1.5 text-stone-500 hover:text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-gray-700" title="View Quote">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">{quote.projectReference || 'No project reference'}</p>
            <div className="mt-4 flex justify-between items-end">
                <p className="font-bold text-lg text-stone-800 dark:text-stone-100">
                     {quote.totalValue.toLocaleString(undefined, { style: 'currency', currency: systemSettings.currency })}
                </p>
                <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-bold flex items-center justify-center" title={`Assigned to ${quote.assignedStaffName}`}>{assignedStaff}</div>
            </div>
        </div>
    )
};

type AugmentedClient = Client & {
  displayName: string;
  primaryContactName: string;
  quoteCount: number;
  assignedStaffName: string;
  assignedStaffInitials: string;
  officeAddressFormatted: string;
  installationAddressFormatted: string;
};

const QuickViewPanel: React.FC<{
    client: AugmentedClient;
    quotes: Quote[];
    appointments: Appointment[];
    navigateTo: (view: any) => void;
}> = ({ client, quotes, appointments, navigateTo }) => {
    const clientQuotes = quotes.filter(q => q.clientId === client.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    const upcomingAppointments = appointments
        .filter(a => a.clientId === client.id && new Date(a.start) > new Date())
        .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 3);
    const latestNote = [...(client.activity || [])]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .find(a => a.type === 'note');
        
    const onEditLead = (clientId: string) => navigateTo({ view: 'leadEditor', clientId: clientId });

    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="space-y-4">
                <h4 className="font-semibold text-stone-700 dark:text-stone-200">Contacts</h4>
                {client.contacts.map(c => (
                    <div key={c.id} className="text-sm">
                        <p className="font-medium">{c.firstName} {c.lastName} {c.isPrimary && <span className="text-xs font-bold text-green-600">(Primary)</span>}</p>
                        <p className="text-stone-500 dark:text-stone-400">{c.email}</p>
                    </div>
                ))}
                 <h4 className="font-semibold text-stone-700 dark:text-stone-200 mt-4">Addresses</h4>
                 <div>
                    <p className="font-medium text-sm">Billing:</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{client.officeAddressFormatted}</p>
                 </div>
                 {client.installationAddress && <div>
                    <p className="font-medium text-sm">Installation:</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{client.installationAddressFormatted}</p>
                 </div>}
            </div>
            <div className="space-y-4">
                <h4 className="font-semibold text-stone-700 dark:text-stone-200">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                    {clientQuotes.length > 0 && clientQuotes.map(q => <p key={q.id}>Quote {q.quoteNumber} - {q.status}</p>)}
                    {upcomingAppointments.length > 0 && upcomingAppointments.map(a => <p key={a.id}>Upcoming: {a.title} on {new Date(a.start).toLocaleDateString()}</p>)}
                    {clientQuotes.length === 0 && upcomingAppointments.length === 0 && <p className="text-stone-500">No recent quotes or appointments.</p>}
                </div>
            </div>
             <div className="space-y-4">
                <h4 className="font-semibold text-stone-700 dark:text-stone-200">Latest Note</h4>
                <p className="text-sm text-stone-500 bg-stone-100 dark:bg-gray-700/50 p-2 rounded italic">
                    {latestNote?.content || 'No notes yet.'}
                </p>
                <Button variant="secondary" onClick={() => onEditLead(client.id)}>View Full Details</Button>
            </div>
        </div>
    );
};

interface CrmViewProps {
    clients: Client[];
    quotes: Quote[];
    staff: Staff[];
    currentUser: Staff;
    onEditQuote: (quoteId: string) => void;
    onCreateQuote: (clientId: string) => void;
    onUpdateQuote: (quote: Quote, showToast?: boolean) => void;
    onGenerateEmail: (quote: Quote, client: Client) => void;
    hasPermission: (permission: Permission) => boolean;
    systemSettings: SystemSettings;
    appointments: Appointment[];
    navigateTo: (view: any) => void;
    onBookAppointment: (clientId: string) => void;
}


export const CrmView: React.FC<CrmViewProps> = ({ clients, quotes, staff, currentUser, onEditQuote, onCreateQuote, onUpdateQuote, onGenerateEmail, hasPermission, systemSettings, appointments, navigateTo, onBookAppointment }) => {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof AugmentedQuote, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<CustomerType | ''>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterDate, setFilterDate] = useState<string>('all'); // '7d', '30d', '90d', 'custom'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');


    const augmentedQuotes = useMemo((): AugmentedQuote[] => {
        return quotes
            .filter(quote => quote.status !== QuoteStatus.NEW && quote.status !== QuoteStatus.APPOINTMENT_BOOKED)
            .map(quote => {
                const client = clients.find(c => c.id === quote.clientId)!;
                if (!client) return null; // Should not happen
                const assignedStaff = staff.find(s => s.id === client.assignedTo);
                const primaryContact = client.contacts.find(c => c.isPrimary);
                return {
                    ...quote,
                    clientName: getClientName(client),
                    assignedStaffName: assignedStaff?.name || 'Unassigned',
                    totalValue: quote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                    primaryContactName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'N/A',
                    installationAddressFormatted: formatAddress(client.installationAddress),
                };
            }).filter((q): q is AugmentedQuote => q !== null);
    }, [quotes, clients, staff]);

    const filteredQuotes = useMemo(() => {
        return augmentedQuotes.filter(quote => {
            const client = clients.find(c => c.id === quote.clientId);
            if (!client) return false;

            const query = searchQuery.toLowerCase().trim();
            if (query && !(
                quote.quoteNumber.toLowerCase().includes(query) ||
                quote.clientName.toLowerCase().includes(query) ||
                (quote.projectReference && quote.projectReference.toLowerCase().includes(query)) ||
                quote.status.toLowerCase().includes(query)
            )) {
                return false;
            }

            if (filterType && client.customerType !== filterType) {
                return false;
            }

            if (filterStatus && quote.status !== filterStatus) {
                return false;
            }
            
            if (filterDate !== 'all') {
                const quoteDate = new Date(quote.date);
                quoteDate.setHours(0, 0, 0, 0);

                if (filterDate === 'custom') {
                    if (customStartDate && quote.date < customStartDate) return false;
                    if (customEndDate && quote.date > customEndDate) return false;
                } else {
                    const days = { '7d': 7, '30d': 30, '90d': 90 }[filterDate];
                    if (days) {
                        const cutoff = new Date();
                        cutoff.setHours(0, 0, 0, 0);
                        cutoff.setDate(cutoff.getDate() - days);
                        if (quoteDate < cutoff) return false;
                    }
                }
            }

            return true;
        });
    }, [augmentedQuotes, clients, searchQuery, filterType, filterStatus, filterDate, customStartDate, customEndDate]);

    const sortedQuotes = useMemo(() => {
        let sortableItems = [...filteredQuotes];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredQuotes, sortConfig]);

    const quotesByStatus = useMemo(() => {
        return KANBAN_STATUSES.reduce((acc, status) => {
            acc[status] = filteredQuotes.filter(q => q.status === status);
            return acc;
        }, {} as Record<QuoteStatus, AugmentedQuote[]>);
    }, [filteredQuotes]);
    
    const requestSort = (key: keyof AugmentedQuote) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, quoteId: string) => {
        setDraggedItemId(quoteId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: QuoteStatus) => {
        e.preventDefault();
        if (!draggedItemId) {
            setDraggedItemId(null);
            return;
        }

        const quoteToUpdate = quotes.find(q => q.id === draggedItemId);

        if (quoteToUpdate && quoteToUpdate.status !== newStatus) {
            onUpdateQuote({ ...quoteToUpdate, status: newStatus });
            
            if (
                hasPermission('sendFollowUpEmails') &&
                [QuoteStatus.FOLLOW_UP_1, QuoteStatus.FOLLOW_UP_2].includes(newStatus)
            ) {
                const client = clients.find(c => c.id === quoteToUpdate.clientId);
                if (client) {
                    onGenerateEmail(quoteToUpdate, client);
                }
            }
        }

        setDraggedItemId(null);
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
    };
    
    const ViewSwitcherButton: React.FC<{
        active: boolean;
        onClick: () => void;
        children: React.ReactNode;
        icon: React.ElementType;
    }> = ({ active, onClick, children, icon: Icon }) => (
        <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md ${active ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-gray-600'}`}>
            <Icon className="w-5 h-5"/>
            {children}
        </button>
    );

    const SortableHeader: React.FC<{ sortKey: keyof AugmentedQuote; children: React.ReactNode; className?: string; }> = ({ sortKey, children, className }) => {
        const isSorted = sortConfig?.key === sortKey;
        const directionIcon = isSorted ? (sortConfig?.direction === 'asc' ? '▲' : '▼') : '';
        return (
            <th className={`p-3 font-semibold uppercase text-stone-500 dark:text-stone-400 cursor-pointer ${className || ''}`} onClick={() => requestSort(sortKey)}>
                <div className="flex items-center gap-2">
                    {children}
                    <span className="text-xs">{directionIcon}</span>
                </div>
            </th>
        );
    };

    return (
        <div className="bg-stone-50 dark:bg-gray-900 flex flex-col h-full">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                 <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <CrmIcon className="w-8 h-8 text-stone-600 dark:text-stone-300" />
                        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Quotes</h1>
                    </div>
                     <div className="flex-1 max-w-lg">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input type="text" placeholder="Search my quotes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-2 pl-10 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"/>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center p-1 bg-stone-100 dark:bg-gray-900 rounded-lg">
                        <ViewSwitcherButton active={viewMode === 'kanban'} onClick={() => setViewMode('kanban')} icon={ViewColumnsIcon}>Email Follow Ups</ViewSwitcherButton>
                        <ViewSwitcherButton active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={Bars3Icon}>List</ViewSwitcherButton>
                        </div>
                    </div>
                </div>
            </header>
            
            {viewMode === 'list' && (
                <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-stone-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs font-semibold text-stone-500">Customer Type</label>
                            <select value={filterType} onChange={e => setFilterType(e.target.value as CustomerType | '')} className="w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg bg-white text-sm">
                                <option value="">All Types</option>
                                {CUSTOMER_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-stone-500">Status</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg bg-white text-sm">
                                <option value="">All Statuses</option>
                                {systemSettings.labels.sales.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-stone-500">Date Range</label>
                            <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg bg-white text-sm">
                                <option value="all">All Time</option>
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        {filterDate === 'custom' && (
                            <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label className="text-xs font-semibold text-stone-500">Start Date</label>
                                    <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg bg-white text-sm dark:[color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-stone-500">End Date</label>
                                    <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg bg-white text-sm dark:[color-scheme:dark]" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {viewMode === 'kanban' ? (
                 <div className="flex-grow overflow-x-auto p-4" onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 h-full min-w-max">
                        {KANBAN_STATUSES.map(status => (
                            <div 
                                key={status} 
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, status)}
                                className="w-80 bg-stone-100 dark:bg-gray-800/50 rounded-lg flex flex-col flex-shrink-0"
                            >
                                <h3 className="text-sm font-semibold uppercase text-stone-500 dark:text-stone-400 p-3 border-b-2 dark:border-gray-700 flex justify-between">
                                    {status}
                                    <span className="text-xs font-normal bg-stone-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{quotesByStatus[status]?.length || 0}</span>
                                </h3>
                                <div className="p-2 space-y-2 overflow-y-auto flex-grow">
                                    {(quotesByStatus[status] || []).map(quote => (
                                        <QuoteCard
                                            key={quote.id}
                                            quote={quote}
                                            client={clients.find(c => c.id === quote.clientId)!}
                                            onDragStart={handleDragStart}
                                            onEditQuote={onEditQuote}
                                            onGenerateEmail={onGenerateEmail}
                                            hasPermission={hasPermission}
                                            systemSettings={systemSettings}
                                        />
                                    ))}
                                    {draggedItemId && <div className="h-20" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto p-4">
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 dark:bg-gray-700/50">
                                <tr>
                                    <SortableHeader sortKey="quoteNumber">Quote #</SortableHeader>
                                    <SortableHeader sortKey="date">Date</SortableHeader>
                                    <SortableHeader sortKey="clientName">Client Name</SortableHeader>
                                    <SortableHeader sortKey="primaryContactName">Primary Contact</SortableHeader>
                                    <SortableHeader sortKey="installationAddressFormatted">Installation Address</SortableHeader>
                                    <SortableHeader sortKey="status">Status</SortableHeader>
                                    <SortableHeader sortKey="totalValue" className="text-right">Value</SortableHeader>
                                    <th className="p-3 font-semibold uppercase text-stone-500 dark:text-stone-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                                {sortedQuotes.map(quote => (
                                    <React.Fragment key={quote.id}>
                                        <tr onClick={() => setExpandedQuoteId(prev => prev === quote.id ? null : quote.id)} className="hover:bg-stone-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                            <td className="p-3 font-medium">{quote.quoteNumber}</td>
                                            <td className="p-3">{new Date(quote.date).toLocaleDateString()}</td>
                                            <td className="p-3 font-bold text-stone-800 dark:text-stone-100">{quote.clientName}</td>
                                            <td className="p-3">{quote.primaryContactName}</td>
                                            <td className="p-3 text-xs">{quote.installationAddressFormatted}</td>
                                            <td className="p-3"><StatusBadge status={quote.status} /></td>
                                            <td className="p-3 whitespace-nowrap text-right font-semibold">{quote.totalValue.toLocaleString(undefined, { style: 'currency', currency: systemSettings.currency })}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onBookAppointment(quote.clientId); }} icon={CalendarIcon} title="Book Appointment" />
                                                    <Button variant="secondary" className="px-3 py-2 text-xs font-semibold" onClick={(e) => { e.stopPropagation(); navigateTo({ view: 'leadEditor', clientId: quote.clientId }); }}>Lead Details</Button>
                                                    <Button className="px-3 py-2 text-xs font-semibold" onClick={(e) => { e.stopPropagation(); onEditQuote(quote.id); }}>View Quote</Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedQuoteId === quote.id && (
                                            <tr className="bg-stone-100 dark:bg-gray-800/50">
                                                <td colSpan={8} className="p-0">
                                                    {(() => {
                                                        const client = clients.find(c => c.id === quote.clientId);
                                                        if (!client) return null;

                                                        const augmentedClient: AugmentedClient = {
                                                            ...client,
                                                            displayName: getClientName(client),
                                                            primaryContactName: client.contacts.find(c=>c.isPrimary) ? `${client.contacts.find(c=>c.isPrimary)!.firstName} ${client.contacts.find(c=>c.isPrimary)!.lastName}` : 'No primary contact',
                                                            quoteCount: quotes.filter(q => q.clientId === client.id).length,
                                                            assignedStaffName: staff.find(s => s.id === client.assignedTo)?.name || 'Unassigned',
                                                            assignedStaffInitials: staff.find(s => s.id === client.assignedTo)?.initials || '?',
                                                            officeAddressFormatted: formatAddress(client.officeAddress),
                                                            installationAddressFormatted: formatAddress(client.installationAddress),
                                                        };
                                                        
                                                        return <QuickViewPanel client={augmentedClient} quotes={quotes} appointments={appointments} navigateTo={navigateTo} />
                                                    })()}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};