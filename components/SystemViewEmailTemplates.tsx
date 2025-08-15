import React, { useState } from 'react';
import type { EmailTemplate } from '../types';
import { SectionHeader } from './SystemViewCommon';
import { Button, Input, TextArea } from './common';
import { Modal } from './Modal';
import { PencilIcon, TrashIcon } from './icons';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: EmailTemplate | null;
    onSave: (template: EmailTemplate) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, template, onSave }) => {
    const [name, setName] = useState(template?.name || '');
    const [subject, setSubject] = useState(template?.subject || '');
    const [body, setBody] = useState(template?.body || '');

    const handleSave = () => {
        if (!name || !subject || !body) {
            alert('Please fill out all fields.');
            return;
        }
        onSave({
            id: template?.id || `et-${Date.now()}`,
            name,
            subject,
            body
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Edit Email Template' : 'Add New Email Template'} size="3xl">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Template Name</label>
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Quote Follow-up 2" />
                </div>
                <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., A quick follow-up on your quote" />
                </div>
                <div>
                    <label className="text-sm font-medium">Body</label>
                    <TextArea value={body} onChange={e => setBody(e.target.value)} rows={10} placeholder="You can use placeholders like [Client Name], [Quote Number], etc." />
                    <p className="text-xs text-stone-500 mt-1">Available placeholders: [Client Name], [Quote Number], [Quote Date], [User Name], [Appointment Date], [Appointment Time]</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Template</Button>
                </div>
            </div>
        </Modal>
    );
};


interface SystemViewEmailTemplatesProps {
    templates: EmailTemplate[];
    onSave: (template: EmailTemplate) => void;
    onDelete: (templateId: string) => void;
}

export const SystemViewEmailTemplates: React.FC<SystemViewEmailTemplatesProps> = ({ templates, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    const handleAdd = () => {
        setEditingTemplate(null);
        setIsModalOpen(true);
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleDelete = (template: EmailTemplate) => {
        if (window.confirm(`Are you sure you want to delete the "${template.name}" template?`)) {
            onDelete(template.id);
        }
    };

    return (
        <div>
            <SectionHeader
                title="Email Templates"
                subtitle="Create and manage standardized emails for your team to use."
                onAdd={handleAdd}
                addLabel="Add Template"
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-stone-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Template Name</th>
                            <th className="p-4 text-sm font-semibold uppercase text-stone-500 dark:text-stone-400">Subject</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                        {templates.map(template => (
                            <tr key={template.id}>
                                <td className="p-4 font-medium whitespace-nowrap">{template.name}</td>
                                <td className="p-4 text-stone-600 dark:text-stone-300">{template.subject}</td>
                                <td className="p-4 text-right whitespace-nowrap">
                                    <button onClick={() => handleEdit(template)} className="p-2 text-stone-500 hover:text-blue-600"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(template)} className="p-2 text-stone-500 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <TemplateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    template={editingTemplate}
                    onSave={onSave}
                />
            )}
        </div>
    );
};
