import React from 'react';
import type { QuoteItem, Material, FrameDivision, PlacedSash } from '../types';
import { calculatePanes, calculateSashPanes } from '../utils';

const DimensionLine: React.FC<{ x: number; y: number; length: number; label: string | number; isVertical: boolean; offset: number; }> = ({ x, y, length, label, isVertical, offset }) => {
    const tick = 4;
    let lineProps = isVertical ? { x1: x - offset, y1: y, x2: x - offset, y2: y + length } : { x1: x, y1: y - offset, x2: x + length, y2: y - offset };
    let textProps = isVertical ? { x: x - offset - tick, y: y + length / 2, transform: `rotate(-90, ${x-offset-tick}, ${y+length/2})` } : { x: x + length / 2, y: y - offset - tick };
    return (
        <g stroke="#333" strokeWidth="0.5" fill="#333" fontSize="8" textAnchor="middle" dominantBaseline="middle">
            <line {...lineProps} />
            <line x1={lineProps.x1} y1={lineProps.y1} x2={isVertical ? lineProps.x1+tick : lineProps.x1} y2={isVertical ? lineProps.y1 : lineProps.y1+tick} />
            <line x1={lineProps.x2} y1={lineProps.y2} x2={isVertical ? lineProps.x2+tick : lineProps.x2} y2={isVertical ? lineProps.y2 : lineProps.y2-tick} />
            <text {...textProps}>{label}</text>
        </g>
    );
};

const HingeIndicator: React.FC<{
    x: number; y: number; width: number; height: number; hingeSide?: PlacedSash['hingeSide']; strokeWidth?: number;
}> = ({ x, y, width, height, hingeSide, strokeWidth = 1 }) => {
    if (!hingeSide) return null;
    
    const midX = x + width / 2;
    const midY = y + height / 2;
    let path = '';
    
    if (hingeSide === 'top') path = `M ${x},${y + height} L ${midX},${y} L ${x + width},${y + height}`;
    else if (hingeSide === 'bottom') path = `M ${x},${y} L ${midX},${y + height} L ${x + width},${y}`;
    else if (hingeSide === 'left') path = `M ${x + width},${y} L ${x},${midY} L ${x + width},${y + height}`;
    else if (hingeSide === 'right') path = `M ${x},${y} L ${x + width},${midY} L ${x},${y + height}`;

    return (
        <g className="pointer-events-none text-black/40 dark:text-stone-300/60" strokeDasharray="3 3">
            <path d={path} stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
        </g>
    );
};


export const QuoteItemDrawing: React.FC<{ item: QuoteItem, materials: Material[], showDimensions?: boolean, showHinges?: boolean }> = ({ item, materials, showDimensions = true, showHinges = false }) => {
    const PADDING = 30;
    const { windowInstances, pairSpacing = 0, pairRebate = 0, glazingBarThickness, isNewFrame } = item;
    if (!windowInstances || windowInstances.length === 0) return null;

    const totalWidth = windowInstances.reduce((sum, inst) => sum + inst.overallWidth, 0)
        + (windowInstances.length > 1 ? (windowInstances.length - 1) * pairSpacing : 0)
        - (windowInstances.length > 1 ? (windowInstances.length - 1) * pairRebate : 0);
    const maxHeight = Math.max(...windowInstances.map(inst => inst.overallHeight));

    const viewBox = `-${PADDING} -${PADDING} ${totalWidth + PADDING * 2} ${maxHeight + PADDING * 2}`;

    const { head: sashHead, stile: sashStile, bottomRail: sashBottomRail, meetingStile: sashMeetingStile } = item.sashInfo;
    
    const frameColor = materials.find(m => m.id === item.externalFinishId)?.color || materials.find(m => m.id === item.materialFrameId)?.color || '#D1B48C';
    const sashColor = materials.find(m => m.id === item.externalFinishId)?.color || materials.find(m => m.id === item.materialSashId)?.color || '#D3B48C';
    const cillColor = materials.find(m => m.id === item.cillFinishId)?.color || materials.find(m => m.id === item.materialCillId)?.color || '#8C6E54';
    const glassColor = '#e0f2fe';
    
    const F_HEAD = isNewFrame ? item.frameInfo.outer.head : 0;
    const F_L_JAMB = isNewFrame ? item.frameInfo.outer.leftJamb : 0;
    const F_R_JAMB = isNewFrame ? item.frameInfo.outer.rightJamb : 0;
    const F_CILL = isNewFrame ? item.frameInfo.outer.cill : 0;
    const MULLION_WIDTH = isNewFrame ? item.frameInfo.outer.mullion : 0;
    const TRANSOM_HEIGHT = isNewFrame ? item.frameInfo.outer.transom : 0;


    return (
        <svg viewBox={viewBox} className="max-w-full max-h-full">
            <g stroke="black" strokeWidth="0.5">
                {(() => {
                    let currentXOffset = 0;
                    return windowInstances.map(instance => {
                        const instanceX = currentXOffset;
                        currentXOffset += instance.overallWidth + (windowInstances.length > 1 ? pairSpacing - pairRebate : 0);
                        
                        const { overallWidth, overallHeight } = instance;
                        const instanceY = (maxHeight - overallHeight) / 2; // Center vertically
                        const innerWidth = overallWidth - F_L_JAMB - F_R_JAMB;
                        const innerHeight = overallHeight - F_HEAD - F_CILL;
                        
                        const instanceMullions = (item.mullions || []).filter(d => !d.instanceId || d.instanceId === instance.id);
                        const instanceTransoms = (item.transoms || []).filter(d => !d.instanceId || d.instanceId === instance.id);

                        return (
                            <g key={instance.id} transform={`translate(${instanceX}, ${instanceY})`}>
                                {/* Frame */}
                                {isNewFrame && <>
                                    <rect x="0" y="0" width={overallWidth} height={F_HEAD} fill={frameColor} />
                                    <rect x="0" y={F_HEAD} width={F_L_JAMB} height={innerHeight} fill={frameColor} />
                                    <rect x={overallWidth - F_R_JAMB} y={F_HEAD} width={F_R_JAMB} height={innerHeight} fill={frameColor} />
                                    <rect x="0" y={overallHeight - F_CILL} width={overallWidth} height={F_CILL} fill={cillColor} />
                                </>}

                                {item.itemType === 'Sash' ? (
                                    <>
                                        {(() => {
                                            const topSashH = instance.topSashHeight || (innerHeight + sashHead - sashBottomRail) / 2;
                                            const bottomSashH = innerHeight - topSashH;
                                            const sashInnerWidth = innerWidth;
                                            return(<>
                                                {/* Bottom Sash */}
                                                <g transform={`translate(${F_L_JAMB}, ${F_HEAD + topSashH})`}>
                                                    <rect x={0} y={0} width={sashInnerWidth} height={bottomSashH} fill={sashColor} />
                                                    <g transform={`translate(${sashStile}, ${sashMeetingStile})`}>
                                                        {(() => {
                                                            const glassW = sashInnerWidth - sashStile * 2;
                                                            const glassH = bottomSashH - sashMeetingStile - sashBottomRail;
                                                            const panes = calculateSashPanes(glassW, glassH, instance.bottomSashGlazingBars, glazingBarThickness);
                                                            return panes.map(pane => <rect key={pane.id} x={pane.x} y={pane.y} width={pane.width} height={pane.height} fill={glassColor} stroke="none" />);
                                                        })()}
                                                    </g>
                                                </g>
                                                {/* Top Sash */}
                                                <g transform={`translate(${F_L_JAMB}, ${F_HEAD})`}>
                                                    <rect x="0" y="0" width={sashInnerWidth} height={topSashH} fill={sashColor} />
                                                    <g transform={`translate(${sashStile}, ${sashHead})`}>
                                                        {(() => {
                                                            const glassW = sashInnerWidth - sashStile * 2;
                                                            const glassH = topSashH - sashHead - sashMeetingStile;
                                                            const panes = calculateSashPanes(glassW, glassH, instance.topSashGlazingBars, glazingBarThickness);
                                                            return panes.map(pane => <rect key={pane.id} x={pane.x} y={pane.y} width={pane.width} height={pane.height} fill={glassColor} stroke="none" />);
                                                        })()}
                                                    </g>
                                                </g>
                                            </>);
                                        })()}
                                    </>
                                ) : (
                                    <>
                                        {/* Mullions and Transoms */}
                                        {instanceMullions.map(d => {
                                            const thickness = d.thickness || MULLION_WIDTH;
                                            const startEdge = d.offset - thickness / 2;
                                            const start = d.start ?? 0;
                                            const end = d.end ?? innerHeight;
                                            return <rect key={d.id} x={F_L_JAMB + startEdge} y={F_HEAD + start} width={thickness} height={end - start} fill={frameColor} stroke="none" />;
                                        })}
                                        {instanceTransoms.map(t => {
                                            const thickness = t.thickness || TRANSOM_HEIGHT;
                                            const startEdge = t.offset - thickness / 2;
                                            const start = t.start ?? 0;
                                            const end = t.end ?? innerWidth;
                                            return <rect key={t.id} x={F_L_JAMB + start} y={F_HEAD + startEdge} width={end - start} height={thickness} fill={frameColor} stroke="none" />;
                                        })}
                                        {/* Panes */}
                                        {calculatePanes(innerWidth, innerHeight, [...instanceMullions, ...instanceTransoms], { mullion: MULLION_WIDTH, transom: TRANSOM_HEIGHT }).map((pane, i) => {
                                            const paneIdString = `${instance.id}-${pane.id}`;
                                            const sash = item.placedSashes?.find(s => s.paneId === paneIdString);
                                            return (
                                                <g key={i} transform={`translate(${F_L_JAMB + pane.x}, ${F_HEAD + pane.y})`}>
                                                    {sash ? (
                                                        <>
                                                          {sash.type !== 'fixed-glazing' && <rect x={0} y={0} width={pane.width} height={pane.height} fill={sashColor} />}
                                                          <g transform={`translate(${sash.type !== 'fixed-glazing' ? sashStile : 0}, ${sash.type !== 'fixed-glazing' ? sashHead : 0})`}>
                                                            {(() => {
                                                              const glassW = pane.width - (sash.type !== 'fixed-glazing' ? sashStile * 2 : 0);
                                                              const glassH = pane.height - (sash.type !== 'fixed-glazing' ? sashHead + sashBottomRail : 0);
                                                              const subPanes = calculateSashPanes(glassW, glassH, sash.glazingBars, glazingBarThickness);
                                                              return subPanes.map(subPane => <rect key={subPane.id} x={subPane.x} y={subPane.y} width={subPane.width} height={subPane.height} fill={glassColor} stroke="none" />);
                                                            })()}
                                                          </g>
                                                          {showHinges && <HingeIndicator x={0} y={0} width={pane.width} height={pane.height} hingeSide={sash.hingeSide} />}
                                                        </>
                                                    ) : (
                                                        <rect x="0" y="0" width={pane.width} height={pane.height} fill={glassColor} stroke="none" />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </>
                                )}
                            </g>
                        );
                    });
                })()}
            </g>
            {showDimensions && (
              <>
                <DimensionLine x={0} y={(maxHeight - Math.min(...windowInstances.map(i => i.overallHeight)))/2} length={totalWidth} label={Math.round(totalWidth)} isVertical={false} offset={20} />
                <DimensionLine x={0} y={0} length={maxHeight} label={Math.round(maxHeight)} isVertical={true} offset={20} />
              </>
            )}
        </svg>
    );
};