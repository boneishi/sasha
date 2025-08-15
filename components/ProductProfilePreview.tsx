

import React from 'react';
import type { ProductProfile, Material, QuoteItem, ProductRange } from '../types';
import { QuoteItemDrawing } from './QuoteItemDrawing';

interface ProductProfilePreviewProps {
    profile: Omit<ProductProfile, 'id'>;
    materials: Material[];
    productRanges: ProductRange[];
}

export const ProductProfilePreview: React.FC<ProductProfilePreviewProps> = ({ profile, materials, productRanges }) => {
    const { defaultLayout } = profile;

    const instances = defaultLayout?.instances && defaultLayout.instances.length > 0
        ? defaultLayout.instances
        : [{ id: 'legacy-instance', overallWidth: 1200, overallHeight: 1500 }];

    const tempItem: QuoteItem = {
        id: 'preview-item',
        itemNumber: '0',
        quantity: 1,
        location: profile.name,
        itemType: profile.itemType,
        productRangeId: profile.productRangeId,
        viewType: 'External View',
        isNewFrame: true,
        isInstallation: false,
        installationLevel: 1,
        fitToPreparedOpening: false,
        materialSashId: profile.materialSashId,
        materialFrameId: profile.materialFrameId,
        materialCillId: profile.materialCillId,
        externalFinishId: profile.externalFinishId,
        internalFinishId: profile.internalFinishId,
        cillFinishId: profile.cillFinishId,
        windowInstances: instances,
        frameInfo: {
            thickness: profile.frameThickness,
            outer: {
                head: profile.outerHeadHeight,
                cill: profile.outerCillHeight,
                leftJamb: profile.outerLeftJambWidth,
                rightJamb: profile.outerRightJambWidth,
                transom: profile.outerTransomHeight,
                mullion: profile.outerMullionWidth
            },
            inner: {
                head: profile.innerHeightHeight,
                cill: profile.innerCillHeight,
                leftJamb: profile.innerLeftJambWidth,
                rightJamb: profile.innerRightJambWidth,
                transom: profile.innerTransomHeight,
                mullion: profile.innerMullionWidth
            }
        },
        sashInfo: {
            head: profile.topRailHeight,
            stile: profile.stileWidth,
            bottomRail: profile.bottomRailHeight,
            meetingStile: profile.meetingRailHeight,
            thickness: 56,
        },
        ironmongery: profile.ironmongery,
        openingDirection: profile.openingDirection,
        masterSash: 'Left',
        mullions: defaultLayout?.mullions,
        transoms: defaultLayout?.transoms,
        placedSashes: defaultLayout?.placedSashes,
        paneGlassTypes: [],
        glazingBarThickness: profile.glazingBarThickness,
        glazingBarType: 'plant-on',
        sashOpening: 'both',
        price: 0,
        photos: [],
    };
    
    return (
        <div className="w-full h-full bg-stone-100 dark:bg-gray-700/50 rounded-md flex items-center justify-center p-2">
            <QuoteItemDrawing item={tempItem} materials={materials} showDimensions={false} showHinges={true} />
        </div>
    );
};