
import React, { useMemo, useState } from 'react';
import type { Client, Quote, Staff, SystemSettings, Appointment, Contact, Address } from '../types';
import { HomeIcon, TrophyIcon, FunnelIcon, MailIcon, UserGroupIcon, CalendarIcon, PlusIcon, PencilIcon } from './icons';
import { Button, StatusBadge } from './common';
import { getClientName, formatAddress } from '../utils';

interface SalesDashboardProps {
    currentUser: Staff;
    clients: Client[];
    quotes: Quote[];
    staff: Staff[];
    systemSettings: SystemSettings;
    appointments: Appointment[];
    navigateTo: (view: any) => void;
    onCreateQuote: (clientId: string) => void;
    onBookAppointment: (prefilledClientId: string) => void;
    onAddNewLead: () => void;
}

type DateRange = 'all' | '7d' | '30d';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-stone-200 dark:border-gray-700 flex items-center gap-3">
        <div className={`p-2 rounded-full ${color}`}>
            <Icon className="w-4 h-4 text-white"/>
        </div>
        <div>
            <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{title}</h4>
            <p className="text-xl font-bold text-stone-800 dark:text-stone-100">{value}</p>
        </div>
    </div>
);

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


export const SalesDashboard: React.FC<SalesDashboardProps> = ({ currentUser, clients, quotes, staff, systemSettings, appointments, navigateTo, onCreateQuote, onBookAppointment, onAddNewLead }) => {
    
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof AugmentedClient; direction: 'asc' | 'desc' } | null>({ key: 'displayName', direction: 'asc' });

    const formatCurrency = (value: number) => {
        return value.toLocaleString(undefined, { style: 'currency', currency: systemSettings.currency });
    };

    const myClients = useMemo(() => clients.filter(c => c.assignedTo === currentUser.id), [clients, currentUser.id]);
    const myQuotes = useMemo(() => quotes.filter(q => myClients.some(c => c.id === q.clientId)), [quotes, myClients]);

    const isWithinRange = (dateString: string) => {
        if (dateRange === 'all') return true;
        const date = new Date(dateString);
        const now = new Date();
        const daysToSubtract = dateRange === '7d' ? 7 : 30;
        const cutoffDate = new Date(new Date().setDate(now.getDate() - daysToSubtract));
        return date >= cutoffDate;
    };

    const augmentedMyClients = useMemo((): AugmentedClient[] => {
        return myClients.map(client => {
            const assignedStaffMember = staff.find(s => s.id === client.assignedTo);
            const clientQuotes = quotes.filter(q => q.clientId === client.id);
            const primaryContact = client.contacts.find(c => c.isPrimary);
            
            return {
                ...client,
                displayName: getClientName(client),
                primaryContactName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'No primary contact',
                quoteCount: clientQuotes.length,
                assignedStaffName: assignedStaffMember?.name || 'Unassigned',
                assignedStaffInitials: assignedStaffMember?.initials || '?',
                officeAddressFormatted: formatAddress(client.officeAddress),
                installationAddressFormatted: formatAddress(client.installationAddress),
            }
        });
    }, [myClients, quotes, staff]);

    const requestSort = (key: keyof AugmentedClient) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedLeads = useMemo(() => {
        let sortableItems = [...augmentedMyClients].filter(c => isWithinRange(c.createdAt));
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
    }, [augmentedMyClients, dateRange, sortConfig]);

    const kpis = useMemo(() => {
        const myLeadsCount = myClients.filter(c => isWithinRange(c.createdAt)).length;
        
        const filteredQuotes = myQuotes.filter(q => isWithinRange(q.date));
        
        const myQuotesSent = filteredQuotes.filter(q => ['Quoted', 'Follow Up 1', 'Follow Up 2', 'Won', 'Lost'].includes(q.status)).length;
        
        const myWonQuotes = filteredQuotes.filter(q => q.status === 'Won');
        const myValueWon = myWonQuotes.reduce((acc, q) => acc + q.items.reduce((iAcc, i) => iAcc + i.price * i.quantity, 0), 0);
        
        const relevantForConversion = filteredQuotes.filter(q => ['Won', 'Lost'].includes(q.status));
        const conversionRate = relevantForConversion.length > 0 ? (myWonQuotes.length / relevantForConversion.length) * 100 : 0;
        
        return {
            myLeadsCount,
            myQuotesSent,
            myValueWon,
            conversionRate,
        };
    }, [myClients, myQuotes, dateRange]);
    
    const DateFilterButton: React.FC<{ label: string; range: DateRange }> = ({ label, range }) => (
        <button
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${dateRange === range ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-gray-600'}`}
        >
            {label}
        </button>
    );
    
    const SortableHeader: React.FC<{ sortKey: keyof AugmentedClient; children: React.ReactNode; className?: string; }> = ({ sortKey, children, className }) => {
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
        <div className="bg-stone-50 dark:bg-gray-900 min-h-full overflow-y-auto p-8">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="flex-shrink-0">
                    <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
                    <p className="text-stone-500 dark:text-stone-400">Here's a look at your sales activity.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center p-1 bg-stone-100 dark:bg-gray-900 rounded-lg">
                        <DateFilterButton label="Last 7 Days" range="7d" />
                        <DateFilterButton label="Last 30 Days" range="30d" />
                        <DateFilterButton label="All Time" range="all" />
                    </div>
                     <Button onClick={onAddNewLead} icon={PlusIcon}>Add New Lead</Button>
                </div>
            </header>
            
            <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-4 flex-shrink-0 mb-8">
                <KpiCard title="New Leads" value={kpis.myLeadsCount.toString()} icon={UserGroupIcon} color="bg-cyan-500" />
                <KpiCard title="Quotes Sent" value={kpis.myQuotesSent.toString()} icon={MailIcon} color="bg-blue-500" />
                <KpiCard title="Value Won" value={formatCurrency(kpis.myValueWon)} icon={TrophyIcon} color="bg-green-500" />
                <KpiCard title="Conversion Rate" value={`${kpis.conversionRate.toFixed(1)}%`} icon={FunnelIcon} color="bg-orange-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-stone-200 dark:border-gray-700 mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">My Leads</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[1024px]">
                        <thead className="bg-stone-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3 font-semibold uppercase text-stone-500 dark:text-stone-400 w-24">Lead #</th>
                                <SortableHeader sortKey="displayName">Name / Company</SortableHeader>
                                <SortableHeader sortKey="primaryContactName">Primary Contact</SortableHeader>
                                <SortableHeader sortKey="officeAddressFormatted">Office Address</SortableHeader>
                                <SortableHeader sortKey="installationAddressFormatted">Installation Address</SortableHeader>
                                <SortableHeader sortKey="label">Status</SortableHeader>
                                <th className="p-3 font-semibold uppercase text-stone-500 dark:text-stone-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                            {sortedLeads.map(client => (
                                <React.Fragment key={client.id}>
                                    <tr 
                                        onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                                        className="hover:bg-stone-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                    >
                                        <td className="p-3 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <span>{client.leadNumber}</span>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); navigateTo({ view: 'leadEditor', clientId: client.id }); }}
                                                    className="p-1.5"
                                                    title="Edit Lead"
                                                >
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="p-3 font-bold text-stone-800 dark:text-stone-100">{client.displayName}</td>
                                        <td className="p-3 font-medium text-stone-700 dark:text-stone-200">{client.primaryContactName}</td>
                                        <td className="p-3 text-xs">{client.officeAddressFormatted}</td>
                                        <td className="p-3 text-xs">{client.installationAddressFormatted}</td>
                                        <td className="p-3"><StatusBadge status={client.label} /></td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onBookAppointment(client.id); }} icon={CalendarIcon} title="Book Appointment" />
                                                <Button variant="secondary" className="px-3 py-2 text-xs font-semibold" onClick={(e) => { e.stopPropagation(); onCreateQuote(client.id); }}>New Quote</Button>
                                                <Button variant="secondary" className="px-3 py-2 text-xs font-semibold" onClick={(e) => { e.stopPropagation(); navigateTo({ view: 'quoteList', clientId: client.id }); }}>Quotes</Button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedClientId === client.id && (
                                        <tr className="bg-stone-100 dark:bg-gray-800/50">
                                            <td colSpan={7} className="p-0">
                                                <QuickViewPanel 
                                                    client={client} 
                                                    quotes={quotes} 
                                                    appointments={appointments} 
                                                    navigateTo={navigateTo}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedLeads.length === 0 && <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-8">No leads found for the selected period.</p>}
            </div>
        </div>
    );
};
