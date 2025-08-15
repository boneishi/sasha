import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { MailIcon, Cog6ToothIcon, CheckmarkIcon } from './icons';
import { Input, TextArea, Button } from './common';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
    emailData: {
        subject: string;
        body: string;
        clientEmail: string;
    } | null;
    onSend: (subject: string) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, isLoading, error, emailData, onSend }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (emailData) {
            setSubject(emailData.subject);
            setBody(emailData.body);
        }
        if (isOpen) {
            setIsSending(false);
        }
    }, [emailData, isOpen]);

    const handleSend = () => {
        if (!emailData) return;
        setIsSending(true);
        // Simulate sending email
        setTimeout(() => {
            onSend(subject);
            setIsSending(false);
            onClose();
        }, 1500);
    };
    
    let content;

    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-20 text-center min-h-[40vh]">
                <Cog6ToothIcon className="w-12 h-12 text-blue-500 animate-spin"/>
                <p className="mt-4 font-semibold text-lg">Generating email...</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Our AI is drafting a message. Please wait a moment.</p>
            </div>
        );
    } else if (error) {
        content = (
            <div className="p-10 text-center min-h-[40vh] flex flex-col justify-center items-center">
                <p className="font-semibold text-lg text-red-600">Error Generating Email</p>
                <p className="text-sm text-stone-600 dark:text-stone-300 mt-2">{error}</p>
            </div>
        );
    } else if (isSending) {
        content = (
            <div className="flex flex-col items-center justify-center p-20 text-center" style={{height: '75vh'}}>
                <MailIcon className="w-12 h-12 text-blue-500 animate-pulse"/>
                <p className="mt-4 font-semibold text-lg">Sending Email...</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                    Sending to {emailData?.clientEmail}.
                </p>
            </div>
        );
    } else if (emailData) {
        content = (
            <div className="flex flex-col" style={{height: '75vh'}}>
                <div className="p-4 border-b dark:border-gray-700 space-y-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-stone-500 dark:text-stone-400 w-16 text-right">To:</label>
                        <Input
                            type="text"
                            value={emailData.clientEmail}
                            readOnly
                            className="bg-stone-100 dark:bg-gray-800 border-none focus:ring-0"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="subject" className="text-sm font-medium text-stone-500 dark:text-stone-400 w-16 text-right">Subject:</label>
                        <Input
                            id="subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-grow p-4">
                    <TextArea
                        id="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full h-full border-none focus:ring-0 p-0 text-base"
                        placeholder="Email body..."
                    />
                </div>
                <div className="flex justify-end p-4 border-t dark:border-gray-700">
                    <Button
                        onClick={handleSend}
                        icon={MailIcon}
                        disabled={isSending}
                    >
                        {isSending ? 'Sending...' : 'Send Email'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compose Follow-Up Email" size="4xl">
            {content}
        </Modal>
    );
};