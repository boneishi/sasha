import React from 'react';
import { Modal } from './Modal';
import { XMarkIcon } from './icons';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: { name: string; dataUrl: string; } | null;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, onClose, file }) => {
    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <img src={file.dataUrl} alt={file.name} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                <div className="absolute -bottom-8 left-0 right-0 text-center text-white p-2 bg-black bg-opacity-50 rounded-b-lg">
                    {file.name}
                </div>
                 <button onClick={onClose} className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-200" aria-label="Close viewer">
                    <XMarkIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>
    );
};