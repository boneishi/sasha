

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { GlazingBar } from '../types';
import { Button, Input } from './common';

interface GlazingBarPreviewProps {
    verticalCount: number;
    horizontalCount: number;
}

const GlazingBarPreview: React.FC<GlazingBarPreviewProps> = ({ verticalCount, horizontalCount }) => {
    const lines = [];
    for (let i = 1; i <= verticalCount; i++) {
        lines.push(<line key={`v-${i}`} x1={`${(i * 100) / (verticalCount + 1)}%`} y1="0" x2={`${(i * 100) / (verticalCount + 1)}%`} y2="100%" stroke="currentColor" strokeWidth="2" />);
    }
    for (let i = 1; i <= horizontalCount; i++) {
        lines.push(<line key={`h-${i}`} x1="0" y1={`${(i * 100) / (horizontalCount + 1)}%`} x2="100%" y2={`${(i * 100) / (horizontalCount + 1)}%`} stroke="currentColor" strokeWidth="2" />);
    }

    const stile = 15;
    const rail = 15;
    
    return (
        <div className="w-full h-64 bg-stone-100 dark:bg-gray-800/20 rounded-md p-4 flex justify-center items-center">
            <svg viewBox="0 0 150 200" className="w-auto h-full text-stone-500 dark:text-stone-400">
                {/* Outer sash frame */}
                <rect x="0" y="0" width="150" height="200" stroke="currentColor" strokeWidth="3" fill="#D3B48C" />
                {/* Glass area */}
                <svg x={stile} y={rail} width={150 - stile*2} height={200 - rail*2}>
                    <rect x="0" y="0" width="100%" height="100%" fill="#e0f2fe" />
                    {lines}
                </svg>
            </svg>
        </div>
    );
};


export const GlazingBarSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (bars: GlazingBar[], thickness: number) => void;
    initialBars: GlazingBar[];
    initialThickness: number;
}> = ({ isOpen, onClose, onSave, initialBars, initialThickness }) => {

    const [verticalCount, setVerticalCount] = useState(0);
    const [horizontalCount, setHorizontalCount] = useState(0);
    const [thickness, setThickness] = useState(initialThickness);

    useEffect(() => {
        if (isOpen) {
            const vBars = initialBars.filter(b => b.type === 'vertical').length;
            const hBars = initialBars.filter(b => b.type === 'horizontal').length;
            setVerticalCount(vBars);
            setHorizontalCount(hBars);
            setThickness(initialThickness);
        }
    }, [isOpen, initialBars, initialThickness]);

    const handleSave = () => {
        const bars: GlazingBar[] = [];
        for (let i = 0; i < verticalCount; i++) {
            bars.push({ id: `v-${Date.now()}-${i}`, type: 'vertical', offset: 0 });
        }
        for (let i = 0; i < horizontalCount; i++) {
            bars.push({ id: `h-${Date.now()}-${i}`, type: 'horizontal', offset: 0 });
        }
        onSave(bars, thickness);
        onClose();
    };

    const Control: React.FC<{label: string, count: number, onIncrement: () => void, onDecrement: () => void}> = ({ label, count, onIncrement, onDecrement}) => (
        <div className="flex items-center justify-between">
            <span className="font-semibold">{label}</span>
            <div className="flex items-center gap-2">
                <button onClick={onDecrement} disabled={count === 0} className="px-3 py-1 bg-stone-200 dark:bg-gray-600 rounded disabled:opacity-50">-</button>
                <span className="w-8 text-center font-bold">{count}</span>
                 <button onClick={onIncrement} className="px-3 py-1 bg-stone-200 dark:bg-gray-600 rounded">+</button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configure Glazing Bars" size="lg">
            <div className="space-y-6">
                <GlazingBarPreview verticalCount={verticalCount} horizontalCount={horizontalCount} />

                <div className="space-y-4 p-4 bg-stone-50 dark:bg-gray-700/50 rounded-lg">
                    <Control 
                        label="Vertical Bars"
                        count={verticalCount}
                        onIncrement={() => setVerticalCount(c => c + 1)}
                        onDecrement={() => setVerticalCount(c => c > 0 ? c - 1 : 0)}
                    />
                     <Control 
                        label="Horizontal Bars"
                        count={horizontalCount}
                        onIncrement={() => setHorizontalCount(c => c + 1)}
                        onDecrement={() => setHorizontalCount(c => c > 0 ? c - 1 : 0)}
                    />
                    <div className="flex items-center justify-between pt-3 border-t dark:border-gray-600">
                        <label htmlFor="glazing-bar-thickness" className="font-semibold">Bar Thickness (mm)</label>
                         <Input
                            id="glazing-bar-thickness"
                            type="number"
                            value={thickness}
                            onChange={(e) => setThickness(Number(e.target.value))}
                            className="w-24"
                        />
                    </div>
                </div>
                
                 <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Apply Configuration</Button>
                </div>
            </div>
        </Modal>
    );
};