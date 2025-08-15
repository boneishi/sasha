
import React, { useState, useMemo } from 'react';
import type { Client, Quote, Staff, Team, Permission, CustomerType, SystemSettings, Appointment } from '../types';
import { PlusIcon, UserGroupIcon, MagnifyingGlassIcon, PencilIcon, CalendarIcon } from './icons';
import { CUSTOMER_TYPES } from '../constants';
import { Button, StatusBadge } from './common';
import { formatAddress } from '../utils';

interface CustomerViewProps {
    clients: Client[];
    quotes: Quote[];
    staff: Staff[];
    teams: Team[];
    appointments: Appointment[];
    onViewQuotes: (clientId: string) => void;
    onEditLead: (clientId: string) => void;
    onCreateQuote: (clientId: string) => void;
    currentUser: Staff;
    hasPermission: (permission: Permission) => boolean;
    onOpenFile: (file: { name: string; dataUrl: string; }) => void;
    onAssignFile: (file: { name: string; dataUrl: string; }, client: Client) => void;
    systemSettings: SystemSettings;
    onBookAppointment: (prefilledClientId: string) => void;
    onAddNewLead: () => void;
}

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
    onEditLead: (clientId: string) => void;
}> = ({ client, quotes, appointments, onEditLead }) => {
    const clientQuotes = quotes.filter(q => q.clientId === client.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    const upcomingAppointments = appointments
        .filter(a => a.clientId === client.id && new Date(a.start) > new Date())
        .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 3);
    const latestNote = [...(client.activity || [])]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .find(a => a.type === 'note');

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

export const CustomerView: React.FC<CustomerViewProps> = ({ clients, quotes, staff, teams, onViewQuotes, onEditLead, onCreateQuote, hasPermission, systemSettings, onBookAppointment, onAddNewLead, appointments }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<CustomerType | ''>('');
    const [filterStaff, setFilterStaff] = useState<string>('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof AugmentedClient; direction: 'asc' | 'desc' } | null>({ key: 'displayName', direction: 'asc' });
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

    const augmentedClients = useMemo((): AugmentedClient[] => {
        return clients.map(client => {
            const assignedStaffMember = staff.find(s => s.id === client.assignedTo);
            const clientQuotes = quotes.filter(q => q.clientId === client.id);
            const primaryContact = client.contacts.find(c => c.isPrimary);
            
            return {
                ...client,
                displayName: client.companyName || (primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : ''),
                primaryContactName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'No primary contact',
                quoteCount: clientQuotes.length,
                assignedStaffName: assignedStaffMember?.name || 'Unassigned',
                assignedStaffInitials: assignedStaffMember?.initials || '?',
                officeAddressFormatted: formatAddress(client.officeAddress),
                installationAddressFormatted: formatAddress(client.installationAddress),
            }
        });
    }, [clients, quotes, staff]);

    const requestSort = (key: keyof AugmentedClient) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const sortedClients = useMemo(() => {
        let sortableItems = [...augmentedClients].filter(client => {
            const query = searchQuery.toLowerCase().trim();
            if (query && !(
                client.displayName.toLowerCase().includes(query) ||
                (client.contacts[0] && client.contacts[0].email.toLowerCase().includes(query)) ||
                (client.officeAddressFormatted.toLowerCase().includes(query)) ||
                (client.installationAddressFormatted.toLowerCase().includes(query)) ||
                client.leadNumber.toLowerCase().includes(query)
            )) {
                return false;
            }
            if (filterType && client.customerType !== filterType) {
                return false;
            }
            if (filterStaff && client.assignedTo !== filterStaff) {
                return false;
            }
            return true;
        });

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
    }, [augmentedClients, searchQuery, filterType, filterStaff, sortConfig]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterType('');
        setFilterStaff('');
    };

    const filtersAreActive = searchQuery || filterType || filterStaff;

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
        <div className="bg-stone-50 dark:bg-gray-900 flex flex-col h-full">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <UserGroupIcon className="w-8 h-8 text-stone-600 dark:text-stone-300" />
                        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Leads</h1>
                    </div>
                    <div className="flex-1 max-w-lg">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input type="text" placeholder="Search by name, email, address..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-2 pl-10 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"/>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={onAddNewLead} disabled={!hasPermission('manageClients')} icon={PlusIcon}>
                            Add New Lead
                        </Button>
                    </div>
                </div>
            </header>
            
            <main className="flex-grow p-8 overflow-y-auto">
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-stone-200 dark:border-gray-700 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <select value={filterType} onChange={e => setFilterType(e.target.value as CustomerType | '')} className="w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg bg-white">
                                <option value="">All Customer Types</option>
                                {CUSTOMER_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)} className="w-full p-2 border border-stone-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg bg-white">
                                <option value="">All Staff</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        {filtersAreActive && (
                           <div className="flex items-center justify-end md:col-start-3">
                                <button onClick={handleClearFilters} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3 font-semibold uppercase text-stone-500 dark:text-stone-400 w-24">Lead #</th>
                                <SortableHeader sortKey="displayName">Name / Company</SortableHeader>
                                <SortableHeader sortKey="primaryContactName">Primary Contact</SortableHeader>
                                <SortableHeader sortKey="officeAddressFormatted">Office Address</SortableHeader>
                                <SortableHeader sortKey="installationAddressFormatted">Installation Address</SortableHeader>
                                <SortableHeader sortKey="label">Status</SortableHeader>
                                <SortableHeader sortKey="assignedStaffName">Assigned</SortableHeader>
                                <th className="p-3 font-semibold uppercase text-stone-500 dark:text-stone-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                            {sortedClients.map(client => (
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
                                                    onClick={(e) => { e.stopPropagation(); onEditLead(client.id); }}
                                                    disabled={!hasPermission('manageClients')}
                                                    className="p-1.5"
                                                    title="Edit Lead"
                                                >
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="p-3 font-bold text-stone-800 dark:text-stone-100">
                                            {client.displayName}
                                        </td>
                                        <td className="p-3 font-medium text-stone-700 dark:text-stone-200">{client.primaryContactName}</td>
                                        <td className="p-3 text-xs">{client.officeAddressFormatted}</td>
                                        <td className="p-3 text-xs">{client.installationAddressFormatted}</td>
                                        <td className="p-3">
                                            <StatusBadge status={client.label} />
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <div className="w-6 h-6 rounded-full bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-bold flex items-center justify-center">{client.assignedStaffInitials}</div>
                                                <span>{client.assignedStaffName}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2 justify-end">
                                                <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onBookAppointment(client.id); }} icon={CalendarIcon} title="Book Appointment" />
                                                <Button variant="secondary" className="px-3 py-2 text-xs font-semibold" onClick={(e) => { e.stopPropagation(); onCreateQuote(client.id); }} disabled={!hasPermission('manageQuotes')}>New Quote</Button>
                                                <Button
                                                    variant="secondary"
                                                    className="px-3 py-2 text-xs font-semibold"
                                                    onClick={(e) => { e.stopPropagation(); onViewQuotes(client.id); }}>
                                                    Quotes
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedClientId === client.id && (
                                        <tr className="bg-stone-100 dark:bg-gray-800/50">
                                            <td colSpan={8} className="p-0">
                                                <QuickViewPanel 
                                                    client={client} 
                                                    quotes={quotes} 
                                                    appointments={appointments} 
                                                    onEditLead={onEditLead}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {sortedClients.length === 0 && (
                        <div className="text-center py-16 px-6">
                            <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-stone-400" />
                            <h3 className="mt-4 text-lg font-medium">No Leads Found</h3>
                            <p className="mt-1 text-sm text-stone-500">
                                {filtersAreActive ? 'Your filters did not match any leads.' : 'There are no leads to display.'}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
