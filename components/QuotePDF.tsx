import React from 'react';
import type { Quote, Client, Currency, Material, QuoteItem, ProductRange, SystemSettings } from '../types';
import { getClientName, formatAddress } from '../utils';
import { CURRENCY_SYMBOLS } from '../constants';
import { QuoteItemDrawing } from './QuoteItemDrawing';

interface QuotePDFProps {
    quote: Quote;
    client: Client;
    currency: Currency;
    materials: Material[];
    productRanges: ProductRange[];
    systemSettings: SystemSettings;
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ quote, client, currency, materials, productRanges, systemSettings }) => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatCurrency = (val: number) => `${symbol}${val.toFixed(2)}`;

    const getMaterialName = (id?: string) => materials.find(m => m.id === id)?.name;

    const subtotal = quote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const clientDisplayName = getClientName(client);
    const primaryContact = client.contacts.find(c => c.isPrimary);

    return (
        <div className="bg-white text-black p-12 font-sans text-[10pt] leading-normal shadow-lg w-[210mm] min-h-[297mm] mx-auto">
            {/* Header */}
            <header className="flex justify-between items-start pb-8 border-b">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">QUOTE</h1>
                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                        <p><strong>Quote Number:</strong> {quote.quoteNumber}</p>
                        <p><strong>Date:</strong> {new Date(quote.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold">{systemSettings.companyName || 'Sash Style Pro'}</h2>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                        {systemSettings.companyAddress ? formatAddress(systemSettings.companyAddress) : '123 Window Lane, Design City, DC 45678'}
                    </p>
                     <p className="text-sm text-gray-600">{[systemSettings.companyEmail, systemSettings.companyPhone].filter(Boolean).join(' | ')}</p>
                </div>
            </header>

            {/* Client Info */}
            <section className="my-8 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Billed To</h3>
                    <div className="text-sm">
                        <p className="font-bold">{clientDisplayName}</p>
                        {primaryContact && <p>{`${primaryContact.firstName} ${primaryContact.lastName}`}</p>}
                        <p className="whitespace-pre-line">{formatAddress(client.officeAddress)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Installation Address</h3>
                    <div className="text-sm">
                        <p className="font-bold">{quote.projectReference || client.installationAddress?.line1 || client.officeAddress.line1}</p>
                        <p className="whitespace-pre-line">{client.installationAddress ? formatAddress(client.installationAddress) : formatAddress(client.officeAddress)}</p>
                    </div>
                </div>
            </section>

            {/* Items */}
            <section className="space-y-6">
                {quote.items.map(item => (
                    <div key={item.id} className="border-t pt-4 grid grid-cols-5 gap-4">
                        <div className="col-span-1">
                            <div className="w-full h-32 bg-gray-100 rounded">
                                 <QuoteItemDrawing item={item} materials={materials} showDimensions={false} />
                            </div>
                        </div>
                        <div className="col-span-4">
                            <h4 className="font-bold text-lg">Item #{item.itemNumber}: {item.location}</h4>
                            <div className="text-xs grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-gray-600">
                                <p><strong>Product:</strong> {productRanges.find(r => r.id === item.productRangeId)?.name}</p>
                                <p><strong>Dimensions:</strong> {item.windowInstances.map(inst => `${inst.overallWidth}mm x ${inst.overallHeight}mm`).join(' | ')}</p>
                                <p><strong>Frame:</strong> {getMaterialName(item.materialFrameId)}</p>
                                <p><strong>Sash:</strong> {getMaterialName(item.materialSashId)}</p>
                                <p><strong>External Finish:</strong> {getMaterialName(item.externalFinishId)}</p>
                                <p><strong>Internal Finish:</strong> {getMaterialName(item.internalFinishId)}</p>
                                <p><strong>Glass:</strong> {item.paneGlassTypes.length > 0 ? getMaterialName(item.paneGlassTypes[0].glassTypeId) : 'N/A'}</p>
                                <p><strong>U-Value:</strong> {item.calculatedUValue ? `${item.calculatedUValue.toFixed(2)} W/m²K` : 'N/A'}</p>
                            </div>
                            <div className="mt-2 text-right flex justify-end items-baseline gap-6 border-t pt-2">
                                <p>{formatCurrency(item.price)} x {item.quantity}</p>
                                <p className="font-bold text-lg">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Totals */}
            <section className="mt-8 flex justify-end">
                <div className="w-1/2">
                    <div className="flex justify-between py-2 border-b">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                        <span className="font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-xl font-bold bg-gray-100 px-2 mt-2 rounded">
                        <span>TOTAL</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>
            </section>
            
            {/* Footer */}
            <footer className="mt-12 text-center text-xs text-gray-500 border-t pt-4">
                <p>Thank you for your business!</p>
                <p>Terms and conditions apply. This quote is valid for 30 days.</p>
            </footer>
        </div>
    );
};
