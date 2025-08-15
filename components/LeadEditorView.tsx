
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Client, Staff, Team, Appointment, CustomerType, Contact, Address, Email, EmailTemplate, Quote, ContactRole, Activity, SystemSettings } from '../types';
import { QuoteStatus } from '../types';
import { ArrowLeftIcon, SaveIcon, PlusIcon, TrashIcon, UserCircleIcon, MailIcon, EnvelopeIcon, UploadIcon, FileTextIcon, ChevronLeftIcon, ChevronRightIcon, ChatBubbleLeftRightIcon, PencilIcon, CalendarIcon, PhoneIcon, VideoCameraIcon } from './icons';
import { Button, Input, Select, TextArea } from './common';
import { CUSTOMER_TYPES, CONTACT_ROLES } from '../constants';
import { getClientName, formatTimeAgo } from '../utils';

const getBlankClient = (): Client => ({
    id: `client-${Date.now()}`,
    leadNumber: '', // This will be assigned on save
    contacts: [
        { id: `contact-${Date.now()}-1`, firstName: '', lastName: '', email: '', phone: '', isPrimary: true, role: 'Client' },
        { id: `contact-${Date.now()}-2`, firstName: '', lastName: '', email: '', phone: '', isPrimary: false, role: 'Client' }
    ],
    officeAddress: { line1: '', townCity: '', county: '', postcode: '' },
    createdAt: new Date().toISOString(),
    lastContacted: new Date().toISOString(),
    activity: [],
    assignedTo: '',
    customerType: 'Homeowner',
    label: '', // Initial status, will be set on save
    emails: [],
    files: [],
});

interface LeadEditorViewProps {
    client?: Client;
    staff: Staff[];
    teams: Team[];
    appointments: Appointment[];
    onSaveClient: (client: Client) => void;
    onBack: () => void;
    quotes: Quote[];
    emailTemplates: EmailTemplate[];
    currentUser: Staff;
    systemSettings: SystemSettings;
}

export const LeadEditorView: React.FC<LeadEditorViewProps> = ({ client, staff, teams, appointments, onSaveClient, onBack, quotes, emailTemplates, currentUser, systemSettings }) => {
    const [isNewLead, setIsNewLead] = useState(!client);
    const [formData, setFormData] = useState<Client>(client ? JSON.parse(JSON.stringify(client)) : getBlankClient());
    const [activeTab, setActiveTab] = useState<'details' | 'appointments' | 'emails' | 'files' | 'activity'>('details');

    const [isComposing, setIsComposing] = useState(false);
    const [composition, setComposition] = useState({ subject: '', body: ''});
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [calendarDate, setCalendarDate] = useState(new Date());
    
    // State for the new activity logger
    const [activeLoggerTab, setActiveLoggerTab] = useState<'note' | 'call' | 'meeting'>('note');
    const [newNote, setNewNote] = useState('');
    const [callLog, setCallLog] = useState({ direction: 'outgoing' as 'incoming' | 'outgoing', summary: '' });
    const [meetingLog, setMeetingLog] = useState({ subject: '', notes: '' });

    useEffect(() => {
        setIsNewLead(!client);
        let initialData = client ? JSON.parse(JSON.stringify(client)) : getBlankClient();
        
        // Ensure there are always at least two contact forms
        if (initialData.contacts.length < 2) {
            const contactsToAdd = 2 - initialData.contacts.length;
            for (let i = 0; i < contactsToAdd; i++) {
                initialData.contacts.push({ 
                    id: `contact-${Date.now()}-${i}`, 
                    firstName: '', 
                    lastName: '', 
                    email: '', 
                    phone: '', 
                    isPrimary: false, 
                    role: 'Client' 
                });
            }
        }

        setFormData(initialData);
        setActiveTab('details');
    }, [client]);

    const handleChange = (field: keyof Client, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (addressType: 'officeAddress' | 'installationAddress', field: keyof Address, value: string) => {
        setFormData(prev => {
            const currentAddress = prev[addressType] || { line1: '', townCity: '', county: '', postcode: '' };
            return {
                ...prev,
                [addressType]: {
                    ...currentAddress,
                    [field]: value
                }
            };
        });
    };

    const handleContactChange = (contactId: string, field: keyof Contact, value: any) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.map(c => c.id === contactId ? { ...c, [field]: value } : c)
        }));
    };

    const handleSetPrimary = (contactId: string) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.map(c => ({...c, isPrimary: c.id === contactId}))
        }));
    };

    const handleAddContact = () => {
        const newContact: Contact = { id: `contact-${Date.now()}`, firstName: '', lastName: '', email: '', phone: '', isPrimary: formData.contacts.length === 0, role: 'Client' };
        setFormData(prev => ({ ...prev, contacts: [...prev.contacts, newContact]}));
    };

    const handleDeleteContact = (contactId: string) => {
        const contactToDelete = formData.contacts.find(c => c.id === contactId);
        if (contactToDelete?.isPrimary && formData.contacts.length > 1) {
            alert("You cannot delete the primary contact. Please set another contact as primary first.");
            return;
        }
        if (formData.contacts.length <= 2) { // Changed this logic
            alert("The first two contacts cannot be removed.");
            return;
        }
        setFormData(prev => ({...prev, contacts: prev.contacts.filter(c => c.id !== contactId)}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveClient(formData);
        if (isNewLead) {
            onBack();
        }
    };
    
    const TabButton: React.FC<{
        label: string;
        isActive: boolean;
        onClick: () => void;
    }> = ({ label, isActive, onClick }) => (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 px-4 py-3 text-sm font-bold text-center transition-colors rounded-t-lg ${isActive ? 'bg-white dark:bg-gray-800 text-blue-600' : 'bg-stone-100 dark:bg-gray-800/50 text-stone-500 hover:bg-stone-200 dark:hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    const clientAppointments = client ? appointments.filter(a => a.clientId === client.id).sort((a,b) => new Date(b.start).getTime() - new Date(a.start).getTime()) : [];
    const clientEmails = formData.emails || [];

    const handleSelectTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = emailTemplates.find(t => t.id === templateId);
        if (!template) return;
        
        const primaryContact = formData.contacts.find(c => c.isPrimary);
        const clientName = primaryContact ? primaryContact.firstName : getClientName(formData);
        const latestQuote = quotes.length > 0 ? quotes[0] : null; // Quotes are pre-sorted by date
        const latestAppointment = clientAppointments.length > 0 ? clientAppointments[0] : null;

        let subject = template.subject;
        let body = template.body;

        const replacements: Record<string, string | undefined> = {
            '\\[Client Name\\]': clientName,
            '\\[User Name\\]': currentUser.name,
            '\\[Quote Number\\]': latestQuote?.quoteNumber,
            '\\[Quote Date\\]': latestQuote ? new Date(latestQuote.date).toLocaleDateString() : undefined,
            '\\[Appointment Date\\]': latestAppointment ? new Date(latestAppointment.start).toLocaleDateString() : undefined,
            '\\[Appointment Time\\]': latestAppointment ? new Date(latestAppointment.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
            if (value) {
                subject = subject.replace(new RegExp(placeholder, 'g'), value);
                body = body.replace(new RegExp(placeholder, 'g'), value);
            }
        }

        setComposition({ subject, body });
    };
    
    const handleSendEmail = () => {
        const primaryContact = formData.contacts.find(c => c.isPrimary);
        if (!primaryContact?.email) {
            alert("Primary contact does not have an email address.");
            return;
        }

        const newEmail: Email = {
            id: `email-${Date.now()}`,
            direction: 'outgoing',
            subject: composition.subject,
            body: composition.body,
            timestamp: new Date().toISOString(),
        };

        handleChange('emails', [...(formData.emails || []), newEmail]);
        alert("Email added to history. Save changes to persist.");
        setIsComposing(false);
        setComposition({ subject: '', body: '' });
        setSelectedTemplateId('');
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newFile = { name: file.name, dataUrl: reader.result as string };
                    setFormData(prev => ({
                        ...prev,
                        files: [...(prev.files || []), newFile]
                    }));
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleDeleteFile = (fileIndex: number) => {
        setFormData(prev => {
            const updatedFiles = [...(prev.files || [])];
            updatedFiles.splice(fileIndex, 1);
            return { ...prev, files: updatedFiles };
        });
    };

    const handlePostActivity = (type: 'note' | 'call_log' | 'meeting_log') => {
        let content = '';
        let shouldUpdateLastContacted = false;
    
        if (type === 'note') {
            if (!newNote.trim()) return;
            content = newNote.trim();
        } else if (type === 'call_log') {
            if (!callLog.summary.trim()) return;
            content = JSON.stringify(callLog);
            shouldUpdateLastContacted = true;
        } else if (type === 'meeting_log') {
            if (!meetingLog.subject.trim() && !meetingLog.notes.trim()) return;
            content = JSON.stringify(meetingLog);
            shouldUpdateLastContacted = true;
        }
    
        const activity: Activity = {
            id: `act-${Date.now()}`,
            type,
            timestamp: new Date().toISOString(),
            staffId: currentUser.id,
            content,
        };
        
        setFormData(prev => ({
            ...prev,
            activity: [activity, ...(prev.activity || [])],
            lastContacted: shouldUpdateLastContacted ? new Date().toISOString() : prev.lastContacted,
        }));
    
        // Reset inputs
        setNewNote('');
        setCallLog({ direction: 'outgoing', summary: '' });
        setMeetingLog({ subject: '', notes: '' });
    };

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const endOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    const dayOfWeek = startDate.getDay();
    const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startDate.setDate(diff);

    const daysInCalendar = [];
    const tempDate = new Date(startDate);
    while (daysInCalendar.length < 42) {
        daysInCalendar.push(new Date(tempDate));
        tempDate.setDate(tempDate.getDate() + 1);
    }

    const appointmentsByDay = clientAppointments.reduce((acc, appt) => {
        const day = new Date(appt.start).toDateString();
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day].push(appt);
        return acc;
    }, {} as Record<string, Appointment[]>);

    const sortedActivity = useMemo(() => {
        return [...(formData.activity || [])].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [formData.activity]);

    const activityIconMap: Record<Activity['type'], React.ElementType> = {
        note: FileTextIcon,
        label_change: PencilIcon,
        email_sent: EnvelopeIcon,
        appointment_created: CalendarIcon,
        quote_created: FileTextIcon,
        file_uploaded: UploadIcon,
        call_log: PhoneIcon,
        meeting_log: VideoCameraIcon,
    };

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-gray-900">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple/>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700">
                                <ArrowLeftIcon className="w-6 h-6 text-stone-600 dark:text-stone-300"/>
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                                    {isNewLead ? 'Add New Lead' : 'Lead Details'}
                                </h1>
                                {!isNewLead && client && (
                                    <p className="text-sm text-stone-500 dark:text-stone-400">
                                        {getClientName(client)}
                                        <span className="text-stone-400 dark:text-stone-500 mx-1">|</span>
                                        {client.leadNumber}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button type="submit" icon={SaveIcon}>
                            {isNewLead ? 'Save New Lead' : 'Save Changes'}
                        </Button>
                    </div>
                </header>
                <main className="flex-grow pt-6 px-8 pb-8 overflow-y-auto">
                    <div className="max-w-3xl mx-auto">
                         <div className="border-b border-stone-200 dark:border-gray-700 bg-stone-100 dark:bg-gray-800/50 rounded-t-lg">
                             <nav className="flex" aria-label="Tabs">
                                 <TabButton label="Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                                 {!isNewLead && <TabButton label="Appointments" isActive={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />}
                                 {!isNewLead && <TabButton label="Emails" isActive={activeTab === 'emails'} onClick={() => setActiveTab('emails')} />}
                                 {!isNewLead && <TabButton label="Files" isActive={activeTab === 'files'} onClick={() => setActiveTab('files')} />}
                                 <TabButton label="Activity" isActive={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
                             </nav>
                         </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-b-lg border border-t-0 dark:border-gray-700">
                            {activeTab === 'details' && (
                                <div className="space-y-8">
                                    {/* Contacts Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold text-lg text-stone-700 dark:text-stone-200">Contacts</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            {formData.contacts.map((contact, index) => (
                                                <div key={contact.id} className="p-3 bg-stone-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <UserCircleIcon className="w-5 h-5 text-stone-400"/>
                                                                <span className="font-semibold">
                                                                    {index === 0 ? 'Primary Contact' : index === 1 ? 'Secondary Contact' : `Contact ${index + 1}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button type="button" onClick={() => handleSetPrimary(contact.id)} disabled={contact.isPrimary} className="text-xs font-semibold disabled:text-green-600 disabled:cursor-default text-stone-500 hover:text-green-600">
                                                                {contact.isPrimary ? 'Primary' : 'Set as Primary'}
                                                            </button>
                                                            {index > 1 && (
                                                                <button type="button" onClick={() => handleDeleteContact(contact.id)} className="p-1 text-stone-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Input placeholder="First Name" value={contact.firstName} onChange={e => handleContactChange(contact.id, 'firstName', e.target.value)} required={contact.isPrimary} />
                                                        <Input placeholder="Last Name" value={contact.lastName} onChange={e => handleContactChange(contact.id, 'lastName', e.target.value)} required={contact.isPrimary} />
                                                        <Input type="email" placeholder="Email" value={contact.email} onChange={e => handleContactChange(contact.id, 'email', e.target.value)} required={contact.isPrimary} />
                                                        <Input type="tel" placeholder="Phone" value={contact.phone} onChange={e => handleContactChange(contact.id, 'phone', e.target.value)} />
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Type</label>
                                                            <Select value={contact.role || 'Client'} onChange={e => handleContactChange(contact.id, 'role', e.target.value as any)}>
                                                                {CONTACT_ROLES.map(role => (
                                                                    <option key={role} value={role}>{role}</option>
                                                                ))}
                                                            </Select>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                                            <TextArea placeholder="Contact-specific notes..." value={contact.notes || ''} onChange={e => handleContactChange(contact.id, 'notes', e.target.value)} rows={2} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                         <div className="mt-4">
                                            <Button type="button" variant="secondary" size="sm" onClick={handleAddContact} icon={PlusIcon}>Add Another Contact</Button>
                                        </div>
                                    </div>

                                    {/* Lead Details Section */}
                                    <div>
                                        <h3 className="font-semibold text-lg text-stone-800 dark:text-stone-100 mb-4">Lead Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                                <Input type="text" placeholder="Company (optional)" value={formData.companyName || ''} onChange={e => handleChange('companyName', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Type</label>
                                                <Select value={formData.customerType || 'Homeowner'} onChange={e => handleChange('customerType', e.target.value as CustomerType)}>
                                                    {CUSTOMER_TYPES.map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                            {!isNewLead && (
                                              <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lead Status</label>
                                                    <Select value={formData.label || ''} onChange={e => handleChange('label', e.target.value)}>
                                                        {systemSettings.labels.leads.map(status => (
                                                            <option key={status.id} value={status.name}>{status.name}</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                                                    <Select value={formData.assignedTo || ''} onChange={e => handleChange('assignedTo', e.target.value)}>
                                                        <option value="">Unassigned</option>
                                                        {teams.map(team => (
                                                            <optgroup key={team.id} label={team.name}>
                                                                {staff.filter(s => s.teamId === team.id).map(s => (
                                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </Select>
                                                </div>
                                              </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Addresses Section */}
                                    <div>
                                        <h3 className="font-semibold text-lg text-stone-800 dark:text-stone-100 mb-4">Addresses</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="font-semibold text-md text-stone-700 dark:text-stone-200 mb-2">Billing Address</h4>
                                                <div className="space-y-2">
                                                    <Input placeholder="Address Line 1" value={formData.officeAddress?.line1 || ''} onChange={e => handleAddressChange('officeAddress', 'line1', e.target.value)} />
                                                    <Input placeholder="Address Line 2" value={formData.officeAddress?.line2 || ''} onChange={e => handleAddressChange('officeAddress', 'line2', e.target.value)} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Input placeholder="Town/City" value={formData.officeAddress?.townCity || ''} onChange={e => handleAddressChange('officeAddress', 'townCity', e.target.value)} />
                                                        <Input placeholder="County" value={formData.officeAddress?.county || ''} onChange={e => handleAddressChange('officeAddress', 'county', e.target.value)} />
                                                    </div>
                                                    <Input placeholder="Postcode" value={formData.officeAddress?.postcode || ''} onChange={e => handleAddressChange('officeAddress', 'postcode', e.target.value)} />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-md text-stone-700 dark:text-stone-200 mb-2">Installation Address</h4>
                                                <div className="space-y-2">
                                                    <Input placeholder="Address Line 1" value={formData.installationAddress?.line1 || ''} onChange={e => handleAddressChange('installationAddress', 'line1', e.target.value)} />
                                                    <Input placeholder="Address Line 2" value={formData.installationAddress?.line2 || ''} onChange={e => handleAddressChange('installationAddress', 'line2', e.target.value)} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Input placeholder="Town/City" value={formData.installationAddress?.townCity || ''} onChange={e => handleAddressChange('installationAddress', 'townCity', e.target.value)} />
                                                        <Input placeholder="County" value={formData.installationAddress?.county || ''} onChange={e => handleAddressChange('installationAddress', 'county', e.target.value)} />
                                                    </div>
                                                    <Input placeholder="Postcode" value={formData.installationAddress?.postcode || ''} onChange={e => handleAddressChange('installationAddress', 'postcode', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                             {activeTab === 'appointments' && (
                                <div className="space-y-4">
                                    <div className="bg-stone-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <Button type="button" variant="secondary" size="sm" onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} icon={ChevronLeftIcon} />
                                            <h4 className="font-bold text-lg">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                                            <Button type="button" variant="secondary" size="sm" onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} icon={ChevronRightIcon} />
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-500">
                                            {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {daysInCalendar.map(day => {
                                                const isToday = day.toDateString() === new Date().toDateString();
                                                const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                                                const dayAppointments = appointmentsByDay[day.toDateString()];
                                                return (
                                                    <div key={day.toISOString()} className={`h-24 border dark:border-gray-700 rounded p-1 text-sm overflow-hidden ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-stone-100 dark:bg-gray-700/50 text-stone-400'}`}>
                                                        <div className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>{day.getDate()}</div>
                                                        {dayAppointments && (
                                                            <div className="mt-1 -mx-1 text-xs text-white bg-blue-500 rounded px-1 truncate" title={dayAppointments.map(a => a.title).join(', ')}>
                                                                {dayAppointments.length} event{dayAppointments.length > 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <h4 className="font-semibold mt-6 mb-2">Appointment List</h4>
                                    <div className="space-y-3">
                                        {clientAppointments.map(appt => (
                                            <div key={appt.id} className="bg-stone-50 dark:bg-gray-700/50 p-3 rounded-lg border dark:border-gray-700">
                                                <p className="font-semibold">{appt.title}</p>
                                                <p className="text-sm text-stone-500 dark:text-stone-400">
                                                    {new Date(appt.start).toLocaleString()} with {staff.find(s => s.id === appt.staffId)?.name || 'Unknown'}
                                                </p>
                                            </div>
                                        ))}
                                        {clientAppointments.length === 0 && !isNewLead && <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-8">No appointments found.</p>}
                                    </div>
                                </div>
                             )}
                            {activeTab === 'emails' && (
                                <div>
                                    {isComposing ? (
                                        <div className="bg-stone-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700 shadow-sm">
                                            <div className="p-4 border-b dark:border-gray-600">
                                                <h3 className="font-semibold">Compose Email</h3>
                                                <p className="text-sm text-stone-500 dark:text-stone-400">To: {formData.contacts.find(c => c.isPrimary)?.email}</p>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium">Use Template</label>
                                                    <Select value={selectedTemplateId} onChange={e => handleSelectTemplate(e.target.value)}>
                                                        <option value="">-- Select a template --</option>
                                                        {emailTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Subject</label>
                                                    <Input type="text" value={composition.subject} onChange={e => setComposition(c => ({...c, subject: e.target.value}))} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Body</label>
                                                    <TextArea value={composition.body} onChange={e => setComposition(c => ({...c, body: e.target.value}))} rows={12} />
                                                </div>
                                            </div>
                                            <div className="p-4 flex justify-end gap-3 bg-stone-100 dark:bg-gray-800/50 rounded-b-lg">
                                                <Button type="button" variant="secondary" onClick={() => setIsComposing(false)}>Cancel</Button>
                                                <Button type="button" onClick={handleSendEmail} icon={EnvelopeIcon}>Send Email</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-end mb-4">
                                                <Button type="button" onClick={() => setIsComposing(true)} icon={PlusIcon}>Compose Email</Button>
                                            </div>
                                            <div className="space-y-3">
                                                {clientEmails.slice().reverse().map(email => (
                                                    <div key={email.id} className="bg-stone-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                                                        <div className="flex justify-between items-center text-xs text-stone-400 dark:text-stone-500 mb-2">
                                                            <span>{email.direction === 'outgoing' ? `From: ${currentUser.name}` : `From: ${getClientName(formData)}`}</span>
                                                            <span>{new Date(email.timestamp).toLocaleString()}</span>
                                                        </div>
                                                        <p className="font-semibold text-stone-800 dark:text-stone-100">{email.subject}</p>
                                                        <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 whitespace-pre-wrap">{email.body}</p>
                                                    </div>
                                                ))}
                                                {clientEmails.length === 0 && !isNewLead && <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-8">No email history found for this lead.</p>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {activeTab === 'files' && (
                                <div>
                                    <div className="flex justify-end mb-4">
                                        <Button type="button" onClick={() => fileInputRef.current?.click()} icon={UploadIcon}>Upload File</Button>
                                    </div>
                                    <div className="space-y-3">
                                        {(formData.files || []).map((file, index) => (
                                            <div key={index} className="bg-stone-50 dark:bg-gray-700/50 p-3 rounded-lg border dark:border-gray-700 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <FileTextIcon className="w-5 h-5 text-stone-500"/>
                                                    <p className="font-medium">{file.name}</p>
                                                </div>
                                                <Button type="button" variant="danger" size="sm" onClick={() => handleDeleteFile(index)} icon={TrashIcon} />
                                            </div>
                                        ))}
                                        {(formData.files || []).length === 0 && (
                                            <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-8">No files uploaded for this lead.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                             {activeTab === 'activity' && (
                                <div>
                                    <div className="bg-stone-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 mb-6">
                                        <div className="flex border-b dark:border-gray-700">
                                            {['note', 'call', 'meeting'].map(tab => (
                                                <button
                                                    key={tab}
                                                    type="button"
                                                    onClick={() => setActiveLoggerTab(tab as any)}
                                                    className={`flex-1 px-4 py-2 text-sm font-semibold text-center transition-colors ${activeLoggerTab === tab ? 'bg-white dark:bg-gray-800 text-blue-600' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-gray-700'}`}
                                                >
                                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="p-4">
                                            {activeLoggerTab === 'note' && (
                                                <div className="space-y-2">
                                                    <TextArea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} placeholder="Add a note..." />
                                                    <div className="flex justify-end"><Button type="button" onClick={() => handlePostActivity('note')}>Post Note</Button></div>
                                                </div>
                                            )}
                                            {activeLoggerTab === 'call' && (
                                                <div className="space-y-3">
                                                    <Select value={callLog.direction} onChange={e => setCallLog(c => ({...c, direction: e.target.value as any}))}>
                                                        <option value="outgoing">Outgoing Call</option>
                                                        <option value="incoming">Incoming Call</option>
                                                    </Select>
                                                    <TextArea value={callLog.summary} onChange={e => setCallLog(c => ({...c, summary: e.target.value}))} rows={3} placeholder="Call summary..." />
                                                    <div className="flex justify-end"><Button type="button" onClick={() => handlePostActivity('call_log')}>Log Call</Button></div>
                                                </div>
                                            )}
                                            {activeLoggerTab === 'meeting' && (
                                                 <div className="space-y-3">
                                                    <Input type="text" value={meetingLog.subject} onChange={e => setMeetingLog(m => ({...m, subject: e.target.value}))} placeholder="Meeting Subject"/>
                                                    <TextArea value={meetingLog.notes} onChange={e => setMeetingLog(m => ({...m, notes: e.target.value}))} rows={3} placeholder="Meeting notes..." />
                                                    <div className="flex justify-end"><Button type="button" onClick={() => handlePostActivity('meeting_log')}>Log Meeting</Button></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {sortedActivity.map(item => {
                                            const activityStaff = staff.find(s => s.id === item.staffId);
                                            const Icon = activityIconMap[item.type] || ChatBubbleLeftRightIcon;
                                            
                                            let parsedContent: any = null;
                                            if (item.type === 'call_log' || item.type === 'meeting_log') {
                                                try { parsedContent = JSON.parse(item.content); } catch (e) { /* ignore */ }
                                            }

                                            return (
                                                <div key={item.id} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-gray-700 text-stone-600 dark:text-stone-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1" title={activityStaff?.name}>{activityStaff?.initials}</div>
                                                    <div className="flex-grow">
                                                        <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                                             <Icon className="w-4 h-4" />
                                                            <span className="font-semibold">{activityStaff?.name || 'System'}</span>
                                                            <span>&bull;</span>
                                                            <span>{formatTimeAgo(item.timestamp)}</span>
                                                        </div>
                                                        <div className="bg-stone-100 dark:bg-gray-700/50 p-3 rounded-lg mt-1 text-sm">
                                                            {parsedContent && item.type === 'call_log' ? (
                                                                <>
                                                                    <p className="font-semibold text-sm capitalize">{parsedContent.direction} Call</p>
                                                                    <p className="whitespace-pre-wrap">{parsedContent.summary}</p>
                                                                </>
                                                            ) : parsedContent && item.type === 'meeting_log' ? (
                                                                <>
                                                                    <p className="font-semibold text-sm">Meeting: {parsedContent.subject}</p>
                                                                    <p className="whitespace-pre-wrap">{parsedContent.notes}</p>
                                                                </>
                                                            ) : (
                                                                <p className="whitespace-pre-wrap">{item.content}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {sortedActivity.length === 0 && !isNewLead && <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-8">No activity yet for this lead.</p>}
                                    </div>
                                </div>
                             )}
                         </div>
                    </div>
                </main>
            </form>
        </div>
    );
};
