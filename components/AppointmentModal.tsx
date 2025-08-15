

import React, { useState, useEffect } from 'react';
import type { Appointment, Staff, Client, Quote } from '../types';
import { Modal } from './Modal';
import { SaveIcon, TrashIcon } from './icons';
import { Button, Input, Select } from './common';

const getClientName = (client: Client) => {
    if (client.companyName) return client.companyName;
    const primaryContact = client.contacts.find(c => c.isPrimary);
    return primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'Unnamed Client';
};

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onSave: (appointment: Appointment) => void;
    onDelete: (appointmentId: string) => void;
    staff: Staff[];
    clients: Client[];
    quotes: Quote[];
    currentUser: Staff;
    prefilledClientId?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, appointment, onSave, onDelete, staff, clients, quotes, currentUser, prefilledClientId }) => {
    const [formData, setFormData] = useState<Partial<Appointment>>({});

    useEffect(() => {
        if (isOpen) {
            let initialData: Partial<Appointment> = {
                title: '',
                staffId: currentUser.id,
                start: new Date().toISOString().slice(0, 16),
                end: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
                reason: 'Sales Visit',
            };

            if (prefilledClientId && !appointment) {
                initialData.clientId = prefilledClientId;
                const client = clients.find(c => c.id === prefilledClientId);
                if (client) {
                    initialData.title = `Consultation - ${getClientName(client)}`;
                }
            }

            setFormData(appointment || initialData);
        }
    }, [isOpen, appointment, currentUser, clients, prefilledClientId]);
    
    const handleChange = (field: keyof Appointment, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleClientChange = (clientId: string) => {
        setFormData(prev => ({ ...prev, clientId, quoteId: '' }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.start || !formData.end) {
            alert('Please fill in all required fields.');
            return;
        }

        onSave({
            id: appointment?.id || `appt-${Date.now()}`,
            ...formData
        } as Appointment);
    };
    
    const handleDelete = () => {
        if (appointment) {
            onDelete(appointment.id);
            onClose();
        }
    }

    const availableQuotes = formData.clientId ? quotes.filter(q => q.clientId === formData.clientId) : [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={appointment ? 'Edit Appointment' : 'New Appointment'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">Title</label>
                    <Input type="text" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} required/>
                </div>
                
                <div>
                    <label className="block text-sm font-medium">Reason</label>
                    <Select value={formData.reason || ''} onChange={e => handleChange('reason', e.target.value)}>
                        <option value="Sales Visit">Sales Visit</option>
                        <option value="Survey">Survey</option>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Start Time</label>
                        <Input type="datetime-local" value={formData.start ? new Date(new Date(formData.start).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''} onChange={e => handleChange('start', new Date(e.target.value).toISOString())} className="dark:[color-scheme:dark]" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">End Time</label>
                        <Input type="datetime-local" value={formData.end ? new Date(new Date(formData.end).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''} onChange={e => handleChange('end', new Date(e.target.value).toISOString())} className="dark:[color-scheme:dark]" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Assigned To</label>
                    <Select value={formData.staffId || ''} onChange={e => handleChange('staffId', e.target.value)}>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium">Client</label>
                    <Select value={formData.clientId || ''} onChange={e => handleClientChange(e.target.value)}>
                        <option value="">No Client</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{getClientName(c)}</option>)}
                    </Select>
                </div>

                {formData.clientId && (
                     <div>
                        <label className="block text-sm font-medium">Related Quote</label>
                        <Select value={formData.quoteId || ''} onChange={e => handleChange('quoteId', e.target.value)}>
                            <option value="">No specific quote</option>
                            {availableQuotes.map(q => <option key={q.id} value={q.id}>{q.quoteNumber} - {q.projectReference || 'No Ref'}</option>)}
                        </Select>
                    </div>
                )}


                <div className="flex justify-between items-center pt-4">
                    <div>
                        {appointment && (
                            <Button type="button" variant="danger" onClick={handleDelete} icon={TrashIcon}>
                                Delete
                            </Button>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" icon={SaveIcon}>
                           Save Appointment
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};