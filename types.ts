

export enum QuoteStatus {
  NEW = 'New',
  APPOINTMENT_BOOKED = 'Appointment Booked',
  QUOTED = 'Quoted',
  FOLLOW_UP_1 = 'Follow Up 1',
  FOLLOW_UP_2 = 'Follow Up 2',
  WON = 'Won',
  LOST = 'Lost',
  SURVEY = 'Survey',
  READY_FOR_PRODUCTION = 'Ready for Production',
}

export type Module = 'leads' | 'sales' | 'surveys' | 'production' | 'installation' | 'reports' | 'system' | 'calendar';

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface CustomLabel {
  id: string;
  name: string;
  color: string;
  isProtected?: boolean;
}

export type ProjectType = 'residential' | 'commercial';
export type CustomerType = 'Homeowner' | 'Contractor' | 'Window Installer' | 'Architect' | 'Interior Designer';

export type Permission = 'manageClients' | 'manageQuotes' | 'manageStaff' | 'manageProductConfigurations' | 'manageSettings' | 'viewReports' | 'conductSurveys' | 'sendFollowUpEmails' | 'manageProduction' | 'manageInstallation';

export interface SystemSettings {
    currency: 'USD' | 'GBP' | 'EUR';
    timezone: string;
    dateFormat: 'MDY' | 'DMY' | 'YMD';
    timeFormat: '12h' | '24h';
    firstDayOfWeek: 'Sunday' | 'Monday';
    workingWeek: string[];
    workingHoursStart: number; // e.g. 9 for 9am
    workingHoursEnd: number; // e.g. 17 for 5pm
    customerTypeColors: Record<CustomerType, string>;
    leadNumberPrefix: string;
    leadNextNumber: number;
    projectNumberPrefix: string;
    projectNextNumber: number;
    smtpServer?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpEncryption?: 'none' | 'ssl' | 'starttls';
    smtpFromAddress?: string;
    developerModeEnabled: boolean;
    enabledModules: Module[];
    labels: {
      leads: CustomLabel[];
      sales: CustomLabel[];
      survey: CustomLabel[];
      production: CustomLabel[];
    };
    companyName?: string;
    companyAddress?: Address;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
}

export type Currency = SystemSettings['currency'];

export interface Team {
  id: string;
  name: string;
}

export interface Staff {
  id:string;
  name: string;
  initials: string;
  teamId: string;
  roleId: string;
  email: string;
  mobile?: string;
}

export type ContactRole = 'Client' | 'Partner' | 'Architect' | 'Builder' | 'Designer' | 'Other';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  role?: ContactRole;
  notes?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  townCity: string;
  county?: string;
  postcode: string;
}

export interface Email {
  id: string;
  direction: 'incoming' | 'outgoing';
  subject: string;
  body: string;
  timestamp: string;
  isRead?: boolean;
}

export type ActivityType = 'label_change' | 'email_sent' | 'appointment_created' | 'quote_created' | 'file_uploaded' | 'note' | 'call_log' | 'meeting_log';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  staffId: string;
  content: string;
}

export interface Client {
  id:string;
  leadNumber: string;
  companyName?: string;
  contacts: Contact[];
  officeAddress: Address;
  installationAddress?: Address;
  files?: { name: string; dataUrl: string; }[];
  emails?: Email[];
  createdAt: string;
  lastContacted: string;
  activity?: Activity[];
  assignedTo?: string; // Staff ID
  customerType: CustomerType;
  label: string;
}

export interface FrameSideProfile {
  head: number;
  cill: number;
  leftJamb: number;
  rightJamb: number;
  transom: number;
  mullion: number;
}

export interface FrameInfo {
  thickness: number;
  outer: FrameSideProfile;
  inner: FrameSideProfile;
  rebateDepth?: number;
  rebateWidth?: number;
}

export interface SashInfo {
  head: number;
  stile: number;
  bottomRail: number;
  meetingStile: number;
  thickness: number;
}

export interface Ironmongery {
  hinges: string;
  mpls: string;
}

export interface FrameDivision {
  id: string;
  type: 'mullion' | 'transom';
  offset: number; 
  start?: number; 
  end?: number; 
  thickness?: number;
  instanceId?: string;
}

export interface GlazingBar {
    id: string;
    type: 'vertical' | 'horizontal';
    offset: number; // from left for vertical, from top for horizontal
}

export interface SashSectionOverrides {
    topRail?: number;
    bottomRail?: number;
    stile?: number;
    meetingRail?: number;
}

export interface PlacedSash {
  paneId: string; // e.g., "0-0" for top-left pane
  type: 'casement' | 'door-sash' | 'fixed-glazing';
  hingeSide?: 'left' | 'right' | 'top' | 'bottom';
  glazingBars?: GlazingBar[];
  sashOverrides?: SashSectionOverrides;
}

export interface WindowInstance {
  id: string;
  overallWidth: number;
  overallHeight: number;
  topSashHeight?: number;
  topSashOverrides?: SashSectionOverrides;
  bottomSashOverrides?: SashSectionOverrides;
  // Per-instance glazing bars for Sash windows
  topSashGlazingBars?: GlazingBar[];
  bottomSashGlazingBars?: GlazingBar[];
}

export interface QuoteItem {
  id: string;
  itemNumber: string;
  quantity: number;
  location: string;
  itemType: 'Sash' | 'Casement' | 'Door' | 'Screen';
  productRangeId: string;
  viewType: 'Internal View' | 'External View';
  isNewFrame: boolean;
  isInstallation: boolean;
  installationLevel: number;
  fitToPreparedOpening: boolean;
  materialSashId: string;
  materialFrameId: string;
  materialCillId: string;
  externalFinishId?: string;
  internalFinishId?: string;
  cillFinishId?: string;
  windowInstances: WindowInstance[];
  photos?: { name: string, dataUrl: string }[];
  frameInfo: FrameInfo;
  sashInfo: SashInfo;
  ironmongery: Ironmongery;
  openingDirection?: 'inward' | 'outward';
  glazingType?: 'internally' | 'externally';
  masterSash: 'Left' | 'Right';
  mullions?: FrameDivision[];
  transoms?: FrameDivision[];
  placedSashes?: PlacedSash[];
  paneGlassTypes: { paneId: string; glassTypeId: string; }[];
  glazingBarThickness: number;
  glazingBarType: 'plant-on' | 'true-bars';
  sashOpening: 'both' | 'top-fixed' | 'bottom-fixed' | 'both-fixed';
  price: number;
  calculatedUValue?: number;
  surveyComplete?: boolean;
  trims?: string;
  surveyorNotes?: string;
  pairSpacing?: number;
  pairRebate?: number;
}

export interface ProductProfileLayout {
    instances?: WindowInstance[];
    pairSpacing?: number;
    pairRebate?: number;
    mullions?: FrameDivision[];
    transoms?: FrameDivision[];
    placedSashes?: PlacedSash[];
}

export interface ComponentTemplate {
  id: string;
  name: string;
  itemType: 'Sash' | 'Casement' | 'Door' | 'Screen';
  applicableTo: ('Sash' | 'Casement' | 'Door' | 'Screen')[];
  sashInfo: SashInfo;
  layout: ProductProfileLayout;
}

export interface ProductRange {
    id: string;
    name: string;
    itemType: 'Sash' | 'Casement' | 'Door' | 'Screen';

    frameThickness: number;
    
    outerHeadHeight: number;
    outerCillHeight: number;
    outerLeftJambWidth: number;
    outerRightJambWidth: number;
    outerTransomHeight: number;
    outerMullionWidth: number;
    
    innerHeightHeight: number;
    innerCillHeight: number;
    innerLeftJambWidth: number;
    innerRightJambWidth: number;
    innerTransomHeight: number;
    innerMullionWidth: number;
    
    topRailHeight: number;
    bottomRailHeight: number;
    meetingRailHeight: number;
    stileWidth: number;
    materialSashId: string;
    materialFrameId: string;
    materialCillId: string;
    defaultGlassTypeId?: string;

    openingDirection?: 'inward' | 'outward';
    glazingType?: 'internally' | 'externally';
    rebateDepth?: number;
    rebateWidth?: number;
}

export interface ProductProfile {
    id: string;
    name: string;
    itemType: 'Sash' | 'Casement' | 'Door' | 'Screen';
    productRangeId: string;
    materialSashId: string;
    materialFrameId: string;
    materialCillId: string;
    externalFinishId?: string;
    internalFinishId?: string;
    cillFinishId?: string;

    frameThickness: number;

    outerHeadHeight: number;
    outerCillHeight: number;
    outerLeftJambWidth: number;
    outerRightJambWidth: number;
    outerTransomHeight: number;
    outerMullionWidth: number;
    
    innerHeightHeight: number;
    innerCillHeight: number;
    innerLeftJambWidth: number;
    innerRightJambWidth: number;
    innerTransomHeight: number;
    innerMullionWidth: number;
    
    topRailHeight: number;
    bottomRailHeight: number;
    meetingRailHeight: number;
    stileWidth: number;
    glazingBarThickness: number;
    ironmongery: Ironmongery;
    defaultLayout?: ProductProfileLayout;

    openingDirection?: 'inward' | 'outward';
    glazingType?: 'internally' | 'externally';
    rebateDepth?: number;
    rebateWidth?: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    clientId: string;
    date: string;
    status: string;
    items: QuoteItem[];
    projectReference?: string;
    surveyorId?: string;
    surveyStatus?: string;
}

export interface CompanyDocument {
    id: string;
    name: string;
    uploadedAt: string;
    size: string;
}

export interface Material {
    id: string;
    name: string;
    type: 'Timber' | 'Cill' | 'Finish' | 'Glass' | 'Ironmongery' | 'Other';
    color?: string;
    density?: number; // for timber, kg/m³
    thickness?: number; // for glass, mm
    uValue?: number; // for glass, W/m²K
    spec?: string; // for glass, e.g., '4-16-4'
}

export interface Appointment {
    id: string;
    title: string;
    start: string; // ISO 8601
    end: string; // ISO 8601
    staffId: string;
    clientId?: string;
    quoteId?: string;
    reason: 'Sales Visit' | 'Survey' | 'Installation' | 'Other';
}

export interface Alert {
    id: string;
    type: 'stale_lead' | 'missed_follow_up' | 'upcoming_appointment';
    message: string;
    clientId: string;
    isRead: boolean;
    createdAt: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
}