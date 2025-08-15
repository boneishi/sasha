

import React, { useMemo, useState } from 'react';
import type { Client, Quote, Staff, SystemSettings } from '../types';
import { ChartBarIcon, CubeIcon, UsersIcon } from './icons';
import { PieChart } from './PieChart';

interface ReportsViewProps {
    quotes: Quote[];
    clients: Client[];
    staff: Staff[];
    systemSettings: SystemSettings;
}

const ReportCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h4 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{title}</h4>
        <p className="text-3xl font-bold text-stone-800 dark:text-stone-100 mt-2">{value}</p>
        {subtext && <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{subtext}</p>}
    </div>
);

type DateRange = 'all' | '7d' | '30d';

export const ReportsView: React.FC<ReportsViewProps> = ({ quotes, clients, staff, systemSettings }) => {
    const [dateRange, setDateRange] = useState<DateRange>('all');

    const formatCurrency = (value: number) => {
        return value.toLocaleString(undefined, { style: 'currency', currency: systemSettings.currency });
    };
    
    const { filteredQuotes, filteredClients } = useMemo(() => {
        if (dateRange === 'all') {
            return { filteredQuotes: quotes, filteredClients: clients };
        }
        const now = new Date();
        const daysToSubtract = dateRange === '7d' ? 7 : 30;
        const cutoffDate = new Date(new Date().setDate(now.getDate() - daysToSubtract));
        
        const fClients = clients.filter(c => new Date(c.createdAt) >= cutoffDate);
        const fQuotes = quotes.filter(q => new Date(q.date) >= cutoffDate);

        return { filteredQuotes: fQuotes, filteredClients: fClients };
    }, [quotes, clients, dateRange]);

    const kpis = useMemo(() => {
        const totalLeads = filteredClients.length;
        const totalQuotes = filteredQuotes.length;
        const totalQuotedValue = filteredQuotes.reduce((acc, quote) => acc + quote.items.reduce((itemAcc, item) => itemAcc + item.price * item.quantity, 0), 0);
        
        const wonQuotes = filteredQuotes.filter(q => q.status === 'Won');
        const totalInvoicedValue = wonQuotes.reduce((acc, quote) => acc + quote.items.reduce((itemAcc, item) => itemAcc + item.price * item.quantity, 0), 0);
        
        const relevantForConversion = filteredQuotes.filter(q => ['Won', 'Lost'].includes(q.status));
        const conversionRate = relevantForConversion.length > 0 ? (wonQuotes.length / relevantForConversion.length) * 100 : 0;
        
        return {
            totalLeads,
            totalQuotes,
            totalQuotedValue,
            totalInvoicedValue,
            conversionRate,
        };
    }, [filteredClients, filteredQuotes]);

    const quoteStatusData = useMemo(() => {
        const statusCounts = filteredQuotes.reduce((acc, quote) => {
            acc[quote.status] = (acc[quote.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const colorMap: Record<string, string> = {
            'New': '#d1d5db',
            'Appointment Booked': '#22d3ee',
            'Quoted': '#60a5fa',
            'Follow Up 1': '#fb923c',
            'Follow Up 2': '#facc15',
            'Won': '#4ade80',
            'Lost': '#f87171',
        };

        return Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value,
            color: colorMap[name] || '#a8a29e'
        })).filter(d => d.value > 0);
    }, [filteredQuotes]);
    
    const staffPerformance = useMemo(() => {
        return staff.map(s => {
            const assignedQuotes = filteredQuotes.filter(q => {
                const client = clients.find(c => c.id === q.clientId);
                return client?.assignedTo === s.id;
            });
            
            const quotedCount = assignedQuotes.length;
            const quotedValue = assignedQuotes.reduce((sum, q) => sum + q.items.reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);
            
            const wonQuotes = assignedQuotes.filter(q => q.status === 'Won');
            const orderCount = wonQuotes.length;
            const orderValue = wonQuotes.reduce((sum, q) => sum + q.items.reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);

            const conversionRate = quotedCount > 0 ? (orderCount / quotedCount) * 100 : 0;
            
            return {
                ...s,
                quotedCount,
                quotedValue,
                orderCount,
                orderValue,
                conversionRate,
            };
        }).sort((a, b) => b.orderValue - a.orderValue);
    }, [staff, filteredQuotes, clients]);

    const productPerformance = useMemo(() => {
        const performance: { [key: string]: { quoted: number, sold: number, value: number } } = {};
        
        filteredQuotes.forEach(quote => {
            quote.items.forEach(item => {
                if (!performance[item.itemType]) {
                    performance[item.itemType] = { quoted: 0, sold: 0, value: 0 };
                }
                performance[item.itemType].quoted += item.quantity;
                if (quote.status === 'Won') {
                    performance[item.itemType].sold += item.quantity;
                    performance[item.itemType].value += item.price * item.quantity;
                }
            });
        });
        
        return Object.entries(performance).map(([type, data]) => ({ type, ...data })).sort((a,b) => b.value - a.value);
    }, [filteredQuotes]);
    
    const DateFilterButton: React.FC<{ label: string; range: DateRange }> = ({ label, range }) => (
        <button
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${dateRange === range ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-gray-600'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-stone-50 dark:bg-gray-900 min-h-full overflow-y-auto p-8">
            <header className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-8 h-8 text-stone-600 dark:text-stone-300" />
                    <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100">Reports Dashboard</h1>
                </div>
                <div className="flex items-center p-1 bg-stone-100 dark:bg-gray-900 rounded-lg">
                    <DateFilterButton label="Last 7 Days" range="7d" />
                    <DateFilterButton label="Last 30 Days" range="30d" />
                    <DateFilterButton label="All Time" range="all" />
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <ReportCard title="New Leads" value={kpis.totalLeads.toString()} />
                <ReportCard title="Total Quotes" value={kpis.totalQuotes.toString()} />
                <ReportCard title="Quoted Value" value={formatCurrency(kpis.totalQuotedValue)} />
                <ReportCard title="Invoiced Value" value={formatCurrency(kpis.totalInvoicedValue)} subtext="From won quotes" />
                <ReportCard title="Conversion Rate" value={`${kpis.conversionRate.toFixed(1)}%`} subtext="Won vs Lost" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Staff & Product Performance */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><UsersIcon className="w-6 h-6"/> Staff Performance</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-50 dark:bg-gray-700/50 text-stone-600 dark:text-stone-300">
                                    <tr>
                                        <th className="p-3 font-semibold">Salesperson</th>
                                        <th className="p-3 font-semibold text-right">Quotes</th>
                                        <th className="p-3 font-semibold text-right">Orders</th>
                                        <th className="p-3 font-semibold text-right">Order Value</th>
                                        <th className="p-3 font-semibold text-right">Conv. Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                                    {staffPerformance.map(s => (
                                        <tr key={s.id}>
                                            <td className="p-3 font-medium text-stone-800 dark:text-stone-100">{s.name}</td>
                                            <td className="p-3 text-right">{s.quotedCount}</td>
                                            <td className="p-3 text-right">{s.orderCount}</td>
                                            <td className="p-3 text-right">{formatCurrency(s.orderValue)}</td>
                                            <td className="p-3 text-right font-medium">{s.conversionRate.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><CubeIcon className="w-6 h-6" /> Product Performance</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-50 dark:bg-gray-700/50 text-stone-600 dark:text-stone-300">
                                    <tr>
                                        <th className="p-3 font-semibold">Product Type</th>
                                        <th className="p-3 font-semibold text-right"># Quoted</th>
                                        <th className="p-3 font-semibold text-right"># Sold</th>
                                        <th className="p-3 font-semibold text-right">Total Value Sold</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                                    {productPerformance.map(p => (
                                        <tr key={p.type}>
                                            <td className="p-3 font-medium text-stone-800 dark:text-stone-100">{p.type}</td>
                                            <td className="p-3 text-right">{p.quoted}</td>
                                            <td className="p-3 text-right">{p.sold}</td>
                                            <td className="p-3 text-right">{formatCurrency(p.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4">Quote Status</h3>
                        <PieChart data={quoteStatusData} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold mb-4">Lead Locations</h3>
                        <div className="h-64 bg-stone-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-center text-stone-500 dark:text-stone-400 p-4">
                            Map visualization will be added in a future update.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};