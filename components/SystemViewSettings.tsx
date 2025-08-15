import React from 'react';
import type { SystemSettings, Permission, Address } from '../types';
import { Button } from './common';
import { SectionHeader } from './SystemViewCommon';
import { formatAddress } from '../utils';

interface SettingsSectionProps {
    systemSettings: SystemSettings;
    hasPermission: (permission: Permission) => boolean;
    onEdit: () => void;
    onNavigate: (tab: 'invoicing' | 'project' | 'email_smtp') => void;
}

const SettingRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 border-b border-stone-200 dark:border-gray-700/50 last:border-b-0">
        <dt className="text-sm text-stone-600 dark:text-stone-400 sm:col-span-1">{label}</dt>
        <dd className="text-sm font-medium text-stone-800 dark:text-stone-200 sm:col-span-2">{value || 'Not Set'}</dd>
    </div>
);

const SettingsCard: React.FC<{ title: string; editLabel: string; onEdit: () => void; children: React.ReactNode; footerContent?: React.ReactNode; headerActions?: React.ReactNode; }> = ({ title, children, editLabel, onEdit, footerContent, headerActions }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">{title}</h3>
            <div className="flex items-center gap-2">
                {headerActions}
                <Button variant="secondary" onClick={onEdit}>{editLabel}</Button>
            </div>
        </div>
        <div className="p-6">
            <dl>
                {children}
            </dl>
        </div>
        {footerContent && (
             <div className="px-6 py-4 border-t dark:border-gray-700 bg-stone-50 dark:bg-gray-800/50 rounded-b-lg">
                {footerContent}
            </div>
        )}
    </div>
);

export const SettingsSection: React.FC<SettingsSectionProps> = ({ systemSettings, onEdit, onNavigate }) => {

    const formattedWorkingWeek = systemSettings.workingWeek.join(' to ');

    const DATE_FORMAT_MAP: Record<SystemSettings['dateFormat'], string> = {
        MDY: 'Month Day, Year',
        DMY: 'Day Month, Year',
        YMD: 'Year, Month Day',
    };

    const TIME_FORMAT_MAP: Record<SystemSettings['timeFormat'], string> = {
        '12h': '12 hour clock',
        '24h': '24 hour clock',
    };

    return (
        <div>
            <SectionHeader 
                title="System Settings"
                subtitle="An overview of your company's global settings."
            />
            <div className="space-y-8">
                <SettingsCard title="General Settings" editLabel="Edit General Settings" onEdit={onEdit}>
                    <SettingRow label="Company Name" value={systemSettings.companyName} />
                    <SettingRow label="Address" value={systemSettings.companyAddress ? formatAddress(systemSettings.companyAddress) : 'Not set'} />
                    <SettingRow label="Phone" value={systemSettings.companyPhone} />
                    <SettingRow label="Email" value={systemSettings.companyEmail} />
                    <SettingRow label="Website" value={systemSettings.companyWebsite} />
                    <SettingRow label="Default Language" value="English" />
                    <SettingRow label="Time Zone" value={systemSettings.timezone} />
                    <SettingRow label="Date Format" value={DATE_FORMAT_MAP[systemSettings.dateFormat]} />
                    <SettingRow label="Time Format" value={TIME_FORMAT_MAP[systemSettings.timeFormat]} />
                    <SettingRow label="First Day of the Week" value={systemSettings.firstDayOfWeek} />
                    <SettingRow label="Workdays" value={formattedWorkingWeek} />
                </SettingsCard>
                
                 <SettingsCard title="Project" editLabel="Edit Project Settings" onEdit={() => onNavigate('project')}>
                    <SettingRow label="Lead Number Prefix" value={systemSettings.leadNumberPrefix} />
                    <SettingRow label="Next Lead Number" value={systemSettings.leadNextNumber} />
                    <SettingRow label="Project Number Prefix" value={systemSettings.projectNumberPrefix} />
                    <SettingRow label="Next Project Number" value={systemSettings.projectNextNumber} />
                    <SettingRow label="Lead Statuses" value={systemSettings.labels.leads.map(s => s.name).join(', ')} />
                    <SettingRow label="Sales Statuses" value={systemSettings.labels.sales.map(s => s.name).join(', ')} />
                    <SettingRow label="Survey Statuses" value={systemSettings.labels.survey.map(s => s.name).join(', ')} />
                    <SettingRow label="Production Statuses" value={systemSettings.labels.production.map(s => s.name).join(', ')} />
                </SettingsCard>

                <SettingsCard title="Quotes & Invoicing" editLabel="Edit Quotes & Invoicing Settings" onEdit={() => onNavigate('invoicing')} headerActions={
                    <Button variant="secondary" onClick={() => { /* Navigate to Invoice Designer */ }}>Invoice Designer</Button>
                }>
                    <SettingRow label="Default Currency" value={systemSettings.currency} />
                    <SettingRow label="Tax Rates" value={"VAT (17.5%)"} />
                    <SettingRow label="Second Tax" value={"Disabled"} />
                    <SettingRow label="Grouping" value={"Keep invoice items separate"} />
                    <SettingRow label="Item Templates" value={"None"} />
                    <SettingRow label="Note Templates" value={"None"} />
                    <SettingRow label="Issued Invoice Due" value={"After 15 days (NET15)"} />
                    <SettingRow label="Overdue Reminders" value={"None"} />
                </SettingsCard>

                 <SettingsCard title="Email Integration (SMTP)" editLabel="Edit SMTP Settings" onEdit={() => onNavigate('email_smtp')}>
                    <SettingRow label="SMTP Server" value={systemSettings.smtpServer} />
                    <SettingRow label="Port" value={systemSettings.smtpPort} />
                    <SettingRow label="Encryption" value={systemSettings.smtpEncryption} />
                    <SettingRow label="Username" value={systemSettings.smtpUser} />
                    <SettingRow label="From Address" value={systemSettings.smtpFromAddress} />
                </SettingsCard>
            </div>
        </div>
    );
};