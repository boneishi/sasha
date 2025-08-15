
import React, { useState } from 'react';
import { ClockIcon, ChevronUpIcon, ChevronDownIcon } from './icons';

interface HistoryLog {
  user: string;
  action: string;
  details?: string;
  timestamp: string;
}

interface HistoryFooterProps {
    logs: HistoryLog[];
}

const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}

export const HistoryFooter: React.FC<HistoryFooterProps> = ({ logs }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const latestLog = logs[0];

    if (!latestLog) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-stone-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-all duration-300 ${isExpanded ? 'h-80' : 'h-10'}`}>
            <div className={`max-w-screen-2xl mx-auto flex flex-col h-full ${isExpanded ? 'p-4' : 'px-4'}`}>
                <div className="flex justify-between items-center flex-shrink-0 h-10">
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <ClockIcon className="w-4 h-4" />
                        <span className="font-semibold">{latestLog.user}</span>
                        <span>{latestLog.action}</span>
                        {latestLog.details && <span className="text-stone-400 dark:text-stone-500 italic">({latestLog.details})</span>}
                        <span>- {formatTimeAgo(latestLog.timestamp)}</span>
                    </div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700">
                        {isExpanded ? <ChevronDownIcon className="w-5 h-5"/> : <ChevronUpIcon className="w-5 h-5"/>}
                    </button>
                </div>
                {isExpanded && (
                    <div className="flex-grow overflow-y-auto mt-2 text-sm">
                         <ul className="divide-y divide-stone-100 dark:divide-gray-700">
                            {logs.map((log, index) => (
                                <li key={index} className="py-2 grid grid-cols-4 gap-4">
                                    <div className="col-span-1 text-stone-500 dark:text-stone-400">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                    <div className="col-span-1 font-semibold">
                                        {log.user}
                                    </div>
                                    <div className="col-span-2">
                                        <p className="font-medium">{log.action}</p>
                                        {log.details && <p className="text-xs text-stone-400">{log.details}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};