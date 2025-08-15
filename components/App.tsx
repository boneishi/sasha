
import React, { useState, useEffect, useMemo } from 'react';
import { CrmView } from './components/CrmView';
import { QuoteBuilder } from './components/QuoteEditor';
import { WindowBuilder } from './components/WindowBuilder';
import { SystemView } from './components/SystemView';
import { ProductSelectionModal } from './components/ProductSelectionModal';
import { ReportsView } from './components/ReportsView';
import { SalesDashboard } from './components/SalesDashboard';
import { SurveyListView } from './components/SurveyListView';
import { SurveyView } from './components/SurveyView';
import { CustomerView } from './components/CustomerView';
import { LeadEditorView } from './components/LeadEditorView';
import { CalendarView } from './components/CalendarView';
import { EmailModal } from './components/EmailModal';
import { FileViewerModal } from './components/FileViewerModal';
import { AssignFileModal } from './components/AssignFileModal';
import { AppointmentModal } from './components/AppointmentModal';
import { ProductionView } from './components/ProductionView';
import { InstallationView } from './components/InstallationView';
import { Modal } from './components/Modal';
import { Button } from './components/common';
import { INITIAL_CLIENTS, INITIAL_QUOTES, STAFF_MEMBERS, INITIAL_PRODUCT_PROFILES, INITIAL_DOCUMENTS, TEAMS, INITIAL_MATERIALS, INITIAL_SYSTEM_SETTINGS, INITIAL_APPOINTMENTS, INITIAL_ROLES, INITIAL_EMAIL_TEMPLATES, INITIAL_PRODUCT_RANGES, INITIAL_COMPONENT_TEMPLATES } from './constants';
import type { Client, Quote, Staff, ProductProfile, CompanyDocument, QuoteItem, Team, Material, Permission, SystemSettings, Appointment, Role, WindowInstance, Contact, Alert, EmailTemplate, Module, Activity, Email, ProductRange, ComponentTemplate, FrameDivision, PlacedSash } from './types';
import { QuoteStatus } from './types';
import { CrmIcon, SunIcon, MoonIcon, UserCircleIcon, ChartBarIcon, HomeIcon, Cog6ToothIcon, ClipboardCheckIcon, UserGroupIcon, CalendarIcon, ProductionIcon, InstallationIcon } from './components/icons';
import { generateFollowUpEmail, generateAppointmentConfirmationEmail } from './services/geminiService';
import { SurveyBookingView } from './components/SurveyBookingView';
import { AlertsDropdown } from './components/AlertsDropdown';
import { getClientName } from './utils';
import { QuoteListView } from './components/QuoteListView';
import { useToast } from './components/Toast';
import { UserSettingsView } from './components/UserSettingsView';

type ViewState = 
    | { view: 'dashboard' }
    | { view: 'customers' }
    | { view: 'crm' }
    | { view: 'quoteList', clientId: string }
    | { view: 'quoteBuilder', quoteId: string, isCopy?: boolean }
    | { view: 'windowBuilder', quoteId: string, itemToEdit?: QuoteItem, profileToUse?: ProductProfile }
    | { view: 'surveyWindowBuilder', quoteId: string, itemToEdit: QuoteItem }
    | { view: 'system', tab?: 'staff' | 'roles' | 'profiles-sash' | 'profiles-casement' | 'profiles-door' | 'profiles-screen' | 'components' | 'materials' | 'settings' | 'email_smtp' | 'email_templates' | 'developer' | 'ranges' | 'invoicing' | 'project' }
    | { view: 'profileEditor', profileId?: string, newItemType?: 'Sash' | 'Casement' | 'Door' | 'Screen' }
    | { view: 'componentEditor', templateId?: string, itemType?: 'Sash' | 'Casement' | 'Door' | 'Screen' }
    | { view: 'productSelection', quoteId: string, itemType: 'Sash' | 'Casement' | 'Door' | 'Screen' }
    | { view: 'reports' }
    | { view: 'surveyList' }
    | { view: 'surveyEditor', quoteId: string }
    | { view: 'surveyBooking', quoteId: string }
    | { view: 'calendar' }
    | { view: 'production' }
    | { view: 'installation' }
    | { view: 'userSettings' }
    | { view: 'leadEditor', clientId?: string };

type EmailModalState = {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    clientId: string | null;
    data: {
        subject: string;
        body: string;
        clientEmail: string;
    } | null;
};

type FileViewerState = {
    isOpen: boolean;
    file: { name: string; dataUrl: string; } | null;
};

type AssignFileState = {
    isOpen: boolean;
    file: { name: string; dataUrl: string; } | null;
    client: Client | null;
};

type AppointmentModalState = {
    isOpen: boolean;
    appointment: Appointment | null;
    prefilledClientId?: string;
};

type AppointmentConfirmationState = {
    isOpen: boolean;
    appointment: Appointment | null;
    client: Client | null;
};

export default function App() {
    const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
    const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
    const [staff, setStaff] = useState<Staff[]>(STAFF_MEMBERS);
    const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
    const [teams, setTeams] = useState<Team[]>(TEAMS);
    const [productProfiles, setProductProfiles] = useState<ProductProfile[]>(INITIAL_PRODUCT_PROFILES);
    const [componentTemplates, setComponentTemplates] = useState<ComponentTemplate[]>(INITIAL_COMPONENT_TEMPLATES);
    const [productRanges, setProductRanges] = useState<ProductRange[]>(INITIAL_PRODUCT_RANGES);
    const [documents, setDocuments] = useState<CompanyDocument[]>(INITIAL_DOCUMENTS);
    const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
    const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
    const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(INITIAL_EMAIL_TEMPLATES);
    
    const [currentUser, setCurrentUser] = useState<Staff>(STAFF_MEMBERS[0]);
    const [currentView, setCurrentView] = useState<ViewState>({ view: 'dashboard' });
    const [emailModalState, setEmailModalState] = useState<EmailModalState>({ isOpen: false, isLoading: false, error: null, data: null, clientId: null });
    const [fileViewerState, setFileViewerState] = useState<FileViewerState>({ isOpen: false, file: null });
    const [assignFileState, setAssignFileState] = useState<AssignFileState>({ isOpen: false, file: null, client: null });
    const [appointmentModalState, setAppointmentModalState] = useState<AppointmentModalState>({ isOpen: false, appointment: null, prefilledClientId: undefined });
    const [appointmentConfirmationState, setAppointmentConfirmationState] = useState<AppointmentConfirmationState>({ isOpen: false, appointment: null, client: null });
    
    const { addToast } = useToast();

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedTheme = window.localStorage.getItem('theme');
            if (storedTheme) return storedTheme;
        }
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);
    
    // Alert Generation Effect
    useEffect(() => {
        const now = new Date();
        const newAlerts: Alert[] = [];

        clients.forEach(client => {
            if (client.assignedTo) {
                const createdAt = new Date(client.createdAt);
                const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

                if (hoursSinceCreation > 24 && client.createdAt === client.lastContacted) {
                    const existingAlert = alerts.find(a => a.clientId === client.id && a.type === 'stale_lead');
                    if (!existingAlert) {
                        const clientName = getClientName(client);
                        newAlerts.push({
                            id: `alert-${client.id}-stale`,
                            type: 'stale_lead',
                            message: `Lead "${clientName}" has not been actioned in over 24 hours.`,
                            clientId: client.id,
                            isRead: false,
                            createdAt: now.toISOString(),
                        });
                    }
                }
            }
        });

        if (newAlerts.length > 0) {
            setAlerts(prev => [...prev, ...newAlerts]);
        }
    }, [clients]); // Reruns when clients change

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const navigateTo = (view: ViewState) => {
        setCurrentView(view);
    };

    const hasPermission = (permission: Permission) => {
        const userRole = roles.find(r => r.id === currentUser.roleId);
        return userRole?.permissions.includes(permission) ?? false;
    };

    const logActivity = (clientId: string, activity: Omit<Activity, 'id' | 'timestamp'>) => {
        const newActivity: Activity = {
            ...activity,
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
        };

        setClients(prev => prev.map(c => 
            c.id === clientId 
            ? { ...c, activity: [newActivity, ...(c.activity || [])] } 
            : c
        ));
    };
    
    const updateLastContacted = (clientId: string) => {
        setClients(prev => prev.map(c => 
            c.id === clientId 
            ? { ...c, lastContacted: new Date().toISOString() } 
            : c
        ));
    };
    
    const handleCreateQuote = (clientId: string) => {
        if (!hasPermission('manageQuotes')) return addToast("You don't have permission to create quotes.", 'error');

        const client = clients.find(c => c.id === clientId);
        if (!client) {
            addToast("Client not found.", 'error');
            return;
        }

        const existingQuotesForClient = quotes.filter(q => q.clientId === clientId);
        const newQuoteRevision = existingQuotesForClient.length + 1;
        const newQuoteNumber = `${client.leadNumber}/${newQuoteRevision}`;

        const newQuote: Quote = {
            id: `quote-${Date.now()}`,
            quoteNumber: newQuoteNumber,
            clientId,
            date: new Date().toISOString().split('T')[0],
            status: QuoteStatus.NEW,
            items: [],
        };
        
        setQuotes(prev => [...prev, newQuote]);
        updateLastContacted(clientId);
        logActivity(clientId, { type: 'quote_created', staffId: currentUser.id, content: `Created quote ${newQuote.quoteNumber}.` });
        navigateTo({ view: 'quoteBuilder', quoteId: newQuote.id });
    };
    
    const handleUpdateQuote = (updatedQuote: Quote, showToast = true) => {
        const oldQuote = quotes.find(q => q.id === updatedQuote.id);
        setQuotes(prevQuotes => prevQuotes.map(q => q.id === updatedQuote.id ? updatedQuote : q));
        if (showToast) {
            addToast('Quote updated!', 'success');
        }

        if (oldQuote && oldQuote.status !== updatedQuote.status) {
            logActivity(updatedQuote.clientId, {
                type: 'label_change',
                staffId: currentUser.id,
                content: `Quote ${updatedQuote.quoteNumber} status changed from ${oldQuote.status} to ${updatedQuote.status}.`
            });
            updateLastContacted(updatedQuote.clientId);
        }
    };

    const handlePublishQuote = (quoteId: string) => {
        const quote = quotes.find(q => q.id === quoteId);
        if (quote && (quote.status === QuoteStatus.NEW || quote.status === QuoteStatus.APPOINTMENT_BOOKED)) {
            handleUpdateQuote({ ...quote, status: QuoteStatus.QUOTED });
            addToast('Quote published successfully!', 'success');
        }
    };

    const handleCopyQuote = (quoteId: string) => {
        const originalQuote = quotes.find(q => q.id === quoteId);
        if (!originalQuote) return;
        
        const client = clients.find(c => c.id === originalQuote.clientId);
        if (!client) {
            addToast("Client for original quote not found.", "error");
            return;
        }

        const existingQuotesForClient = quotes.filter(q => q.clientId === originalQuote.clientId);
        const newQuoteRevision = existingQuotesForClient.length + 1;
        const newQuoteNumber = `${client.leadNumber}/${newQuoteRevision}`;
        
        const newQuote: Quote = JSON.parse(JSON.stringify(originalQuote));
        newQuote.id = `quote-${Date.now()}`;
        newQuote.quoteNumber = newQuoteNumber;
        newQuote.status = QuoteStatus.NEW;
        newQuote.date = new Date().toISOString().split('T')[0];
        
        newQuote.items = newQuote.items.map((item, index) => {
            const newItem: QuoteItem = JSON.parse(JSON.stringify(item));
            newItem.id = `item-${Date.now()}-${index}`;

            if (newItem.windowInstances && newItem.windowInstances.length > 0) {
                const newMullions: FrameDivision[] = [];
                const newTransoms: FrameDivision[] = [];
                const newPlacedSashes: PlacedSash[] = [];
                const newPaneGlassTypes: { paneId: string; glassTypeId: string; }[] = [];

                const originalInstances = [...newItem.windowInstances];
                const firstOriginalInstanceId = originalInstances[0].id;

                const newInstances = originalInstances.map(instance => {
                    const oldInstanceId = instance.id;
                    const newInstanceId = `inst-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                    (item.mullions || []).filter(m => (m.instanceId || firstOriginalInstanceId) === oldInstanceId).forEach(m => {
                        newMullions.push({ ...m, id: `m-q-${Date.now()}-${Math.random().toString(36).substring(2,9)}`, instanceId: newInstanceId });
                    });
                    
                    (item.transoms || []).filter(t => (t.instanceId || firstOriginalInstanceId) === oldInstanceId).forEach(t => {
                        newTransoms.push({ ...t, id: `t-q-${Date.now()}-${Math.random().toString(36).substring(2,9)}`, instanceId: newInstanceId });
                    });

                    (item.placedSashes || []).filter(s => s.paneId.startsWith(oldInstanceId)).forEach(sash => {
                        const newSash = JSON.parse(JSON.stringify(sash));
                        newSash.paneId = newSash.paneId.replace(oldInstanceId, newInstanceId);
                        if (newSash.glazingBars) {
                            newSash.glazingBars = newSash.glazingBars.map((bar: any) => ({ ...bar, id: `gb-q-${Date.now()}-${Math.random().toString(36).substring(2,9)}` }));
                        }
                        newPlacedSashes.push(newSash);
                    });

                    (item.paneGlassTypes || []).filter(pgt => pgt.paneId.startsWith(oldInstanceId)).forEach(pgt => {
                        newPaneGlassTypes.push({ ...pgt, paneId: pgt.paneId.replace(oldInstanceId, newInstanceId) });
                    });
                    
                    const newInstanceData = { ...instance, id: newInstanceId };
                    if(newInstanceData.topSashGlazingBars) {
                        newInstanceData.topSashGlazingBars = newInstanceData.topSashGlazingBars.map(bar => ({...bar, id: `gb-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}));
                    }
                    if(newInstanceData.bottomSashGlazingBars) {
                        newInstanceData.bottomSashGlazingBars = newInstanceData.bottomSashGlazingBars.map(bar => ({...bar, id: `gb-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}));
                    }

                    return newInstanceData;
                });
                
                newItem.windowInstances = newInstances;
                newItem.mullions = newMullions;
                newItem.transoms = newTransoms;
                newItem.placedSashes = newPlacedSashes;
                newItem.paneGlassTypes = newPaneGlassTypes;
            }
            
            return newItem;
        });

        setQuotes(prev => [...prev, newQuote]);
        addToast('Quote copied successfully!', 'success');
        navigateTo({ view: 'quoteBuilder', quoteId: newQuote.id, isCopy: true });
    };

    const handleGenerateEmail = async (quote: Quote, client: Client) => {
        const primaryContact = client.contacts.find(c => c.isPrimary);
        if (!primaryContact) return addToast('Cannot generate email: client has no primary contact.', 'error');

        setEmailModalState({ isOpen: true, isLoading: true, error: null, data: null, clientId: client.id });

        try {
            const emailContent = await generateFollowUpEmail(client, quote, systemSettings, currentUser, productRanges);
            setEmailModalState(prev => ({
                ...prev,
                isLoading: false,
                data: { ...emailContent, clientEmail: primaryContact.email },
            }));
        } catch (error) {
            setEmailModalState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : "An unknown error occurred.",
            }));
        }
    };

    const handleSendEmail = (subject: string) => {
        if (emailModalState.clientId) {
            logActivity(emailModalState.clientId, {
                type: 'email_sent',
                staffId: currentUser.id,
                content: `Sent email: ${subject}`
            });
            updateLastContacted(emailModalState.clientId);
        }
    };

    const handleSaveAppointment = (appointmentToSave: Appointment) => {
        setAppointments(prev => {
            const isNew = !prev.some(a => a.id === appointmentToSave.id);
            if (isNew) {
                if (appointmentToSave.clientId) {
                    logActivity(appointmentToSave.clientId, {
                        type: 'appointment_created',
                        staffId: currentUser.id,
                        content: `Created appointment: ${appointmentToSave.title}`
                    });
                    updateLastContacted(appointmentToSave.clientId);
                }
                const client = clients.find(c => c.id === appointmentToSave.clientId);
                if (client) {
                    setAppointmentConfirmationState({ isOpen: true, appointment: appointmentToSave, client });
                }
                return [...prev, appointmentToSave];
            }
            return prev.map(a => a.id === appointmentToSave.id ? appointmentToSave : a);
        });
        addToast('Appointment saved!', 'success');
        setAppointmentModalState({ isOpen: false, appointment: null });
    };

    const handleDeleteAppointment = (appointmentId: string) => {
        setAppointments(prev => prev.filter(a => a.id !== appointmentId));
        addToast('Appointment deleted.', 'info');
    };

    const handleSendAppointmentConfirmation = async () => {
        const { appointment, client } = appointmentConfirmationState;
        if (!appointment || !client) return;
        const staffMember = staff.find(s => s.id === appointment.staffId);
        if (!staffMember) return;

        try {
            const emailContent = await generateAppointmentConfirmationEmail(appointment, client, staffMember, systemSettings);
            
            const newEmail: Email = {
                id: `email-${Date.now()}`,
                direction: 'outgoing',
                ...emailContent,
                timestamp: new Date().toISOString(),
            };
            
            setClients(prev => prev.map(c => 
                c.id === client.id 
                ? { ...c, emails: [newEmail, ...(c.emails || [])] } 
                : c
            ));
            
            logActivity(client.id, {
                type: 'email_sent',
                staffId: currentUser.id,
                content: `Sent appointment confirmation: ${emailContent.subject}`
            });
            updateLastContacted(client.id);
            addToast('Confirmation email sent!', 'success');

        } catch (e) {
            console.error(e);
            addToast("Failed to generate or send appointment confirmation email.", 'error');
        } finally {
            setAppointmentConfirmationState({ isOpen: false, appointment: null, client: null });
        }
    };

    const handleSaveClient = (clientToSave: Client) => {
        const isNew = !clients.some(c => c.id === clientToSave.id);
        if (isNew) {
            const newLeadNumber = `${systemSettings.leadNumberPrefix}${systemSettings.leadNextNumber}`;
            clientToSave.leadNumber = newLeadNumber;
            clientToSave.label = systemSettings.labels.leads[0].name; // e.g., 'New'
            
            setSystemSettings(prev => ({...prev, leadNextNumber: prev.leadNextNumber + 1}));
            
            const newActivity: Activity = {
                id: `act-${Date.now()}`,
                type: 'note',
                timestamp: new Date().toISOString(),
                staffId: currentUser.id,
                content: 'New lead created.'
            };
            clientToSave.activity = [newActivity];
            clientToSave.assignedTo = clientToSave.assignedTo || currentUser.id;

            setClients(prev => [...prev, clientToSave]);
        } else {
            setClients(prev => prev.map(c => c.id === clientToSave.id ? clientToSave : c));
        }
        addToast(isNew ? 'New lead saved successfully!' : 'Lead details updated.', 'success');
    };

    const handleUpdateUser = (updatedUser: Staff) => {
        setStaff(prev => prev.map(s => s.id === updatedUser.id ? updatedUser : s));
        if (currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        addToast('Profile updated successfully!', 'success');
    };

    const renderView = () => {
        switch (currentView.view) {
            case 'dashboard':
                return <SalesDashboard 
                    currentUser={currentUser} 
                    clients={clients} 
                    quotes={quotes}
                    staff={staff}
                    systemSettings={systemSettings}
                    appointments={appointments}
                    navigateTo={navigateTo}
                    onCreateQuote={handleCreateQuote}
                    onBookAppointment={(clientId) => setAppointmentModalState({ isOpen: true, prefilledClientId: clientId, appointment: null })}
                    onAddNewLead={() => navigateTo({ view: 'leadEditor' })}
                />;
            case 'customers':
                return <CustomerView 
                    clients={clients} 
                    quotes={quotes} 
                    staff={staff}
                    teams={teams}
                    appointments={appointments}
                    onViewQuotes={(clientId) => navigateTo({ view: 'quoteList', clientId })}
                    onEditLead={(clientId) => navigateTo({ view: 'leadEditor', clientId })}
                    onCreateQuote={handleCreateQuote}
                    currentUser={currentUser}
                    hasPermission={hasPermission}
                    onOpenFile={(file) => setFileViewerState({isOpen: true, file})}
                    onAssignFile={(file, client) => setAssignFileState({isOpen: true, file, client})}
                    systemSettings={systemSettings}
                    onBookAppointment={(clientId) => setAppointmentModalState({ isOpen: true, prefilledClientId: clientId, appointment: null })}
                    onAddNewLead={() => navigateTo({ view: 'leadEditor' })}
                />;
            case 'crm':
                return <CrmView 
                    clients={clients} 
                    quotes={quotes} 
                    staff={staff} 
                    currentUser={currentUser} 
                    onEditQuote={(quoteId) => navigateTo({ view: 'quoteBuilder', quoteId })}
                    onCreateQuote={handleCreateQuote}
                    onUpdateQuote={handleUpdateQuote}
                    onGenerateEmail={handleGenerateEmail}
                    hasPermission={hasPermission}
                    systemSettings={systemSettings}
                    appointments={appointments}
                    navigateTo={navigateTo}
                    onBookAppointment={(clientId) => setAppointmentModalState({ isOpen: true, prefilledClientId: clientId, appointment: null })}
                />;
            case 'quoteList': {
                const client = clients.find(c => c.id === currentView.clientId);
                const clientQuotes = quotes.filter(q => q.clientId === currentView.clientId);
                if (!client) return <div>Client not found</div>;
                return <QuoteListView
                    client={client}
                    quotes={clientQuotes}
                    onBack={() => navigateTo({ view: 'customers' })}
                    onEditQuote={(quoteId) => navigateTo({ view: 'quoteBuilder', quoteId })}
                    onCreateQuote={handleCreateQuote}
                    systemSettings={systemSettings}
                />;
            }
            case 'quoteBuilder': {
                const quote = quotes.find(q => q.id === currentView.quoteId);
                const client = quote ? clients.find(c => c.id === quote.clientId) : undefined;
                if (!quote || !client) return <div>Quote not found</div>;
                const assignedStaff = staff.find(s => s.id === client.assignedTo);

                return <QuoteBuilder
                    quote={quote}
                    client={client}
                    onUpdateQuote={handleUpdateQuote}
                    onBack={() => navigateTo({ view: 'quoteList', clientId: quote.clientId })}
                    assignedStaffName={assignedStaff?.name}
                    onAddItem={(itemType) => navigateTo({ view: 'productSelection', quoteId: quote.id, itemType })}
                    onEditItem={(itemId) => {
                        const itemToEdit = quote.items.find(i => i.id === itemId);
                        if (itemToEdit) navigateTo({ view: 'windowBuilder', quoteId: quote.id, itemToEdit });
                    }}
                    currency={systemSettings.currency}
                    materials={materials}
                    productRanges={productRanges}
                    systemSettings={systemSettings}
                    onPublishQuote={handlePublishQuote}
                    onCopyQuote={handleCopyQuote}
                    isCopy={currentView.isCopy}
                    addToast={addToast}
                />
            }
            case 'windowBuilder': {
                const quote = quotes.find(q => q.id === currentView.quoteId);
                if (!quote) return <div>Quote not found</div>;
                return <WindowBuilder
                    mode="quote"
                    itemToEdit={currentView.itemToEdit}
                    profile={currentView.profileToUse}
                    componentTemplates={componentTemplates}
                    onSaveItem={(item) => {
                        const isNew = !quote.items.some(i => i.id === item.id);
                        let updatedItems;

                        if (isNew) {
                            const numericRefs = quote.items.map(i => i.itemNumber).filter(ref => /^\d+$/.test(ref)).map(ref => parseInt(ref, 10));
                            const maxNumber = numericRefs.length > 0 ? Math.max(...numericRefs) : 0;
                            let newRef = String(maxNumber + 1);
                            while (quote.items.some(i => i.itemNumber === newRef)) {
                                newRef = String(parseInt(newRef, 10) + 1);
                            }
                            item.itemNumber = newRef;
                            updatedItems = [...quote.items, item];
                        } else {
                            updatedItems = quote.items.map(i => i.id === item.id ? item : i);
                        }
                        
                        handleUpdateQuote({ ...quote, items: updatedItems });
                        navigateTo({ view: 'quoteBuilder', quoteId: quote.id });
                    }}
                    onCancel={() => navigateTo({ view: 'quoteBuilder', quoteId: quote.id })}
                    currency={systemSettings.currency}
                    materials={materials}
                    productRanges={productRanges}
                    quoteItems={quote.items}
                    onNavigateItem={(direction) => {
                        const currentIndex = quote.items.findIndex(i => i.id === currentView.itemToEdit?.id);
                        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
                        if (nextIndex >= 0 && nextIndex < quote.items.length) {
                            navigateTo({ view: 'windowBuilder', quoteId: quote.id, itemToEdit: quote.items[nextIndex] });
                        }
                    }}
                    addToast={addToast}
                />
            }
            case 'productSelection': {
                const { quoteId, itemType } = currentView;
                const filteredProfiles = productProfiles.filter(p => p.itemType === itemType);
                return <ProductSelectionModal
                    isOpen={true}
                    onClose={() => navigateTo({ view: 'quoteBuilder', quoteId })}
                    profiles={filteredProfiles}
                    itemType={itemType}
                    onSelect={(profile) => navigateTo({ view: 'windowBuilder', quoteId, profileToUse: profile })}
                    navigateToSystem={() => navigateTo({ view: 'system', tab: `profiles-${itemType.toLowerCase()}` as any })}
                    productRanges={productRanges}
                />
            }
            case 'system':
                return <SystemView 
                    initialTab={currentView.tab}
                    staff={staff}
                    setStaff={setStaff}
                    roles={roles}
                    setRoles={setRoles}
                    documents={documents}
                    setDocuments={setDocuments}
                    teams={teams}
                    productProfiles={productProfiles}
                    componentTemplates={componentTemplates}
                    setComponentTemplates={setComponentTemplates}
                    productRanges={productRanges}
                    setProductRanges={setProductRanges}
                    materials={materials}
                    setMaterials={setMaterials}
                    onSaveProfile={(profile) => {
                        const isNew = !productProfiles.some(p => p.id === profile.id);
                        if (isNew) {
                            setProductProfiles(prev => [...prev, profile]);
                        } else {
                            setProductProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
                        }
                    }}
                    onDeleteProfile={(id) => setProductProfiles(prev => prev.filter(p => p.id !== id))}
                    onImportMaterials={(newMaterials) => setMaterials(prev => [...prev, ...newMaterials])}
                    systemSettings={systemSettings}
                    setSystemSettings={setSystemSettings}
                    hasPermission={hasPermission}
                    emailTemplates={emailTemplates}
                    onSaveEmailTemplate={(template) => {
                        const isNew = !emailTemplates.some(t => t.id === template.id);
                        if (isNew) {
                            setEmailTemplates(prev => [...prev, template]);
                        } else {
                            setEmailTemplates(prev => prev.map(t => t.id === template.id ? template : t));
                        }
                    }}
                    onDeleteEmailTemplate={(id) => setEmailTemplates(prev => prev.filter(t => t.id !== id))}
                    navigateTo={navigateTo}
                    addToast={addToast}
                />;
            case 'profileEditor': {
                const profile = currentView.profileId ? productProfiles.find(p => p.id === currentView.profileId) : undefined;
                const profilesOfType = productProfiles.filter(p => p.itemType === (profile?.itemType || currentView.newItemType));
                const currentIndex = profile ? profilesOfType.findIndex(p => p.id === profile.id) : -1;
                
                return <WindowBuilder
                    mode="profile"
                    profileToEdit={profile}
                    componentTemplates={componentTemplates}
                    newItemType={currentView.newItemType}
                    allProfiles={profilesOfType}
                    onNavigateItem={(direction) => {
                        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
                        if (nextIndex >= 0 && nextIndex < profilesOfType.length) {
                            const nextProfile = profilesOfType[nextIndex];
                            navigateTo({ view: 'profileEditor', profileId: nextProfile.id });
                        }
                    }}
                    onSaveProfile={(savedProfile) => {
                        const isNew = !productProfiles.some(p => p.id === savedProfile.id);
                        if (isNew) {
                            setProductProfiles(prev => [...prev, savedProfile]);
                        } else {
                            setProductProfiles(prev => prev.map(p => p.id === savedProfile.id ? savedProfile : p));
                        }
                        navigateTo({ view: 'system', tab: `profiles-${savedProfile.itemType.toLowerCase()}` as any });
                    }}
                    onCancel={() => {
                        const itemType = (profile?.itemType || currentView.newItemType || 'Sash').toLowerCase();
                        navigateTo({ view: 'system', tab: `profiles-${itemType}` as any });
                    }}
                    materials={materials}
                    productRanges={productRanges}
                    addToast={addToast}
                />;
            }
            case 'componentEditor': {
                const template = currentView.templateId ? componentTemplates.find(t => t.id === currentView.templateId) : undefined;
                const templatesOfType = componentTemplates.filter(t => t.itemType === (template?.itemType || currentView.itemType));
                const currentIndex = template ? templatesOfType.findIndex(t => t.id === template.id) : -1;

                return <WindowBuilder
                    mode="component"
                    componentTemplateToEdit={template}
                    newItemType={currentView.itemType}
                    allComponents={templatesOfType}
                    onNavigateItem={(direction) => {
                        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
                        if (nextIndex >= 0 && nextIndex < templatesOfType.length) {
                            const nextTemplate = templatesOfType[nextIndex];
                            navigateTo({ view: 'componentEditor', templateId: nextTemplate.id, itemType: nextTemplate.itemType });
                        }
                    }}
                    onSaveComponentTemplate={(savedTemplate) => {
                        const isNew = !componentTemplates.some(t => t.id === savedTemplate.id);
                        if (isNew) {
                            setComponentTemplates(prev => [...prev, savedTemplate]);
                        } else {
                            setComponentTemplates(prev => prev.map(t => t.id === savedTemplate.id ? savedTemplate : t));
                        }
                        navigateTo({ view: 'system', tab: 'components' });
                    }}
                    onCancel={() => navigateTo({ view: 'system', tab: 'components' })}
                    materials={materials}
                    productRanges={productRanges}
                    addToast={addToast}
                />;
            }
            case 'reports':
                return <ReportsView quotes={quotes} clients={clients} staff={staff} systemSettings={systemSettings} />;
            case 'surveyList':
                const quotesInSurvey = quotes.filter(q => q.status === QuoteStatus.SURVEY);
                return <SurveyListView quotes={quotesInSurvey} clients={clients} staff={staff} navigateTo={navigateTo} />;
            case 'surveyEditor': {
                const quote = quotes.find(q => q.id === currentView.quoteId);
                const client = quote ? clients.find(c => c.id === quote.clientId) : undefined;
                if (!quote || !client) return <div>Quote not found for survey.</div>;
                return <SurveyView 
                    quote={quote}
                    client={client}
                    materials={materials}
                    staff={staff}
                    roles={roles}
                    onEditSurveyItem={(quoteId, itemId) => {
                        const itemToEdit = quote.items.find(i => i.id === itemId);
                        if(itemToEdit) navigateTo({ view: 'surveyWindowBuilder', quoteId, itemToEdit });
                    }}
                    onCompleteSurvey={(updatedQuote) => {
                        handleUpdateQuote(updatedQuote);
                        addToast(`Survey for ${updatedQuote.quoteNumber} complete!`, 'success');
                    }}
                    onAssignSurveyor={(quoteId, surveyorId) => {
                        const quoteToUpdate = quotes.find(q => q.id === quoteId);
                        if (quoteToUpdate) {
                            const projectNumber = `${systemSettings.projectNumberPrefix}${systemSettings.projectNextNumber}`;
                            setSystemSettings(s => ({...s, projectNextNumber: s.projectNextNumber + 1}));
                            handleUpdateQuote({...quoteToUpdate, surveyorId, projectReference: projectNumber});
                        }
                    }}
                    onBack={() => navigateTo({ view: 'surveyList'})}
                    systemSettings={systemSettings}
                    onUpdateQuote={handleUpdateQuote}
                />
            }
             case 'surveyWindowBuilder': {
                const quote = quotes.find(q => q.id === currentView.quoteId);
                if (!quote) return <div>Quote not found</div>;
                return <WindowBuilder
                    mode="quote"
                    itemToEdit={currentView.itemToEdit}
                    onSaveItem={(item) => {
                        const updatedItems = quote.items.map(i => i.id === item.id ? {...item, surveyComplete: true} : i);
                        handleUpdateQuote({ ...quote, items: updatedItems });
                        navigateTo({ view: 'surveyEditor', quoteId: quote.id });
                    }}
                    onCancel={() => navigateTo({ view: 'surveyEditor', quoteId: quote.id })}
                    currency={systemSettings.currency}
                    materials={materials}
                    productRanges={productRanges}
                    isReadOnly={false}
                    quoteItems={quote.items}
                    onNavigateItem={() => {}}
                    addToast={addToast}
                />
            }
            case 'surveyBooking': {
                const quote = quotes.find(q => q.id === currentView.quoteId);
                const client = quote ? clients.find(c => c.id === quote.clientId) : undefined;
                const surveyor = quote ? staff.find(s => s.id === quote.surveyorId) : undefined;
                if (!quote || !client) return <div>Data not found for survey booking.</div>;
                return <SurveyBookingView 
                    quote={quote} 
                    client={client} 
                    surveyor={surveyor}
                    appointments={appointments}
                    systemSettings={systemSettings}
                    onBack={() => navigateTo({ view: 'surveyList'})}
                    onOpenAppointmentModal={(appt) => setAppointmentModalState({isOpen: true, appointment: appt})}
                />;
            }
            case 'calendar':
                return <CalendarView 
                    appointments={appointments}
                    staff={staff}
                    clients={clients}
                    quotes={quotes}
                    currentUser={currentUser}
                    onOpenAppointmentModal={(appt, clientId) => setAppointmentModalState({isOpen: true, appointment: appt, prefilledClientId: clientId})}
                    navigateTo={navigateTo}
                    systemSettings={systemSettings}
                />;
            case 'production':
                return <ProductionView />;
            case 'installation':
                return <InstallationView />;
            case 'userSettings':
                return <UserSettingsView
                    currentUser={currentUser}
                    allStaff={staff}
                    roles={roles}
                    onUpdateUser={handleUpdateUser}
                    setCurrentUser={setCurrentUser}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />;
            case 'leadEditor': {
                const client = clients.find(c => c.id === currentView.clientId);
                return <LeadEditorView
                    client={client}
                    staff={staff}
                    teams={teams}
                    appointments={appointments}
                    onSaveClient={handleSaveClient}
                    onBack={() => navigateTo({ view: 'customers' })}
                    quotes={quotes.filter(q => q.clientId === currentView.clientId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
                    emailTemplates={emailTemplates}
                    currentUser={currentUser}
                    systemSettings={systemSettings}
                />;
            }
            default:
                return <div>Not found</div>;
        }
    };

    const NavItem: React.FC<{
        icon: React.ComponentType<any>,
        label: string,
        view: ViewState,
        module: Module,
    }> = ({ icon: Icon, label, view, module }) => {
        const isActive = currentView.view === view.view;
        const isEnabled = systemSettings.enabledModules.includes(module);
        if (!isEnabled) return null;
        
        return (
            <li>
                <button
                    onClick={() => navigateTo(view)}
                    className={`flex flex-col items-center justify-center w-full p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">{label}</span>
                </button>
            </li>
        )
    };
    
    return (
        <div className={`flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${theme}`}>
            <aside className="w-24 bg-gray-800 text-white flex flex-col items-center p-2 shadow-lg z-20">
                <nav className="flex-grow w-full pt-4">
                    <ul className="space-y-2">
                        <NavItem icon={HomeIcon} label="Dashboard" view={{ view: 'dashboard' }} module="leads" />
                        <NavItem icon={UserGroupIcon} label="Leads" view={{ view: 'customers' }} module="leads" />
                        <NavItem icon={CrmIcon} label="Quotes" view={{ view: 'crm' }} module="sales" />
                        <NavItem icon={ClipboardCheckIcon} label="Surveys" view={{ view: 'surveyList' }} module="surveys" />
                        <NavItem icon={ProductionIcon} label="Production" view={{ view: 'production' }} module="production" />
                        <NavItem icon={InstallationIcon} label="Installs" view={{ view: 'installation' }} module="installation" />
                        <NavItem icon={CalendarIcon} label="Calendar" view={{ view: 'calendar' }} module="calendar" />
                        <NavItem icon={ChartBarIcon} label="Reports" view={{ view: 'reports' }} module="reports" />
                    </ul>
                </nav>
                <div className="w-full space-y-2">
                    <NavItem icon={Cog6ToothIcon} label="System" view={{ view: 'system' }} module="system" />
                     <AlertsDropdown 
                        alerts={alerts}
                        onNavigate={(clientId) => navigateTo({ view: 'leadEditor', clientId })}
                        onMarkAsRead={(alertId) => {
                            if (alertId === 'all') {
                                setAlerts(prev => prev.map(a => ({...a, isRead: true})));
                            } else {
                                setAlerts(prev => prev.map(a => a.id === alertId ? {...a, isRead: true} : a));
                            }
                        }}
                    />
                    <button onClick={() => navigateTo({ view: 'userSettings' })} className={`flex flex-col items-center w-full p-2 rounded-lg transition-colors ${currentView.view === 'userSettings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 text-sm font-bold flex items-center justify-center mb-1">{currentUser.initials}</div>
                         <span className="text-xs font-medium">Me</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
                {renderView()}
            </main>

            {/* Modals */}
            <EmailModal 
                isOpen={emailModalState.isOpen}
                onClose={() => setEmailModalState({ isOpen: false, isLoading: false, error: null, data: null, clientId: null })}
                isLoading={emailModalState.isLoading}
                error={emailModalState.error}
                emailData={emailModalState.data}
                onSend={handleSendEmail}
            />
            <FileViewerModal 
                isOpen={fileViewerState.isOpen}
                onClose={() => setFileViewerState({ isOpen: false, file: null })}
                file={fileViewerState.file}
            />
             <AssignFileModal
                isOpen={assignFileState.isOpen}
                onClose={() => setAssignFileState({ isOpen: false, file: null, client: null })}
                fileToAssign={assignFileState.file}
                client={assignFileState.client}
                quotes={quotes}
                onAssign={(file, quoteId, itemId) => {
                     const quoteIndex = quotes.findIndex(q => q.id === quoteId);
                     if (quoteIndex === -1) return;

                     const quote = quotes[quoteIndex];
                     const itemIndex = quote.items.findIndex(i => i.id === itemId);
                     if (itemIndex === -1) return;

                     const newQuotes = [...quotes];
                     const newItems = [...newQuotes[quoteIndex].items];
                     const newItem = { ...newItems[itemIndex] };
                     newItem.photos = [...(newItem.photos || []), file];
                     newItems[itemIndex] = newItem;
                     newQuotes[quoteIndex] = { ...newQuotes[quoteIndex], items: newItems };
                     setQuotes(newQuotes);
                }}
            />
            <AppointmentModal 
                isOpen={appointmentModalState.isOpen}
                onClose={() => setAppointmentModalState({ isOpen: false, appointment: null })}
                appointment={appointmentModalState.appointment}
                onSave={handleSaveAppointment}
                onDelete={handleDeleteAppointment}
                staff={staff}
                clients={clients}
                quotes={quotes}
                currentUser={currentUser}
                prefilledClientId={appointmentModalState.prefilledClientId}
            />
             <Modal
                isOpen={appointmentConfirmationState.isOpen}
                onClose={() => setAppointmentConfirmationState({ isOpen: false, appointment: null, client: null })}
                title="Send Appointment Confirmation?"
                size="md"
            >
                <div>
                    <p>An email confirmation can be generated and sent for this appointment. Would you like to send it now?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setAppointmentConfirmationState({ isOpen: false, appointment: null, client: null })}>Skip</Button>
                        <Button onClick={handleSendAppointmentConfirmation}>Generate & Send</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}