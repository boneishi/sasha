

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { QuoteItem, ProductProfile, FrameDivision, PlacedSash, Currency, GlazingBar, Material, WindowInstance, SashSectionOverrides, Ironmongery, ProductProfileLayout, SashInfo, ProductRange, ComponentTemplate, FrameInfo, FrameSideProfile } from '../types';
import { SaveIcon, TrashIcon, PlusIcon, ArrowLeftIcon, GridIcon, SashWindowIcon, DoorIcon, PanelIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, XMarkIcon, ClipboardDocumentIcon, UndoIcon } from './icons';
import { CURRENCY_SYMBOLS } from '../constants';
import { GlassSelectionModal } from './GlassSelectionModal';
import { GlazingBarSelectionModal } from './GlazingBarSelectionModal';
import { Button, Input, Select, TextArea, SidebarSection, Checkbox } from './common';
import { Modal } from './Modal';
import { calculatePanes, calculateSashPanes } from '../utils';

// Moved here from useMemo to be accessible globally in this module
const getInstanceSpecString = (instance: WindowInstance) => JSON.stringify({
    w: instance.overallWidth, h: instance.overallHeight, ts: instance.topSashHeight,
    tgb: instance.topSashGlazingBars?.length, bgb: instance.bottomSashGlazingBars?.length,
});

// --- HYDRATION HELPERS ---

const initializeFromComponent = (
    componentTemplateToEdit: ComponentTemplate | undefined,
    newItemType: 'Sash' | 'Casement' | 'Door' | 'Screen' | undefined
): { item: QuoteItem; applicability: ('Sash' | 'Casement' | 'Door' | 'Screen')[] } => {
    const template = componentTemplateToEdit;
    const itemTypeName = template?.itemType || newItemType || 'Casement';
    const applicability = template?.applicableTo || (itemTypeName ? [itemTypeName] : []);
    
    const layoutInstances = template?.layout?.instances && template.layout.instances.length > 0
        ? JSON.parse(JSON.stringify(template.layout.instances))
        : [{
            id: `inst-ct-${Date.now()}`,
            overallWidth: 1000,
            overallHeight: 1200,
          }];

    const baseComponent: Omit<ComponentTemplate, 'id' | 'applicableTo'> = {
        name: template?.name || `New ${itemTypeName} Component`,
        itemType: itemTypeName,
        sashInfo: template?.sashInfo || { head: 80, stile: 80, bottomRail: 80, meetingStile: 0, thickness: 56 },
        layout: template?.layout || {},
    };

    const item: QuoteItem = {
        id: template?.id || `transient-ct-${Date.now()}`,
        itemNumber: 'Component',
        quantity: 1,
        location: baseComponent.name,
        itemType: baseComponent.itemType,
        productRangeId: '', // Components don't belong to a range
        viewType: 'External View', isNewFrame: false, isInstallation: false, installationLevel: 1, fitToPreparedOpening: false,
        materialSashId: '', materialFrameId: '', materialCillId: '',
        windowInstances: layoutInstances,
        frameInfo: { thickness: 70, outer: { head: 70, cill: 70, leftJamb: 70, rightJamb: 70, transom: 70, mullion: 70 }, inner: { head: 70, cill: 70, leftJamb: 70, rightJamb: 70, transom: 70, mullion: 70 } },
        sashInfo: baseComponent.sashInfo,
        ironmongery: { hinges: '', mpls: '' },
        masterSash: 'Left',
        mullions: baseComponent.layout?.mullions || [],
        transoms: baseComponent.layout?.transoms || [],
        placedSashes: baseComponent.layout?.placedSashes || [],
        paneGlassTypes: [],
        glazingBarThickness: 25, glazingBarType: 'plant-on',
        sashOpening: 'both', price: 0, photos: [],
    };
    return { item, applicability };
};

const initializeFromProfile = (
    profileToEdit: ProductProfile | undefined,
    newItemType: 'Sash' | 'Casement' | 'Door' | 'Screen' | undefined,
    timberMaterials: Material[],
    cillMaterials: Material[]
): QuoteItem => {
    const prof = profileToEdit;
    const itemTypeName = prof?.itemType || newItemType || 'Sash';
    
    const layoutInstances = prof?.defaultLayout?.instances && prof.defaultLayout.instances.length > 0
        ? JSON.parse(JSON.stringify(prof.defaultLayout.instances))
        : [{
            id: `inst-pp-${Date.now()}`,
            overallWidth: 1200,
            overallHeight: itemTypeName === 'Door' ? 2100 : 1500,
          }];

    const tempFrameInfo: FrameInfo = {
        thickness: prof?.frameThickness ?? 70,
        outer: {
            head: prof?.outerHeadHeight ?? 80, cill: prof?.outerCillHeight ?? 80,
            leftJamb: prof?.outerLeftJambWidth ?? 80, rightJamb: prof?.outerRightJambWidth ?? 80,
            transom: prof?.outerTransomHeight ?? 80, mullion: prof?.outerMullionWidth ?? 80
        },
        inner: {
            head: prof?.innerHeightHeight ?? 80, cill: prof?.innerCillHeight ?? 80,
            leftJamb: prof?.innerLeftJambWidth ?? 80, rightJamb: prof?.innerRightJambWidth ?? 80,
            transom: prof?.innerTransomHeight ?? 80, mullion: prof?.innerMullionWidth ?? 80
        },
        rebateDepth: prof?.rebateDepth,
        rebateWidth: prof?.rebateWidth,
    };

    return {
        id: prof?.id || `transient-pp-${Date.now()}`, itemNumber: 'Profile', quantity: 1,
        location: prof?.name || `New ${itemTypeName} Profile`, itemType: itemTypeName,
        productRangeId: prof?.productRangeId || '', viewType: 'External View', isNewFrame: true,
        isInstallation: false, installationLevel: 1, fitToPreparedOpening: false,
        materialSashId: prof?.materialSashId || timberMaterials[0]?.id || '',
        materialFrameId: prof?.materialFrameId || timberMaterials[0]?.id || '',
        materialCillId: prof?.materialCillId || cillMaterials[0]?.id || '',
        externalFinishId: prof?.externalFinishId, internalFinishId: prof?.internalFinishId, cillFinishId: prof?.cillFinishId,
        windowInstances: layoutInstances,
        pairSpacing: prof?.defaultLayout?.pairSpacing, pairRebate: prof?.defaultLayout?.pairRebate,
        frameInfo: tempFrameInfo,
        sashInfo: { head: prof?.topRailHeight ?? 80, stile: prof?.stileWidth ?? 80, bottomRail: prof?.bottomRailHeight ?? 80, meetingStile: prof?.meetingRailHeight ?? 0, thickness: 56 },
        ironmongery: prof?.ironmongery || { hinges: 'Standard', mpls: 'Standard' },
        openingDirection: prof?.openingDirection || 'outward', glazingType: prof?.glazingType || 'externally', masterSash: 'Left',
        mullions: prof?.defaultLayout?.mullions || [], transoms: prof?.defaultLayout?.transoms || [],
        placedSashes: prof?.defaultLayout?.placedSashes || [],
        paneGlassTypes: [], glazingBarThickness: prof?.glazingBarThickness ?? 25,
        glazingBarType: 'plant-on', sashOpening: 'both', price: 0, photos: [],
    };
};

const initializeFromQuote = (itemToEdit: QuoteItem | undefined, profile: ProductProfile | undefined): QuoteItem | null => {
    if (itemToEdit) {
        const item = JSON.parse(JSON.stringify(itemToEdit));
        if ((item as any).openingType) {
            item.openingDirection = (item as any).openingType === 'Open In' ? 'inward' : 'outward';
            delete (item as any).openingType;
        }
        return item;
    }
    if (profile) {
        const defaultLayout = profile.defaultLayout;
        const newDefaultInstances: WindowInstance[] = defaultLayout?.instances && defaultLayout.instances.length > 0
            ? JSON.parse(JSON.stringify(defaultLayout.instances))
            : [{
                id: `inst-${Date.now()}`,
                overallWidth: (profile.outerLeftJambWidth + profile.outerRightJambWidth) + 600,
                overallHeight: profile.itemType === 'Door' ? 2100 : 1800
            }];

        const idMap = new Map<string, string>();
        newDefaultInstances.forEach(inst => {
            const oldId = inst.id;
            const newId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            idMap.set(oldId, newId);
            inst.id = newId;
        });

        const newPlacedSashes = (defaultLayout?.placedSashes || []).map(sash => {
            for(const [oldId, newId] of idMap.entries()) {
                if (sash.paneId.startsWith(oldId)) return {...sash, paneId: sash.paneId.replace(oldId, newId)}
            }
            return sash;
        });

        const tempFrameInfo: FrameInfo = {
            thickness: profile.frameThickness,
            outer: { head: profile.outerHeadHeight, cill: profile.outerCillHeight, leftJamb: profile.outerLeftJambWidth, rightJamb: profile.outerRightJambWidth, transom: profile.outerTransomHeight, mullion: profile.outerMullionWidth },
            inner: { head: profile.innerHeightHeight, cill: profile.innerCillHeight, leftJamb: profile.innerLeftJambWidth, rightJamb: profile.innerRightJambWidth, transom: profile.innerTransomHeight, mullion: profile.innerMullionWidth },
            rebateDepth: profile.rebateDepth,
            rebateWidth: profile.rebateWidth,
        };

        return {
            id: `item-${Date.now()}`, itemNumber: '0', quantity: 1, location: 'New Item',
            itemType: profile.itemType, productRangeId: profile.productRangeId, viewType: 'External View',
            isNewFrame: true, isInstallation: false, installationLevel: 1, fitToPreparedOpening: false,
            materialSashId: profile.materialSashId, materialFrameId: profile.materialFrameId, materialCillId: profile.materialCillId,
            externalFinishId: profile.externalFinishId, internalFinishId: profile.internalFinishId, cillFinishId: profile.cillFinishId,
            windowInstances: newDefaultInstances,
            pairSpacing: defaultLayout?.pairSpacing, pairRebate: defaultLayout?.pairRebate,
            frameInfo: tempFrameInfo,
            sashInfo: { head: profile.topRailHeight, stile: profile.stileWidth, bottomRail: profile.bottomRailHeight, meetingStile: profile.meetingRailHeight, thickness: 56 },
            ironmongery: profile.ironmongery,
            openingDirection: profile.openingDirection || 'outward', glazingType: profile.glazingType || 'externally', masterSash: 'Left',
            mullions: defaultLayout?.mullions || [], transoms: defaultLayout?.transoms || [], placedSashes: newPlacedSashes,
            paneGlassTypes: [], glazingBarThickness: profile.glazingBarThickness, glazingBarType: 'plant-on',
            sashOpening: 'both', price: 0, photos: [],
        };
    }
    return null;
};


// --- SERIALIZATION HELPERS ---

const sanitizeAndReIdLayout = (item: QuoteItem): QuoteItem => {
    const newItem = JSON.parse(JSON.stringify(item));
    
    if (!newItem.windowInstances || newItem.windowInstances.length === 0) return newItem;

    const instanceIdMap = new Map<string, string>();
    const newWindowInstances = newItem.windowInstances.map((instance: WindowInstance) => {
        const oldId = instance.id;
        const newId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        instanceIdMap.set(oldId, newId);
        const newInstance = { ...instance, id: newId };
        
        if (newInstance.topSashGlazingBars) newInstance.topSashGlazingBars = newInstance.topSashGlazingBars.map((bar: any) => ({ ...bar, id: `gb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }));
        if (newInstance.bottomSashGlazingBars) newInstance.bottomSashGlazingBars = newInstance.bottomSashGlazingBars.map((bar: any) => ({ ...bar, id: `gb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }));
        return newInstance;
    });

    const firstOriginalInstanceId = item.windowInstances[0].id;

    const newMullions = (newItem.mullions || []).map((m: FrameDivision) => ({...m, id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, instanceId: instanceIdMap.get(m.instanceId || firstOriginalInstanceId)}));
    const newTransoms = (newItem.transoms || []).map((t: FrameDivision) => ({...t, id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, instanceId: instanceIdMap.get(t.instanceId || firstOriginalInstanceId)}));
    const newPlacedSashes = (newItem.placedSashes || []).map((sash: PlacedSash) => {
        let newPaneId = sash.paneId;
        for (const [oldId, newId] of instanceIdMap.entries()) {
            if (sash.paneId.startsWith(oldId)) {
                newPaneId = sash.paneId.replace(oldId, newId);
                break;
            }
        }
        const newGlazingBars = sash.glazingBars?.map(bar => ({ ...bar, id: `gb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }));
        return { ...sash, paneId: newPaneId, glazingBars: newGlazingBars };
    });
    const newPaneGlassTypes = (newItem.paneGlassTypes || []).map((pgt: any) => {
        let newPaneId = pgt.paneId;
        for (const [oldId, newId] of instanceIdMap.entries()) {
            if (pgt.paneId.startsWith(oldId)) {
                newPaneId = pgt.paneId.replace(oldId, newId);
                break;
            }
        }
        return { ...pgt, paneId: newPaneId };
    });

    newItem.windowInstances = newWindowInstances;
    newItem.mullions = newMullions;
    newItem.transoms = newTransoms;
    newItem.placedSashes = newPlacedSashes;
    newItem.paneGlassTypes = newPaneGlassTypes;
    return newItem;
};

const serializeToComponent = (item: QuoteItem, id: string, applicability: ('Sash' | 'Casement' | 'Door' | 'Screen')[]): ComponentTemplate => {
    const savedLayout: ProductProfileLayout | undefined = (item.itemType === 'Casement' || item.itemType === 'Door' || item.itemType === 'Screen' || item.itemType === 'Sash') ? {
        instances: item.windowInstances,
        mullions: item.mullions || [],
        transoms: item.transoms || [],
        placedSashes: item.placedSashes || [],
    } : undefined;

    return {
        id: id.startsWith('transient') ? `ct-${Date.now()}` : id,
        name: item.location, // repurposed field
        itemType: item.itemType,
        applicableTo: applicability,
        sashInfo: item.sashInfo,
        layout: savedLayout || {},
    };
};

const serializeToProfile = (item: QuoteItem, id: string): ProductProfile => {
    const savedLayout: ProductProfileLayout | undefined = (item.itemType === 'Casement' || item.itemType === 'Door' || item.itemType === 'Screen') && item.windowInstances.length > 0 ? {
        instances: item.windowInstances,
        pairSpacing: item.pairSpacing,
        pairRebate: item.pairRebate,
        mullions: item.mullions || [],
        transoms: item.transoms || [],
        placedSashes: item.placedSashes || [],
    } : undefined;

    return {
        id: id.startsWith('transient') ? `pp-${Date.now()}` : id,
        name: item.location, // Repurposed field
        productRangeId: item.productRangeId,
        itemType: item.itemType,
        materialSashId: item.materialSashId,
        materialFrameId: item.materialFrameId,
        materialCillId: item.materialCillId,
        externalFinishId: item.externalFinishId, internalFinishId: item.internalFinishId, cillFinishId: item.cillFinishId,
        frameThickness: item.frameInfo.thickness,
        outerHeadHeight: item.frameInfo.outer.head, outerCillHeight: item.frameInfo.outer.cill,
        outerLeftJambWidth: item.frameInfo.outer.leftJamb, outerRightJambWidth: item.frameInfo.outer.rightJamb,
        outerTransomHeight: item.frameInfo.outer.transom, outerMullionWidth: item.frameInfo.outer.mullion,
        innerHeightHeight: item.frameInfo.inner.head, innerCillHeight: item.frameInfo.inner.cill,
        innerLeftJambWidth: item.frameInfo.inner.leftJamb, innerRightJambWidth: item.frameInfo.inner.rightJamb,
        innerTransomHeight: item.frameInfo.inner.transom, innerMullionWidth: item.frameInfo.inner.mullion,
        topRailHeight: item.sashInfo.head, bottomRailHeight: item.sashInfo.bottomRail,
        meetingRailHeight: item.sashInfo.meetingStile, stileWidth: item.sashInfo.stile,
        glazingBarThickness: item.glazingBarThickness || 25,
        ironmongery: item.ironmongery,
        defaultLayout: savedLayout,
        rebateDepth: item.frameInfo.rebateDepth, rebateWidth: item.frameInfo.rebateWidth,
        openingDirection: item.openingDirection, glazingType: item.glazingType,
    };
};

// --- UI COMPONENTS ---

const PropertyInput: React.FC<{ label: string; value: number | string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; unit?: string; min?: number; max?: number; disabled?: boolean, placeholder?: string }> = ({ label, value, onChange, unit = 'mm', min, max, disabled = false, placeholder }) => (
    <div>
        <label className={`block text-sm font-medium ${disabled ? 'text-stone-400 dark:text-stone-500' : 'text-stone-600 dark:text-stone-300'}`}>{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <input
                type="number"
                value={value}
                onChange={onChange}
                min={min}
                max={max}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full p-2 border border-stone-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-stone-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-stone-500 dark:text-stone-400 sm:text-sm">{unit}</span>
            </div>
        </div>
    </div>
);

const SpecificationItem: React.FC<{ label: string, value: React.ReactNode, inconsistent?: boolean }> = ({ label, value, inconsistent = false }) => (
    <div className={`flex justify-between items-start text-sm transition-colors rounded -mx-1 px-1 ${inconsistent ? 'bg-yellow-100 dark:bg-yellow-900/40' : ''}`}>
        <span className="font-medium text-stone-500 dark:text-stone-400">{label}</span>
        <span className="font-semibold text-right text-stone-700 dark:text-stone-200 max-w-[60%]">{value || 'N/A'}</span>
    </div>
);

const DimensionLine: React.FC<{
    x: number; y: number;
    length: number;
    label: string | number;
    isVertical: boolean;
    offset: number;
    colorClass?: string;
    fontSize: number;
}> = ({ x, y, length, label, isVertical, offset, colorClass = "text-stone-600 dark:text-stone-400", fontSize }) => {
    const tickLength = 8;

    let lineX1, lineY1, lineX2, lineY2;
    let textX, textY;
    let transform = '';

    if (isVertical) {
        lineX1 = x - offset;
        lineY1 = y;
        lineX2 = x - offset;
        lineY2 = y + length;
        textX = lineX1;
        textY = y + length / 2;
        transform = `rotate(-90 ${textX} ${textY})`;
    } else { // Horizontal
        lineX1 = x;
        lineY1 = y - offset;
        lineX2 = x + length;
        lineY2 = y - offset;
        textX = x + length / 2;
        textY = lineY1;
    }

    const textStyle: React.CSSProperties = {
        fontSize: fontSize,
        fontWeight: 500,
        textAnchor: 'middle',
        dominantBaseline: isVertical ? 'auto' : 'text-after-edge',
    };
    
    return (
        <g className={`${colorClass} pointer-events-none`} stroke="currentColor">
            {/* Dashed lines from object to dimension line */}
            <line x1={isVertical ? x : x} y1={isVertical ? y : y} x2={lineX1} y2={lineY1} strokeWidth={0.5} strokeDasharray="2 2" />
            <line x1={isVertical ? x : x + length} y1={isVertical ? y + length : y} x2={lineX2} y2={lineY2} strokeWidth={0.5} strokeDasharray="2 2" />
            
            {/* Main dimension line */}
            <line x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2} strokeWidth={1} />
            
            {/* Ticks at the end of the dimension line */}
            <line x1={isVertical ? lineX1 - tickLength/2 : lineX1} y1={isVertical ? lineY1 : lineY1 - tickLength/2} x2={isVertical ? lineX1 + tickLength/2 : lineX1} y2={isVertical ? lineY1 : lineY1 + tickLength/2} strokeWidth={1} />
            <line x1={isVertical ? lineX2 - tickLength/2 : lineX2} y1={isVertical ? lineY2 : lineY2 - tickLength/2} x2={isVertical ? lineX2 + tickLength/2 : lineX2} y2={isVertical ? lineY2 : lineY2 + tickLength/2} strokeWidth={1} />

            {/* Text */}
            <g transform={transform}>
                <text x={textX} y={textY - (fontSize * 0.25)} style={textStyle} fill="currentColor" stroke="white" strokeWidth="2.1px" paintOrder="stroke" className="dark:stroke-gray-800/20">{label}</text>
            </g>
        </g>
    );
};

const GlassLabel: React.FC<{
    text?: string;
    isToughened?: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    yOffset?: number;
}> = ({ text, isToughened, x, y, width, height, yOffset = 0 }) => {
    if ((!text && !isToughened) || width < 50 || height < 50) return null;

    const centerX = x + width / 2;
    const centerY = y + height / 2 + yOffset;
    
    const baseFontSize = Math.min(width / ((text?.length || 0) * 0.5), height / (isToughened ? 4 : 2.5));
    const clampedFontSize = Math.max(8, Math.min(baseFontSize, 16));

    const textStyle: React.CSSProperties = {
        fontSize: clampedFontSize,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
    };

    const tghTextStyle: React.CSSProperties = {
        ...textStyle,
        fontWeight: 'bold',
        fontSize: clampedFontSize * 0.9,
    };

    return (
        <g className="pointer-events-none text-black/50 dark:text-white/50">
            {text && <text x={centerX} y={centerY - (isToughened ? clampedFontSize / 2 : 0)} style={textStyle}>{text}</text>}
            {isToughened && (
                <text x={centerX} y={centerY + (text ? clampedFontSize / 2 + 2 : 0)} style={tghTextStyle}>TGH</text>
            )}
        </g>
    );
};

const OpeningSashIndicator: React.FC<{
    x: number; y: number; width: number; height: number; direction: 'up' | 'down';
}> = ({ x, y, width, height, direction }) => {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const arrowSize = Math.min(width, height) * 0.08;

    const path = direction === 'up'
        ? `M ${centerX - arrowSize} ${centerY + arrowSize / 2} L ${centerX} ${centerY - arrowSize / 2} L ${centerX + arrowSize} ${centerY - arrowSize / 2}`
        : `M ${centerX - arrowSize} ${centerY - arrowSize / 2} L ${centerX} ${centerY + arrowSize / 2} L ${centerX + arrowSize} ${centerY - arrowSize / 2}`;
    
    return (
        <g className="pointer-events-none text-black/60 dark:text-white/70">
            <path
                d={path}
                stroke="currentColor"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
    )
};

const HingeIndicator: React.FC<{
    x: number; y: number; width: number; height: number; hingeSide?: PlacedSash['hingeSide'];
}> = ({ x, y, width, height, hingeSide }) => {
    if (!hingeSide) return null;
    
    const midX = x + width / 2;
    const midY = y + height / 2;
    let path = '';
    
    if (hingeSide === 'top') path = `M ${x},${y + height} L ${midX},${y} L ${x + width},${y + height}`;
    else if (hingeSide === 'bottom') path = `M ${x},${y} L ${midX},${y + height} L ${x + width},${y}`;
    else if (hingeSide === 'left') path = `M ${x + width},${y} L ${x},${midY} L ${x + width},${y + height}`;
    else if (hingeSide === 'right') path = `M ${x},${y} L ${x + width},${midY} L ${x},${y + height}`;

    return (
        <g className="pointer-events-none text-black/40 dark:text-stone-300/60" strokeDasharray="6 6">
            <path d={path} stroke="currentColor" strokeWidth={2} fill="none" />
        </g>
    );
};

// --- HELPER FUNCTIONS ---
const calculateUValue = (
    item: Omit<QuoteItem, 'id' | 'itemNumber'>,
    materials: Material[]
): number | undefined => {
    const instance = item.windowInstances[0];
    if (!instance) return undefined;

    // 1. Glass U-Value (Ug)
    const glassTypesUsed = item.paneGlassTypes
        .map(p => materials.find(m => m.id === p.glassTypeId && m.type === 'Glass'))
        .filter((g): g is Material => !!g);

    if (glassTypesUsed.length === 0) return undefined;
    const totalUValue = glassTypesUsed.reduce((acc, g) => acc + (g.uValue || 0), 0);
    const Ug = totalUValue / glassTypesUsed.length;
    if (!Ug) return undefined;

    // 2. Frame U-Value (Uf)
    const frameMaterial = materials.find(m => m.id === item.materialFrameId);
    const thermalConductivity = frameMaterial?.density ? (0.00015 * frameMaterial.density + 0.025) : 0.13; // W/mK
    const frameDepth = 0.08; // 80mm
    const Uf = thermalConductivity / frameDepth;

    // 3. Spacer Psi-value (Ψg)
    const Psi_g = 0.06; // W/mK for a warm edge spacer

    // 4. Areas and Perimeters
    const width_m = instance.overallWidth / 1000;
    const height_m = instance.overallHeight / 1000;
    
    // Simplified assumption: 30% frame, 70% glass
    const frameFraction = 0.3;
    const totalArea = width_m * height_m;
    const Ag = totalArea * (1 - frameFraction); // Area of glass
    const Af = totalArea * frameFraction;       // Area of frame
    
    // Perimeter of glass (assuming a single pane for simplicity)
    const Lg = (item.itemType === 'Sash') 
        ? (2 * (Math.sqrt(Ag/2) + Math.sqrt(Ag/2))) * 2 // Two sashes
        : (2 * (Math.sqrt(Ag) + Math.sqrt(Ag)));

    if (Ag + Af === 0) return undefined;

    // 5. Overall Window U-Value (Uw)
    const Uw = (Ag * Ug + Af * Uf + Lg * Psi_g) / (Ag + Af);

    return parseFloat(Uw.toFixed(2));
};

const remapPlacedSashes = (
    oldPanes: { id: string; x: number; y: number; width: number; height: number }[],
    newPanes: { id: string; x: number; y: number; width: number; height: number }[],
    allSashes: PlacedSash[],
    instanceId: string,
): PlacedSash[] => {
    const sashesForThisInstance = allSashes.filter(s => s.paneId.startsWith(instanceId));
    const sashesForOtherInstances = allSashes.filter(s => !s.paneId.startsWith(instanceId));

    const remappedSashes: PlacedSash[] = [];

    sashesForThisInstance.forEach(sash => {
        const oldPaneIdInternal = sash.paneId.replace(`${instanceId}-`, '');
        const oldPane = oldPanes.find(p => p.id === oldPaneIdInternal);
        if (oldPane) {
            const centerX = oldPane.x + oldPane.width / 2;
            const centerY = oldPane.y + oldPane.height / 2;

            const newPane = newPanes.find(p => 
                centerX >= p.x && centerX < p.x + p.width &&
                centerY >= p.y && centerY < p.y + p.height
            );

            if (newPane) {
                remappedSashes.push({
                    ...sash,
                    paneId: `${instanceId}-${newPane.id}`
                });
            }
        }
    });

    return [...remappedSashes, ...sashesForOtherInstances];
};

const snapDivisions = (
    mullions: FrameDivision[],
    transoms: FrameDivision[],
    baseLayout: { mullions: FrameDivision[], transoms: FrameDivision[] },
    defaultThickness: { mullion: number, transom: number }
) => {
    const baseMullions = baseLayout.mullions;
    const baseTransoms = baseLayout.transoms;

    let snappedMullions = [...mullions];
    let snappedTransoms = [...transoms];

    // Snap mullion ends/starts to transom edges
    snappedMullions = snappedMullions.map(mullion => {
        const newMullion = { ...mullion };
        const originalMullion = baseMullions.find(bm => bm.id === mullion.id);
        if (!originalMullion) return newMullion;

        baseTransoms.forEach(originalTransom => {
            const scaledTransom = snappedTransoms.find(st => st.id === originalTransom.id);
            if (!scaledTransom) return;

            const originalTransomTop = originalTransom.offset - (originalTransom.thickness ?? defaultThickness.transom) / 2;
            const originalTransomBottom = originalTransom.offset + (originalTransom.thickness ?? defaultThickness.transom) / 2;
            
            const scaledTransomTop = scaledTransom.offset - (scaledTransom.thickness ?? defaultThickness.transom) / 2;
            const scaledTransomBottom = scaledTransom.offset + (scaledTransom.thickness ?? defaultThickness.transom) / 2;

            if (newMullion.end !== undefined && originalMullion.end !== undefined && Math.abs(originalMullion.end - originalTransomTop) < 1) {
                newMullion.end = scaledTransomTop;
            }
            if (newMullion.start !== undefined && originalMullion.start !== undefined && Math.abs(originalMullion.start - originalTransomBottom) < 1) {
                newMullion.start = scaledTransomBottom;
            }
        });
        return newMullion;
    });

    // Snap transom ends/starts to mullion edges
    snappedTransoms = snappedTransoms.map(transom => {
        const newTransom = { ...transom };
        const originalTransom = baseTransoms.find(bt => bt.id === transom.id);
        if (!originalTransom) return newTransom;

        baseMullions.forEach(originalMullion => {
            const scaledMullion = snappedMullions.find(sm => sm.id === originalMullion.id);
            if (!scaledMullion) return;

            const originalMullionLeft = originalMullion.offset - (originalMullion.thickness ?? defaultThickness.mullion) / 2;
            const originalMullionRight = originalMullion.offset + (originalMullion.thickness ?? defaultThickness.mullion) / 2;
            
            const scaledMullionLeft = scaledMullion.offset - (scaledMullion.thickness ?? defaultThickness.mullion) / 2;
            const scaledMullionRight = scaledMullion.offset + (scaledMullion.thickness ?? defaultThickness.mullion) / 2;

            if (newTransom.end !== undefined && originalTransom.end !== undefined && Math.abs(originalTransom.end - originalMullionLeft) < 1) {
                newTransom.end = scaledMullionLeft;
            }
            if (newTransom.start !== undefined && originalTransom.start !== undefined && Math.abs(originalTransom.start - originalMullionRight) < 1) {
                newTransom.start = scaledMullionRight;
            }
        });
        return newTransom;
    });

    return { mullions: snappedMullions, transoms: snappedTransoms };
};




interface WindowBuilderProps {
    mode?: 'quote' | 'profile' | 'component';
    itemToEdit?: QuoteItem;
    profile?: ProductProfile;
    onSaveItem?: (item: QuoteItem) => void;
    quoteItems?: QuoteItem[];
    allProfiles?: ProductProfile[];
    allComponents?: ComponentTemplate[];
    onNavigateItem?: (direction: 'prev' | 'next') => void;
    currency?: Currency;
    profileToEdit?: ProductProfile;
    onSaveProfile?: (profile: ProductProfile) => void;
    componentTemplateToEdit?: ComponentTemplate;
    onSaveComponentTemplate?: (template: ComponentTemplate) => void;
    onCancel: () => void;
    materials: Material[];
    productRanges: ProductRange[];
    isReadOnly?: boolean;
    newItemType?: 'Sash' | 'Casement' | 'Door' | 'Screen';
    componentTemplates?: ComponentTemplate[];
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}


// --- MAIN BUILDER COMPONENT ---
export function WindowBuilder({
    mode = 'quote',
    itemToEdit,
    profile,
    onSaveItem,
    quoteItems = [],
    allProfiles = [],
    allComponents = [],
    onNavigateItem = () => {},
    currency,
    profileToEdit,
    onSaveProfile,
    componentTemplateToEdit,
    onSaveComponentTemplate,
    onCancel,
    materials,
    productRanges,
    isReadOnly = false,
    newItemType,
    componentTemplates = [],
    addToast,
}: WindowBuilderProps) {
  const PADDING = 40;
  
  const timberMaterials = useMemo(() => materials.filter(m => m.type === 'Timber'), [materials]);
  const cillMaterials = useMemo(() => materials.filter(m => m.type === 'Cill'), [materials]);
  const glassMaterials = useMemo(() => materials.filter(m => m.type === 'Glass'), [materials]);
  const finishMaterials = useMemo(() => materials.filter(m => m.type === 'Finish'), [materials]);
  
  // --- STATE ---
  const [editableItem, setEditableItem] = useState<QuoteItem | null>(null);
  const [history, setHistory] = useState<QuoteItem[]>([]);
  const editableItemRef = useRef<QuoteItem | null>(null);
  
  // UI State
  const [activeInstanceId, setActiveInstanceId] = useState<string>('');
  const [selectedSashId, setSelectedSashId] = useState<string | null>(null);
  const [hoveredGlassPaneId, setHoveredGlassPaneId] = useState<string | null>(null);
  const [activeGlassPaneId, setActiveGlassPaneId] = useState<string | null>(null);
  const [popoverState, setPopoverState] = useState<{ x: number; y: number; divisionId: string } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isGlassModalOpen, setIsGlassModalOpen] = useState(false);
  const [isGlazingBarModalOpen, setIsGlazingBarModalOpen] = useState(false);
  const [selectedPaneId, setSelectedPaneId] = useState<string | null>(null);
  const [isAutoSplit, setIsAutoSplit] = useState(true);
  const lastValidLayout = useRef<{ mullions: FrameDivision[], transoms: FrameDivision[], innerWidth: number, innerHeight: number } | null>(null);
  const [dimensionVisibility, setDimensionVisibility] = useState({ frame: true, sash: false, glass: false });
  const [componentApplicability, setComponentApplicability] = useState<('Sash' | 'Casement' | 'Door' | 'Screen')[]>([]);

  const designerTitle = useMemo(() => {
    if (mode === 'component') {
        return 'Component Template Designer';
    }
    if (mode === 'profile') {
        return 'Product Profile Designer';
    }
    if (!editableItem?.itemType) {
        return 'Window & Door Designer';
    }
    const typeNameMap = {
        'Sash': 'Sash Window',
        'Casement': 'Casement Window',
        'Door': 'Door',
        'Screen': 'Screen'
    };
    return `${typeNameMap[editableItem.itemType]} Designer`;
  }, [editableItem?.itemType, mode]);

    useEffect(() => {
        editableItemRef.current = editableItem;
    }, [editableItem]);
    
    const updateItem = (updater: (prevItem: QuoteItem) => QuoteItem, addToHistory: boolean = true) => {
        const prevItem = editableItemRef.current;
        if (prevItem) {
            if (addToHistory) {
                setHistory(h => [...h, prevItem]);
            }
            const newItem = updater(prevItem);
            setEditableItem(newItem);
        }
    };

    const handleUndo = () => {
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            setEditableItem(lastState);
            setHistory(h => h.slice(0, -1));
        }
    };


  useEffect(() => {
    let initialItem: QuoteItem | null = null;

    if (mode === 'component') {
        const { item, applicability } = initializeFromComponent(componentTemplateToEdit, newItemType);
        initialItem = item;
        setComponentApplicability(applicability);
        setIsAutoSplit(true);
    } else if (mode === 'profile') {
        initialItem = initializeFromProfile(profileToEdit, newItemType, timberMaterials, cillMaterials);
        setIsAutoSplit(true);
    } else { // mode === 'quote'
        initialItem = initializeFromQuote(itemToEdit, profile);
        if (itemToEdit) {
            setIsAutoSplit(itemToEdit.windowInstances?.[0]?.topSashHeight === undefined);
        } else if (profile) {
            setIsAutoSplit(true);
        }
    }

    if (initialItem) {
        const needsInstanceIdMigration = (initialItem.mullions?.some(d => !d.instanceId) || initialItem.transoms?.some(d => !d.instanceId)) && initialItem.windowInstances.length > 0;

        if (needsInstanceIdMigration) {
            const firstInstanceId = initialItem.windowInstances[0].id;
            initialItem.mullions = (initialItem.mullions || []).map(d => ({ ...d, instanceId: d.instanceId || firstInstanceId }));
            initialItem.transoms = (initialItem.transoms || []).map(d => ({ ...d, instanceId: d.instanceId || firstInstanceId }));
        }
    }
    
    setEditableItem(initialItem);
    if (initialItem) {
        setActiveInstanceId(initialItem.windowInstances[0].id);
    }
    setHistory([]);
    setSelectedSashId(null);
    setHoveredGlassPaneId(null);
    setActiveGlassPaneId(null);
    setPopoverState(null);
    setSelectedPaneId(null);

}, [itemToEdit, profile, profileToEdit, mode, newItemType, componentTemplateToEdit, timberMaterials, cillMaterials]);

  useEffect(() => {
    if (editableItem && activeInstance) {
        const { outer, inner } = editableItem.frameInfo;
        const innerW = activeInstance.overallWidth - outer.leftJamb - outer.rightJamb;
        const innerH = activeInstance.overallHeight - outer.head - outer.cill;
        if (innerW > 0 && innerH > 0) {
            lastValidLayout.current = {
                mullions: (editableItem.mullions || []).map(m => ({...m})),
                transoms: (editableItem.transoms || []).map(t => ({...t})),
                innerWidth: innerW,
                innerHeight: innerH,
            };
        }
    }
  }, [editableItem, activeInstanceId]);


  const itemType = editableItem?.itemType;
  const activeInstance = useMemo(() => editableItem?.windowInstances.find(inst => inst.id === activeInstanceId) || editableItem?.windowInstances[0], [editableItem, activeInstanceId]);

  const { items, currentItem, currentIndex } = useMemo(() => {
    if (mode === 'quote') {
        return { items: quoteItems, currentItem: itemToEdit, currentIndex: quoteItems.findIndex(i => i.id === itemToEdit?.id) };
    }
    if (mode === 'profile') {
        return { items: allProfiles, currentItem: profileToEdit, currentIndex: allProfiles.findIndex(p => p.id === profileToEdit?.id) };
    }
    if (mode === 'component') {
        return { items: allComponents, currentItem: componentTemplateToEdit, currentIndex: allComponents.findIndex(c => c.id === componentTemplateToEdit?.id) };
    }
    return { items: [], currentItem: null, currentIndex: -1 };
  }, [mode, quoteItems, itemToEdit, allProfiles, profileToEdit, allComponents, componentTemplateToEdit]);

  const isFirstItem = currentIndex <= 0;
  const isLastItem = currentIndex >= items.length - 1;
  const showNavigation = items.length > 1 && currentItem;

  const activeInstanceCasementPanes = useMemo(() => {
    if (!editableItem || !activeInstance) return [];
    const { mullions, transoms, frameInfo } = editableItem;
    const { outer } = frameInfo;
    const activeInstanceInnerWidth = Math.max(0, (activeInstance.overallWidth || 0) - (outer.leftJamb + outer.rightJamb));
    const activeInstanceInnerHeight = Math.max(0, (activeInstance.overallHeight || 0) - outer.head - outer.cill);
    const instanceMullions = (mullions || []).filter(d => d.instanceId === activeInstance.id);
    const instanceTransoms = (transoms || []).filter(d => d.instanceId === activeInstance.id);
    return calculatePanes(activeInstanceInnerWidth, activeInstanceInnerHeight, [...instanceMullions, ...instanceTransoms], { mullion: outer.mullion, transom: outer.transom });
  }, [editableItem, activeInstance]);
  
  const updateActiveInstance = (field: keyof WindowInstance, value: any) => {
    updateItem(prev => ({
        ...prev,
        windowInstances: prev.windowInstances.map(inst => 
            inst.id === activeInstanceId ? {...inst, [field]: value} : inst
        )
    }));
  };

  const handleApplicabilityChange = (itemType: 'Sash' | 'Casement' | 'Door' | 'Screen', checked: boolean) => {
    if (isReadOnly) return;
    setComponentApplicability(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(itemType);
        } else {
            newSet.delete(itemType);
        }
        return Array.from(newSet);
    });
};

  const handleRangeChange = (newRangeId: string) => {
    updateItem(prev => {
        const selectedRange = productRanges.find(r => r.id === newRangeId);
        
        if (!selectedRange) {
            return { ...prev, productRangeId: newRangeId };
        }

        const newFrameInfo: FrameInfo = {
            ...prev.frameInfo,
            thickness: selectedRange.frameThickness,
            outer: { head: selectedRange.outerHeadHeight, cill: selectedRange.outerCillHeight, leftJamb: selectedRange.outerLeftJambWidth, rightJamb: selectedRange.outerRightJambWidth, transom: selectedRange.outerTransomHeight, mullion: selectedRange.outerMullionWidth },
            inner: { head: prev.frameInfo.inner.head, cill: prev.frameInfo.inner.cill, leftJamb: prev.frameInfo.inner.leftJamb, rightJamb: prev.frameInfo.inner.rightJamb, transom: prev.frameInfo.inner.transom, mullion: prev.frameInfo.inner.mullion },
            rebateDepth: selectedRange.rebateDepth,
            rebateWidth: selectedRange.rebateWidth,
        };
        
        const newSashInfo: SashInfo = {
            ...prev.sashInfo,
            head: selectedRange.topRailHeight,
            stile: selectedRange.stileWidth,
            bottomRail: selectedRange.bottomRailHeight,
            meetingStile: selectedRange.meetingRailHeight,
        };
        
        return {
            ...prev,
            productRangeId: newRangeId,
            materialSashId: selectedRange.materialSashId,
            materialFrameId: selectedRange.materialFrameId,
            materialCillId: selectedRange.materialCillId,
            frameInfo: newFrameInfo,
            sashInfo: newSashInfo,
            openingDirection: selectedRange.openingDirection,
            glazingType: selectedRange.glazingType,
        };
    }, false);
  };
  
    const handleDimensionChange = (
        changeFn: (prev: QuoteItem) => { newOverallWidth: number; newOverallHeight: number; newFrameInfo?: QuoteItem['frameInfo'] }
    ) => {
        updateItem(prev => {
            const { newOverallWidth, newOverallHeight, newFrameInfo } = changeFn(prev);
            const frameInfo = newFrameInfo || prev.frameInfo;
            const { outer } = frameInfo;
            
            const newInnerWidth = newOverallWidth - outer.leftJamb - outer.rightJamb;
            const newInnerHeight = newOverallHeight - outer.head - outer.cill;

            let updatedMullions = prev.mullions || [];
            let updatedTransoms = prev.transoms || [];

            if (newInnerWidth > 1 && newInnerHeight > 1 && lastValidLayout.current) {
                const base = JSON.parse(JSON.stringify(lastValidLayout.current));

                const allXCoords = new Set<number>([0, base.innerWidth]);
                base.mullions.forEach((d: FrameDivision) => allXCoords.add(d.offset));
                base.transoms.forEach((d: FrameDivision) => {
                    if (d.start !== undefined) allXCoords.add(d.start);
                    if (d.end !== undefined) allXCoords.add(d.end);
                });

                const allYCoords = new Set<number>([0, base.innerHeight]);
                base.transoms.forEach((d: FrameDivision) => allYCoords.add(d.offset));
                base.mullions.forEach((d: FrameDivision) => {
                    if (d.start !== undefined) allXCoords.add(d.start);
                    if (d.end !== undefined) allXCoords.add(d.end);
                });

                const xRatio = base.innerWidth > 0 ? newInnerWidth / base.innerWidth : 0;
                const yRatio = base.innerHeight > 0 ? newInnerHeight / base.innerHeight : 0;

                const xMap = new Map<number, number>();
                for (const x of allXCoords) {
                    xMap.set(x, Math.round(x * xRatio));
                }

                const yMap = new Map<number, number>();
                for (const y of allYCoords) {
                    yMap.set(y, Math.round(y * yRatio));
                }
                
                updatedMullions = base.mullions.map((m: FrameDivision) => ({
                    ...m,
                    offset: xMap.get(m.offset)!,
                    start: m.start !== undefined ? yMap.get(m.start) : undefined,
                    end: m.end !== undefined ? yMap.get(m.end) : undefined,
                }));

                updatedTransoms = base.transoms.map((t: FrameDivision) => ({
                    ...t,
                    offset: yMap.get(t.offset)!,
                    start: t.start !== undefined ? xMap.get(t.start) : undefined,
                    end: t.end !== undefined ? xMap.get(t.end) : undefined,
                }));

                const snapped = snapDivisions(
                    updatedMullions,
                    updatedTransoms,
                    { mullions: base.mullions, transoms: base.transoms },
                    { mullion: outer.mullion, transom: outer.transom }
                );
                updatedMullions = snapped.mullions;
                updatedTransoms = snapped.transoms;
            }
            
            const willBeValid = newInnerWidth > 1 && newInnerHeight > 1;

            const updatedItem = { ...prev };
            if (newFrameInfo) updatedItem.frameInfo = newFrameInfo;

            return {
                ...updatedItem,
                mullions: willBeValid ? updatedMullions : prev.mullions,
                transoms: willBeValid ? updatedTransoms : prev.transoms,
                placedSashes: prev.placedSashes,
                windowInstances: prev.windowInstances.map(inst =>
                    inst.id === activeInstanceId ? { ...inst, overallWidth: newOverallWidth, overallHeight: newOverallHeight } : inst
                )
            };
        }, false);
    };

    const handleInstanceDimensionChange = (id: string, field: 'overallWidth' | 'overallHeight', value: number) => {
        handleDimensionChange(prev => {
            const activeInst = prev.windowInstances.find(i => i.id === id);
            const newDimension = isNaN(value) ? 0 : value;
            return {
                newOverallWidth: field === 'overallWidth' ? newDimension : activeInst!.overallWidth,
                newOverallHeight: field === 'overallHeight' ? newDimension : activeInst!.overallHeight,
            };
        });
    };

    const handleProfileFrameChange = (view: 'outer' | 'inner', side: keyof FrameSideProfile, valueStr: string) => {
        const value = Number(valueStr);
        if (isNaN(value)) return;
        
        updateItem(prev => {
            const newFrameInfo = JSON.parse(JSON.stringify(prev.frameInfo));
            (newFrameInfo[view] as FrameSideProfile)[side] = value;
            return { ...prev, frameInfo: newFrameInfo };
        });
    };

    const handleFrameInfoChange = (field: keyof FrameInfo, value: string) => {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        if (isNaN(numValue as number) && numValue !== undefined) return;
    
        updateItem(prev => ({
            ...prev,
            frameInfo: { ...prev.frameInfo, [field]: numValue }
        }));
    };

    const handleProfileSashChange = (field: keyof Omit<SashInfo, 'thickness'>, valueStr: string) => {
        const value = Number(valueStr);
        if (isNaN(value)) return;

        updateItem(p => ({
            ...p,
            sashInfo: { ...p.sashInfo, [field]: value }
        }));
    };

    const handleEqualisePanes = () => {
        if (isReadOnly || !activeInstance || !editableItem) return;
    
        const instanceMullions = (editableItem.mullions || []).filter(d => d.instanceId === activeInstanceId);
        const instanceTransoms = (editableItem.transoms || []).filter(d => d.instanceId === activeInstanceId);
    
        if (instanceMullions.length === 0 && instanceTransoms.length === 0) return;
    
        updateItem(prev => {
            const { frameInfo } = prev;
            const activeInst = prev.windowInstances.find(i => i.id === activeInstanceId)!;
            
            const innerWidth = activeInst.overallWidth - frameInfo.outer.leftJamb - frameInfo.outer.rightJamb;
            const innerHeight = activeInst.overallHeight - frameInfo.outer.head - frameInfo.outer.cill;
    
            const otherMullions = (prev.mullions || []).filter(d => d.instanceId !== activeInstanceId);
            const otherTransoms = (prev.transoms || []).filter(d => d.instanceId !== activeInstanceId);
            const currentInstanceMullions = (prev.mullions || []).filter(d => d.instanceId === activeInstanceId);
            const currentInstanceTransoms = (prev.transoms || []).filter(d => d.instanceId === activeInstanceId);
    
            const oldPanes = calculatePanes(innerWidth, innerHeight, [...currentInstanceMullions, ...currentInstanceTransoms], { mullion: frameInfo.outer.mullion, transom: frameInfo.outer.transom });
    
            const numVerticalPanes = currentInstanceMullions.length + 1;
            const numHorizontalPanes = currentInstanceTransoms.length + 1;
    
            const totalMullionWidth = currentInstanceMullions.reduce((sum, m) => sum + (m.thickness ?? frameInfo.outer.mullion), 0);
            const totalTransomHeight = currentInstanceTransoms.reduce((sum, t) => sum + (t.thickness ?? frameInfo.outer.transom), 0);
    
            const paneWidth = (innerWidth - totalMullionWidth) / numVerticalPanes;
            const paneHeight = (innerHeight - totalTransomHeight) / numHorizontalPanes;
    
            let currentX = 0;
            const newInstanceMullions = [...currentInstanceMullions].sort((a,b) => a.offset - b.offset).map(mullion => {
                const thickness = mullion.thickness ?? frameInfo.outer.mullion;
                currentX += paneWidth;
                const newOffset = currentX + thickness / 2;
                currentX += thickness;
                return { ...mullion, offset: Math.round(newOffset) };
            });
    
            let currentY = 0;
            const newInstanceTransoms = [...currentInstanceTransoms].sort((a,b) => a.offset - b.offset).map(transom => {
                const thickness = transom.thickness ?? frameInfo.outer.transom;
                currentY += paneHeight;
                const newOffset = currentY + thickness / 2;
                currentY += thickness;
                return { ...transom, offset: Math.round(newOffset) };
            });
            
            const newPanes = calculatePanes(innerWidth, innerHeight, [...newInstanceMullions, ...newInstanceTransoms], { mullion: frameInfo.outer.mullion, transom: frameInfo.outer.transom });
            const remappedSashes = remapPlacedSashes(oldPanes, newPanes, prev.placedSashes || [], activeInst.id);
    
            return {
                ...prev,
                mullions: [...otherMullions, ...newInstanceMullions],
                transoms: [...otherTransoms, ...newInstanceTransoms],
                placedSashes: remappedSashes,
            };
        });
    };

  const handleSashOverrideChange = (sashType: 'top' | 'bottom', field: keyof SashSectionOverrides, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (isNaN(numValue as number) && numValue !== undefined) return;

    const overrideField = sashType === 'top' ? 'topSashOverrides' : 'bottomSashOverrides';

    updateItem(prev => ({
        ...prev,
        windowInstances: prev.windowInstances.map(inst => {
            if (inst.id === activeInstanceId) {
                const newOverrides = { ...(inst[overrideField]), [field]: numValue };
                Object.keys(newOverrides).forEach(key => newOverrides[key as keyof SashSectionOverrides] === undefined && delete newOverrides[key as keyof SashSectionOverrides]);
                return { ...inst, [overrideField]: newOverrides };
            }
            return inst;
        })
    }));
  };
  
    const handleCopyInstance = (direction: 'left' | 'right') => {
        if (isReadOnly) return;
        const activeIndex = editableItem?.windowInstances.findIndex(inst => inst.id === activeInstanceId);
        if (activeIndex === -1 || !editableItem) return;

        const sourceInstance = editableItem.windowInstances[activeIndex];
        const newInstance: WindowInstance = JSON.parse(JSON.stringify(sourceInstance));
        newInstance.id = `inst-${Date.now()}`;

        const newInstances = [...editableItem.windowInstances];
        const insertIndex = direction === 'left' ? activeIndex : activeIndex + 1;
        newInstances.splice(insertIndex, 0, newInstance);

        const sourceInstanceId = sourceInstance.id;
        const newInstanceId = newInstance.id;
        
        const mullionsToCopy = (editableItem.mullions || []).filter(m => m.instanceId === sourceInstanceId);
        const newMullions = mullionsToCopy.map(m => ({
            ...m,
            id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            instanceId: newInstanceId
        }));

        const transomsToCopy = (editableItem.transoms || []).filter(t => t.instanceId === sourceInstanceId);
        const newTransoms = transomsToCopy.map(t => ({
            ...t,
            id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            instanceId: newInstanceId
        }));

        const sashesToCopy = (editableItem.placedSashes || []).filter(sash => sash.paneId.startsWith(sourceInstanceId));
        const newSashes = sashesToCopy.map(sash => {
            const newSash = JSON.parse(JSON.stringify(sash));
            newSash.paneId = newSash.paneId.replace(sourceInstanceId, newInstanceId);
            if (newSash.glazingBars) {
                newSash.glazingBars = newSash.glazingBars.map((bar: GlazingBar) => ({
                    ...bar,
                    id: `gb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                }));
            }
            return newSash;
        });

        const glassTypesToCopy = (editableItem.paneGlassTypes || []).filter(pgt => pgt.paneId.startsWith(sourceInstanceId));
        const newGlassTypes = glassTypesToCopy.map(pgt => ({
            ...pgt,
            paneId: pgt.paneId.replace(sourceInstanceId, newInstanceId)
        }));
        
        updateItem(prev => ({ 
            ...prev, 
            windowInstances: newInstances,
            mullions: [...(prev.mullions || []), ...newMullions],
            transoms: [...(prev.transoms || []), ...newTransoms],
            placedSashes: [...(prev.placedSashes || []), ...newSashes],
            paneGlassTypes: [...(prev.paneGlassTypes || []), ...newGlassTypes]
        }));
    };

  // --- AUTO SPLIT EFFECT ---
  useEffect(() => {
    if (itemType === 'Sash' && isAutoSplit && activeInstance && editableItem) {
        const F_HEAD = isNewFrame ? editableItem.frameInfo.outer.head : 0;
        const F_CILL = isNewFrame ? editableItem.frameInfo.outer.cill : 0;
        const sashableHeight = activeInstance.overallHeight - F_HEAD - F_CILL;
        const newTopSashHeight = (sashableHeight + editableItem.sashInfo.head - editableItem.sashInfo.bottomRail) / 2;

        if (newTopSashHeight > 0 && newTopSashHeight < sashableHeight) {
            updateActiveInstance('topSashHeight', Math.round(newTopSashHeight));
        }
    }
  }, [isAutoSplit, activeInstance?.overallHeight, editableItem?.frameInfo, editableItem?.sashInfo, editableItem?.isNewFrame, itemType, activeInstanceId]);
  
    const handleGlassPaneClick = (paneId: string, instanceId: string) => {
        if (isReadOnly) return;
        setActiveInstanceId(instanceId);
        setActiveGlassPaneId(paneId);
        setIsGlassModalOpen(true);
    };

    const handleGlassSelection = (selectedGlassId: string) => {
        if (!activeGlassPaneId) return;
        updateItem(prev => {
            let newPanes = [...prev.paneGlassTypes];
            if (prev.glazingBarType === 'plant-on' && prev.itemType !== 'Sash') {
                 const uniqueSashPaneId = activeGlassPaneId ? activeGlassPaneId.split('-').slice(0, 3).join('-') : '';
                 newPanes = newPanes.filter(p => !p.paneId.startsWith(uniqueSashPaneId));
                 newPanes.push({ paneId: uniqueSashPaneId, glassTypeId: selectedGlassId });

            } else { // Sash windows or true-bars
                const idx = newPanes.findIndex(p => p.paneId === activeGlassPaneId);
                if (idx > -1) {
                    newPanes[idx] = { ...newPanes[idx], glassTypeId: selectedGlassId };
                } else {
                    newPanes.push({ paneId: activeGlassPaneId, glassTypeId: selectedGlassId });
                }
            }
            return {...prev, paneGlassTypes: newPanes};
        });
        setIsGlassModalOpen(false);
        setActiveGlassPaneId(null);
    };
  
    const addDivision = (type: 'mullion' | 'transom') => {
        if (isReadOnly || !activeInstance || !editableItem) return;
    
        updateItem(prev => {
            const activeInst = prev.windowInstances.find(i => i.id === activeInstanceId) || prev.windowInstances[0];
            const innerWidth = activeInst.overallWidth - (prev.frameInfo.outer.leftJamb + prev.frameInfo.outer.rightJamb);
            const innerHeight = activeInst.overallHeight - prev.frameInfo.outer.head - prev.frameInfo.outer.cill;
            
            const instanceDivisions = (type === 'mullion' ? prev.mullions : prev.transoms)?.filter(d => d.instanceId === activeInstanceId) || [];

            const oldPanes = calculatePanes(innerWidth, innerHeight, [...(prev.mullions || []), ...(prev.transoms || [])], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });

            const dimension = type === 'mullion' ? innerWidth : innerHeight;
            const thickness = type === 'mullion' ? prev.frameInfo.outer.mullion : prev.frameInfo.outer.transom;
    
            const getStartEdge = (d: FrameDivision) => d.offset - (d.thickness || thickness) / 2;
            const getEndEdge = (d: FrameDivision) => d.offset + (d.thickness || thickness) / 2;

            const sortedDivisions = [...instanceDivisions].sort((a, b) => a.offset - b.offset);
    
            const boundaries = [0, ...sortedDivisions.flatMap(d => [getStartEdge(d), getEndEdge(d)]), dimension];
            
            let largestGap = 0;
            let largestGapStart = 0;
    
            for (let i = 0; i < boundaries.length; i += 2) {
                const start = boundaries[i];
                const end = boundaries[i+1];
                const gap = end - start;
                if (gap > largestGap) {
                    largestGap = gap;
                    largestGapStart = start;
                }
            }
            
            const newCenterOffset = largestGapStart + largestGap / 2;
            
            const newDivision: FrameDivision = {
                id: `${type.charAt(0)}-${Date.now()}`,
                type,
                offset: Math.round(newCenterOffset),
                instanceId: activeInstanceId,
            };
    
            const newMullions = type === 'mullion' ? [...(prev.mullions || []), newDivision] : (prev.mullions || []);
            const newTransoms = type === 'transom' ? [...(prev.transoms || []), newDivision] : (prev.transoms || []);
            const newPanes = calculatePanes(innerWidth, innerHeight, [...newMullions, ...newTransoms], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });
            const remappedSashes = remapPlacedSashes(oldPanes, newPanes, prev.placedSashes || [], activeInst.id);
    
            return { ...prev, mullions: newMullions, transoms: newTransoms, placedSashes: remappedSashes };
        });
    };

    const addDivisionInPane = (type: 'mullion' | 'transom') => {
        if (isReadOnly || !activeInstance || !editableItem || !selectedPaneId) return;

        const paneInternalId = selectedPaneId.replace(`${activeInstance.id}-`, '');
        const selectedPane = activeInstanceCasementPanes.find(p => p.id === paneInternalId);

        if (!selectedPane) {
            return;
        }

        updateItem(prev => {
            const activeInst = prev.windowInstances.find(i => i.id === activeInstanceId) || prev.windowInstances[0];
            const innerWidth = activeInst.overallWidth - (prev.frameInfo.outer.leftJamb + prev.frameInfo.outer.rightJamb);
            const innerHeight = activeInst.overallHeight - prev.frameInfo.outer.head - prev.frameInfo.outer.cill;
            const oldPanes = calculatePanes(innerWidth, innerHeight, [...(prev.mullions || []), ...(prev.transoms || [])], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });

            const thickness = type === 'mullion' ? prev.frameInfo.outer.mullion : prev.frameInfo.outer.transom;

            const newDivision: FrameDivision = {
                id: `${type.charAt(0)}-${Date.now()}`,
                type,
                offset: type === 'mullion'
                    ? Math.round(selectedPane.x + selectedPane.width / 2)
                    : Math.round(selectedPane.y + selectedPane.height / 2),
                start: type === 'mullion' ? selectedPane.y : selectedPane.x,
                end: type === 'mullion' ? selectedPane.y + selectedPane.height : selectedPane.x + selectedPane.width,
                thickness: thickness,
                instanceId: activeInstanceId,
            };

            const updatedMullions = type === 'mullion' ? [...(prev.mullions || []), newDivision] : prev.mullions;
            const updatedTransoms = type === 'transom' ? [...(prev.transoms || []), newDivision] : prev.transoms;

            const newPanes = calculatePanes(innerWidth, innerHeight, [...(updatedMullions || []), ...(updatedTransoms || [])], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });
            const remappedSashes = remapPlacedSashes(oldPanes, newPanes, prev.placedSashes || [], activeInst.id);

            return {
                ...prev,
                mullions: updatedMullions,
                transoms: updatedTransoms,
                placedSashes: remappedSashes,
            };
        });

        setSelectedPaneId(null);
    };
    
    const handleDivisionPropertyChange = (id: string, prop: keyof Omit<FrameDivision, 'id' | 'type'>, value: number | string | undefined) => {
        if (isReadOnly) return;
        
        updateItem(prev => {
            const numValue = (typeof value === 'string' && value.trim() === '') ? undefined : Number(value);
            
            let newMullions = [...(prev.mullions || [])];
            let newTransoms = [...(prev.transoms || [])];

            const popoverDivision = [...newMullions, ...newTransoms].find(div => div.id === id);
            if (!popoverDivision) return prev;

            if (prop === 'thickness') {
                const oldThickness = popoverDivision.thickness || (popoverDivision.type === 'mullion' ? prev.frameInfo.outer.mullion : prev.frameInfo.outer.transom);
                const newThickness = numValue === undefined ? (popoverDivision.type === 'mullion' ? prev.frameInfo.outer.mullion : prev.frameInfo.outer.transom) : numValue;
                
                if (popoverDivision.type === 'mullion') {
                    newMullions = newMullions.map(d => d.id === id ? { ...d, thickness: numValue } : d);
                } else {
                    newTransoms = newTransoms.map(d => d.id === id ? { ...d, thickness: numValue } : d);
                }

                if (popoverDivision.type === 'mullion') {
                    const mullion = newMullions.find(d=>d.id===id)!;
                    const mullionLeftEdge = mullion.offset - newThickness / 2;
                    const mullionRightEdge = mullion.offset + newThickness / 2;
                    const oldMullionLeftEdge = mullion.offset - oldThickness / 2;
                    const oldMullionRightEdge = mullion.offset + oldThickness / 2;

                    newTransoms = newTransoms.map(t => {
                        let newT = { ...t };
                        let changed = false;
                        if (newT.end !== undefined && Math.abs(newT.end - oldMullionLeftEdge) < 1) {
                            newT.end = mullionLeftEdge;
                            changed = true;
                        }
                        if (newT.start !== undefined && Math.abs(newT.start - oldMullionRightEdge) < 1) {
                            newT.start = mullionRightEdge;
                            changed = true;
                        }
                        return changed ? newT : t;
                    });
                } else { // popoverDivision is a transom
                    const transom = newTransoms.find(d=>d.id===id)!;
                    const transomTopEdge = transom.offset - newThickness / 2;
                    const transomBottomEdge = transom.offset + newThickness / 2;
                    const oldTransomTopEdge = transom.offset - oldThickness / 2;
                    const oldTransomBottomEdge = transom.offset + oldThickness / 2;

                    newMullions = newMullions.map(m => {
                        let newM = { ...m };
                        let changed = false;
                        if (newM.end !== undefined && Math.abs(newM.end - oldTransomTopEdge) < 1) {
                            newM.end = transomTopEdge;
                            changed = true;
                        }
                        if (newM.start !== undefined && Math.abs(newM.start - oldTransomBottomEdge) < 1) {
                            newM.start = transomBottomEdge;
                            changed = true;
                        }
                        return changed ? newM : m;
                    });
                }
            } else {
                 const updatedDivision = { ...popoverDivision };
                 if (prop === 'start') updatedDivision.start = numValue;
                 if (prop === 'end') updatedDivision.end = numValue;

                 if (popoverDivision.type === 'mullion') {
                    newMullions = newMullions.map(d => d.id === id ? updatedDivision : d);
                } else {
                    newTransoms = newTransoms.map(d => d.id === id ? updatedDivision : d);
                }
            }
            
            return {
                ...prev,
                mullions: newMullions,
                transoms: newTransoms,
            };
        });
    };
    
    const handleRelativeOffsetChange = (from: 'start' | 'end', valueStr: string) => {
        const value = Number(valueStr);
        if (isNaN(value) || value < 0 || !popoverState) return;
        const divisionId = popoverState.divisionId;
    
        updateItem(prev => {
            const allDivisions = [...(prev.mullions || []), ...(prev.transoms || [])];
            const popoverDivision = allDivisions.find(div => div.id === divisionId);
            if (!popoverDivision) return prev;

            const activeInst = prev.windowInstances.find(i => i.id === activeInstanceId) || prev.windowInstances[0];
            const isMullion = popoverDivision.type === 'mullion';
            
            const innerWidth = activeInst.overallWidth - (prev.frameInfo.outer.leftJamb + prev.frameInfo.outer.rightJamb);
            const innerHeight = activeInst.overallHeight - prev.frameInfo.outer.head - prev.frameInfo.outer.cill;
            
            const dimension = isMullion ? innerWidth : innerHeight;
            const thickness = popoverDivision.thickness || (isMullion ? prev.frameInfo.outer.mullion : prev.frameInfo.outer.transom);
            
            const popoverStartCoord = popoverDivision.start ?? 0;
            const popoverEndCoord = popoverDivision.end ?? (isMullion ? innerHeight : innerWidth);
            
            const overlaps = (d: FrameDivision) => {
                const dStart = d.start ?? 0;
                const dEnd = d.end ?? (isMullion ? innerHeight : innerWidth);
                return Math.max(popoverStartCoord, dStart) < Math.min(popoverEndCoord, dEnd);
            };

            const getStartEdge = (d: FrameDivision) => d.offset - (d.thickness || (isMullion ? prev.frameInfo.outer.mullion : prev.frameInfo.outer.transom)) / 2;
            const getEndEdge = (d: FrameDivision) => d.offset + (d.thickness || (isMullion ? prev.frameInfo.outer.mullion : prev.frameInfo.outer.transom)) / 2;
            
            const allDivs = [...(prev.mullions || []), ...(prev.transoms || [])];
            const popoverCenter = popoverDivision.offset;

            const potentialNeighbors = allDivs
                .filter(d => d.id !== popoverDivision.id && d.type === popoverDivision.type && overlaps(d));

            const leftNeighbors = potentialNeighbors.filter(d => d.offset < popoverCenter);
            const rightNeighbors = potentialNeighbors.filter(d => d.offset > popoverCenter);

            const leftNeighborEdge = leftNeighbors.length > 0
                ? Math.max(...leftNeighbors.map(getEndEdge))
                : 0;
                
            const rightNeighborEdge = rightNeighbors.length > 0
                ? Math.min(...rightNeighbors.map(getStartEdge))
                : dimension;
            
            let newCenterOffset: number;
            if (from === 'start') {
                newCenterOffset = leftNeighborEdge + value + thickness / 2;
            } else { // from 'end'
                newCenterOffset = rightNeighborEdge - value - thickness / 2;
            }
    
            const updatedDivision: FrameDivision = { 
                ...popoverDivision, 
                offset: Math.round(newCenterOffset),
            };
            
            let newMullions = prev.mullions || [];
            let newTransoms = prev.transoms || [];

            if (updatedDivision.type === 'mullion') {
                newMullions = newMullions.map(d => d.id === divisionId ? updatedDivision : d);
            } else {
                newTransoms = newTransoms.map(d => d.id === divisionId ? updatedDivision : d);
            }
            
            return {
                ...prev,
                mullions: newMullions,
                transoms: newTransoms,
            };
        });
    };

    const handleDeleteDivision = () => {
        if (isReadOnly || !popoverState) return;
        const divisionId = popoverState.divisionId;
        updateItem(prev => {
            const activeInst = prev.windowInstances.find(i => i.id === activeInstanceId) || prev.windowInstances[0];
            const innerWidth = activeInst.overallWidth - (prev.frameInfo.outer.leftJamb + prev.frameInfo.outer.rightJamb);
            const innerHeight = activeInst.overallHeight - prev.frameInfo.outer.head - prev.frameInfo.outer.cill;
            const oldPanes = calculatePanes(innerWidth, innerHeight, [...(prev.mullions || []), ...(prev.transoms || [])], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });
            
            const newMullions = prev.mullions?.filter(d => d.id !== divisionId);
            const newTransoms = prev.transoms?.filter(d => d.id !== divisionId);

            const newPanes = calculatePanes(innerWidth, innerHeight, [...(newMullions || []), ...(newTransoms || [])], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });
            const remappedSashes = remapPlacedSashes(oldPanes, newPanes, prev.placedSashes || [], activeInst.id);
            
            return { ...prev,
                mullions: newMullions,
                transoms: newTransoms,
                placedSashes: remappedSashes
            };
        });
        setPopoverState(null);
    };
    
    const clearLayout = () => {
        if (isReadOnly || !activeInstanceId) return;
        updateItem(prev => ({
            ...prev,
            mullions: (prev.mullions || []).filter(d => d.instanceId !== activeInstanceId),
            transoms: (prev.transoms || []).filter(d => d.instanceId !== activeInstanceId),
            placedSashes: (prev.placedSashes || []).filter(sash => !sash.paneId.startsWith(activeInstanceId)),
        }));
    };
    
    const addSash = (paneId: string, type: PlacedSash['type'], hingeSide?: PlacedSash['hingeSide']) => {
        if (isReadOnly || !paneId) return;
        const newSash: PlacedSash = { paneId, type, hingeSide };
        updateItem(prev => ({...prev, placedSashes: [...(prev.placedSashes || []).filter(s => s.paneId !== paneId), newSash] }));
    };

    const handleAddComponent = (paneId: string, template: ComponentTemplate) => {
        if (isReadOnly || !paneId || !activeInstance) return;
    
        const paneInternalId = paneId.replace(`${activeInstance.id}-`, '');
        const targetPane = activeInstanceCasementPanes.find(p => p.id === paneInternalId);
    
        if (!targetPane) {
            console.error("Target pane not found.");
            return;
        }
    
        const componentLayout = template.layout;
        if (!componentLayout || !componentLayout.instances || componentLayout.instances.length === 0) {
            console.error("Component template has no layout defined.");
            return;
        }
    
        const componentInstances = componentLayout.instances;
        const componentTotalWidth = componentInstances.reduce((sum, inst) => sum + inst.overallWidth, 0);
    
        if (componentTotalWidth <= 0) {
            console.error("Component template has invalid dimensions.");
            return;
        }
    
        updateItem(prev => {
            const item = JSON.parse(JSON.stringify(prev));
    
            const newDivisions: FrameDivision[] = [];
            let currentX = targetPane.x;
            const mullionThickness = 1; // Assume a thin mullion for component splits
            const effectivePaneWidth = targetPane.width - (componentInstances.length - 1) * mullionThickness;
    
            const scaledInstanceWidths = componentInstances.map(inst => inst.overallWidth * (effectivePaneWidth / componentTotalWidth));
    
            for (let i = 0; i < componentInstances.length - 1; i++) {
                currentX += scaledInstanceWidths[i];
                const newMullion: FrameDivision = {
                    id: `m-comp-${Date.now()}-${i}`,
                    type: 'mullion',
                    offset: currentX + (mullionThickness / 2),
                    thickness: mullionThickness,
                    start: targetPane.y,
                    end: targetPane.y + targetPane.height,
                    instanceId: activeInstance.id,
                };
                newDivisions.push(newMullion);
                currentX += mullionThickness;
            }
    
            item.mullions = [...(item.mullions || []), ...newDivisions];
    
            const instanceMullions = (item.mullions || []).filter(d => d.instanceId === activeInstance.id);
            const instanceTransoms = (item.transoms || []).filter(d => d.instanceId === activeInstance.id);
            const allNewPanesForInstance = calculatePanes(activeInstanceInnerWidth, activeInstanceInnerHeight, [...instanceMullions, ...instanceTransoms], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });
    
            const newSashesInTargetArea = allNewPanesForInstance.filter(p => {
                const pCenterX = p.x + p.width / 2;
                const pCenterY = p.y + p.height / 2;
                return pCenterX > targetPane.x && pCenterX < (targetPane.x + targetPane.width) &&
                       pCenterY > targetPane.y && pCenterY < (targetPane.y + targetPane.height);
            }).sort((a,b) => a.x - b.x);
    
            if (newSashesInTargetArea.length < componentInstances.length) {
                console.error("Component insertion failed: could not create enough panes.");
                return prev;
            }
    
            const newPlacedSashes: PlacedSash[] = [];
            const templateSashes = componentLayout.placedSashes || [];
    
            componentInstances.forEach((inst, index) => {
                const originalSash = templateSashes.find(s => s.paneId.startsWith(inst.id));
                if (!originalSash) return;
    
                const targetNewPane = newSashesInTargetArea[index];
                if (!targetNewPane) return;
                
                let sashType: PlacedSash['type'] = 'casement';
                if (template.itemType === 'Door') sashType = 'door-sash';
                else if (template.itemType === 'Screen') sashType = 'fixed-glazing';
    
                newPlacedSashes.push({
                    ...originalSash,
                    paneId: `${activeInstance.id}-${targetNewPane.id}`,
                    type: sashType,
                    sashOverrides: {
                        topRail: template.sashInfo.head,
                        stile: template.sashInfo.stile,
                        bottomRail: template.sashInfo.bottomRail,
                        meetingRail: template.sashInfo.meetingStile > 0 ? template.sashInfo.meetingStile : undefined,
                    }
                });
            });
            
            const otherSashes = (item.placedSashes || []).filter(s => {
                const sPaneIdInternal = s.paneId.replace(`${activeInstance.id}-`, '');
                const sPane = activeInstanceCasementPanes.find(p => p.id === sPaneIdInternal);
                if (!sPane) return true;
                const sCenterX = sPane.x + sPane.width / 2;
                const sCenterY = sPane.y + sPane.height / 2;
                return !(sCenterX >= targetPane.x && sCenterX < (targetPane.x + targetPane.width) &&
                         sCenterY >= targetPane.y && sCenterY < (targetPane.y + targetPane.height));
            });

            item.placedSashes = [...otherSashes, ...newPlacedSashes];
    
            return item;
        });
    
        setSelectedPaneId(null);
    };

    const updateSash = (paneId: string, config: Partial<PlacedSash>) => {
        if (isReadOnly || !paneId) return;
        updateItem(prev => ({ ...prev,
            placedSashes: prev.placedSashes?.map(s => s.paneId === paneId ? { ...s, ...config } : s)
        }));
    };
    
    const removeSash = (paneId: string) => {
        if (isReadOnly || !paneId) return;
        updateItem(prev => ({ ...prev,
            placedSashes: prev.placedSashes?.filter(s => s.paneId !== paneId)
        }));
        setSelectedPaneId(paneId); // keep pane selected
    };

    const handleAddFrenchPair = (paneId: string, pane: { id: string; x: number; y: number; width: number; height: number; }, sashType: 'casement' | 'door-sash') => {
        if (isReadOnly || !editableItem) return;
        const instanceId = activeInstanceId;
        if (!instanceId) return;
    
        const instance = editableItem.windowInstances.find(i => i.id === instanceId);
        if (!instance) return;
    
        const innerWidth = instance.overallWidth - editableItem.frameInfo.outer.leftJamb - editableItem.frameInfo.outer.rightJamb;
        const innerHeight = instance.overallHeight - editableItem.frameInfo.outer.head - editableItem.frameInfo.outer.cill;
        
        const REBATE_THICKNESS = 0.1;
    
        const newMullionCenterOffset = pane.x + pane.width / 2;
        const newMullion: FrameDivision = { 
            id: `m-${Date.now()}`, 
            type: 'mullion', 
            offset: Math.round(newMullionCenterOffset),
            thickness: REBATE_THICKNESS,
            start: pane.y,
            end: pane.y + pane.height,
            instanceId: activeInstanceId,
        };
        
        updateItem(prev => {
            const oldPanes = calculatePanes(innerWidth, innerHeight, [...(prev.mullions || []), ...(prev.transoms || [])], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });
            const updatedMullions = [...(prev.mullions || []), newMullion];
            const allPanesAfterUpdate = calculatePanes(innerWidth, innerHeight, [...updatedMullions, ...(prev.transoms || [])], { mullion: prev.frameInfo.outer.mullion, transom: prev.frameInfo.outer.transom });
            
            const newPanesInOldSpace = allPanesAfterUpdate.filter(p => {
                const pCenterX = p.x + p.width / 2;
                const pCenterY = p.y + p.height / 2;
                return pCenterX > pane.x && pCenterX < (pane.x + pane.width) &&
                       pCenterY > pane.y && pCenterY < (pane.y + pane.height);
            }).sort((a,b) => a.x - b.x);
    
            if (newPanesInOldSpace.length < 2) {
                 console.warn("Could not create two panes for French pair.");
                 return prev;
            }
    
            const [leftPane, rightPane] = newPanesInOldSpace;
    
            const leftSash: PlacedSash = { paneId: `${instanceId}-${leftPane.id}`, type: sashType, hingeSide: 'left' };
            const rightSash: PlacedSash = { paneId: `${instanceId}-${rightPane.id}`, type: sashType, hingeSide: 'right' };
            
            const otherSashes = (prev.placedSashes || []).filter(s => s.paneId !== paneId);
    
            return {...prev, mullions: updatedMullions, placedSashes: [...otherSashes, leftSash, rightSash]};
        });
    };


  const handleDeleteInstance = (idToDelete: string) => {
    if (editableItem && editableItem.windowInstances.length <= 1 || isReadOnly) return;
    
    updateItem(prev => {
        const indexToDelete = prev.windowInstances.findIndex(inst => inst.id === idToDelete);
        const newInstances = prev.windowInstances.filter(inst => inst.id !== idToDelete);
        
        if (activeInstanceId === idToDelete) {
            const newActiveIndex = Math.max(0, indexToDelete - 1);
            setActiveInstanceId(newInstances[newActiveIndex]?.id || '');
        }
        return { ...prev, windowInstances: newInstances };
    });
  };

    const handleGlazingBarSave = (bars: GlazingBar[], newThickness: number) => {
        if (!selectedSashId || isReadOnly) return;
        updateItem(p=>({...p, glazingBarThickness: newThickness}));

        if (itemType === 'Sash') {
            const instanceId = selectedSashId.substring(0, selectedSashId.lastIndexOf('-'));
            const sashType = selectedSashId.substring(selectedSashId.lastIndexOf('-') + 1);
            
            updateItem(prev => ({ ...prev,
                windowInstances: prev.windowInstances.map(inst => {
                    if (inst.id === instanceId) {
                        if (sashType === 'pair') {
                            return { ...inst, topSashGlazingBars: JSON.parse(JSON.stringify(bars)), bottomSashGlazingBars: JSON.parse(JSON.stringify(bars)) };
                        }
                        return { ...inst, [sashType === 'top' ? 'topSashGlazingBars' : 'bottomSashGlazingBars']: JSON.parse(JSON.stringify(bars)) };
                    }
                    return inst;
                })
            }));
        } else {
            updateSash(selectedSashId, { glazingBars: bars });
        }
        setIsGlazingBarModalOpen(false);
    };

    const handleCopyGlazingBars = (targetInstanceId: string, targetSashType: 'top' | 'bottom') => {
        if (!selectedSashId || isReadOnly || !editableItem) return;

        const sourceInstanceId = selectedSashId.substring(0, selectedSashId.lastIndexOf('-'));
        const sourceSashType = selectedSashId.substring(selectedSashId.lastIndexOf('-') + 1);
        
        const sourceInstance = editableItem.windowInstances.find(i => i.id === sourceInstanceId);
        if (!sourceInstance) return;

        const sourceBars = sourceSashType === 'top' ? sourceInstance.topSashGlazingBars : sourceInstance.bottomSashGlazingBars;
        if (!sourceBars) return;
        
        const barsCopy = JSON.parse(JSON.stringify(sourceBars));
        
        updateItem(prev => ({...prev,
            windowInstances: prev.windowInstances.map(inst => {
                if (inst.id === targetInstanceId) {
                    const updatedInst = {...inst};
                    if (targetSashType === 'top') {
                        updatedInst.topSashGlazingBars = barsCopy;
                    } else {
                        updatedInst.bottomSashGlazingBars = barsCopy;
                    }
                    return updatedInst;
                }
                return inst;
            })
        }));
    };

    const handleSave = () => {
        if (isReadOnly || !editableItem) return;
        const sanitizedItem = sanitizeAndReIdLayout(editableItem);
    
        if (mode === 'component' && onSaveComponentTemplate) {
            const finalTemplate = serializeToComponent(sanitizedItem, editableItem.id, componentApplicability);
            onSaveComponentTemplate(finalTemplate);
        } else if (mode === 'profile' && onSaveProfile) {
            const finalProfile = serializeToProfile(sanitizedItem, editableItem.id);
            onSaveProfile(finalProfile);
        } else if (mode === 'quote' && onSaveItem) {
            const calculatedUValue = calculateUValue(sanitizedItem, materials);
            const finalItem = { ...sanitizedItem, calculatedUValue };
            onSaveItem(finalItem);
        }
        setHistory([]); // Clear history on save
    };
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPopoverState(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!editableItem) {
      return <div className="flex-1 flex items-center justify-center">Loading builder...</div>;
    }
    
    const { outer } = editableItem.frameInfo;
    const { head: sashHead, stile: sashStile, bottomRail: sashBottomRail, meetingStile: sashMeetingStile } = editableItem.sashInfo;
    const { isNewFrame, mullions, transoms, windowInstances, paneGlassTypes, glazingBarType, placedSashes = [], glazingBarThickness } = editableItem;
    
    const F_HEAD = isNewFrame ? outer.head : 0;
    const F_CILL = isNewFrame ? outer.cill : 0;
    const F_JAMB = isNewFrame ? outer.leftJamb : 0; // Simplified for now
    
    const totalOverallWidth = windowInstances.reduce((sum, inst) => sum + inst.overallWidth, 0)
        + (windowInstances.length > 1 ? (windowInstances.length - 1) * (editableItem.pairSpacing || 0) : 0)
        - (windowInstances.length > 1 ? (windowInstances.length - 1) * (editableItem.pairRebate || 0) : 0);

    const maxOverallHeight = windowInstances.length > 0 ? Math.max(...windowInstances.map(inst => inst.overallHeight)) : 0;
    
    const strokeBaseScale = 800 / (totalOverallWidth || 800);
    const dynamicStrokeWidth = 2 / strokeBaseScale;
    const dynamicDashArray = `${6 / strokeBaseScale} ${3 / strokeBaseScale}`;
    
    const dynamicFontSize = 20;

    const viewBox = `-${PADDING * 1.5} -${PADDING * 2} ${totalOverallWidth + PADDING * 3} ${maxOverallHeight + PADDING * 3.5}`;
    
    const frameColor = materials.find(m => m.id === editableItem.externalFinishId)?.color || materials.find(m => m.id === editableItem.materialFrameId)?.color || '#D1B48C';
    const sashColor = materials.find(m => m.id === editableItem.externalFinishId)?.color || materials.find(m => m.id === editableItem.materialSashId)?.color || '#D3B48C';
    const cillColor = materials.find(m => m.id === editableItem.cillFinishId)?.color || materials.find(m => m.id === editableItem.materialCillId)?.color || '#8C6E54';
    const glassColor = '#e0f2fe';

    const handleSashClick = (sashId: string) => {
        if (isReadOnly) return;
        const instanceId = sashId.substring(0, sashId.lastIndexOf('-'));
        setActiveInstanceId(instanceId);
        setSelectedSashId(prev => prev === sashId ? null : sashId);
        setSelectedPaneId(null);
        setPopoverState(null);
    };

    const handlePaneClick = (paneId: string, instanceId: string) => {
      if (isReadOnly) return;
      const uniquePaneId = `${instanceId}-${paneId}`;
      setActiveInstanceId(instanceId);
      setSelectedPaneId(uniquePaneId);
      setPopoverState(null);
      const sashInPane = placedSashes.find(s => s.paneId === uniquePaneId);
      if(sashInPane) {
        setSelectedSashId(uniquePaneId);
      } else {
        setSelectedSashId(null);
      }
    };
    
    const handleDivisionClick = (e: React.MouseEvent, division: FrameDivision, instanceId: string) => {
        e.stopPropagation();
        if(isReadOnly) return;
        setActiveInstanceId(instanceId);
        setSelectedPaneId(null);
        setSelectedSashId(null);
        
        const designerRect = (e.currentTarget as SVGElement).closest('.designer-container')?.getBoundingClientRect();
        if (designerRect) {
            setPopoverState({ x: e.clientX - designerRect.left, y: e.clientY - designerRect.top, divisionId: division.id });
        }
    };
    
    const activeInstanceInnerWidth = Math.max(0, (activeInstance?.overallWidth || 0) - (outer.leftJamb + outer.rightJamb));
    const activeInstanceInnerHeight = Math.max(0, (activeInstance?.overallHeight || 0) - outer.head - outer.cill);
    
    const activeSash = placedSashes.find(s => s.paneId === selectedPaneId);
    
    const popoverDivision = popoverState ? 
        [...(editableItem.mullions || []), ...(editableItem.transoms || [])].find(d => d.id === popoverState.divisionId)
        : null;
        
    const getInitialBarsForSelectedSash = (): GlazingBar[] => {
        if (!selectedSashId) return [];
        
        if (itemType === 'Sash') {
            const instanceId = selectedSashId.substring(0, selectedSashId.lastIndexOf('-'));
            const sashType = selectedSashId.substring(selectedSashId.lastIndexOf('-') + 1);
            const instance = windowInstances.find(i => i.id === instanceId);
            if (!instance) return [];

            if (sashType === 'pair') return instance.topSashGlazingBars || [];
            return sashType === 'top' ? (instance.topSashGlazingBars || []) : (instance.bottomSashGlazingBars || []);
        } else {
            const sash = placedSashes.find(s => s.paneId === selectedSashId);
            return sash?.glazingBars || [];
        }
    };
        
    const uniqueSashPaneId = activeGlassPaneId ? activeGlassPaneId.split('-').slice(0, 3).join('-') : '';

    const filteredTemplates = (componentTemplates || []).filter(template => 
        template.applicableTo.includes(editableItem.itemType)
    );

    const frameSectionsPanel = (mode === 'quote' || mode === 'profile') && (
        <SidebarSection title="Frame Sections" isHighlighted={selectedPaneId === 'frame'}>
            {mode === 'quote' && (
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isNewFrame" checked={isNewFrame} onChange={e => updateItem(p=>({...p, isNewFrame: e.target.checked}))} disabled={isReadOnly} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"/>
                    <label htmlFor="isNewFrame" className="text-sm font-medium">New Frame</label>
                </div>
            )}
            <div className="grid grid-cols-3 gap-2">
                <PropertyInput label="Head" value={outer.head} onChange={e => handleProfileFrameChange('outer', 'head', e.target.value)} disabled={mode === 'quote' ? (!isNewFrame || isReadOnly) : isReadOnly} />
                <PropertyInput label="Jamb" value={outer.leftJamb} onChange={e => handleProfileFrameChange('outer', 'leftJamb', e.target.value)} disabled={mode === 'quote' ? (!isNewFrame || isReadOnly) : isReadOnly} />
                <PropertyInput label="Cill" value={outer.cill} onChange={e => handleProfileFrameChange('outer', 'cill', e.target.value)} disabled={mode === 'quote' ? (!isNewFrame || isReadOnly) : isReadOnly} />
            </div>
             <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t dark:border-gray-600">
                <PropertyInput
                    label="Rebate Width"
                    value={editableItem.frameInfo.rebateWidth || ''}
                    onChange={e => handleFrameInfoChange('rebateWidth', e.target.value)}
                    disabled={mode === 'quote' ? (!isNewFrame || isReadOnly) : isReadOnly}
                    placeholder="12"
                />
                <PropertyInput
                    label="Rebate Depth"
                    value={editableItem.frameInfo.rebateDepth || ''}
                    onChange={e => handleFrameInfoChange('rebateDepth', e.target.value)}
                    disabled={mode === 'quote' ? (!isNewFrame || isReadOnly) : isReadOnly}
                    placeholder="15"
                />
            </div>
        </SidebarSection>
    );

    const openingGlazingPanel = (mode === 'quote' || mode === 'profile') && (itemType === 'Casement' || itemType === 'Door' || itemType === 'Screen') && (
        <SidebarSection title="Opening & Glazing">
            <Select
                label="Opening Direction"
                value={editableItem.openingDirection}
                onChange={e => updateItem(p => ({ ...p, openingDirection: e.target.value as any }))}
                disabled={isReadOnly}
            >
                <option value="inward">Inward Opening</option>
                <option value="outward">Outward Opening</option>
            </Select>
            <Select
                label="Glazing Type"
                value={editableItem.glazingType}
                onChange={e => updateItem(p => ({ ...p, glazingType: e.target.value as any }))}
                disabled={isReadOnly}
            >
                <option value="internally">Internally Glazed</option>
                <option value="externally">Externally Glazed</option>
            </Select>
        </SidebarSection>
    );


    return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-gray-900 text-stone-900 dark:text-stone-100">
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex-1 flex items-center gap-4">
                 <button onClick={onCancel} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700">
                    <ArrowLeftIcon className="w-6 h-6 text-stone-600 dark:text-stone-300"/>
                </button>
                <h2 className="text-xl font-bold">{designerTitle}</h2>
            </div>

            <div className="flex-1 flex justify-center">
                {showNavigation && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => onNavigateItem('prev')}
                            disabled={isFirstItem}
                            icon={ChevronLeftIcon}
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-stone-300 dark:border-gray-600">
                            {currentIndex + 1} / {items.length}
                        </span>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => onNavigateItem('next')}
                            disabled={isLastItem}
                            icon={ChevronRightIcon}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 flex justify-end">
                <div className="flex items-center gap-4">
                    {mode === 'quote' && (
                        <div className="text-sm font-medium">
                            {itemToEdit ? `Editing Item #${itemToEdit.itemNumber}` : 'Creating New Item'}
                        </div>
                    )}
                    {!isReadOnly && <Button variant="primary" onClick={handleSave} icon={SaveIcon}>Save</Button>}
                </div>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-[256px_1fr_256px] min-h-0 overflow-hidden">
            {/* Left Sidebar: Properties */}
            <aside className="bg-white dark:bg-gray-800 p-4 flex flex-col border-r border-stone-200 dark:border-gray-700 overflow-y-auto">
                <div className="pr-2 -mr-4">
                    {mode === 'quote' && (
                        <SidebarSection title="Product Range">
                            <Select value={editableItem.productRangeId} onChange={e => handleRangeChange(e.target.value)} disabled={isReadOnly}>
                                <option value="">-- Select a Range --</option>
                                {productRanges
                                    .filter(r => r.itemType === editableItem.itemType)
                                    .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </Select>
                            <p className="text-xs text-stone-500 mt-2">Selecting a range will apply its default materials and section sizes.</p>
                        </SidebarSection>
                    )}
                    <SidebarSection>
                        {(mode === 'profile' || mode === 'component') && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium">Name</label>
                                    <Input type="text" value={editableItem.location} onChange={e => updateItem(p => ({...p, location: e.target.value}))} />
                                </div>
                                {mode === 'profile' && (
                                    <div>
                                        <label className="block text-sm font-medium">Product Range</label>
                                        <Select value={editableItem.productRangeId} onChange={e => handleRangeChange(e.target.value)}>
                                            <option value="">Custom</option>
                                            {productRanges
                                                .filter(r => r.itemType === editableItem.itemType)
                                                .map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </Select>
                                    </div>
                                )}
                                {mode === 'component' && (
                                    <div className="pt-2">
                                        <h4 className="font-semibold text-sm text-stone-500 dark:text-stone-400 border-b dark:border-gray-600 pb-1 mb-2">Applicability</h4>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">Select in which designers this component can be used.</p>
                                        <div className="space-y-2">
                                            {(['Sash', 'Casement', 'Door', 'Screen'] as const).map(type => (
                                                <Checkbox
                                                    key={type}
                                                    label={type}
                                                    checked={componentApplicability.includes(type)}
                                                    onChange={checked => handleApplicabilityChange(type, checked)}
                                                    disabled={isReadOnly}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {(mode === 'quote' || mode === 'profile' || mode === 'component') && (
                        <div className="flex items-center gap-2 bg-stone-100 dark:bg-gray-900 p-1 rounded-lg">
                            {windowInstances.map((inst, index) => (
                                <button key={inst.id} onClick={() => setActiveInstanceId(inst.id)} className={`relative flex-1 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeInstanceId === inst.id ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-stone-200 dark:hover:bg-gray-700/50'}`}>
                                    W{index+1}
                                    {windowInstances.length > 1 && <button onClick={(e) => { e.stopPropagation(); handleDeleteInstance(inst.id); }} disabled={isReadOnly} className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"><XMarkIcon className="w-3 h-3"/></button>}
                                </button>
                            ))}
                        </div>
                        )}
                        {activeInstance && <div className="grid grid-cols-2 gap-4">
                            <PropertyInput label="Overall Width" value={activeInstance.overallWidth} onChange={e => handleInstanceDimensionChange(activeInstance.id, 'overallWidth', parseInt(e.target.value) || 0)} disabled={isReadOnly}/>
                            <PropertyInput label="Overall Height" value={activeInstance.overallHeight} onChange={e => handleInstanceDimensionChange(activeInstance.id, 'overallHeight', parseInt(e.target.value) || 0)} disabled={isReadOnly}/>
                        </div>}
                    </SidebarSection>
                    
                    {frameSectionsPanel}
                    {openingGlazingPanel}

                    {(mode === 'profile' || mode === 'component') && (
                        <SidebarSection title="Default Component Sections">
                            <div className="space-y-4">
                                {mode === 'profile' && (
                                    <div>
                                        <h4 className="font-semibold text-sm text-stone-500 dark:text-stone-400 border-b dark:border-gray-600 pb-1 mb-2">Frame Sections</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <PropertyInput label="Head" value={editableItem.frameInfo.outer.head} onChange={e => handleProfileFrameChange('outer', 'head', e.target.value)} />
                                            <PropertyInput label="Jamb" value={editableItem.frameInfo.outer.leftJamb} onChange={e => handleProfileFrameChange('outer', 'leftJamb', e.target.value)} />
                                            <PropertyInput label="Cill" value={editableItem.frameInfo.outer.cill} onChange={e => handleProfileFrameChange('outer', 'cill', e.target.value)} />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-semibold text-sm text-stone-500 dark:text-stone-400 border-b dark:border-gray-600 pb-1 mb-2">Sash Sections</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <PropertyInput label="Top Rail" value={editableItem.sashInfo.head} onChange={e => handleProfileSashChange('head', e.target.value)} />
                                        <PropertyInput label="Stile" value={editableItem.sashInfo.stile} onChange={e => handleProfileSashChange('stile', e.target.value)} />
                                        {itemType === 'Sash' && (
                                            <PropertyInput label="Meeting Rail" value={editableItem.sashInfo.meetingStile} onChange={e => handleProfileSashChange('meetingStile', e.target.value)} />
                                        )}
                                        <PropertyInput label="Bottom Rail" value={editableItem.sashInfo.bottomRail} onChange={e => handleProfileSashChange('bottomRail', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>
                    )}
                    
                    {mode === 'quote' && (
                        <>
                            {itemType === 'Sash' ? (
                                <>
                                    <SidebarSection title="Top Sash" isHighlighted={selectedSashId?.endsWith('-top')}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <PropertyInput label="Top Rail" value={activeInstance?.topSashOverrides?.topRail ?? ''} placeholder={String(sashHead)} onChange={e => handleSashOverrideChange('top', 'topRail', e.target.value)} disabled={isReadOnly} />
                                            <PropertyInput label="Stile" value={activeInstance?.topSashOverrides?.stile ?? ''} placeholder={String(sashStile)} onChange={e => handleSashOverrideChange('top', 'stile', e.target.value)} disabled={isReadOnly} />
                                            <PropertyInput label="Meeting Rail" value={activeInstance?.topSashOverrides?.meetingRail ?? ''} placeholder={String(sashMeetingStile)} onChange={e => handleSashOverrideChange('top', 'meetingRail', e.target.value)} disabled={isReadOnly} />
                                        </div>
                                    </SidebarSection>
                                    <SidebarSection title="Bottom Sash" isHighlighted={selectedSashId?.endsWith('-bottom')}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <PropertyInput label="Meeting Rail" value={activeInstance?.bottomSashOverrides?.meetingRail ?? ''} placeholder={String(sashMeetingStile)} onChange={e => handleSashOverrideChange('bottom', 'meetingRail', e.target.value)} disabled={isReadOnly} />
                                            <PropertyInput label="Stile" value={activeInstance?.bottomSashOverrides?.stile ?? ''} placeholder={String(sashStile)} onChange={e => handleSashOverrideChange('bottom', 'stile', e.target.value)} disabled={isReadOnly} />
                                            <PropertyInput label="Bottom Rail" value={activeInstance?.bottomSashOverrides?.bottomRail ?? ''} placeholder={String(sashBottomRail)} onChange={e => handleSashOverrideChange('bottom', 'bottomRail', e.target.value)} disabled={isReadOnly} />
                                        </div>
                                    </SidebarSection>
                                </>
                            ) : (
                                <SidebarSection title="Default Sash Sections">
                                    <div className="grid grid-cols-3 gap-2">
                                        <PropertyInput label="Top/Head" value={editableItem.sashInfo.head} onChange={e => handleProfileSashChange('head', e.target.value)} disabled={isReadOnly} />
                                        <PropertyInput label="Stile" value={editableItem.sashInfo.stile} onChange={e => handleProfileSashChange('stile', e.target.value)} disabled={isReadOnly} />
                                        <PropertyInput label="Bottom" value={editableItem.sashInfo.bottomRail} onChange={e => handleProfileSashChange('bottomRail', e.target.value)} disabled={isReadOnly} />
                                    </div>
                                </SidebarSection>
                            )}
                        </>
                    )}
                    
                    {itemType === 'Sash' && mode !== 'component' && (
                        <SidebarSection title="Sash Settings">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="autoSplit" checked={isAutoSplit} onChange={e => setIsAutoSplit(e.target.checked)} disabled={isReadOnly} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"/>
                                <label htmlFor="autoSplit" className="text-sm font-medium">Auto-split Sash Height</label>
                            </div>
                            {activeInstance && <PropertyInput label="Top Sash Height" value={activeInstance.topSashHeight ?? ''} onChange={e => updateActiveInstance('topSashHeight', e.target.value === '' ? undefined : Number(e.target.value))} disabled={isAutoSplit || isReadOnly} placeholder={isAutoSplit ? 'Auto' : ''}/>}
                            <Select value={editableItem.sashOpening} onChange={e => updateItem(p=>({...p, sashOpening: e.target.value as any}))} disabled={isReadOnly}>
                                <option value="both">Both Sashes Slide</option>
                                <option value="top-fixed">Top Sash Fixed</option>
                                <option value="bottom-fixed">Bottom Sash Fixed</option>
                                <option value="both-fixed">Both Sashes Fixed</option>
                            </Select>
                        </SidebarSection>
                    )}

                    {mode !== 'component' && (
                        <>
                            <SidebarSection title="Glass">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Glazing Bar Type</label>
                                    <div className="flex gap-2 rounded-lg bg-stone-100 dark:bg-gray-700 p-1">
                                        <button onClick={() => updateItem(p=>({...p, glazingBarType: 'plant-on'}))} className={`flex-1 p-1 rounded-md text-sm font-semibold ${glazingBarType === 'plant-on' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}>Plant On</button>
                                        <button onClick={() => updateItem(p=>({...p, glazingBarType: 'true-bars'}))} className={`flex-1 p-1 rounded-md text-sm font-semibold ${glazingBarType === 'true-bars' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}>True Bars</button>
                                    </div>
                                    <p className="text-xs text-stone-500 dark:text-stone-400">
                                        {glazingBarType === 'plant-on'
                                            ? 'Decorative bars on a single glass unit. One glass spec per sash.'
                                            : 'Structural bars creating individual panes. Each pane can have a different glass spec.'
                                        }
                                    </p>
                                </div>
                                <PropertyInput label="Glazing Bar Thickness" value={glazingBarThickness} onChange={e => updateItem(p=>({...p, glazingBarThickness: Number(e.target.value)}))} disabled={isReadOnly}/>
                            </SidebarSection>
                            
                            <SidebarSection title="Finishes & Materials">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">Frame Material</label>
                                    <Select value={editableItem.materialFrameId} onChange={e => updateItem(p=>({...p, materialFrameId: e.target.value}))} className="mt-1" disabled={isReadOnly}>
                                        {timberMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">Sash Material</label>
                                    <Select value={editableItem.materialSashId} onChange={e => updateItem(p=>({...p, materialSashId: e.target.value}))} className="mt-1" disabled={isReadOnly}>
                                        {timberMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">Cill Material</label>
                                    <Select value={editableItem.materialCillId} onChange={e => updateItem(p=>({...p, materialCillId: e.target.value}))} className="mt-1" disabled={isReadOnly}>
                                        {cillMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">External Finish</label>
                                    <Select value={editableItem.externalFinishId} onChange={e => updateItem(p=>({...p, externalFinishId: e.target.value}))} className="mt-1" disabled={isReadOnly}>
                                        <option value="">-- No Finish --</option>
                                        {finishMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">Internal Finish</label>
                                    <Select value={editableItem.internalFinishId} onChange={e => updateItem(p=>({...p, internalFinishId: e.target.value}))} className="mt-1" disabled={isReadOnly}>
                                        <option value="">-- No Finish --</option>
                                        {finishMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">Cill Finish</label>
                                    <Select value={editableItem.cillFinishId} onChange={e => updateItem(p=>({...p, cillFinishId: e.target.value}))} className="mt-1" disabled={isReadOnly}>
                                        <option value="">-- No Finish --</option>
                                        {finishMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </Select>
                                </div>
                            </SidebarSection>

                            <SidebarSection title="Ironmongery">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">Hinges</label>
                                    <Input type="text" value={editableItem.ironmongery.hinges} onChange={e => updateItem(p=>({...p, ironmongery: {...p.ironmongery, hinges: e.target.value}}))} disabled={isReadOnly}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-300">Locking System (MPL)</label>
                                    <Input type="text" value={editableItem.ironmongery.mpls} onChange={e => updateItem(p=>({...p, ironmongery: {...p.ironmongery, mpls: e.target.value}}))} disabled={isReadOnly}/>
                                </div>
                            </SidebarSection>
                        </>
                    )}
                </div>
            </aside>

            {/* Center: Preview */}
            <main className="relative bg-stone-100 dark:bg-gray-800/20 min-w-0" onClick={() => { setSelectedPaneId(null); setPopoverState(null); }}>
                <div className="absolute inset-0 p-6">
                    <div className="designer-container relative w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-inner flex items-center justify-center">
                        {totalOverallWidth > 0 && maxOverallHeight > 0 && (
                            <svg
                                viewBox={viewBox}
                                className="max-w-full max-h-full"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                <defs><style>{`.dimension-text-outline { stroke: white; } .dark .dimension-text-outline { stroke: #2d3748; }`}</style></defs>
                                <g>
                                {(() => {
                                    let currentXOffset = 0;
                                    return windowInstances.map(instance => {
                                        const { overallWidth, overallHeight } = instance;
                                        const instanceX = currentXOffset;
                                        currentXOffset += overallWidth + (windowInstances.length > 1 ? (editableItem.pairSpacing || 0) - (editableItem.pairRebate || 0) : 0);
                                        const isActive = instance.id === activeInstanceId;
                                        
                                        const instanceInnerHeight = Math.max(0, overallHeight - F_HEAD - F_CILL);
                                        const instanceInnerWidth = Math.max(0, overallWidth - (F_JAMB * 2));
                                        
                                        const sashInnerWidth = overallWidth - (F_JAMB * 2);

                                        const ts_topRail = activeInstance?.topSashOverrides?.topRail ?? sashHead;
                                        const ts_stile = activeInstance?.topSashOverrides?.stile ?? sashStile;
                                        const ts_meetingRail = activeInstance?.topSashOverrides?.meetingRail ?? sashMeetingStile;

                                        const bs_bottomRail = activeInstance?.bottomSashOverrides?.bottomRail ?? sashBottomRail;
                                        const bs_stile = activeInstance?.bottomSashOverrides?.stile ?? sashStile;
                                        const bs_meetingRail = activeInstance?.bottomSashOverrides?.meetingRail ?? sashMeetingStile;

                                        const topSashH = instance.topSashHeight || (instanceInnerHeight + ts_topRail - bs_bottomRail) / 2;
                                        const bottomSashH = instanceInnerHeight - topSashH;

                                        const getStartEdge = (d: FrameDivision) => d.offset - (d.thickness || (d.type === 'mullion' ? outer.mullion : outer.transom)) / 2;
                                        const getEndEdge = (d: FrameDivision) => d.offset + (d.thickness || (d.type === 'mullion' ? outer.mullion : outer.transom)) / 2;
                                        
                                        const instanceMullions = (mullions || []).filter(d => d.instanceId === instance.id);
                                        const instanceTransoms = (transoms || []).filter(d => d.instanceId === instance.id);

                                        return (
                                            <g key={instance.id} transform={`translate(${instanceX}, 0)`} onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setActiveInstanceId(instance.id); 
                                                const instancePanes = calculatePanes(instanceInnerWidth, instanceInnerHeight, [...instanceMullions, ...instanceTransoms], { mullion: outer.mullion, transom: outer.transom });
                                                if (instancePanes.length === 1) {
                                                    handlePaneClick(instancePanes[0].id, instance.id);
                                                }
                                            }}>
                                                <g onClick={e => { e.stopPropagation(); setActiveInstanceId(instance.id); setSelectedPaneId('frame'); }} className="cursor-pointer">
                                                    {isNewFrame && (
                                                        <>
                                                            <rect x={0} y={0} width={overallWidth} height={outer.head} style={{ fill: frameColor }} stroke="none"/>
                                                            <rect x={0} y={outer.head} width={outer.leftJamb} height={instanceInnerHeight} style={{ fill: frameColor }} stroke="none"/>
                                                            <rect x={overallWidth - outer.rightJamb} y={outer.head} width={outer.rightJamb} height={instanceInnerHeight} style={{ fill: frameColor }} stroke="none"/>
                                                            <rect x={0} y={overallHeight - outer.cill} width={overallWidth} height={outer.cill} style={{ fill: cillColor }} stroke="none"/>
                                                        </>
                                                    )}
                                                </g>
                                                
                                                {itemType === 'Sash' ? (
                                                    <>
                                                        {/* Bottom Sash drawn first for overlap */}
                                                        <g transform={`translate(${F_JAMB}, ${F_HEAD + topSashH})`} onClick={e => {e.stopPropagation(); handleSashClick(`${instance.id}-bottom`);}} className="cursor-pointer">
                                                            <rect x={0} y={0} width={sashInnerWidth} height={bottomSashH} style={{ fill: sashColor }} stroke="black" strokeWidth={dynamicStrokeWidth * 0.5}/>
                                                            <g transform={`translate(${bs_stile}, ${bs_meetingRail})`}>
                                                                {(() => {
                                                                    const glassW = sashInnerWidth - bs_stile * 2;
                                                                    const glassH = bottomSashH - bs_meetingRail - bs_bottomRail;
                                                                    const glassPaneIdPrefix = `${instance.id}-bottom`;
                                                                    const glazingBars = instance.bottomSashGlazingBars;
                                                                    const panes = calculateSashPanes(glassW, glassH, glazingBars, glazingBarThickness);
                                                                    const singlePaneGlassTypeId = glazingBarType === 'plant-on' ? paneGlassTypes.find(p => p.paneId.startsWith(glassPaneIdPrefix))?.glassTypeId : undefined;
                                                                    const verticalBars = glazingBars?.filter(b => b.type === 'vertical') || [];
                                                                    const horizontalBars = glazingBars?.filter(b => b.type === 'horizontal') || [];
                                                                    const paneWidth = (glassW - verticalBars.length * glazingBarThickness) / (verticalBars.length + 1);
                                                                    const paneHeight = (glassH - horizontalBars.length * glazingBarThickness) / (horizontalBars.length + 1);

                                                                    return (<>
                                                                        {panes.map(pane => {
                                                                            const uniquePaneId = `${glassPaneIdPrefix}-${pane.id}`;
                                                                            const glassTypeId = glazingBarType === 'true-bars' ? paneGlassTypes.find(p => p.paneId === uniquePaneId)?.glassTypeId : singlePaneGlassTypeId;
                                                                            const glassType = glassMaterials.find(m => m.id === glassTypeId);
                                                                            const isToughened = glassType?.spec?.toLowerCase().includes('t');
                                                                            return (<g key={uniquePaneId}><rect x={pane.x} y={pane.y} width={pane.width} height={pane.height} style={{fill: glassType?.color || glassColor}} stroke="none" className={`cursor-pointer ${hoveredGlassPaneId === uniquePaneId || activeGlassPaneId === uniquePaneId ? 'opacity-80' : 'opacity-100'}`} onMouseEnter={() => !isReadOnly && setHoveredGlassPaneId(uniquePaneId)} onMouseLeave={() => setHoveredGlassPaneId(null)} onClick={e => { e.stopPropagation(); handleGlassPaneClick(uniquePaneId, instance.id); }} /><GlassLabel text={glassType?.name.split(' ')[0]} isToughened={isToughened} x={pane.x} y={pane.y} width={pane.width} height={pane.height} /></g>)
                                                                        })}
                                                                        {verticalBars.map((bar, i) => (<rect key={`v-bar-${i}`} x={(i + 1) * paneWidth + i * glazingBarThickness} y={0} width={glazingBarThickness} height={glassH} style={{ fill: sashColor }} stroke="none" />))}
                                                                        {horizontalBars.map((bar, i) => (<rect key={`h-bar-${i}`} x={0} y={(i + 1) * paneHeight + i * glazingBarThickness} width={glassW} height={glazingBarThickness} style={{ fill: sashColor }} stroke="none" />))}
                                                                    </>);
                                                                })()}
                                                            </g>
                                                            {editableItem.sashOpening !== 'bottom-fixed' && editableItem.sashOpening !== 'both-fixed' && <OpeningSashIndicator x={0} y={0} width={sashInnerWidth} height={bottomSashH} direction="up"/>}
                                                        </g>

                                                        {/* Top Sash */}
                                                        <g transform={`translate(${F_JAMB}, ${F_HEAD})`} onClick={e => { e.stopPropagation(); handleSashClick(`${instance.id}-top`); }} className="cursor-pointer">
                                                            <rect x="0" y="0" width={sashInnerWidth} height={topSashH} style={{ fill: sashColor }} stroke="black" strokeWidth={dynamicStrokeWidth * 0.5}/>
                                                            <g transform={`translate(${ts_stile}, ${ts_topRail})`}>
                                                                {(() => {
                                                                    const glassW = sashInnerWidth - ts_stile * 2;
                                                                    const glassH = topSashH - ts_topRail - ts_meetingRail;
                                                                    const glassPaneIdPrefix = `${instance.id}-top`;
                                                                    const glazingBars = instance.topSashGlazingBars;
                                                                    const panes = calculateSashPanes(glassW, glassH, glazingBars, glazingBarThickness);
                                                                    const singlePaneGlassTypeId = glazingBarType === 'plant-on' ? paneGlassTypes.find(p => p.paneId.startsWith(glassPaneIdPrefix))?.glassTypeId : undefined;
                                                                    const verticalBars = glazingBars?.filter(b => b.type === 'vertical') || [];
                                                                    const horizontalBars = glazingBars?.filter(b => b.type === 'horizontal') || [];
                                                                    const paneWidth = (glassW - verticalBars.length * glazingBarThickness) / (verticalBars.length + 1);
                                                                    const paneHeight = (glassH - horizontalBars.length * glazingBarThickness) / (horizontalBars.length + 1);
                                                                    
                                                                    return (<>
                                                                        {panes.map(pane => {
                                                                            const uniquePaneId = `${glassPaneIdPrefix}-${pane.id}`; 
                                                                            const glassTypeId = glazingBarType === 'true-bars' ? paneGlassTypes.find(p => p.paneId === uniquePaneId)?.glassTypeId : singlePaneGlassTypeId;
                                                                            const glassType = glassMaterials.find(m => m.id === glassTypeId);
                                                                            const isToughened = glassType?.spec?.toLowerCase().includes('t');

                                                                            return (<g key={uniquePaneId}><rect x={pane.x} y={pane.y} width={pane.width} height={pane.height} style={{fill: glassType?.color || glassColor}} stroke="none" className={`cursor-pointer ${hoveredGlassPaneId === uniquePaneId || activeGlassPaneId === uniquePaneId ? 'opacity-80' : 'opacity-100'}`} onMouseEnter={() => !isReadOnly && setHoveredGlassPaneId(uniquePaneId)} onMouseLeave={() => setHoveredGlassPaneId(null)} onClick={e => { e.stopPropagation(); handleGlassPaneClick(uniquePaneId, instance.id); }} /><GlassLabel text={glassType?.name.split(' ')[0]} isToughened={isToughened} x={pane.x} y={pane.y} width={pane.width} height={pane.height} /></g>)
                                                                        })}
                                                                        {verticalBars.map((bar, i) => (<rect key={`v-bar-${i}`} x={(i + 1) * paneWidth + i * glazingBarThickness} y={0} width={glazingBarThickness} height={glassH} style={{ fill: sashColor }} stroke="none" />))}
                                                                        {horizontalBars.map((bar, i) => (<rect key={`h-bar-${i}`} x={0} y={(i + 1) * paneHeight + i * glazingBarThickness} width={glassW} height={glazingBarThickness} style={{ fill: sashColor }} stroke="none" />))}
                                                                    </>);
                                                                })()}
                                                            </g>
                                                            {editableItem.sashOpening !== 'top-fixed' && editableItem.sashOpening !== 'both-fixed' && <OpeningSashIndicator x={0} y={0} width={sashInnerWidth} height={topSashH} direction="down"/>}
                                                        </g>
                                                        
                                                        {(selectedSashId === `${instance.id}-top` || selectedSashId === `${instance.id}-pair`) && <rect x={F_JAMB} y={F_HEAD} width={sashInnerWidth} height={topSashH} fill="none" stroke="blue" strokeWidth={dynamicStrokeWidth * 1.5} strokeDasharray={dynamicDashArray} className="pointer-events-none" />}
                                                        {(selectedSashId === `${instance.id}-bottom` || selectedSashId === `${instance.id}-pair`) && <rect x={F_JAMB} y={F_HEAD + topSashH} width={sashInnerWidth} height={bottomSashH} fill="none" stroke="blue" strokeWidth={dynamicStrokeWidth * 1.5} strokeDasharray={dynamicDashArray} className="pointer-events-none" />}
                                                    </>
                                                ) : (
                                                    // Casement / Door / Screen
                                                    <g transform={`translate(${F_JAMB}, ${F_HEAD})`}>
                                                         {[...instanceMullions, ...instanceTransoms].map(d => {
                                                            const thickness = d.thickness || (d.type === 'mullion' ? outer.mullion : outer.transom);
                                                            const startEdge = d.offset - thickness / 2;
                                                            const isSelected = popoverState?.divisionId === d.id;
                                                            if (d.type === 'mullion') {
                                                                const start = d.start ?? 0;
                                                                const end = d.end ?? innerHeight;
                                                                return <rect key={d.id} x={startEdge} y={start} width={thickness} height={end - start} fill={frameColor} stroke={isSelected ? 'blue' : 'none'} strokeWidth={isSelected ? dynamicStrokeWidth * 1.5 : 0} className="cursor-pointer" onClick={e => handleDivisionClick(e, d, instance.id)} />;
                                                            } else { // Transom
                                                                const start = d.start ?? 0;
                                                                const end = d.end ?? innerWidth;
                                                                return <rect key={d.id} x={start} y={startEdge} width={end - start} height={thickness} fill={frameColor} stroke={isSelected ? 'blue' : 'none'} strokeWidth={isSelected ? dynamicStrokeWidth * 1.5 : 0} className="cursor-pointer" onClick={e => handleDivisionClick(e, d, instance.id)} />;
                                                            }
                                                        })}
                                                        {calculatePanes(instanceInnerWidth, instanceInnerHeight, [...instanceMullions, ...instanceTransoms], { mullion: outer.mullion, transom: outer.transom }).map((pane) => {
                                                            const uniquePaneId = `${instance.id}-${pane.id}`;
                                                            const sashInPane = placedSashes.find(s => s.paneId === uniquePaneId);
                                                            const singlePaneGlassTypeId = paneGlassTypes.find(p => p.paneId === uniquePaneId)?.glassTypeId;
                                                            const glassType = glassMaterials.find(m => m.id === singlePaneGlassTypeId);

                                                            return (
                                                                <g key={pane.id} transform={`translate(${pane.x}, ${pane.y})`}
                                                                    onClick={e => { e.stopPropagation(); handlePaneClick(pane.id, instance.id); }}>
                                                                    {sashInPane ? (
                                                                        <>
                                                                            {sashInPane.type !== 'fixed-glazing' && <rect x="0" y="0" width={pane.width} height={pane.height} style={{fill: sashColor}} stroke="black" strokeWidth={dynamicStrokeWidth * 0.5}/>}
                                                                            <g transform={`translate(${sashInPane.type !== 'fixed-glazing' ? sashStile : 0}, ${sashInPane.type !== 'fixed-glazing' ? sashHead : 0})`}>
                                                                                {(() => {
                                                                                    const glassW = pane.width - (sashInPane.type !== 'fixed-glazing' ? sashStile * 2 : 0);
                                                                                    const glassH = pane.height - (sashInPane.type !== 'fixed-glazing' ? sashHead + sashBottomRail : 0);
                                                                                    const glassPaneIdPrefix = uniquePaneId;
                                                                                    const subPanes = calculateSashPanes(glassW, glassH, sashInPane.glazingBars, glazingBarThickness);
                                                                                    const plantOnGlassTypeId = glazingBarType === 'plant-on' ? paneGlassTypes.find(p => p.paneId === glassPaneIdPrefix)?.glassTypeId : undefined;
                                                                                    const verticalBars = sashInPane.glazingBars?.filter(b => b.type === 'vertical') || [];
                                                                                    const horizontalBars = sashInPane.glazingBars?.filter(b => b.type === 'horizontal') || [];
                                                                                    const subPaneWidth = (glassW - verticalBars.length * glazingBarThickness) / (verticalBars.length + 1);
                                                                                    const subPaneHeight = (glassH - horizontalBars.length * glazingBarThickness) / (horizontalBars.length + 1);

                                                                                    return (<>
                                                                                        {subPanes.map(subPane => {
                                                                                            const uniqueSubPaneId = `${glassPaneIdPrefix}-${subPane.id}`;
                                                                                            const trueBarGlassTypeId = glazingBarType === 'true-bars' ? paneGlassTypes.find(p => p.paneId === uniqueSubPaneId)?.glassTypeId : undefined;
                                                                                            const glassTypeId = plantOnGlassTypeId || trueBarGlassTypeId;
                                                                                            const subPaneGlassType = glassMaterials.find(m => m.id === glassTypeId);
                                                                                            const isToughened = subPaneGlassType?.spec?.toLowerCase().includes('t');
                                                                                            return (<g key={uniqueSubPaneId}><rect x={subPane.x} y={subPane.y} width={subPane.width} height={subPane.height} style={{fill: subPaneGlassType?.color || glassColor}} stroke="none" className={`cursor-pointer ${hoveredGlassPaneId === uniqueSubPaneId || activeGlassPaneId === uniqueSubPaneId ? 'opacity-80' : 'opacity-100'}`} onMouseEnter={() => !isReadOnly && setHoveredGlassPaneId(uniqueSubPaneId)} onMouseLeave={() => setHoveredGlassPaneId(null)} onClick={e => { e.stopPropagation(); handleGlassPaneClick(uniqueSubPaneId, instance.id); }} /><GlassLabel text={subPaneGlassType?.name.split(' ')[0]} isToughened={isToughened} x={subPane.x} y={subPane.y} width={subPane.width} height={subPane.height} /></g>)
                                                                                        })}
                                                                                        {verticalBars.map((b, i) => <rect key={`v-${i}`} x={(i + 1) * subPaneWidth + i * glazingBarThickness} y={0} width={glazingBarThickness} height={glassH} fill={sashColor} stroke="none" />)}
                                                                                        {horizontalBars.map((b, i) => <rect key={`h-${i}`} x={0} y={(i + 1) * subPaneHeight + i * glazingBarThickness} width={glassW} height={glazingBarThickness} fill={sashColor} stroke="none" />)}
                                                                                    </>);
                                                                                })()}
                                                                            </g>
                                                                            <HingeIndicator x={0} y={0} width={pane.width} height={pane.height} hingeSide={sashInPane.hingeSide} />
                                                                        </>
                                                                    ) : (
                                                                        <rect x="0" y="0" width={pane.width} height={pane.height} style={{fill: glassType?.color || glassColor}} stroke="none"/>
                                                                    )}
                                                                     {selectedPaneId === uniquePaneId && <rect x="0" y="0" width={pane.width} height={pane.height} fill="blue" fillOpacity="0.2" stroke="blue" strokeWidth={dynamicStrokeWidth * 1.5} className="pointer-events-none"/>}
                                                                </g>
                                                            )
                                                        })}
                                                    </g>
                                                )}

                                                 {isActive && <rect x={-2} y={-2} width={overallWidth+4} height={overallHeight+4} fill="none" stroke="blue" strokeWidth={dynamicStrokeWidth*2} strokeDasharray={dynamicDashArray} className="pointer-events-none" />}
                                                 
                                                 <>
                                                    {dimensionVisibility.frame && (
                                                        <>
                                                            <DimensionLine x={0} y={0} length={overallWidth} label={overallWidth} isVertical={false} offset={PADDING * 0.75} colorClass="text-blue-600 dark:text-blue-400" fontSize={dynamicFontSize} />
                                                            <DimensionLine x={0} y={0} length={overallHeight} label={overallHeight} isVertical={true} offset={PADDING * 0.75} colorClass="text-blue-600 dark:text-blue-400" fontSize={dynamicFontSize} />
                                                        </>
                                                    )}
                                                    {itemType === 'Sash' ? (
                                                        <>
                                                            {dimensionVisibility.sash && (
                                                                <>
                                                                    <DimensionLine x={F_JAMB} y={F_HEAD} length={sashInnerWidth} label={Math.round(sashInnerWidth)} isVertical={false} offset={PADDING * 0.66} colorClass="text-green-600 dark:text-green-400" fontSize={dynamicFontSize} />
                                                                    <DimensionLine x={F_JAMB} y={F_HEAD} length={topSashH} label={Math.round(topSashH)} isVertical={true} offset={PADDING * 0.66} colorClass="text-green-600 dark:text-green-400" fontSize={dynamicFontSize} />
                                                                    <DimensionLine x={F_JAMB} y={F_HEAD + topSashH} length={bottomSashH} label={Math.round(bottomSashH)} isVertical={true} offset={PADDING * 0.66} colorClass="text-green-600 dark:text-green-400" fontSize={dynamicFontSize} />
                                                                </>
                                                            )}
                                                            {dimensionVisibility.glass && (
                                                                <>
                                                                    <DimensionLine x={F_JAMB + ts_stile} y={F_HEAD + ts_topRail} length={sashInnerWidth - ts_stile * 2} label={Math.round(sashInnerWidth - ts_stile * 2)} isVertical={false} offset={PADDING * 0.33} colorClass="text-red-600 dark:text-red-400" fontSize={dynamicFontSize} />
                                                                    <DimensionLine x={F_JAMB + ts_stile} y={F_HEAD + ts_topRail} length={topSashH - ts_topRail - ts_meetingRail} label={Math.round(topSashH - ts_topRail - ts_meetingRail)} isVertical={true} offset={PADDING * 0.33} colorClass="text-red-600 dark:text-red-400" fontSize={dynamicFontSize} />
                                                                    <DimensionLine x={F_JAMB + bs_stile} y={F_HEAD + topSashH + bs_meetingRail} length={bottomSashH - bs_meetingRail - bs_bottomRail} label={Math.round(bottomSashH - bs_meetingRail - bs_bottomRail)} isVertical={true} offset={PADDING * 0.33} colorClass="text-red-600 dark:text-red-400" fontSize={dynamicFontSize} />
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                        calculatePanes(instanceInnerWidth, instanceInnerHeight, [...instanceMullions, ...instanceTransoms], { mullion: outer.mullion, transom: outer.transom }).map(pane => {
                                                            const uniquePaneId = `${instance.id}-${pane.id}`;
                                                            const sashInPane = placedSashes.find(s => s.paneId === uniquePaneId);
                                                            const paneX = F_JAMB + pane.x;
                                                            const paneY = F_HEAD + pane.y;

                                                            return (
                                                                <React.Fragment key={`dim-${pane.id}`}>
                                                                    {sashInPane ? (
                                                                        <>
                                                                            {dimensionVisibility.sash && (
                                                                                <>
                                                                                    <DimensionLine x={paneX} y={paneY} length={pane.width} label={Math.round(pane.width)} isVertical={false} offset={PADDING * 0.66} colorClass="text-green-600 dark:text-green-400" fontSize={dynamicFontSize} />
                                                                                    <DimensionLine x={paneX} y={paneY} length={pane.height} label={Math.round(pane.height)} isVertical={true} offset={PADDING * 0.66} colorClass="text-green-600 dark:text-green-400" fontSize={dynamicFontSize} />
                                                                                </>
                                                                            )}
                                                                            {dimensionVisibility.glass && (
                                                                                <>
                                                                                    <DimensionLine x={paneX + sashStile} y={paneY + sashHead} length={pane.width - sashStile*2} label={Math.round(pane.width - sashStile*2)} isVertical={false} offset={PADDING * 0.33} colorClass="text-red-600 dark:text-red-400" fontSize={dynamicFontSize} />
                                                                                    <DimensionLine x={paneX + sashStile} y={paneY + sashHead} length={pane.height - sashHead - sashBottomRail} label={Math.round(pane.height - sashHead - sashBottomRail)} isVertical={true} offset={PADDING * 0.33} colorClass="text-red-600 dark:text-red-400" fontSize={dynamicFontSize} />
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {dimensionVisibility.glass && (
                                                                                <>
                                                                                    <DimensionLine x={paneX} y={paneY} length={pane.width} label={Math.round(pane.width)} isVertical={false} offset={PADDING * 0.5} colorClass="text-red-600 dark:text-red-400" fontSize={dynamicFontSize} />
                                                                                    <DimensionLine x={paneX} y={paneY} length={pane.height} label={Math.round(pane.height)} isVertical={true} offset={PADDING * 0.5} colorClass="text-red-600 dark:text-red-400" fontSize={dynamicFontSize} />
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </React.Fragment>
                                                            )
                                                        })
                                                    )}
                                                </>
                                            </g>
                                        );
                                    })
                                })()}
                                </g>
                            </svg>
                        )}
                        {popoverState && popoverDivision && (() => {
                            const type = popoverDivision.type;
                            const isMullion = type === 'mullion';
                            
                            const innerWidth = activeInstanceInnerWidth;
                            const innerHeight = activeInstanceInnerHeight;
                            
                            const dimension = isMullion ? innerWidth : innerHeight;
                            const thickness = popoverDivision.thickness || (isMullion ? outer.mullion : outer.transom);

                            const popoverStartCoord = popoverDivision.start ?? 0;
                            const popoverEndCoord = popoverDivision.end ?? (isMullion ? innerHeight : innerWidth);
                            
                            const overlaps = (d: FrameDivision) => {
                                const dStart = d.start ?? 0;
                                const dEnd = d.end ?? (isMullion ? innerHeight : innerWidth);
                                return Math.max(popoverStartCoord, dStart) < Math.min(popoverEndCoord, dEnd);
                            };

                            const getStartEdge = (d: FrameDivision) => d.offset - (d.thickness || (isMullion ? editableItem.frameInfo.outer.mullion : editableItem.frameInfo.outer.transom)) / 2;
                            const getEndEdge = (d: FrameDivision) => d.offset + (d.thickness || (isMullion ? editableItem.frameInfo.outer.mullion : editableItem.frameInfo.outer.transom)) / 2;
                            
                            const allDivs = [...(editableItem.mullions || []), ...(editableItem.transoms || [])];
                            const popoverCenter = popoverDivision.offset;

                            const potentialNeighbors = allDivs
                                .filter(d => d.id !== popoverDivision.id && d.type === popoverDivision.type && overlaps(d));

                            const leftNeighbors = potentialNeighbors.filter(d => d.offset < popoverCenter);
                            const rightNeighbors = potentialNeighbors.filter(d => d.offset > popoverCenter);

                            const leftNeighborEdge = leftNeighbors.length > 0
                                ? Math.max(...leftNeighbors.map(getEndEdge))
                                : 0;
                                
                            const rightNeighborEdge = rightNeighbors.length > 0
                                ? Math.min(...rightNeighbors.map(getStartEdge))
                                : dimension;

                            const spaceToLeft = getStartEdge(popoverDivision) - leftNeighborEdge;
                            const spaceToRight = rightNeighborEdge - getEndEdge(popoverDivision);

                            return (
                                <div
                                    ref={popoverRef}
                                    className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-lg border dark:border-gray-700 p-4 w-64 space-y-3"
                                    style={{ left: `${popoverState.x + 10}px`, top: `${popoverState.y + 10}px` }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <h4 className="font-bold capitalize">{popoverDivision.type} Editor</h4>
                                    
                                    <div>
                                        <label className="text-xs font-medium">Offset from Neighbors</label>
                                        <div className="space-y-2 mt-1">
                                            <PropertyInput label={`From ${isMullion ? 'Left' : 'Top'}`} value={Math.round(spaceToLeft)} onChange={e => handleRelativeOffsetChange('start', e.target.value)} />
                                            <PropertyInput label={`From ${isMullion ? 'Right' : 'Bottom'}`} value={Math.round(spaceToRight)} onChange={e => handleRelativeOffsetChange('end', e.target.value)} />
                                        </div>
                                    </div>
                                    
                                    <PropertyInput label="Thickness" value={popoverDivision.thickness || ''} onChange={e => handleDivisionPropertyChange(popoverDivision.id, 'thickness', e.target.value === '' ? undefined : Number(e.target.value))} placeholder={String(popoverDivision.type === 'mullion' ? outer.mullion : outer.transom)} />
                                    <Button variant="danger" size="sm" onClick={handleDeleteDivision} className="w-full justify-center" icon={TrashIcon}>Delete</Button>
                                </div>
                            )
                        })()}
                    </div>
                </div>

            </main>

            {/* Right Sidebar: Tools */}
            <aside className="bg-white dark:bg-gray-800 p-4 flex flex-col border-l border-stone-200 dark:border-gray-700 overflow-hidden">
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center pb-4 border-b border-stone-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold">Design Tools</h3>
                        <Button variant="secondary" size="sm" onClick={handleUndo} icon={UndoIcon} disabled={history.length === 0 || isReadOnly} title="Undo last change" />
                    </div>
                </div>
                <div className="mt-4 pr-2 -mr-4 flex-grow overflow-y-auto">
                     <SidebarSection title="Dimension Visibility">
                        <div className="flex items-center space-x-4">
                            {mode !== 'component' &&
                                <Checkbox 
                                    label="Frame"
                                    checked={dimensionVisibility.frame}
                                    onChange={checked => setDimensionVisibility(v => ({...v, frame: checked}))}
                                />
                            }
                             <Checkbox 
                                label="Sash / Leaf"
                                checked={dimensionVisibility.sash}
                                onChange={checked => setDimensionVisibility(v => ({...v, sash: checked}))}
                            />
                             <Checkbox 
                               