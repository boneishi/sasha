
import React, { useState, useEffect } from 'react';
import type { Staff, CompanyDocument, Team, Permission, ProductProfile, Material, SystemSettings, Role, EmailTemplate, ProductRange, ComponentTemplate } from '../types';
import { UserGroupIcon, Cog6ToothIcon, GlassIcon, ShieldCheckIcon, EnvelopeIcon, BookOpenIcon, CodeBracketIcon, FunnelIcon, SashWindowIcon, CasementWindowIcon, DoorIcon, ViewColumnsIcon, SquaresPlusIcon, BuildingOfficeIcon, ClipboardCheckIcon } from './icons';
import { StaffAndRolesSection } from './SystemViewStaff';
import { SystemViewProductTemplates } from './SystemViewProfiles';
import { SettingsSection } from './SystemViewSettings';
import { SystemViewMaterials } from './SystemViewMaterials';
import { TabButton } from './SystemViewCommon';
import { SystemViewEmail } from './SystemViewEmail';
import { SystemViewEmailTemplates } from './SystemViewEmailTemplates';
import { SystemViewDeveloper } from './SystemViewDeveloper';
import { SystemViewRanges } from './SystemViewRanges';
import { SystemViewComponentTemplates } from './SystemViewComponents';
import { SystemSettingsEditor } from './SystemSettingsEditor';
import { SystemViewInvoicing } from './SystemViewInvoicing';
import { SystemViewProjectSettings } from './SystemViewProjectSettings';

type Tab = 'staff' | 'profiles-sash' | 'profiles-casement' | 'profiles-door' | 'profiles-screen' | 'components' | 'materials' | 'settings' | 'email_smtp' | 'email_templates' | 'developer' | 'ranges' | 'invoicing' | 'project';

interface SystemViewProps {
    initialTab?: Tab;
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
    componentTemplates: ComponentTemplate[];
    setComponentTemplates: React.Dispatch<React.SetStateAction<ComponentTemplate[]>>;
    onSaveProfile: (profile: ProductProfile) => void;
    onDeleteProfile: (profileId: string) => void;
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
    
    const canManageStaff = props.hasPermission('manageStaff');
    const canManageProducts = props.hasPermission('manageProductConfigurations');
    const canManageSettings = props.hasPermission('manageSettings');

    const getDefaultTab = (): Tab => {
        if (canManageSettings) return 'settings';
        if (canManageStaff) return 'staff';
        if (canManageProducts) return 'profiles-sash';
        return 'settings';
    };

    const [activeTab, setActiveTab] = useState<Tab>(props.initialTab || getDefaultTab());
    const [editingSettings, setEditingSettings] = useState(false);
    
    useEffect(() => {
        const tabPermissions: Record<string, boolean> = {
            staff: canManageStaff,
            materials: canManageProducts,
            ranges: canManageProducts,
            components: canManageProducts,
            settings: canManageSettings,
            project: canManageSettings,
            invoicing: canManageSettings,
            email_smtp: canManageSettings,
            email_templates: canManageSettings,
            developer: canManageSettings && props.systemSettings.developerModeEnabled,
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
        // When switching to a different tab, exit edit mode
        if (activeTab !== 'settings') {
            setEditingSettings(false);
        }
    }, [activeTab]);


    const renderContent = () => {
        switch (activeTab) {
            case 'staff': return <StaffAndRolesSection {...props} />;
            case 'profiles-sash':
            case 'profiles-casement':
            case 'profiles-door':
            case 'profiles-screen':
                const productType = activeTab.split('-')[1];
                const capitalizedProductType = productType.charAt(0).toUpperCase() + productType.slice(1);
                return <SystemViewProductTemplates {...props} productType={capitalizedProductType as any} />;
            case 'components': return <SystemViewComponentTemplates {...props} />;
            case 'materials': return <SystemViewMaterials {...props} />;
            case 'ranges': return <SystemViewRanges productRanges={props.productRanges} setProductRanges={props.setProductRanges} materials={props.materials} canEdit={canManageProducts} />;
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
            case 'project': return <SystemViewProjectSettings
                    systemSettings={props.systemSettings}
                    setSystemSettings={props.setSystemSettings}
                    hasPermission={props.hasPermission}
                    onBack={() => setActiveTab('settings')}
            />;
            case 'invoicing': return <SystemViewInvoicing
                    systemSettings={props.systemSettings}
                    setSystemSettings={props.setSystemSettings}
                    hasPermission={props.hasPermission}
            />;
            case 'email_smtp': return <SystemViewEmail
                    systemSettings={props.systemSettings}
                    setSystemSettings={props.setSystemSettings}
                    hasPermission={props.hasPermission}
                    onBack={() => setActiveTab('settings')}
            />;
            case 'developer': return <SystemViewDeveloper
                    systemSettings={props.systemSettings}
                    setSystemSettings={props.setSystemSettings}
            />;
            default: return null;
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
                <TabButton icon={UserGroupIcon} active={activeTab === 'staff'} onClick={() => setActiveTab('staff')}>Staff</TabButton>
                <TabButton icon={SashWindowIcon} active={activeTab === 'profiles-sash'} onClick={() => setActiveTab('profiles-sash')}>Profiles (Sash)</TabButton>
                <TabButton icon={CasementWindowIcon} active={activeTab === 'profiles-casement'} onClick={() => setActiveTab('profiles-casement')}>Profiles (Casement)</TabButton>
                <TabButton icon={DoorIcon} active={activeTab === 'profiles-door'} onClick={() => setActiveTab('profiles-door')}>Profiles (Door)</TabButton>
                <TabButton icon={ViewColumnsIcon} active={activeTab === 'profiles-screen'} onClick={() => setActiveTab('profiles-screen')}>Profiles (Screen)</TabButton>
                <TabButton icon={SquaresPlusIcon} active={activeTab === 'components'} onClick={() => setActiveTab('components')}>Components</TabButton>
                <TabButton icon={GlassIcon} active={activeTab === 'materials'} onClick={() => setActiveTab('materials')}>Materials</TabButton>
                <TabButton icon={FunnelIcon} active={activeTab === 'ranges'} onClick={() => setActiveTab('ranges')}>Ranges</TabButton>
                <TabButton icon={Cog6ToothIcon} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>Settings</TabButton>
                <TabButton icon={BuildingOfficeIcon} active={activeTab === 'project'} onClick={() => setActiveTab('project')}>Project</TabButton>
                <TabButton icon={ClipboardCheckIcon} active={activeTab === 'invoicing'} onClick={() => setActiveTab('invoicing')}>Invoicing</TabButton>
                <TabButton icon={EnvelopeIcon} active={activeTab === 'email_smtp'} onClick={() => setActiveTab('email_smtp')}>Email</TabButton>
                <TabButton icon={CodeBracketIcon} active={activeTab === 'developer'} onClick={() => setActiveTab('developer')}>Developer</TabButton>
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
};
