import React from 'react';
import type { ComponentTemplate, QuoteItem } from '../types';
import { QuoteItemDrawing } from './QuoteItemDrawing';

export const ComponentTemplatePreview: React.FC<{ template: ComponentTemplate }> = ({ template }) => {
    
    const instances = template.layout?.instances && template.layout.instances.length > 0
        ? template.layout.instances
        : [{ id: 'preview-instance', overallWidth: 1200, overallHeight: 1500 }];

    const tempItem: QuoteItem = {
        id: 'preview-component',
        itemNumber: '0',
        quantity: 1,
        location: template.name,
        itemType: template.itemType,
        productRangeId: '',
        viewType: 'External View',
        isNewFrame: false,
        isInstallation: false,
        installationLevel: 1,
        fitToPreparedOpening: false,
        materialSashId: '', materialFrameId: '', materialCillId: '',
        windowInstances: instances,
        frameInfo: { thickness: 70, outer: { head: 70, cill: 70, leftJamb: 70, rightJamb: 70, transom: 70, mullion: 70 }, inner: { head: 70, cill: 70, leftJamb: 70, rightJamb: 70, transom: 70, mullion: 70 } },
        sashInfo: template.sashInfo,
        ironmongery: { hinges: '', mpls: ''},
        openingDirection: 'outward', masterSash: 'Left',
        mullions: template.layout.mullions,
        transoms: template.layout.transoms,
        placedSashes: template.layout.placedSashes,
        paneGlassTypes: [],
        glazingBarThickness: 25,
        glazingBarType: 'plant-on',
        sashOpening: 'both',
        price: 0,
    };
    
    return (
        <div className="w-full h-full bg-stone-100 dark:bg-gray-700/50 rounded-t-lg flex items-center justify-center p-2">
            <QuoteItemDrawing item={tempItem} materials={[]} showDimensions={false} showHinges={true} />
        </div>
    );
};