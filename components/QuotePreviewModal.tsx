import React, { useRef, useState } from 'react';
import jspdf from 'jspdf';
import { Modal } from './Modal';
import { QuotePDF } from './QuotePDF';
import type { Quote, Client, Currency, Material, QuoteItem, GlazingBar, FrameDivision, ProductRange, SystemSettings } from '../types';
import { DownloadIcon } from './icons';
import { getClientName, formatAddress } from '../utils';
import { CURRENCY_SYMBOLS } from '../constants';
import { calculatePanes, calculateSashPanes } from '../utils';

interface QuotePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    quote: Quote;
    client: Client;
    currency: Currency;
    materials: Material[];
    productRanges: ProductRange[];
    systemSettings: SystemSettings;
}

export const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ isOpen, onClose, quote, client, currency, materials, productRanges, systemSettings }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    
    const formatAddressMultiline = (address: any) => {
        return [address.line1, address.line2, address.townCity, address.county, address.postcode].filter(Boolean).join('\n');
    }
    
    const handleDownloadPDF = () => {
        setIsDownloading(true);
        try {
            const doc = new jspdf('p', 'pt', 'a4');
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 40;
            let y = margin;

            // --- Helper Functions ---
            const getMaterialName = (id?: string) => materials.find(m => m.id === id)?.name;
            const symbol = CURRENCY_SYMBOLS[currency];
            const formatCurrency = (val: number) => `${symbol}${val.toFixed(2)}`;
            
            const drawWindowItem = (doc: jspdf, item: QuoteItem, x: number, y: number, maxWidth: number, maxHeight: number) => {
                const { windowInstances, pairSpacing = 0, pairRebate = 0 } = item;
                if (!windowInstances || windowInstances.length === 0) return;

                const totalWidth = windowInstances.reduce((sum, inst) => sum + inst.overallWidth, 0)
                    + (windowInstances.length > 1 ? (windowInstances.length - 1) * pairSpacing : 0)
                    - (windowInstances.length > 1 ? (windowInstances.length - 1) * pairRebate : 0);
                const maxItemHeight = Math.max(...windowInstances.map(inst => inst.overallHeight));

                const scale = Math.min(maxWidth / totalWidth, maxHeight / maxItemHeight);
                const s = (val: number) => val * scale;
                
                const totalScaledWidth = s(totalWidth);
                const offsetX = x + (maxWidth - totalScaledWidth) / 2;

                let currentXOffset = offsetX;

                windowInstances.forEach(instance => {
                    const W = s(instance.overallWidth);
                    const H = s(instance.overallHeight);
                    const instanceY = y + (s(maxItemHeight) - H) / 2;

                    const getMaterialColor = (id?: string, defaultColor = '#cccccc') => materials.find(m => m.id === id)?.color || defaultColor;
                    const frameColor = getMaterialColor(item.externalFinishId) || getMaterialColor(item.materialFrameId, '#D1B48C');
                    const sashColor = getMaterialColor(item.externalFinishId) || getMaterialColor(item.materialSashId, '#D3B48C');
                    const cillColor = getMaterialColor(item.cillFinishId) || getMaterialColor(item.materialCillId, '#8C6E54');
                    const glassColor = '#e0f2fe';
                    doc.setDrawColor(55, 65, 81);
                    doc.setLineWidth(0.5);

                    const F_HEAD = s(item.frameInfo.outer.head);
                    const F_CILL = s(item.frameInfo.outer.cill);
                    const F_JAMB = s(item.frameInfo.outer.leftJamb);
                    
                    doc.setFillColor(frameColor);
                    doc.rect(currentXOffset, instanceY, W, F_HEAD, 'FD');
                    doc.rect(currentXOffset, instanceY + F_HEAD, F_JAMB, H - F_HEAD - F_CILL, 'FD');
                    doc.rect(currentXOffset + W - F_JAMB, instanceY + F_HEAD, F_JAMB, H - F_HEAD - F_CILL, 'FD');
                    doc.setFillColor(cillColor);
                    doc.rect(currentXOffset, instanceY + H - F_CILL, W, F_CILL, 'FD');

                    const innerX = currentXOffset + F_JAMB;
                    const innerY = instanceY + F_HEAD;
                    const innerW = W - F_JAMB * 2;
                    const innerH = H - F_HEAD - F_CILL;

                    if (item.itemType === 'Sash') {
                        const S_HEAD = s(item.sashInfo.head);
                        const S_STILE = s(item.sashInfo.stile);
                        const S_BOTTOM = s(item.sashInfo.bottomRail);
                        const S_MEETING = s(item.sashInfo.meetingStile);
                        const topSashH_val = instance.topSashHeight || (innerH - S_HEAD - S_BOTTOM) / 2;
                        const topSashH = s(topSashH_val);
                        const bottomSashH = innerH - topSashH;
                        const barThickness = item.glazingBarThickness;

                        // Bottom Sash
                        doc.setFillColor(sashColor);
                        doc.rect(innerX, innerY + topSashH, innerW, bottomSashH, 'FD');
                        const bottomGlassX = innerX + S_STILE;
                        const bottomGlassY = innerY + topSashH + S_MEETING;
                        const bottomGlassW = innerW - S_STILE * 2;
                        const bottomGlassH = bottomSashH - S_MEETING - S_BOTTOM;
                        const bottomPanes = calculateSashPanes(bottomGlassW, bottomGlassH, instance.bottomSashGlazingBars, s(barThickness));
                        doc.setFillColor(glassColor);
                        bottomPanes.forEach(pane => {
                            doc.rect(bottomGlassX + pane.x, bottomGlassY + pane.y, pane.width, pane.height, 'F');
                        });

                        // Top Sash
                        doc.setFillColor(sashColor);
                        doc.rect(innerX, innerY, innerW, topSashH, 'FD');
                        const topGlassX = innerX + S_STILE;
                        const topGlassY = innerY + S_HEAD;
                        const topGlassW = innerW - S_STILE * 2;
                        const topGlassH = topSashH - S_HEAD - S_MEETING;
                        const topPanes = calculateSashPanes(topGlassW, topGlassH, instance.topSashGlazingBars, s(barThickness));
                        doc.setFillColor(glassColor);
                        topPanes.forEach(pane => {
                            doc.rect(topGlassX + pane.x, topGlassY + pane.y, pane.width, pane.height, 'F');
                        });
                        
                    } else { // Casement, Door, Screen
                        const S_HEAD = s(item.sashInfo.head);
                        const S_STILE = s(item.sashInfo.stile);
                        const S_BOTTOM = s(item.sashInfo.bottomRail);
                        
                        const instanceMullions = (item.mullions || []).filter(d => !d.instanceId || d.instanceId === instance.id);
                        const instanceTransoms = (item.transoms || []).filter(d => !d.instanceId || d.instanceId === instance.id);

                        const scaledDivisions = [...instanceMullions, ...instanceTransoms].map(d => ({
                            ...d, offset: s(d.offset), start: d.start !== undefined ? s(d.start) : undefined, end: d.end !== undefined ? s(d.end) : undefined, thickness: d.thickness !== undefined ? s(d.thickness) : undefined,
                        }));
                        const defaultThickness = { mullion: s(item.frameInfo.outer.mullion), transom: s(item.frameInfo.outer.transom) };
                        const panes = calculatePanes(innerW, innerH, scaledDivisions, defaultThickness);
                        
                        // Draw divisions first as filled shapes
                        doc.setFillColor(frameColor);
                        scaledDivisions.forEach(d => {
                            const thickness = d.thickness || (d.type === 'mullion' ? defaultThickness.mullion : defaultThickness.transom);
                            const startEdge = d.offset - thickness / 2;

                            if (d.type === 'mullion') {
                                const start = d.start ?? 0;
                                const end = d.end ?? innerH;
                                doc.rect(innerX + startEdge, innerY + start, thickness, end - start, 'F');
                            } else { // Transom
                                const start = d.start ?? 0;
                                const end = d.end ?? innerW;
                                doc.rect(innerX + start, innerY + startEdge, end - start, thickness, 'F');
                            }
                        });

                        // Then draw panes on top
                        panes.forEach(pane => {
                            const paneIdString = `${instance.id}-${pane.id}`;
                            const sash = item.placedSashes?.find(s => s.paneId === paneIdString);
                            if (sash) {
                               if (sash.type !== 'fixed-glazing') {
                                   doc.setFillColor(sashColor);
                                   doc.rect(innerX + pane.x, innerY + pane.y, pane.width, pane.height, 'FD');
                               }
                               const glassX = innerX + pane.x + (sash.type !== 'fixed-glazing' ? S_STILE : 0);
                               const glassY = innerY + pane.y + (sash.type !== 'fixed-glazing' ? S_HEAD : 0);
                               const glassW = pane.width - (sash.type !== 'fixed-glazing' ? S_STILE * 2 : 0);
                               const glassH = pane.height - (sash.type !== 'fixed-glazing' ? S_HEAD + S_BOTTOM : 0);
                               
                               doc.setFillColor(glassColor);
                               const subPanes = calculateSashPanes(glassW, glassH, sash.glazingBars, s(item.glazingBarThickness));
                               subPanes.forEach(subPane => {
                                   doc.rect(glassX + subPane.x, glassY + subPane.y, subPane.width, subPane.height, 'F');
                               });
                            } else {
                                doc.setFillColor(glassColor);
                                doc.rect(innerX + pane.x, innerY + pane.y, pane.width, pane.height, 'F');
                            }
                        });
                    }
                    
                    currentXOffset += s(instance.overallWidth + pairSpacing - pairRebate);
                });
                
            };

            // --- Header ---
            doc.setFontSize(24); doc.setFont('helvetica', 'bold');
            doc.text('QUOTE', margin, y);
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.text(`Quote Number: ${quote.quoteNumber}`, margin, y += 20);
            doc.text(`Date: ${new Date(quote.date).toLocaleDateString()}`, margin, y += 12);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text(systemSettings.companyName || 'Sash Style Pro', pageWidth - margin, margin, { align: 'right' });
            doc.setFontSize(9); doc.setFont('helvetica', 'normal');
            doc.text(systemSettings.companyAddress ? formatAddress(systemSettings.companyAddress) : '123 Window Lane, Design City, DC 45678', pageWidth - margin, margin + 18, { align: 'right' });
            doc.text([systemSettings.companyEmail, systemSettings.companyPhone].filter(Boolean).join(' | '), pageWidth - margin, margin + 30, { align: 'right' });
            y += 30;
            doc.setDrawColor(229, 231, 235); doc.line(margin, y, pageWidth - margin, y); y += 30;

            // --- Client Info ---
            const clientDisplayName = getClientName(client);
            const primaryContact = client.contacts.find(c => c.isPrimary);
            doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.text('BILLED TO', margin, y);
            doc.text('INSTALLATION ADDRESS', pageWidth - margin, y, { align: 'right' });
            y += 12;
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            const billToText = `${clientDisplayName}\n${primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}\n` : ''}${formatAddressMultiline(client.officeAddress)}`;
            doc.text(billToText, margin, y);
            const installToText = `${quote.projectReference || client.installationAddress?.line1 || client.officeAddress.line1}\n${client.installationAddress ? formatAddressMultiline(client.installationAddress) : ''}`;
            doc.text(installToText, pageWidth - margin, y, { align: 'right' });
            y += 60;
            
            // --- Items ---
            quote.items.forEach(item => {
                if (y + 180 > pageHeight - margin - 100) { doc.addPage(); y = margin; }
                doc.setDrawColor(229, 231, 235); doc.line(margin, y, pageWidth - margin, y); y += 15;
                doc.setFontSize(12); doc.setFont('helvetica', 'bold');
                doc.text(`Item #${item.itemNumber}: ${item.location}`, margin, y); y += 15;

                const drawingX = margin; const drawingY = y; const drawingWidth = 150; const drawingHeight = 150;
                const specX = drawingX + drawingWidth + 20;

                drawWindowItem(doc, item, drawingX, drawingY, drawingWidth, drawingHeight);
                
                let specY = y; const lineHeight = 11; const specValueX = pageWidth - margin;
                const addSpec = (label: string, value?: string) => {
                    if (value) {
                        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128); doc.text(label, specX, specY);
                        doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81); doc.text(value, specValueX, specY, { align: 'right' });
                        specY += lineHeight;
                    }
                };
                const dimensions = item.windowInstances.map(inst => `${inst.overallWidth}mm x ${inst.overallHeight}mm`).join(' | ');
                addSpec("Product Range", productRanges.find(r => r.id === item.productRangeId)?.name);
                addSpec("Dimensions (WxH)", dimensions);
                addSpec("Frame Material", getMaterialName(item.materialFrameId));
                addSpec("Sash Material", getMaterialName(item.materialSashId));
                addSpec("External Finish", getMaterialName(item.externalFinishId));
                addSpec("Internal Finish", getMaterialName(item.internalFinishId));
                addSpec("Glass", item.paneGlassTypes.length > 0 ? getMaterialName(item.paneGlassTypes[0].glassTypeId) : 'N/A');
                addSpec("U-Value", item.calculatedUValue ? `${item.calculatedUValue.toFixed(2)} W/m²K` : 'N/A');

                specY += 10; doc.setDrawColor(229, 231, 235); doc.line(specX, specY, pageWidth - margin, specY); specY += 15;
                const priceLineY = specY; const colWidth = (pageWidth - margin - specX) / 3;
                doc.setFontSize(8); doc.setTextColor(107, 114, 128);
                doc.text('Unit Price', specX, priceLineY);
                doc.text('Quantity', specX + colWidth, priceLineY, { align: 'right' });
                doc.text('Item Total', specX + colWidth*2.5, priceLineY, { align: 'right' });
                specY += 12;
                doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81);
                doc.text(formatCurrency(item.price), specX, specY);
                doc.text(item.quantity.toString(), specX + colWidth, specY, { align: 'right' });
                doc.text(formatCurrency(item.price * item.quantity), specX + colWidth*2.5, specY, { align: 'right' });
                y += drawingHeight + 15;
            });
            
            // --- Totals ---
            const totalsX = pageWidth / 2;
            const subtotal = quote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const taxRate = 0.08; const tax = subtotal * taxRate; const total = subtotal + tax;
            y += 20;
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text('Subtotal', totalsX, y, { align: 'right' });
            doc.text(formatCurrency(subtotal), pageWidth - margin, y, { align: 'right' }); y += 15;
            doc.text(`Tax (${(taxRate * 100).toFixed(0)}%)`, totalsX, y, { align: 'right' });
            doc.text(formatCurrency(tax), pageWidth - margin, y, { align: 'right' }); y += 5;
            doc.line(totalsX - 50, y, pageWidth - margin, y); y += 15;
            doc.setFillColor(243, 244, 246);
            doc.rect(totalsX - 60, y - 12, (pageWidth - margin) - (totalsX - 60), 20, 'F');
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text('TOTAL', totalsX, y, { align: 'right' });
            doc.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' });

            // --- Footer ---
            const footerY = pageHeight - margin + 10;
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175);
            doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
            doc.text('Terms and conditions apply. This quote is valid for 30 days.', pageWidth / 2, footerY + 10, { align: 'center' });

            const clientNameForFile = getClientName(client).replace(/\s+/g, '_');
            doc.save(`Quote-${quote.quoteNumber}-${clientNameForFile}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Preview: Quote ${quote.quoteNumber}`} size="4xl">
            <div className="max-h-[75vh] overflow-y-auto bg-gray-200 dark:bg-gray-900 p-8">
                <div>
                    <QuotePDF quote={quote} client={client} currency={currency} materials={materials} productRanges={productRanges} systemSettings={systemSettings} />
                </div>
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
                <button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 disabled:bg-blue-300"
                >
                    <DownloadIcon className="w-5 h-5"/>
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
            </div>
        </Modal>
    );
};