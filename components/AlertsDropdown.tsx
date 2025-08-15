
import React, { useState, useEffect, useRef } from 'react';
import type { Alert } from '../types';
import { BellIcon, XMarkIcon } from './icons';

interface AlertsDropdownProps {
    alerts: Alert[];
    onNavigate: (clientId: string) => void;
    onMarkAsRead: (alertId: string | 'all') => void;
}

export const AlertsDropdown: React.FC<AlertsDropdownProps> = ({ alerts, onNavigate, onMarkAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const unreadAlerts = alerts.filter(a => !a.isRead);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const handleAlertClick = (alert: Alert) => {
        onNavigate(alert.clientId);
        onMarkAsRead(alert.id);
        setIsOpen(false);
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkAsRead('all');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex flex-col items-center justify-center w-full p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white"
                aria-label="Toggle notifications"
            >
                <BellIcon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Alerts</span>
                {unreadAlerts.length > 0 && (
                    <span className="absolute top-1 right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-gray-800">
                        {unreadAlerts.length}
                    </span>
                )}
            </button>
            {isOpen && (
                <div
                    className="origin-bottom-left absolute left-full bottom-0 ml-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        <div className="px-4 py-2 flex justify-between items-center border-b dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                            {unreadAlerts.length > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <ul className="max-h-96 overflow-y-auto">
                           {alerts.length > 0 ? alerts.map(alert => (
                                <li key={alert.id}>
                                    <button
                                        onClick={() => handleAlertClick(alert)}
                                        className={`w-full text-left block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${!alert.isRead ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                        role="menuitem"
                                    >
                                        <p className="font-semibold">{alert.type === 'stale_lead' && 'Stale Lead Warning'}</p>
                                        <p>{alert.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                                    </button>
                                </li>
                            )) : (
                                <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    You're all caught up!
                                </li>
                           )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
