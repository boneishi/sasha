
import React, { useState, useEffect } from 'react';
import type { Staff, CompanyDocument, Team, Permission, ProductProfile, Material, SystemSettings, Role, EmailTemplate, ProductRange } from '../types';
import { UserGroupIcon, CubeIcon, Cog6ToothIcon, GlassIcon, ShieldCheckIcon, EnvelopeIcon, BookOpenIcon, CodeBracketIcon, FunnelIcon, SquaresPlusIcon, SashWindowIcon, CasementWindowIcon, DoorIcon, ViewColumnsIcon, BuildingOfficeIcon } from './icons';
import { StaffAndRolesSection as StaffSection } from './SystemViewStaff';
import { SystemViewProductTemplates } from './SystemViewProfiles';
import { SettingsSection } from './SystemViewSettings';
import { SystemViewMaterials } from './SystemViewMaterials';
import { TabButton } from './SystemViewCommon';
import { SystemViewEmail } from './SystemViewEmail';
import { SystemViewEmailTemplates } from './SystemViewEmailTemplates';
import { SystemViewDeveloper } from './SystemViewDeveloper';
import { SystemViewComponentTemplates } from './SystemViewComponents';
import { SystemViewCompanyDetails } from './SystemViewCompanyDetails';
import { SystemSettingsEditor } from './SystemSettingsEditor';
import { SystemViewInvoicing } from './SystemViewInvoicing';
import { SystemViewProjectSettings } from './SystemViewProjectSettings';

interface SystemViewProps {
    staff: Staff[];
    setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    documents: CompanyDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<CompanyDocument[]>>;
    teams: Team[];
    productProfiles: ProductProfile[];
    productRanges: ProductRange[];
    setProductRanges: React.Dispatch<React.SetStateAction<ProductRange[]>>;
    materials: Material[];
    setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
    onSaveProfile: (profile: ProductProfile) => void;
    onDeleteProfile: (profileId: string) => void;
    onImportProfiles: (profiles: ProductProfile[]) => void;
    onImportMaterials: (materials: Material[]) => void;
    systemSettings: SystemSettings;
    setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
    hasPermission: (permission: Permission) => boolean;
    emailTemplates: EmailTemplate[];
    onSaveEmailTemplate: (template: EmailTemplate) => void;
    onDeleteEmailTemplate: (templateId: string) => void;
    navigateTo: (view: any) => void;
}

export const SystemView: React.FC<SystemViewProps> = (props) => {
    type Tab = 'staff' | 'profiles-sash' | 'profiles-casement' | 'profiles-door' | 'profiles-screen' | 'materials' | 'settings' | 'email_smtp' | 'email_templates' | 'developer' | 'invoicing' | 'project';
    
    const canManageStaff = props.hasPermission('manageStaff');
    const canManageProducts = props.hasPermission('manageProductConfigurations');
    const canManageSettings = props.hasPermission('manageSettings');

    const getDefaultTab = (): Tab => {
        if (canManageStaff) return 'staff';
        if (canManageProducts) return 'profiles-sash';
        if (canManageSettings) return 'settings';
        return 'staff';
    };

    const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab());
    const [editingSettings, setEditingSettings] = useState(false);

    useEffect(() => {
        const tabPermissions: Record<string, boolean> = {
            staff: canManageStaff,
            materials: canManageProducts,
            settings: canManageSettings,
            email_smtp: canManageSettings,
            email_templates: canManageSettings,
            developer: canManageSettings && props.systemSettings.developerModeEnabled,
            invoicing: canManageSettings,
            project: canManageSettings,
        };

        const isProfileTab = activeTab.startsWith('profiles-');

        if (isProfileTab) {
            if (!canManageProducts) setActiveTab(getDefaultTab());
        } else {
            if (tabPermissions[activeTab] === false) {
                 setActiveTab(getDefaultTab());
            }
        }
    }, [canManageStaff, canManageProducts, canManageSettings, activeTab, props.systemSettings.developerModeEnabled]);

    useEffect(() => {
        if (activeTab !== 'settings') {
            setEditingSettings(false);
        }
    }, [activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'staff': return <StaffSection {...props} />;
            case 'profiles-sash':
            case 'profiles-casement':
            case 'profiles-door':
            case 'profiles-screen':
                const productType = activeTab.split('-')[1];
                const capitalizedProductType = productType.charAt(0).toUpperCase() + productType.slice(1);
                return <SystemViewProductTemplates {...props} productType={capitalizedProductType as any} />;
            case 'materials': return <SystemViewMaterials {...props} />;
            case 'settings':
                return editingSettings ? (
                    <SystemSettingsEditor
                        systemSettings={props.systemSettings}
                        setSystemSettings={props.setSystemSettings}
                        hasPermission={props.hasPermission}
                        onBack={() => setEditingSettings(false)}
                    />
                ) : (
                    <SettingsSection
                        {...props}
                        onEdit={() => setEditingSettings(true)}
                        onNavigate={setActiveTab}
                    />
                );
            case 'email_smtp': return <SystemViewEmail {...props} onBack={() => setActiveTab('settings')} />;
            case 'email_templates': return <SystemViewEmailTemplates templates={props.emailTemplates} onSave={props.onSaveEmailTemplate} onDelete={props.onDeleteEmailTemplate} />;
            case 'developer': return <SystemViewDeveloper systemSettings={props.systemSettings} setSystemSettings={props.setSystemSettings} />;
            case 'invoicing': return <SystemViewInvoicing {...props} />;
            case 'project': return <SystemViewProjectSettings
                    systemSettings={props.systemSettings}
                    setSystemSettings={props.setSystemSettings}
                    hasPermission={props.hasPermission}
                    onBack={() => setActiveTab('settings')}
                />;
            default: return null;
        }
    };

    return (
        <div className="flex h-full bg-stone-50 dark:bg-gray-900">
            <aside className="w-64 bg-white dark:bg-gray-800 p-4 border-r border-stone-200 dark:border-gray-700">
                <h2 className="text-lg font-bold mb-6 px-3">System Hub</h2>
                <nav className="space-y-1">
                    <TabButton icon={UserGroupIcon} label="Staff & Teams" isActive={activeTab === 'staff'} onClick={() => setActiveTab('staff')} disabled={!canManageStaff} />
                    <div className="pt-2">
                        <h3 className="px-3 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Products</h3>
                        <TabButton icon={GlassIcon} label="Materials Library" isActive={activeTab === 'materials'} onClick={() => setActiveTab('materials')} disabled={!canManageProducts}/>
                        <TabButton icon={SashWindowIcon} label="Sash Windows" isActive={activeTab === 'profiles-sash'} onClick={() => setActiveTab('profiles-sash')} disabled={!canManageProducts}/>
                        <TabButton icon={CasementWindowIcon} label="Casement Windows" isActive={activeTab === 'profiles-casement'} onClick={() => setActiveTab('profiles-casement')} disabled={!canManageProducts}/>
                        <TabButton icon={DoorIcon} label="Doors" isActive={activeTab === 'profiles-door'} onClick={() => setActiveTab('profiles-door')} disabled={!canManageProducts}/>
                        <TabButton icon={ViewColumnsIcon} label="Screens" isActive={activeTab === 'profiles-screen'} onClick={() => setActiveTab('profiles-screen')} disabled={!canManageProducts}/>
                    </div>
                     <div className="pt-2">
                        <h3 className="px-3 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Configuration</h3>
                        <TabButton icon={Cog6ToothIcon} label="System Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} disabled={!canManageSettings}/>
                        <TabButton icon={BuildingOfficeIcon} label="Invoicing" isActive={activeTab === 'invoicing'} onClick={() => setActiveTab('invoicing')} disabled={!canManageSettings} />
                        <TabButton icon={EnvelopeIcon} label="Email (SMTP)" isActive={activeTab === 'email_smtp'} onClick={() => setActiveTab('email_smtp')} disabled={!canManageSettings}/>
                        <TabButton icon={BookOpenIcon} label="Email Templates" isActive={activeTab === 'email_templates'} onClick={() => setActiveTab('email_templates')} disabled={!canManageSettings} />
                        {props.systemSettings.developerModeEnabled && (
                            <TabButton icon={CodeBracketIcon} label="Developer" isActive={activeTab === 'developer'} onClick={() => setActiveTab('developer')} disabled={!canManageSettings} />
                        )}
                    </div>
                </nav>
            </aside>
            <main className="flex-grow p-8 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};
