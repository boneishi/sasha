
import React, { useState, useEffect } from 'react';
import type { Staff, CompanyDocument, Team, Permission, ProductProfile, Material, SystemSettings, Role, EmailTemplate, ProductRange, ComponentTemplate } from '../types';
import { UserGroupIcon, Cog6ToothIcon, GlassIcon, ShieldCheckIcon, EnvelopeIcon, BookOpenIcon, CodeBracketIcon, FunnelIcon, SashWindowIcon, CasementWindowIcon, DoorIcon, ViewColumnsIcon, SquaresPlusIcon, BuildingOfficeIcon } from './icons';
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
                    