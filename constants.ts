

import React from 'react';
import type { Client, Quote, QuoteItem, Staff, CompanyDocument, Team, Permission, Material, ProductProfile, SystemSettings, ProjectType, CustomerType, Appointment, Role, Contact, Address, EmailTemplate, Email, Module, ContactRole, ProductRange, ComponentTemplate } from './types';
import { QuoteStatus } from './types';

export const ALL_MODULES: { id: Module, name: string, disabled?: boolean }[] = [
    { id: 'leads', name: 'Leads' },
    { id: 'sales', name: 'Quotes' },
    { id: 'surveys', name: 'Surveys' },
    { id: 'production', name: 'Production' },
    { id: 'installation', name: 'Installation' },
    { id: 'reports', name: 'Reports' },
    { id: 'calendar', name: 'Calendar' },
    { id: 'system', name: 'System', disabled: true }, // System module cannot be disabled
];

export const INITIAL_MATERIALS: Material[] = [
    // Timbers
    { id: 'mat-1', name: 'Engineered Redwood', type: 'Timber', color: '#D3B48C', density: 510 },
    { id: 'mat-2', name: 'Accoya', type: 'Timber', color: '#E0D6C5', density: 510 },
    { id: 'mat-3', name: 'Sapele', type: 'Timber', color: '#885141', density: 640 },
    { id: 'mat-4', name: 'European Oak', type: 'Timber', color: '#B89F7E', density: 720 },
    
    // Cills
    { id: 'mat-5', name: 'Hardwood Cill', type: 'Cill', color: '#8C6E54' },
    { id: 'mat-6', name: 'Aluminium Cill', type: 'Cill', color: '#B8C0C8' },
    
    // Finishes
    { id: 'mat-7', name: 'RAL 9010 Pure White', type: 'Finish', color: '#FFFFFF' },
    { id: 'mat-8', name: 'RAL 7016 Anthracite Grey', type: 'Finish', color: '#383E42' },
    { id: 'mat-9', name: 'F&B Elephants Breath', type: 'Finish', color: '#d3cdc4' },
    
    // Glass (migrated from GlassType)
    { id: 'glass-1', name: 'Standard Double Glazed', type: 'Glass', thickness: 24, uValue: 1.2, spec: '4-16-4', color: '#e0f2fe' },
    { id: 'glass-2', name: 'Toughened Safety', type: 'Glass', thickness: 24, uValue: 1.2, spec: '4T-16-4T', color: '#e0f2fe' },
    { id: 'glass-3', name: 'Acoustic Laminate', type: 'Glass', thickness: 24.8, uValue: 1.1, spec: '6.4L-14-4T', color: '#dbeafe' },
    { id: 'glass-4', name: 'Obscure (Minster)', type: 'Glass', thickness: 24, uValue: 1.2, spec: '4-16-4O', color: '#f0f9ff' },
    { id: 'glass-5', name: 'Low-E Triple Glazed', type: 'Glass', thickness: 36, uValue: 0.8, spec: '4-12-4-12-4', color: '#e0f2fe' },


    // Ironmongery
    { id: 'iron-1', name: 'Standard Sash Locks', type: 'Ironmongery' },
    { id: 'iron-2', name: 'Slimline Sash Locks', type: 'Ironmongery' },
    { id: 'iron-3', name: 'Standard Friction Hinges', type: 'Ironmongery' },
    { id: 'iron-4', name: 'Espagnolette', type: 'Ironmongery' },
    { id: 'iron-5', name: '3D Adjustable Hinges', type: 'Ironmongery' },
    { id: 'iron-6', name: '5-Point MPL', type: 'Ironmongery' },
];

export const CUSTOMER_TYPES: CustomerType[] = ['Homeowner', 'Contractor', 'Window Installer', 'Architect', 'Interior Designer'];
export const CONTACT_ROLES: ContactRole[] = ['Client', 'Partner', 'Architect', 'Builder', 'Designer', 'Other'];

export const CURRENCY_SYMBOLS: Record<SystemSettings['currency'], string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
};

export const ALL_PERMISSIONS: { id: Permission, description: string }[] = [
    { id: 'manageClients', description: 'Can add, edit, and delete clients.' },
    { id: 'manageQuotes', description: 'Can create, edit, and manage quotes.' },
    { id: 'sendFollowUpEmails', description: 'Can send AI-generated follow-up emails.'},
    { id: 'viewReports', description: 'Can view the reports dashboard.' },
    { id: 'conductSurveys', description: 'Can conduct surveys for won jobs.' },
    { id: 'manageStaff', description: 'Can add, edit, and remove staff members and roles.' },
    { id: 'manageProductConfigurations', description: 'Can edit product configurations.' },
    { id: 'manageSettings', description: 'Can edit system-wide settings.' },
    { id: 'manageProduction', description: 'Can manage the production schedule.' },
    { id: 'manageInstallation', description: 'Can manage the installation schedule.' },
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
    currency: 'GBP',
    timezone: 'UTC',
    dateFormat: 'MDY',
    timeFormat: '24h',
    firstDayOfWeek: 'Monday',
    workingWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workingHoursStart: 9,
    workingHoursEnd: 17,
    customerTypeColors: {
        'Homeowner': '#8B5CF6',
        'Contractor': '#3B82F6',
        'Window Installer': '#F97316',
        'Architect': '#22C55E',
        'Interior Designer': '#EC4899',
    },
    leadNumberPrefix: 'L',
    leadNextNumber: 1030,
    projectNumberPrefix: 'P',
    projectNextNumber: 105,
    smtpServer: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpEncryption: 'starttls',
    smtpFromAddress: '',
    developerModeEnabled: false,
    enabledModules: ['leads', 'sales', 'surveys', 'production', 'installation', 'reports', 'system', 'calendar'],
    labels: {
        leads: [
            { id: 'ls-1', name: 'New', color: '#BFDBFE', isProtected: true },
            { id: 'ls-2', name: 'Contacted', color: '#A5F3FC' },
            { id: 'ls-3', name: 'Appointment Booked', color: '#A7F3D0' },
            { id: 'ls-4', name: 'Unqualified', color: '#FECACA' },
            { id: 'ls-6', name: 'Lost', color: '#FECACA' },
        ],
        sales: [
            { id: 'ss-1', name: 'New', color: '#BFDBFE', isProtected: true },
            { id: 'ss-2', name: 'Appointment Booked', color: '#A5F3FC' },
            { id: 'ss-3', name: 'Quoted', color: '#A7F3D0', isProtected: true },
            { id: 'ss-4', name: 'Follow Up 1', color: '#FED7AA' },
            { id: 'ss-5', name: 'Follow Up 2', color: '#FEF08A' },
            { id: 'ss-6', name: 'Won', color: '#A7F3D0', isProtected: false },
            { id: 'ss-7', name: 'Lost', color: '#FECACA', isProtected: false },
            { id: 'ss-8', name: 'Survey', color: '#DDD6FE', isProtected: true },
        ],
        survey: [
            { id: 'sur-1', name: 'Survey Booked', color: '#BFDBFE' },
            { id: 'sur-2', name: 'Survey Complete', color: '#A7F3D0' },
            { id: 'sur-3', name: 'On Hold', color: '#FEF08A' },
            { id: 'sur-4', name: 'Ready for Production', color: '#C7D2FE', isProtected: true },
        ],
        production: [
            { id: 'prod-1', name: 'In Production', color: '#BFDBFE' },
            { id: 'prod-2', name: 'Production Complete', color: '#A7F3D0' },
        ]
    },
    companyName: 'Sash Style Pro',
    companyAddress: {
        line1: '123 Window Lane',
        townCity: 'Design City',
        postcode: 'DC 45678',
    },
    companyPhone: '(555) 123-4567',
    companyEmail: 'contact@sashstyle.pro',
    companyWebsite: 'www.sashstyle.pro',
};

export const INITIAL_ROLES: Role[] = [
    { 
        id: 'role-admin', 
        name: 'Administrator', 
        permissions: ['manageClients', 'manageQuotes', 'manageStaff', 'manageProductConfigurations', 'manageSettings', 'viewReports', 'conductSurveys', 'sendFollowUpEmails', 'manageProduction', 'manageInstallation'] 
    },
    {
        id: 'role-sales',
        name: 'Sales',
        permissions: ['manageClients', 'manageQuotes', 'sendFollowUpEmails', 'viewReports']
    },
    {
        id: 'role-surveyor',
        name: 'Surveyor',
        permissions: ['conductSurveys']
    },
    {
        id: 'role-installer',
        name: 'Installer',
        permissions: ['manageInstallation']
    }
];

export const TEAMS: Team[] = [
    { id: 'team-1', name: 'Sales & Quoting' },
    { id: 'team-2', name: 'Surveying' },
    { id: 'team-3', name: 'Installation & Fitting' },
];

export const STAFF_MEMBERS: Staff[] = [
    { id: 'staff-1', name: 'Alex Johnson', initials: 'AJ', teamId: 'team-1', roleId: 'role-admin', email: 'alex.j@sashstyle.pro', mobile: '07123 456789' },
];

export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_QUOTES: Quote[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_DOCUMENTS: CompanyDocument[] = [];
export const INITIAL_COMPONENT_TEMPLATES: ComponentTemplate[] = [
    {
        id: 'comp-sash-1',
        name: 'Heritage Sliding Sash',
        itemType: 'Sash',
        applicableTo: ['Sash'],
        sashInfo: { head: 55, stile: 55, bottomRail: 95, meetingStile: 30, thickness: 56 },
        layout: {
            instances: [{ id: 'inst-comp-sash-1', overallWidth: 1000, overallHeight: 1600, topSashHeight: 800 }],
        }
    },
    {
        id: 'comp-casement-1',
        name: '45mm Flush Casement',
        itemType: 'Casement',
        applicableTo: ['Casement'],
        sashInfo: { head: 45, stile: 45, bottomRail: 45, meetingStile: 0, thickness: 56 },
        layout: {
            instances: [{ id: 'inst-comp-cas-1', overallWidth: 600, overallHeight: 1200 }],
            placedSashes: [{ paneId: 'inst-comp-cas-1-0-0', type: 'casement', hingeSide: 'right' }],
        },
    },
    {
        id: 'comp-casement-2',
        name: '45mm French Flush Casements',
        itemType: 'Casement',
        applicableTo: ['Casement'],
        sashInfo: { head: 45, stile: 45, bottomRail: 45, meetingStile: 22.5, thickness: 56 },
        layout: {
            instances: [{ id: 'inst-comp-cas-2', overallWidth: 1200, overallHeight: 1200 }],
            mullions: [{ id: 'm-comp-cas-2-1', type: 'mullion', offset: 600, thickness: 0.1 }],
            placedSashes: [
                { paneId: 'inst-comp-cas-2-0-0', type: 'casement', hingeSide: 'left' },
                { paneId: 'inst-comp-cas-2-0-1', type: 'casement', hingeSide: 'right' }
            ]
        },
    },
    {
        id: 'comp-casement-3',
        name: '55mm Flush Casement',
        itemType: 'Casement',
        applicableTo: ['Casement'],
        sashInfo: { head: 55, stile: 55, bottomRail: 55, meetingStile: 0, thickness: 56 },
        layout: {
            instances: [{ id: 'inst-comp-cas-3', overallWidth: 600, overallHeight: 1200 }],
            placedSashes: [{ paneId: 'inst-comp-cas-3-0-0', type: 'casement', hingeSide: 'right' }],
        },
    },
    {
        id: 'comp-casement-4',
        name: '55mm French Flush Casements',
        itemType: 'Casement',
        applicableTo: ['Casement'],
        sashInfo: { head: 55, stile: 55, bottomRail: 55, meetingStile: 27.5, thickness: 56 },
        layout: {
            instances: [{ id: 'inst-comp-cas-4', overallWidth: 1200, overallHeight: 1200 }],
            mullions: [{ id: 'm-comp-cas-4-1', type: 'mullion', offset: 600, thickness: 0.1 }],
            placedSashes: [
                { paneId: 'inst-comp-cas-4-0-0', type: 'casement', hingeSide: 'left' },
                { paneId: 'inst-comp-cas-4-0-1', type: 'casement', hingeSide: 'right' }
            ]
        },
    },
    {
        id: 'comp-casement-5',
        name: '68mm Stormproof Casement',
        itemType: 'Casement',
        applicableTo: ['Casement'],
        sashInfo: { head: 68, stile: 68, bottomRail: 68, meetingStile: 0, thickness: 56 },
        layout: {
            instances: [{ id: 'inst-comp-cas-5', overallWidth: 600, overallHeight: 1200 }],
            placedSashes: [{ paneId: 'inst-comp-cas-5-0-0', type: 'casement', hingeSide: 'right' }],
        },
    },
    {
        id: 'comp-door-1',
        name: '68mm Door',
        itemType: 'Door',
        applicableTo: ['Door'],
        sashInfo: { head: 68, stile: 68, bottomRail: 68, meetingStile: 0, thickness: 56 },
        layout: {
            instances: [{ id: 'inst-comp-door-1', overallWidth: 900, overallHeight: 2100 }],
            placedSashes: [{ paneId: 'inst-comp-door-1-0-0', type: 'door-sash', hingeSide: 'right' }],
        },
    },
];

export const INITIAL_PRODUCT_RANGES: ProductRange[] = [
    { id: 'range-1', name: 'Heritage Range', itemType: 'Sash', frameThickness: 70, outerHeadHeight: 95, outerCillHeight: 70, outerLeftJambWidth: 95, outerRightJambWidth: 95, outerTransomHeight: 95, outerMullionWidth: 95, innerHeightHeight: 95, innerCillHeight: 70, innerLeftJambWidth: 95, innerRightJambWidth: 95, innerTransomHeight: 95, innerMullionWidth: 95, topRailHeight: 55, bottomRailHeight: 95, meetingRailHeight: 30, stileWidth: 55, materialSashId: 'mat-1', materialFrameId: 'mat-1', materialCillId: 'mat-5', defaultGlassTypeId: 'glass-1', rebateDepth: 15, rebateWidth: 12 },
    { id: 'range-2', name: 'Modern Range', itemType: 'Sash', frameThickness: 70, outerHeadHeight: 75, outerCillHeight: 60, outerLeftJambWidth: 75, outerRightJambWidth: 75, outerTransomHeight: 75, outerMullionWidth: 75, innerHeightHeight: 75, innerCillHeight: 60, innerLeftJambWidth: 75, innerRightJambWidth: 75, innerTransomHeight: 75, innerMullionWidth: 75, topRailHeight: 45, bottomRailHeight: 75, meetingRailHeight: 25, stileWidth: 45, materialSashId: 'mat-2', materialFrameId: 'mat-2', materialCillId: 'mat-6', defaultGlassTypeId: 'glass-2', rebateDepth: 15, rebateWidth: 12 },
    { id: 'range-3', name: 'Classic Range', itemType: 'Casement', frameThickness: 70, outerHeadHeight: 80, outerCillHeight: 80, outerLeftJambWidth: 80, outerRightJambWidth: 80, outerTransomHeight: 80, outerMullionWidth: 80, innerHeightHeight: 80, innerCillHeight: 80, innerLeftJambWidth: 80, innerRightJambWidth: 80, innerTransomHeight: 80, innerMullionWidth: 80, topRailHeight: 80, bottomRailHeight: 80, meetingRailHeight: 0, stileWidth: 80, materialSashId: 'mat-1', materialFrameId: 'mat-1', materialCillId: 'mat-5', defaultGlassTypeId: 'glass-1', openingDirection: 'outward', glazingType: 'externally', rebateDepth: 15, rebateWidth: 12 },
    { id: 'range-4', name: 'Contemporary Range', itemType: 'Casement', frameThickness: 70, outerHeadHeight: 70, outerCillHeight: 70, outerLeftJambWidth: 70, outerRightJambWidth: 70, outerTransomHeight: 70, outerMullionWidth: 70, innerHeightHeight: 70, innerCillHeight: 70, innerLeftJambWidth: 70, innerRightJambWidth: 70, innerTransomHeight: 70, innerMullionWidth: 70, topRailHeight: 70, bottomRailHeight: 70, meetingRailHeight: 0, stileWidth: 70, materialSashId: 'mat-4', materialFrameId: 'mat-4', materialCillId: 'mat-5', defaultGlassTypeId: 'glass-2', openingDirection: 'outward', glazingType: 'externally', rebateDepth: 15, rebateWidth: 12 },
    { id: 'range-5', name: 'Entrance Doors', itemType: 'Door', frameThickness: 70, outerHeadHeight: 90, outerCillHeight: 50, outerLeftJambWidth: 90, outerRightJambWidth: 90, outerTransomHeight: 90, outerMullionWidth: 90, innerHeightHeight: 90, innerCillHeight: 50, innerLeftJambWidth: 90, innerRightJambWidth: 90, innerTransomHeight: 90, innerMullionWidth: 90, topRailHeight: 120, bottomRailHeight: 150, meetingRailHeight: 0, stileWidth: 120, materialSashId: 'mat-3', materialFrameId: 'mat-3', materialCillId: 'mat-5', defaultGlassTypeId: 'glass-2', openingDirection: 'outward', glazingType: 'externally', rebateDepth: 15, rebateWidth: 12 },
    { id: 'range-6', name: 'Country Range', itemType: 'Door', frameThickness: 70, outerHeadHeight: 85, outerCillHeight: 50, outerLeftJambWidth: 85, outerRightJambWidth: 85, outerTransomHeight: 85, outerMullionWidth: 85, innerHeightHeight: 85, innerCillHeight: 50, innerLeftJambWidth: 85, innerRightJambWidth: 85, innerTransomHeight: 85, innerMullionWidth: 85, topRailHeight: 110, bottomRailHeight: 140, meetingRailHeight: 0, stileWidth: 110, materialSashId: 'mat-4', materialFrameId: 'mat-4', materialCillId: 'mat-5', defaultGlassTypeId: 'glass-2', openingDirection: 'outward', glazingType: 'externally', rebateDepth: 15, rebateWidth: 12 },
    { id: 'range-7', name: 'Screen Range', itemType: 'Screen', frameThickness: 70, outerHeadHeight: 90, outerCillHeight: 50, outerLeftJambWidth: 90, outerRightJambWidth: 90, outerTransomHeight: 90, outerMullionWidth: 90, innerHeightHeight: 90, innerCillHeight: 50, innerLeftJambWidth: 90, innerRightJambWidth: 90, innerTransomHeight: 90, innerMullionWidth: 90, topRailHeight: 120, bottomRailHeight: 150, meetingRailHeight: 0, stileWidth: 120, materialSashId: 'mat-1', materialFrameId: 'mat-1', materialCillId: 'mat-5', defaultGlassTypeId: 'glass-1', openingDirection: 'outward', glazingType: 'externally', rebateDepth: 15, rebateWidth: 12 },
];


export const INITIAL_PRODUCT_PROFILES: ProductProfile[] = [
    // Sash Windows
    {
        id: 'pp-sash-1', name: 'Heritage Sash', itemType: 'Sash', productRangeId: 'range-1',
        materialSashId: 'mat-1', materialFrameId: 'mat-1', materialCillId: 'mat-5',
        externalFinishId: 'mat-7', internalFinishId: 'mat-7',
        frameThickness: 70,
        outerHeadHeight: 95, outerCillHeight: 70, outerLeftJambWidth: 95, outerRightJambWidth: 95, outerTransomHeight: 95, outerMullionWidth: 95,
        innerHeightHeight: 95, innerCillHeight: 70, innerLeftJambWidth: 95, innerRightJambWidth: 95, innerTransomHeight: 95, innerMullionWidth: 95,
        topRailHeight: 55, bottomRailHeight: 95, meetingRailHeight: 30, stileWidth: 55,
        glazingBarThickness: 25,
        ironmongery: { hinges: 'N/A', mpls: 'Standard Sash Locks' },
        rebateDepth: 15, rebateWidth: 12,
    },
    {
        id: 'pp-sash-2', name: 'Slimline Sash', itemType: 'Sash', productRangeId: 'range-2',
        materialSashId: 'mat-2', materialFrameId: 'mat-2', materialCillId: 'mat-6',
        externalFinishId: 'mat-8', internalFinishId: 'mat-8',
        frameThickness: 70,
        outerHeadHeight: 75, outerCillHeight: 60, outerLeftJambWidth: 75, outerRightJambWidth: 75, outerTransomHeight: 75, outerMullionWidth: 75,
        innerHeightHeight: 75, innerCillHeight: 60, innerLeftJambWidth: 75, innerRightJambWidth: 75, innerTransomHeight: 75, innerMullionWidth: 75,
        topRailHeight: 45, bottomRailHeight: 75, meetingRailHeight: 25, stileWidth: 45,
        glazingBarThickness: 20,
        ironmongery: { hinges: 'N/A', mpls: 'Slimline Sash Locks' },
        rebateDepth: 15, rebateWidth: 12,
    },
    // Casement Windows
    {
        id: 'pp-casement-1', name: 'Classic Casement', itemType: 'Casement', productRangeId: 'range-3',
        materialSashId: 'mat-1', materialFrameId: 'mat-1', materialCillId: 'mat-5',
        externalFinishId: 'mat-7', internalFinishId: 'mat-7',
        frameThickness: 70,
        outerHeadHeight: 80, outerCillHeight: 80, outerLeftJambWidth: 80, outerRightJambWidth: 80, outerTransomHeight: 80, outerMullionWidth: 80,
        innerHeightHeight: 80, innerCillHeight: 80, innerLeftJambWidth: 80, innerRightJambWidth: 80, innerTransomHeight: 80, innerMullionWidth: 80,
        topRailHeight: 80, bottomRailHeight: 80, meetingRailHeight: 0, stileWidth: 80,
        glazingBarThickness: 25,
        ironmongery: { hinges: 'Standard Friction Hinges', mpls: 'Espagnolette' },
        openingDirection: 'outward', glazingType: 'externally',
        rebateDepth: 15, rebateWidth: 12,
        defaultLayout: {
            instances: [{id: 'inst-ppc-1', overallWidth: 1200, overallHeight: 1200}],
            mullions: [{ id: 'm-cas-1-1', type: 'mullion', offset: 600 }],
            transoms: [],
            placedSashes: [
                { paneId: 'inst-ppc-1-0-0', type: 'casement', hingeSide: 'left' },
                { paneId: 'inst-ppc-1-0-1', type: 'casement', hingeSide: 'right' },
            ]
        }
    },
    {
        id: 'pp-casement-2', name: 'Modern Flush Casement', itemType: 'Casement', productRangeId: 'range-4',
        materialSashId: 'mat-4', materialFrameId: 'mat-4', materialCillId: 'mat-5',
        externalFinishId: 'mat-8', internalFinishId: 'mat-8',
        frameThickness: 70,
        outerHeadHeight: 70, outerCillHeight: 70, outerLeftJambWidth: 70, outerRightJambWidth: 70, outerTransomHeight: 70, outerMullionWidth: 70,
        innerHeightHeight: 70, innerCillHeight: 70, innerLeftJambWidth: 70, innerRightJambWidth: 70, innerTransomHeight: 70, innerMullionWidth: 70,
        topRailHeight: 70, bottomRailHeight: 70, meetingRailHeight: 0, stileWidth: 70,
        glazingBarThickness: 22,
        ironmongery: { hinges: 'Concealed Hinges', mpls: 'Espagnolette' },
        openingDirection: 'outward', glazingType: 'externally',
        rebateDepth: 15, rebateWidth: 12,
        defaultLayout: {
            instances: [{id: 'inst-ppc-2', overallWidth: 1500, overallHeight: 1000}],
            mullions: [{ id: 'm-cas-2-1', type: 'mullion', offset: 750 }],
            transoms: [],
            placedSashes: [
                { paneId: 'inst-ppc-2-0-0', type: 'fixed-glazing' },
                { paneId: 'inst-ppc-2-0-1', type: 'casement', hingeSide: 'right' },
            ]
        }
    },
    // Doors
    {
        id: 'pp-door-1', name: 'Classic French Door', itemType: 'Door', productRangeId: 'range-5',
        materialSashId: 'mat-3', materialFrameId: 'mat-3', materialCillId: 'mat-5',
        externalFinishId: 'mat-8', internalFinishId: 'mat-7',
        frameThickness: 70,
        outerHeadHeight: 90, outerCillHeight: 50, outerLeftJambWidth: 90, outerRightJambWidth: 90, outerTransomHeight: 90, outerMullionWidth: 90,
        innerHeightHeight: 90, innerCillHeight: 50, innerLeftJambWidth: 90, innerRightJambWidth: 90, innerTransomHeight: 90, innerMullionWidth: 90,
        topRailHeight: 120, bottomRailHeight: 150, meetingRailHeight: 0, stileWidth: 120,
        glazingBarThickness: 30,
        ironmongery: { hinges: '3D Adjustable Hinges', mpls: '5-Point MPL' },
        openingDirection: 'outward', glazingType: 'externally',
        rebateDepth: 15, rebateWidth: 12,
        defaultLayout: {
            instances: [{id: 'inst-ppd-1', overallWidth: 1800, overallHeight: 2100}],
            mullions: [{ id: 'm-door-1-1', type: 'mullion', offset: 900 }],
            transoms: [],
            placedSashes: [
                { paneId: 'inst-ppd-1-0-0', type: 'door-sash', hingeSide: 'left' },
                { paneId: 'inst-ppd-1-0-1', type: 'door-sash', hingeSide: 'right' },
            ]
        }
    },
    {
        id: 'pp-door-2', name: 'Oak Stable Door', itemType: 'Door', productRangeId: 'range-6',
        materialSashId: 'mat-4', materialFrameId: 'mat-4', materialCillId: 'mat-5',
        internalFinishId: 'mat-9',
        frameThickness: 70,
        outerHeadHeight: 85, outerCillHeight: 50, outerLeftJambWidth: 85, outerRightJambWidth: 85, outerTransomHeight: 85, outerMullionWidth: 85,
        innerHeightHeight: 85, innerCillHeight: 50, innerLeftJambWidth: 85, innerRightJambWidth: 85, innerTransomHeight: 85, innerMullionWidth: 85,
        topRailHeight: 110, bottomRailHeight: 140, meetingRailHeight: 0, stileWidth: 110,
        glazingBarThickness: 28,
        ironmongery: { hinges: '3D Adjustable Hinges', mpls: '5-Point MPL' },
        openingDirection: 'outward', glazingType: 'externally',
        rebateDepth: 15, rebateWidth: 12,
        defaultLayout: {
            instances: [{id: 'inst-ppd-2', overallWidth: 900, overallHeight: 2050}],
            mullions: [],
            transoms: [{ id: 't-door-2-1', type: 'transom', offset: 1025 }],
            placedSashes: [
                { paneId: 'inst-ppd-2-0-0', type: 'door-sash', hingeSide: 'right' },
                { paneId: 'inst-ppd-2-1-0', type: 'door-sash', hingeSide: 'right' },
            ]
        }
    },
    // Screen
    {
        id: 'pp-screen-1', name: 'Standard Screen', itemType: 'Screen', productRangeId: 'range-7',
        materialSashId: 'mat-1', materialFrameId: 'mat-1', materialCillId: 'mat-5',
        externalFinishId: 'mat-7', internalFinishId: 'mat-7',
        frameThickness: 70,
        outerHeadHeight: 90, outerCillHeight: 50, outerLeftJambWidth: 90, outerRightJambWidth: 90, outerTransomHeight: 90, outerMullionWidth: 90,
        innerHeightHeight: 90, innerCillHeight: 50, innerLeftJambWidth: 90, innerRightJambWidth: 90, innerTransomHeight: 90, innerMullionWidth: 90,
        topRailHeight: 120, bottomRailHeight: 150, meetingRailHeight: 0, stileWidth: 120,
        glazingBarThickness: 30,
        ironmongery: { hinges: '3D Adjustable Hinges', mpls: '5-Point MPL' },
        openingDirection: 'outward', glazingType: 'externally',
        rebateDepth: 15, rebateWidth: 12,
        defaultLayout: {
            instances: [{id: 'inst-pps-1', overallWidth: 2400, overallHeight: 2100}],
            mullions: [],
            transoms: [],
            placedSashes: []
        }
    }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'et-1',
        name: 'Initial Quote Follow-up',
        subject: 'Following up on your quote [Quote Number]',
        body: 'Hi [Client Name],\n\nJust wanted to follow up on the quote we sent on [Quote Date]. Please let me know if you have any questions.\n\nBest,\n[User Name]'
    }
];