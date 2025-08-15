import React, { useState } from 'react';
import type { Client, Quote, QuoteItem, Currency, Material, ProductRange, SystemSettings, FrameDivision, PlacedSash } from '../types';
import { QuoteStatus } from '../types';
import { QuotePreviewModal } from './QuotePreviewModal';
import { Modal } from './Modal';
import { ArrowLeftIcon, CalendarIcon, DownloadIcon, FileTextIcon, PencilIcon, PlusIcon, TrashIcon, SashWindowIcon, CasementWindowIcon, DoorIcon, ArrowRightCircleIcon, CameraIcon, SquaresPlusIcon, PaperAirplaneIcon, DocumentDuplicateIcon, InformationCircleIcon, ViewColumnsIcon, ChevronRightIcon } from './icons';
import { Button, Input } from './common';
import { getClientName } from '../utils';
import { QuoteItemDrawing } from './QuoteItemDrawing';

const ItemPreview: React.FC<{ item: QuoteItem; materials: Material[] }> = ({ item, materials }) => {
    return (
        <div className="w-full h-full bg-stone-100 dark:bg-gray-700 rounded-md flex items-center justify-center p-2 overflow-hidden">
           <QuoteItemDrawing item={item} materials={materials} />
        </div>
    );
};

const getStatusInfo = (status: string): { text: string; className: string } => {
  const baseClasses = "px-4 py-2 text-sm font-semibold rounded-lg shadow-sm cursor-default whitespace-nowrap";
  switch (status) {
    case QuoteStatus.NEW:
    case QuoteStatus.APPOINTMENT_BOOKED:
      return { text: 'Draft', className: `${baseClasses} bg-yellow-500 text-white` };
    case QuoteStatus.QUOTED:
      return { text: 'Quoted', className: `${baseClasses} bg-blue-500 text-white` };
    case QuoteStatus.FOLLOW_UP_1:
    case QuoteStatus.FOLLOW_UP_2:
      return { text: status, className: `${baseClasses} bg-orange-500 text-white` };
    case QuoteStatus.WON:
      return { text: 'Won', className: `${baseClasses} bg-green-600 text-white` };
    case QuoteStatus.LOST:
      return { text: 'Lost', className: `${baseClasses} bg-red-600 text-white` };
    case QuoteStatus.SURVEY:
      return { text: 'Survey', className: `${baseClasses} bg-purple-600 text-white` };
    case QuoteStatus.READY_FOR_PRODUCTION:
      return { text: 'Production', className: `${baseClasses} bg-indigo-600 text-white` };
    default:
      return { text: status, className: `${baseClasses} bg-gray-500 text-white` };
  }
};

export const QuoteBuilder: React.FC<{
    quote: Quote;
    client: Client;
    onUpdateQuote: (quote: Quote, showToast?: boolean) => void;
    onBack: () => void;
    assignedStaffName?: string;
    onAddItem: (itemType: 'Sash' | 'Casement' | 'Door' | 'Screen') => void;
    onEditItem: (itemId: string) => void;
    currency: Currency;
    materials: Material[];
    productRanges: ProductRange[];
    systemSettings: SystemSettings;
    onPublishQuote: (quoteId: string) => void;
    onCopyQuote: (quoteId: string) => void;
    isCopy?: boolean;
}> = ({ quote, client, onUpdateQuote, onBack, assignedStaffName, onAddItem, onEditItem, currency, materials, productRanges, systemSettings, onPublishQuote, onCopyQuote, isCopy }) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
    const [editingItemNumberId, setEditingItemNumberId] = useState<string | null>(null);
    const [editingItemNumberValue, setEditingItemNumberValue] = useState('');
    const [showCopyNotification, setShowCopyNotification] = useState(isCopy);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [uploadingForItem, setUploadingForItem] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    
    const isItemsLocked = quote.status !== QuoteStatus.NEW && quote.status !== QuoteStatus.APPOINTMENT_BOOKED;

    React.useEffect(() => {
        if (isCopy) {
            const timer = setTimeout(() => {
                setShowCopyNotification(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isCopy]);

    const handleCopyItem = (itemId: string) => {
        if (isItemsLocked) return;

        const itemToCopy = quote.items.find(i => i.id === itemId);
        const originalIndex = quote.items.findIndex(i => i.id === itemId);

        if (!itemToCopy) return;

        const newItem: QuoteItem = JSON.parse(JSON.stringify(itemToCopy));

        newItem.id = `item-${Date.now()}`;
        
        const numericRefs = quote.items.map(i => i.itemNumber).filter(ref => /^\d+$/.test(ref)).map(ref => parseInt(ref, 10));
        const maxNumber = numericRefs.length > 0 ? Math.max(...numericRefs) : 0;
        let newRef = String(maxNumber + 1);
        while (quote.items.some(i => i.itemNumber === newRef)) {
            newRef = String(parseInt(newRef, 10) + 1);
        }
        newItem.itemNumber = newRef;

        if (newItem.windowInstances && newItem.windowInstances.length > 0) {
            const newMullions: FrameDivision[] = [];
            const newTransoms: FrameDivision[] = [];
            const newPlacedSashes: PlacedSash[] = [];
            const newPaneGlassTypes: { paneId: string; glassTypeId: string; }[] = [];

            const originalInstances = [...newItem.windowInstances];
            const firstOriginalInstanceId = originalInstances[0].id;

            const newInstances = originalInstances.map(instance => {
                const oldInstanceId = instance.id;
                const newInstanceId = `inst-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                (itemToCopy.mullions || []).filter(m => (m.instanceId || firstOriginalInstanceId) === oldInstanceId).forEach(m => {
                    newMullions.push({ ...m, id: `m-q-${Date.now()}-${Math.random().toString(36).substring(2,9)}`, instanceId: newInstanceId });
                });
                
                (itemToCopy.transoms || []).filter(t => (t.instanceId || firstOriginalInstanceId) === oldInstanceId).forEach(t => {
                    newTransoms.push({ ...t, id: `t-q-${Date.now()}-${Math.random().toString(36).substring(2,9)}`, instanceId: newInstanceId });
                });

                (itemToCopy.placedSashes || []).filter(s => s.paneId.startsWith(oldInstanceId)).forEach(sash => {
                    const newSash = JSON.parse(JSON.stringify(sash));
                    newSash.paneId = newSash.paneId.replace(oldInstanceId, newInstanceId);
                    if (newSash.glazingBars) {
                        newSash.glazingBars = newSash.glazingBars.map((bar: any) => ({ ...bar, id: `gb-q-${Date.now()}-${Math.random().toString(36).substring(2,9)}` }));
                    }
                    newPlacedSashes.push(newSash);
                });

                (itemToCopy.paneGlassTypes || []).filter(pgt => pgt.paneId.startsWith(oldInstanceId)).forEach(pgt => {
                    newPaneGlassTypes.push({ ...pgt, paneId: pgt.paneId.replace(oldInstanceId, newInstanceId) });
                });
                
                const newInstanceData = { ...instance, id: newInstanceId };
                if(newInstanceData.topSashGlazingBars) {
                    newInstanceData.topSashGlazingBars = newInstanceData.topSashGlazingBars.map(bar => ({...bar, id: `gb-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}));
                }
                if(newInstanceData.bottomSashGlazingBars) {
                    newInstanceData.bottomSashGlazingBars = newInstanceData.bottomSashGlazingBars.map(bar => ({...bar, id: `gb-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}));
                }

                return newInstanceData;
            });
            
            newItem.windowInstances = newInstances;
            newItem.mullions = newMullions;
            newItem.transoms = newTransoms;
            newItem.placedSashes = newPlacedSashes;
            newItem.paneGlassTypes = newPaneGlassTypes;
        }
        
        const newItems = [...quote.items];
        newItems.splice(originalIndex + 1, 0, newItem);
        onUpdateQuote({ ...quote, items: newItems }, false);
    };

    const handleDeleteItem = (itemId: string) => {
        if (isItemsLocked) return;
        const updatedItems = quote.items.filter(i => i.id !== itemId);
        onUpdateQuote({ ...quote, items: updatedItems });
    };

    const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isItemsLocked) return;
        onUpdateQuote({ ...quote, projectReference: e.target.value });
    };

    const handleLocationChange = (itemId: string, newLocation: string) => {
        if (isItemsLocked) return;
        const updatedItems = quote.items.map(i =>
            i.id === itemId ? { ...i, location: newLocation } : i
        );
        onUpdateQuote({ ...quote, items: updatedItems });
    };

    const handleItemNumberChange = (itemId: string, newRef: string) => {
        if (isItemsLocked) return;
        const trimmedRef = newRef.trim();
    
        if (trimmedRef.length === 0 || trimmedRef.length > 6) {
            console.error('Reference must be between 1 and 6 characters.');
            setEditingItemNumberId(null);
            return;
        }
    
        const validChars = /^[a-zA-Z0-9.]+$/;
        if (!validChars.test(trimmedRef)) {
            console.error('Reference can only contain letters, numbers, and periods.');
            setEditingItemNumberId(null);
            return;
        }

        const isDuplicate = quote.items.some(i => i.id !== itemId && i.itemNumber.toLowerCase() === trimmedRef.toLowerCase());
        if (isDuplicate) {
            console.error('This reference already exists.');
            setEditingItemNumberId(null);
            return;
        }
    
        const updatedItems = quote.items.map(i =>
            i.id === itemId ? { ...i, itemNumber: trimmedRef } : i
        );
        
        updatedItems.sort((a, b) => a.itemNumber.localeCompare(b.itemNumber, undefined, { numeric: true, sensitivity: 'base' }));
        
        onUpdateQuote({ ...quote, items: updatedItems });
        setEditingItemNumberId(null);
    };
    
    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        if (isItemsLocked) return;
        const qty = Math.max(1, newQuantity); // Quantity can't be less than 1
        const updatedItems = quote.items.map(i =>
            i.id === itemId ? { ...i, quantity: qty } : i
        );
        onUpdateQuote({ ...quote, items: updatedItems });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && uploadingForItem) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const newPhoto = { name: file.name, dataUrl: reader.result as string };
                const updatedItems = quote.items.map(item =>
                    item.id === uploadingForItem ? { ...item, photos: [...(item.photos || []), newPhoto] } : item
                );
                onUpdateQuote({ ...quote, items: updatedItems });
            };
            reader.readAsDataURL(file);
        }
        setUploadingForItem(null);
        if(e.target) e.target.value = '';
    };

    const handleDeletePhoto = (itemId: string, photoIndex: number) => {
        if (isItemsLocked) return;
        const updatedItems = quote.items.map(item => {
            if (item.id === itemId) {
                const updatedPhotos = [...(item.photos || [])];
                updatedPhotos.splice(photoIndex, 1);
                return { ...item, photos: updatedPhotos };
            }
            return item;
        });
        onUpdateQuote({ ...quote, items: updatedItems });
    };
    
    const subtotal = quote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    
    const formatCurrency = (value: number) => {
        return value.toLocaleString(undefined, { style: 'currency', currency });
    };

    const ActionButton: React.FC<{
        icon: React.ElementType,
        label: string,
        onClick: () => void,
        primary?: boolean,
        disabled?: boolean,
    }> = ({ icon: Icon, label, onClick, primary = false, disabled = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center text-center p-6 gap-3 rounded-lg border-2 transition-all ${primary ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white dark:bg-gray-700 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-700 dark:hover:text-blue-400'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Icon className="w-12 h-12"/>
            <span className="font-semibold">{label}</span>
        </button>
    );
    
    const FooterButton: React.FC<{
        icon: React.ElementType,
        label: string,
        onClick: () => void,
        disabled?: boolean,
    }> = ({ icon: Icon, label, onClick, disabled = false }) => (
        <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 text-stone-700 dark:text-stone-200 font-semibold rounded-md hover:bg-stone-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
            <Icon className="w-4 h-4"/>
            {label}
        </button>
    );

    const defaultProjectReference = client.installationAddress?.line1 || client.officeAddress.line1 || 'Project Reference...';
    const statusInfo = getStatusInfo(quote.status);
    const getMaterialName = (id?: string) => materials.find(m => m.id === id)?.name;

    const SpecRow: React.FC<{ label: string, value?: string | number }> = ({ label, value }) => (
        <div>
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</span>
            <p className="font-semibold">{value || 'N/A'}</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-gray-900">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={isItemsLocked}/>
            {/* Header */}
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-stone-200 dark:border-gray-700 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700">
                             <ArrowLeftIcon className="w-6 h-6 text-stone-600 dark:text-stone-300"/>
                        </button>
                        <div>
                             <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">Quote Builder</h1>
                             <p className="text-sm text-stone-500 dark:text-stone-400">
                                For <span className="font-medium text-stone-700 dark:text-stone-200">{getClientName(client)}</span>
                                {assignedStaffName && <span className="text-stone-400 dark:text-stone-500 mx-1">|</span>}
                                {assignedStaffName && `Managed by: ${assignedStaffName}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                            <FileTextIcon className="w-5 h-5"/>
                            <span className="font-medium">{quote.quoteNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                             <PencilIcon className="w-5 h-5 text-stone-400 dark:text-stone-500"/>
                             <input
                                type="text"
                                value={quote.projectReference || ''}
                                onChange={handleReferenceChange}
                                disabled={isItemsLocked}
                                placeholder={defaultProjectReference}
                                className="font-medium bg-transparent border-b border-stone-200 dark:border-gray-600 focus:border-blue-500 focus:outline-none p-1 disabled:bg-stone-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed disabled:border-transparent"
                            />
                        </div>
                         <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                            <CalendarIcon className="w-5 h-5"/>
                            <span className="font-medium">{new Date(quote.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-grow p-8 overflow-y-auto">
                <div className="max-w-full mx-auto">
                    {showCopyNotification && (
                         <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-800 dark:text-green-200 p-4 rounded-md mb-6" role="alert">
                            <div className="flex">
                                <div className="py-1"><InformationCircleIcon className="h-6 w-6 text-green-500 mr-4" /></div>
                                <div>
                                    <p className="font-bold">This is a new copy of a quote.</p>
                                    <p className="text-sm">You can now edit the items below before publishing.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {isItemsLocked && !isCopy && (
                         <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-md mb-6" role="alert">
                            <div className="flex">
                                <div className="py-1"><InformationCircleIcon className="h-6 w-6 text-blue-500 mr-4" /></div>
                                <div>
                                    <p className="font-bold">This quote is published and read-only.</p>
                                    <p className="text-sm">To make changes, create a new version using the "Copy Quote" button.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {quote.items.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm min-w-[1600px]">
                                    <thead className="bg-stone-50 dark:bg-gray-700/50 text-xs uppercase">
                                        <tr>
                                            <th className="p-3 w-12">&nbsp;</th>
                                            <th className="p-3">Ref</th>
                                            <th className="p-3">Room / Location</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Range</th>
                                            <th className="p-3">Timbers</th>
                                            <th className="p-3">Glass</th>
                                            <th className="p-3">Security</th>
                                            <th className="p-3">Finishes</th>
                                            <th className="p-3">Ironmongery</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 w-32 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-200 dark:divide-gray-700">
                                        {quote.items.map(item => {
                                            const rangeName = productRanges.find(r => r.id === item.productRangeId)?.name || 'Custom';
                                            const glassNames = [...new Set(item.paneGlassTypes.map(p => getMaterialName(p.glassTypeId)))].join(', ');
                                            const isExpanded = expandedItemId === item.id;
                                            return (
                                                <React.Fragment key={item.id}>
                                                    <tr onClick={() => setExpandedItemId(prev => prev === item.id ? null : item.id)} className="hover:bg-stone-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                                        <td className="p-3 text-center text-stone-400"><ChevronRightIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} /></td>
                                                        <td className="p-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                             {editingItemNumberId === item.id ? <Input type="text" value={editingItemNumberValue} onChange={e => setEditingItemNumberValue(e.target.value)} onBlur={() => handleItemNumberChange(item.id, editingItemNumberValue)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} maxLength={6} autoFocus className="p-1 rounded bg-white dark:bg-gray-900 border border-blue-500 text-sm font-semibold focus:outline-none w-24" /> : <span onClick={() => { if (!isItemsLocked) { setEditingItemNumberId(item.id); setEditingItemNumberValue(item.itemNumber); } }} className={`p-1 rounded relative group ${!isItemsLocked ? 'cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/50' : ''}`}>{item.itemNumber} {!isItemsLocked && <PencilIcon className="w-3 h-3 absolute -top-1 -right-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}</span>}
                                                        </td>
                                                        <td className="p-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>{editingLocationId === item.id ? <Input type="text" value={item.location} onChange={e => handleLocationChange(item.id, e.target.value)} onBlur={() => setEditingLocationId(null)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} autoFocus className="p-1 rounded bg-white dark:bg-gray-900 border border-blue-500 text-sm font-semibold focus:outline-none" /> : <span onClick={() => !isItemsLocked && editingLocationId !== item.id && setEditingLocationId(item.id)} className={`p-1 rounded relative group ${!isItemsLocked ? 'cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/50' : ''}`}>{item.location || 'Click to add'} {!isItemsLocked && <PencilIcon className="w-3 h-3 absolute -top-1 -right-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}</span>}</td>
                                                        <td className="p-3 whitespace-nowrap">{item.itemType}</td>
                                                        <td className="p-3 whitespace-nowrap">{rangeName}</td>
                                                        <td className="p-3 whitespace-nowrap text-xs"><div>{getMaterialName(item.materialFrameId)} / {getMaterialName(item.materialSashId)}</div></td>
                                                        <td className="p-3 whitespace-nowrap truncate max-w-xs">{glassNames || 'N/A'}</td>
                                                        <td className="p-3 whitespace-nowrap">{item.ironmongery.mpls}</td>
                                                        <td className="p-3 whitespace-nowrap text-xs"><div>Ext: {getMaterialName(item.externalFinishId)} / Int: {getMaterialName(item.internalFinishId)}</div></td>
                                                        <td className="p-3 whitespace-nowrap">{item.ironmongery.hinges}</td>
                                                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}><Input type="number" value={item.quantity} onChange={e => handleQuantityChange(item.id, parseInt(e.target.value) || 1)} disabled={isItemsLocked} className="w-16 text-center p-1 text-sm font-semibold disabled:bg-stone-100 dark:disabled:bg-gray-800/50" min="1" /></td>
                                                        <td className="p-3 text-right whitespace-nowrap font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                                                        <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end">
                                                                <button onClick={() => onEditItem(item.id)} className="p-2 text-stone-500 dark:text-stone-400 hover:text-blue-600 dark:hover:text-blue-400" title="Edit Item"><PencilIcon className="w-5 h-5" /></button>
                                                                <button onClick={() => handleCopyItem(item.id)} disabled={isItemsLocked} className="p-2 text-stone-500 dark:text-stone-400 hover:text-green-600 dark:hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed" title="Copy Item"><DocumentDuplicateIcon className="w-5 h-5" /></button>
                                                                <button onClick={() => handleDeleteItem(item.id)} disabled={isItemsLocked} className="p-2 text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed" title="Delete Item"><TrashIcon className="w-5 h-5" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="bg-stone-50 dark:bg-gray-900/50">
                                                            <td colSpan={13} className="p-4">
                                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                                                    <div className="lg:col-span-3"><div className="w-full h-64"><ItemPreview item={item} materials={materials} /></div></div>
                                                                    <div className="lg:col-span-5">
                                                                        <h4 className="text-sm font-semibold text-stone-600 dark:text-stone-300 mb-2">Specifications</h4>
                                                                        <div className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                                                                            <SpecRow label="Frame Material" value={getMaterialName(item.materialFrameId)} />
                                                                            <SpecRow label="Sash Material" value={getMaterialName(item.materialSashId)} />
                                                                            <SpecRow label="Cill Material" value={getMaterialName(item.materialCillId)} />
                                                                            <SpecRow label="Glass" value={glassNames} />
                                                                            <SpecRow label="External Finish" value={getMaterialName(item.externalFinishId)} />
                                                                            <SpecRow label="Internal Finish" value={getMaterialName(item.internalFinishId)} />
                                                                            <SpecRow label="Ironmongery" value={item.ironmongery.mpls} />
                                                                            <SpecRow label="U-Value" value={item.calculatedUValue ? `${item.calculatedUValue.toFixed(2)} W/m²K` : 'N/A'} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="lg:col-span-4 space-y-4">
                                                                        <div>
                                                                            <h4 className="text-sm font-semibold text-stone-600 dark:text-stone-300 mb-2">Notes</h4>
                                                                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 text-center text-sm text-stone-400 italic">
                                                                                Placeholders for Pricing Breakdown, Salesman & Health/Safety Notes.
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <h4 className="text-sm font-semibold text-stone-600 dark:text-stone-300">Photos</h4>
                                                                                <button onClick={() => { setUploadingForItem(item.id); fileInputRef.current?.click(); }} disabled={isItemsLocked} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-md hover:bg-stone-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><CameraIcon className="w-4 h-4"/> Add Photo</button>
                                                                            </div>
                                                                            <div className="mt-2 grid grid-cols-3 gap-2">
                                                                                {(item.photos || []).map((photo, index) => (
                                                                                    <div key={index} className="relative group aspect-square">
                                                                                        <img src={photo.dataUrl} alt={`Item photo ${index + 1}`} className="w-full h-full object-cover rounded-md"/>
                                                                                        <button onClick={() => handleDeletePhoto(item.id, index)} disabled={isItemsLocked} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"><TrashIcon className="w-4 h-4"/></button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            {(item.photos || []).length === 0 && <div className="aspect-square flex items-center justify-center text-xs text-stone-400 dark:text-stone-500 w-full text-center p-2 border-2 border-dashed rounded-lg mt-2">No photos for this item.</div>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-stone-300 dark:border-gray-600 rounded-lg">
                            <FileTextIcon className="w-12 h-12 mx-auto text-stone-400 dark:text-stone-500" />
                            <h3 className="mt-2 text-lg font-medium text-stone-800 dark:text-stone-100">Your quote is empty</h3>
                            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Select a product type to get started.</p>
                             <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto">
                                <ActionButton icon={SashWindowIcon} label="Sash Window" onClick={() => onAddItem('Sash')} disabled={isItemsLocked}/>
                                <ActionButton icon={CasementWindowIcon} label="Casement Window" onClick={() => onAddItem('Casement')} disabled={isItemsLocked}/>
                                <ActionButton icon={DoorIcon} label="Door" onClick={() => onAddItem('Door')} disabled={isItemsLocked}/>
                                <ActionButton icon={ViewColumnsIcon} label="Screen" onClick={() => onAddItem('Screen')} disabled={isItemsLocked}/>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            {/* Footer */}
            <footer className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 border-t border-stone-200 dark:border-gray-700 shadow-inner z-10">
                 <div className="max-w-full mx-auto flex justify-between items-center relative">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Add new:</span>
                        <FooterButton icon={SashWindowIcon} label="Sash" onClick={() => onAddItem('Sash')} disabled={isItemsLocked}/>
                        <FooterButton icon={CasementWindowIcon} label="Casement" onClick={() => onAddItem('Casement')} disabled={isItemsLocked}/>
                        <FooterButton icon={DoorIcon} label="Door" onClick={() => onAddItem('Door')} disabled={isItemsLocked}/>
                        <FooterButton icon={ViewColumnsIcon} label="Screen" onClick={() => onAddItem('Screen')} disabled={isItemsLocked}/>
                    </div>
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className={statusInfo.className}>
                            {statusInfo.text}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-stone-600 dark:text-stone-300">Subtotal: {formatCurrency(subtotal)}</div>
                            <div className="text-xl font-bold text-stone-800 dark:text-stone-100">Total: {formatCurrency(total)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isItemsLocked ? (
                                <Button variant="primary" onClick={() => onCopyQuote(quote.id)} icon={DocumentDuplicateIcon}>
                                    Copy Quote
                                </Button>
                            ) : (
                                <Button variant="primary" onClick={() => onPublishQuote(quote.id)} icon={PaperAirplaneIcon} disabled={quote.items.length === 0}>
                                    Publish Quote
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => setIsPreviewOpen(true)} disabled={quote.items.length === 0} icon={DownloadIcon}>
                                Preview PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </footer>

            <QuotePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                quote={quote}
                client={client}
                currency={currency}
                materials={materials}
                productRanges={productRanges}
                systemSettings={systemSettings}
            />
            
        </div>
    );
};