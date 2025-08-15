
import type { Client, Address, FrameDivision, GlazingBar } from './types';

export const getClientName = (client: Client): string => {
    if (!client) return 'Unnamed Client';
    if (client.companyName) return client.companyName;
    const primaryContact = client.contacts.find(c => c.isPrimary);
    return primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : 'Unnamed Client';
};

export const formatAddress = (address?: Address): string => {
    if (!address) return 'N/A';
    return [address.line1, address.line2, address.townCity, address.county, address.postcode].filter(Boolean).join(', ');
};

export const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;

    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
}

export const calculatePanes = (
    innerWidth: number,
    innerHeight: number,
    divisions: FrameDivision[],
    defaultThickness: { mullion: number; transom: number }
): { id: string; x: number; y: number; width: number; height: number }[] => {
    // 1. Collect all unique X and Y coordinates from divisions and frame boundaries.
    const xCoords = new Set<number>([0, innerWidth]);
    const yCoords = new Set<number>([0, innerHeight]);

    divisions.forEach(d => {
        const thickness = d.thickness || (d.type === 'mullion' ? defaultThickness.mullion : defaultThickness.transom);
        const startEdge = d.offset - thickness / 2;
        const endEdge = d.offset + thickness / 2;
        
        if (d.type === 'mullion') {
            xCoords.add(startEdge);
            xCoords.add(endEdge);
            if (d.start !== undefined) yCoords.add(d.start);
            if (d.end !== undefined) yCoords.add(d.end);
        } else { // transom
            yCoords.add(startEdge);
            yCoords.add(endEdge);
            if (d.start !== undefined) xCoords.add(d.start);
            if (d.end !== undefined) xCoords.add(d.end);
        }
    });

    const sortedX = [...xCoords].sort((a, b) => a - b).filter((v, i, a) => i === 0 || v > a[i-1]);
    const sortedY = [...yCoords].sort((a, b) => a - b).filter((v, i, a) => i === 0 || v > a[i-1]);

    // 2. Create a grid of elementary cells and classify them.
    const grid: ('glass' | 'frame')[][] = [];
    for (let r = 0; r < sortedY.length - 1; r++) {
        grid[r] = [];
        for (let c = 0; c < sortedX.length - 1; c++) {
            const cellCenterX = (sortedX[c] + sortedX[c + 1]) / 2;
            const cellCenterY = (sortedY[r] + sortedY[r + 1]) / 2;
            
            let isCovered = false;
            for (const d of divisions) {
                const thickness = d.thickness || (d.type === 'mullion' ? defaultThickness.mullion : defaultThickness.transom);
                const startEdge = d.offset - thickness / 2;
                const endEdge = d.offset + thickness / 2;

                if (d.type === 'mullion') {
                    if (cellCenterX > startEdge && cellCenterX < endEdge &&
                        cellCenterY >= (d.start ?? 0) && cellCenterY <= (d.end ?? innerHeight)) {
                        isCovered = true;
                        break;
                    }
                } else { // transom
                     if (cellCenterY > startEdge && cellCenterY < endEdge &&
                        cellCenterX >= (d.start ?? 0) && cellCenterX <= (d.end ?? innerWidth)) {
                        isCovered = true;
                        break;
                    }
                }
            }
            grid[r][c] = isCovered ? 'frame' : 'glass';
        }
    }

    // 3. Find maximal rectangles of 'glass' cells to form panes.
    const finalPanes: { id: string; x: number; y: number; width: number; height: number }[] = [];
    if(grid.length === 0 || (grid[0] && grid[0].length === 0)) return finalPanes;
    
    // Re-indexing logic: map grid row/col to pane row/col
    const paneRowStarts = new Map<number, number>();
    const paneColStarts = new Map<number, number>();
    let currentPaneRow = 0;
    for(let r=0; r < grid.length; r++) {
        if(grid[r].some(cell => cell === 'glass')) {
            if(!paneRowStarts.has(r)) {
                paneRowStarts.set(r, currentPaneRow);
                currentPaneRow++;
            }
        }
    }
    let currentPaneCol = 0;
    for(let c=0; c < (grid[0]?.length || 0); c++) {
        let hasGlass = false;
        for(let r=0; r < grid.length; r++) {
            if(grid[r][c] === 'glass') {
                hasGlass = true;
                break;
            }
        }
        if(hasGlass) {
             if(!paneColStarts.has(c)) {
                paneColStarts.set(c, currentPaneCol);
                currentPaneCol++;
            }
        }
    }


    const assigned: boolean[][] = Array.from({ length: grid.length }, () => Array(grid[0]?.length || 0).fill(false));

    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < (grid[r]?.length || 0); c++) {
            if (grid[r][c] === 'glass' && !assigned[r][c]) {
                let maxWidth = 0;
                while(c + maxWidth < grid[r].length && grid[r][c + maxWidth] === 'glass' && !assigned[r][c + maxWidth]) {
                    maxWidth++;
                }

                let height = 1;
                while(r + height < grid.length) {
                    let canExpandRow = true;
                    for (let i = 0; i < maxWidth; i++) {
                        if (grid[r + height][c + i] !== 'glass' || assigned[r + height][c + i]) {
                            canExpandRow = false;
                            break;
                        }
                    }
                    if (canExpandRow) {
                        height++;
                    } else {
                        break;
                    }
                }

                const x = sortedX[c];
                const y = sortedY[r];
                const width = sortedX[c + maxWidth] - x;
                const paneHeight = sortedY[r + height] - y;
                
                const paneRowIndex = paneRowStarts.get(r) ?? 0;
                const paneColIndex = paneColStarts.get(c) ?? 0;

                finalPanes.push({ id: `${paneRowIndex}-${paneColIndex}`, x, y, width, height: paneHeight });

                for (let i = 0; i < height; i++) {
                    for (let j = 0; j < maxWidth; j++) {
                        assigned[r + i][c + j] = true;
                    }
                }
            }
        }
    }
    return finalPanes;
};

export const calculateSashPanes = (sashWidth: number, sashHeight: number, glazingBars: GlazingBar[] | undefined, barThickness: number): { id: string; x: number; y: number; width: number; height: number; }[] => {
    if (!glazingBars || glazingBars.length === 0) {
        if (sashWidth > 0 && sashHeight > 0) {
            return [{ id: '0-0', x: 0, y: 0, width: sashWidth, height: sashHeight }];
        }
        return [];
    }

    const verticals = glazingBars.filter(b => b.type === 'vertical').sort((a,b) => a.offset - b.offset);
    const horizontals = glazingBars.filter(b => b.type === 'horizontal').sort((a,b) => a.offset - b.offset);
    
    const vGaps = verticals.length * barThickness;
    const hGaps = horizontals.length * barThickness;
    const availableWidth = sashWidth - vGaps;
    const availableHeight = sashHeight - hGaps;
    const numVPanes = verticals.length + 1;
    const numHPanes = horizontals.length + 1;
    
    const panes: { id: string; x: number; y: number; width: number; height: number; }[] = [];
    if(availableWidth <= 0 || availableHeight <= 0) return panes;

    let currentX = 0;
    for (let j = 0; j < numVPanes; j++) {
        let currentY = 0;
        const paneWidth = availableWidth / numVPanes;
        for (let i = 0; i < numHPanes; i++) {
            const paneHeight = availableHeight / numHPanes;
            panes.push({
                id: `${i}-${j}`,
                x: currentX,
                y: currentY,
                width: paneWidth,
                height: paneHeight,
            });
            currentY += paneHeight + (i < horizontals.length ? barThickness : 0);
        }
        currentX += paneWidth + (j < verticals.length ? barThickness : 0);
    }
    return panes;
};
