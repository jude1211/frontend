import React, { useMemo } from 'react';
import SeatPicker from 'react-seat-picker';

export type PricingTier = 'Base' | 'Premium' | 'VIP';

export interface SeatClassRule {
  rows: string; // e.g., "A-C" or "D" or "G-J"
  className: string; // e.g., Gold, Silver, Balcony
  price: number;
  tier: PricingTier;
  color: string; // hex or tailwind color for legend; SeatPicker colors are limited, so we show legend
  layout?: { numRows: number; numCols: number; aisleColumns: number[] };
}

export interface SeatLayoutConfig {
  numRows: number; // total number of alphabetic rows
  numCols: number; // seats per row (excluding aisles)
  aisleColumns: number[]; // 1-based column indices to leave blank (gap)
  seatClassRules: SeatClassRule[];
}

export interface SeatLayoutBuilderProps {
  config: SeatLayoutConfig;
  maxReservableSeats?: number;
  onSeatClick?: (seatId: string, meta: { rowLabel: string; columnNumber: number; seatClass?: SeatClassRule }) => void;
  editMode?: boolean;
  processedSeats?: Map<string, any>;
  onSeatDeletion?: (seatId: string) => void;
  onSeatPositionUpdate?: (seatId: string, x: number, y: number) => void;
  onSeatRestoration?: (seatId: string) => void;
  onManualLayoutChange?: (seatIdsByRow: string[][]) => void;
  onSeatGridChange?: (grid: Array<Array<{ row: number; col: number; rowLabel: string; number: number; className?: string }>>) => void;
  selectedSeats?: Set<string>;
  reservedSeats?: Set<string>;
}

function getRowLabel(indexZeroBased: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + indexZeroBased);
}

function parseRowRange(range: string): Set<string> {
  const trimmed = range.trim();
  if (!trimmed) return new Set();
  if (!trimmed.includes('-')) return new Set([trimmed]);
  const [start, end] = trimmed.split('-').map((s) => s.trim());
  const startCode = start.charCodeAt(0);
  const endCode = end.charCodeAt(0);
  const result = new Set<string>();
  for (let c = Math.min(startCode, endCode); c <= Math.max(startCode, endCode); c++) {
    result.add(String.fromCharCode(c));
  }
  return result;
}

function findSeatClassForRow(rowLabel: string, rules: SeatClassRule[]): SeatClassRule | undefined {
  for (const rule of rules) {
    const parts = rule.rows.split(',');
    for (const part of parts) {
      const covered = parseRowRange(part);
      if (covered.has(rowLabel)) return rule;
    }
  }
  return undefined;
}

const SeatLayoutBuilder: React.FC<SeatLayoutBuilderProps> = ({ 
  config, 
  maxReservableSeats = 10, 
  onSeatClick, 
  editMode = false, 
  processedSeats,
  onSeatDeletion,
  onSeatPositionUpdate,
  onSeatRestoration,
  onManualLayoutChange, 
  onSeatGridChange,
  selectedSeats = new Set(),
  reservedSeats = new Set()
}) => {
  const { organizedTiers, legend, classByName } = React.useMemo(() => {
    const legendMap = new Map<string, SeatClassRule>();
    const classByNameMap = new Map<string, SeatClassRule>();
    
    // If we have processed seats, use them to know about deleted seats
    // In edit mode, we still need processedSeats to know which seats were deleted
    if (processedSeats && processedSeats.size > 0) {
      console.log('Restoring layout from processed seats:', processedSeats.size);
      console.log('Sample processed seat:', Array.from(processedSeats.values())[0]);
      console.log('Config seatClassRules:', config.seatClassRules);
      
      // Group seats by tier and row
      const seatsByTier = new Map<string, Map<string, any[]>>();
      
      processedSeats.forEach((seat) => {
        if (seat.isActive !== false) {
          // Determine tier from seat class or use default
          let tier = seat.tier;
          if (!tier) {
            // Try to determine tier from className or use default
            if (seat.className?.toLowerCase().includes('vip') || seat.className?.toLowerCase().includes('balcony')) {
              tier = 'VIP';
            } else if (seat.className?.toLowerCase().includes('premium') || seat.className?.toLowerCase().includes('gold')) {
              tier = 'Premium';
            } else {
              tier = 'Base';
            }
          }
          
          if (!seatsByTier.has(tier)) {
            seatsByTier.set(tier, new Map());
          }
          if (!seatsByTier.get(tier)!.has(seat.rowLabel)) {
            seatsByTier.get(tier)!.set(seat.rowLabel, []);
          }
          seatsByTier.get(tier)!.get(seat.rowLabel)!.push({
            ...seat,
            tier: tier
          });
        }
      });
      
      // Also track deleted seats to avoid creating empty seats in their positions
      const deletedSeats = new Set<string>();
      processedSeats.forEach((seat) => {
        if (seat.isActive === false) {
          deletedSeats.add(`${seat.rowLabel}-${seat.number}`);
        }
      });
      
      // Organize by tier order
      const tierOrder = ['VIP', 'Premium', 'Base'];
      const organizedTiers: Array<{ 
        tier: string; 
        rule: SeatClassRule; 
        rows: any[][]; 
        rowLabels: string[];
        startRowIndex: number;
      }> = [];
      
      let currentRowIndex = 0;
      
      tierOrder.forEach(tier => {
        const tierSeats = seatsByTier.get(tier);
        if (tierSeats && tierSeats.size > 0) {
          console.log(`Processing tier ${tier} with ${tierSeats.size} rows`);
          // Find the rule for this tier
          const rule = config.seatClassRules.find(r => r.tier === tier);
          console.log(`Found rule for tier ${tier}:`, rule);
          if (rule) {
            legendMap.set(rule.className, rule);
            classByNameMap.set(rule.className, rule);
            
            const rows: any[][] = [];
            const rowLabels = Array.from(tierSeats.keys()).sort();
            
            rowLabels.forEach((rowLabel) => {
              const seatsInRow = tierSeats.get(rowLabel) || [];
              const totalVisualCols = config.numCols + config.aisleColumns.length;
              const row: any[] = [];
              
              // Create a map of seat positions for this row based on seat numbers
              const seatPositions = new Map<number, any>();
              seatsInRow.forEach(seat => {
                seatPositions.set(seat.number, seat);
              });
              
              // Build the row with seats in correct positions
              let seatCounter = 0;
              for (let c = 1; c <= totalVisualCols; c++) {
                if (config.aisleColumns.includes(c)) {
                  row.push(null); // Aisle gap
                } else {
                  seatCounter++;
                  if (seatPositions.has(seatCounter)) {
                    const seat = seatPositions.get(seatCounter);
                    row.push({
                      ...seat,
                      isEmpty: false,
                      x: (c - 1) * 40,
                      y: currentRowIndex * 40
                    });
                  } else {
                    // Check if this seat was deleted - if so, create an empty seat for restoration
                    const seatId = `${rowLabel}-${seatCounter}`;
                    if (deletedSeats.has(seatId)) {
                      // This seat was deleted, create an empty seat that can be restored
                      row.push({
                        id: seatId,
                        rowLabel,
                        number: seatCounter,
                        className: rule.className,
                        price: rule.price,
                        color: rule.color,
                        tier: rule.tier,
                        tooltip: `${rowLabel}${seatCounter} · ${rule.className} · ₹${rule.price} · ${rule.tier}`,
                        isVip: rule.tier === 'VIP',
                        status: 'available',
                        isActive: false, // Mark as deleted
                        isEmpty: true, // Mark as empty for restoration
                        x: (c - 1) * 40,
                        y: currentRowIndex * 40,
                      });
                    } else {
                      // Empty seat position (never occupied)
                      row.push({
                        id: seatId,
                        rowLabel,
                        number: seatCounter,
                        className: rule.className,
                        price: rule.price,
                        color: rule.color,
                        tier: rule.tier,
                        tooltip: `${rowLabel}${seatCounter} · ${rule.className} · ₹${rule.price} · ${rule.tier}`,
                        isVip: rule.tier === 'VIP',
                        status: 'available',
                        isActive: true,
                        x: (c - 1) * 40,
                        y: currentRowIndex * 40,
                        isEmpty: true
                      });
                    }
                  }
                }
              }
              
              rows.push(row);
            });
            
            organizedTiers.push({
              tier: rule.tier,
              rule,
              rows,
              rowLabels,
              startRowIndex: currentRowIndex
            });
            
            currentRowIndex += rows.length;
          }
        }
      });
      
      console.log('Restored organizedTiers:', organizedTiers.length, 'tiers');
      console.log('Sample restored tier:', organizedTiers[0]);
      
      if (organizedTiers.length === 0) {
        console.log('WARNING: No organizedTiers created from processed seats, falling back to default');
      }
      
      return { 
        organizedTiers, 
        legend: Array.from(legendMap.values()), 
        classByName: classByNameMap 
      };
    }
    
    // Fallback to default layout generation if no processed seats
    console.log('Falling back to default layout generation');
    console.log('Processed seats available:', processedSeats?.size || 0);
    console.log('Config:', config);
    
    // Organize seat classes by tier (Base → Premium → VIP)
    const tierOrder = ['VIP', 'Premium', 'Base'];
    const organizedTiers: Array<{ 
      tier: string; 
      rule: SeatClassRule; 
      rows: any[][]; 
      rowLabels: string[];
      startRowIndex: number;
    }> = [];

    // Sort rules by tier order
    const sortedRules = [...config.seatClassRules].sort((a, b) => {
      const aIndex = tierOrder.indexOf(a.tier);
      const bIndex = tierOrder.indexOf(b.tier);
      return aIndex - bIndex;
    });

    let currentRowIndex = 0;

    sortedRules.forEach((rule) => {
      legendMap.set(rule.className, rule);
      classByNameMap.set(rule.className, rule);
      
      const layout = rule.layout || { 
        numRows: config.numRows, 
        numCols: config.numCols, 
        aisleColumns: config.aisleColumns 
      };
      
      // Parse the row ranges for this rule (e.g., "A-C", "D-F", "G-H")
      const rowRanges = new Set<string>();
      const parts = rule.rows.split(',');
      for (const part of parts) {
        const covered = parseRowRange(part);
        covered.forEach(row => rowRanges.add(row));
      }
      
      // Convert row ranges to sorted array
      const rowLabels = Array.from(rowRanges).sort();
      
      const rows: any[][] = [];
      rowLabels.forEach((rowLabel, localRowIndex) => {
        const totalVisualCols = layout.numCols + layout.aisleColumns.length;
        let seatCounter = 0;
        const row: any[] = [];
        
        for (let c = 1; c <= totalVisualCols; c++) {
          if (layout.aisleColumns.includes(c)) {
            row.push(null); // Aisle gap
            continue;
          }
          seatCounter += 1;
          const seatId = `${rowLabel}-${seatCounter}`;
          const tooltip = `${rowLabel}${seatCounter} · ${rule.className} · ₹${rule.price} · ${rule.tier}`;
          const isVip = rule.tier === 'VIP';
          
          // Check if we have processed seat data for this seat
          const processedSeat = processedSeats?.get(seatId);
          const isActive = processedSeat?.isActive !== false;
          const seatStatus = processedSeat?.status || 'available';
          
          row.push({ 
            id: seatId, 
            number: seatCounter, 
            tooltip, 
            isReserved: false, 
            isVIP: isVip, 
            isEmpty: false,
            isActive: isActive,
            status: seatStatus,
            x: processedSeat?.x || ((c - 1) * 40),
            y: processedSeat?.y || ((currentRowIndex + localRowIndex) * 40),
            className: rule.className,
            price: rule.price,
            color: rule.color,
            rowLabel: rowLabel
          });
        }
        rows.push(row);
      });
      
      organizedTiers.push({
        tier: rule.tier,
        rule,
        rows,
        rowLabels,
        startRowIndex: currentRowIndex
      });
      
      currentRowIndex += rows.length;
    });

    return { 
      organizedTiers, 
      legend: Array.from(legendMap.values()), 
      classByName: classByNameMap 
    };
  }, [config, processedSeats, editMode]);

  const [editableRowsByTier, setEditableRowsByTier] = React.useState<any[][][]>([]);
  
  React.useEffect(() => {
    if (organizedTiers && Array.isArray(organizedTiers) && organizedTiers.length > 0) {
      console.log('Updating editableRowsByTier with organizedTiers:', organizedTiers.length, 'tiers');
      console.log('Sample organizedTier:', organizedTiers[0]);
      const newEditableRows = organizedTiers.map(t => t.rows);
      console.log('New editableRowsByTier:', newEditableRows.length, 'tiers');
      setEditableRowsByTier(newEditableRows);
    } else {
      console.log('No organizedTiers to update editableRowsByTier');
    }
  }, [organizedTiers]);

  const emitManual = (tierIndex: number, next: any[][]) => {
    console.log('emitManual called with', next.length, 'rows');
    const ids = next.map(r => r.map(cell => (cell && !cell.isEmpty ? cell.id : '')));
    onManualLayoutChange?.(ids);
    const grid = next.map((r, rIdx) => r.map((cell, cIdx) => {
      return {
        row: rIdx,
        col: cIdx,
        rowLabel: cell?.rowLabel || '',
        number: cell ? cell.number : 0,
        className: cell && !cell.isEmpty ? (cell as any).className : undefined,
        price: cell && !cell.isEmpty ? (cell as any).price : undefined,
        color: cell && !cell.isEmpty ? (cell as any).color : undefined,
        status: cell && !cell.isEmpty ? (cell as any).status : undefined,
        isActive: cell && !cell.isEmpty ? (cell as any).isActive : undefined,
        x: cell && !cell.isEmpty ? (cell as any).x : undefined,
        y: cell && !cell.isEmpty ? (cell as any).y : undefined,
        isEmpty: cell ? cell.isEmpty : true
      };
    }));
    console.log('Emitting grid data:', grid.length, 'rows,', grid[0]?.length || 0, 'cols');
    onSeatGridChange?.(grid);
  };

  React.useEffect(() => {
    const flat: any[][] = [];
    editableRowsByTier.forEach(tier => tier.forEach(r => flat.push(r)));
    emitManual(0, flat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableRowsByTier]);

  const [dragFrom, setDragFrom] = React.useState<{ tierIndex: number; r: number; c: number } | null>(null);
  const [hoverTarget, setHoverTarget] = React.useState<{ r: number; c: number } | null>(null);
  const [pendingPositionUpdates, setPendingPositionUpdates] = React.useState<Array<{seatId: string, newX: number, newY: number}>>([]);
  
  const onDragStart = (tierIndex: number, r: number, c: number) => (e: React.DragEvent) => {
    console.log('Drag started:', { tierIndex, r, c, editMode });
    
    if (!editMode) {
      e.preventDefault();
      return;
    }
    
    // Some browsers require data to start a drag operation
    try { e.dataTransfer.setData('text/plain', `${tierIndex},${r},${c}`); } catch {}
    e.dataTransfer.effectAllowed = 'move';
    setDragFrom({ tierIndex, r, c });
  };
  
  const onDragOver = (toR: number, toC: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setHoverTarget({ r: toR, c: toC });
  };
  
  const onDragLeave = () => setHoverTarget(null);
  
  const onDrop = (tierIndex: number, toR: number, toC: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop event:', { tierIndex, toR, toC, dragFrom, editMode });
    
    if (!dragFrom || !editMode) return;
    
    setEditableRowsByTier((prev) => {
      const next = prev.map(tier => tier.map(row => row.slice()));
      const a = next[dragFrom.tierIndex][dragFrom.r][dragFrom.c];
      const b = next[tierIndex][toR][toC];
      
      console.log('Drop data:', { a, b, isEmpty: b?.isEmpty });
      
      // Prevent dropping into aisles; only snap to valid grid blocks
      if (a === null || b === null) return prev;
      
      if (b.isEmpty) {
        // move into empty block
        const placeholder = { ...b };
        
        // Update the seat's number to match its new position
        const updatedSeat = {
          ...a,
          number: b.number, // Use the target cell's number
          id: `${a.rowLabel}-${b.number}`, // Update the ID
          tooltip: `${a.rowLabel}${b.number} · ${a.className} · ₹${a.price} · ${a.tier || 'Base'}`
        };
        
        console.log('Updated seat (drag):', { 
          oldId: a.id, 
          newId: updatedSeat.id, 
          oldNumber: a.number, 
          newNumber: updatedSeat.number,
          position: { row: toR, col: toC }
        });
        
        next[tierIndex][toR][toC] = updatedSeat;
        next[dragFrom.tierIndex][dragFrom.r][dragFrom.c] = placeholder;
        
        // Queue position update
        const updates: Array<{seatId: string, newX: number, newY: number}> = [];
        if (updatedSeat.id) {
          updates.push({ seatId: updatedSeat.id, newX: toC * 40, newY: toR * 40 });
        }
        if (updates.length > 0) {
          setPendingPositionUpdates(updates);
        }
      } else {
        // swap seats
        next[dragFrom.tierIndex][dragFrom.r][dragFrom.c] = b;
        next[tierIndex][toR][toC] = a;
        
        console.log('Swapped seats');
        
        // Queue position updates for both seats
        const updates: Array<{seatId: string, newX: number, newY: number}> = [];
        if (a.id) {
          updates.push({ seatId: a.id, newX: toC * 40, newY: toR * 40 });
        }
        if (b.id) {
          updates.push({ seatId: b.id, newX: dragFrom.c * 40, newY: dragFrom.r * 40 });
        }
        if (updates.length > 0) {
          setPendingPositionUpdates(updates);
        }
      }
      return next;
    });
    setDragFrom(null);
    setHoverTarget(null);
  };
  
  const onDragEnd = () => {
    setDragFrom(null);
    setHoverTarget(null);
  };

  // Handle pending position updates after state changes
  React.useEffect(() => {
    if (pendingPositionUpdates.length > 0 && onSeatPositionUpdate) {
      pendingPositionUpdates.forEach(({ seatId, newX, newY }) => {
        onSeatPositionUpdate(seatId, newX, newY);
      });
      setPendingPositionUpdates([]);
    }
  }, [pendingPositionUpdates, onSeatPositionUpdate]);

  const handleCellClickEdit = (tierIndex: number, r: number, c: number, rowLabel: string, ruleColor: string) => (e?: React.MouseEvent) => {
    if (!editMode) return;
    setEditableRowsByTier(prev => {
      const next = prev.map(tier => tier.map(row => row.slice()));
      const cell = next[tierIndex][r][c];
      if (cell === null) return prev; // aisle
      if (cell.isEmpty) {
        // add seat using the tier's class rule
        const classRule = organizedTiers[tierIndex]?.rule;
        const seatId = `${rowLabel}-${cell.number}`;
        next[tierIndex][r][c] = {
          id: seatId,
          number: cell.number,
          tooltip: `${rowLabel}${cell.number} · ${classRule ? classRule.className : 'Standard'} · ₹${classRule ? classRule.price : 0} · ${classRule ? classRule.tier : 'Base'}`,
          isReserved: false,
          isVIP: classRule?.tier === 'VIP',
          isEmpty: false,
          rowLabel: rowLabel,
          className: classRule?.className,
          price: classRule?.price,
          color: classRule?.color
        };
      } else if (e && (e.ctrlKey || e.altKey || e.shiftKey)) {
        // quick delete with modifier key
        next[tierIndex][r][c] = { ...cell, id: '', tooltip: '', isReserved: false, isVIP: false, isEmpty: true };
      }
      return next;
    });
  };

  const deleteSeatAt = (tierIndex: number, r: number, c: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editMode) return;
    setEditableRowsByTier(prev => {
      const next = prev.map(tier => tier.map(row => row.slice()));
      const cell = next[tierIndex][r][c];
      if (!cell || cell === null) return prev;
      next[tierIndex][r][c] = { ...cell, id: '', tooltip: '', isReserved: false, isVIP: false, isEmpty: true };
      return next;
    });
  };

  const addSeatCallback = ({ row, number, id }: any, addCb: any) => {
    const rowLabel = getRowLabel(row - 1);
    const seatClass = findSeatClassForRow(rowLabel, config.seatClassRules);
    onSeatClick?.(`${rowLabel}-${number}`, { rowLabel, columnNumber: number, seatClass });
    addCb(row, number, id);
  };

  const removeSeatCallback = ({ row, number, id }: any, removeCb: any) => {
    removeCb(row, number);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-500"></span>
            <span className="text-sm text-gray-300">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400"></span>
            <span className="text-sm text-gray-300">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 rounded-sm bg-gray-500"></span>
            <span className="text-sm text-gray-300">Sold</span>
          </div>
        </div>
        <span className="text-xs text-gray-500">Click seats to preview selection</span>
      </div>

      <div
        className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full"
        style={{
          minHeight: 480,
          // Subtle grid background for alignment guidance across the whole preview
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(148,163,184,0.08) 0px, rgba(148,163,184,0.08) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(148,163,184,0.08) 0px, rgba(148,163,184,0.08) 1px, transparent 1px, transparent 28px)'
        }}
      >
        <div className="space-y-4">
          {organizedTiers.map((tier, tierIndex) => {
            const header = tier.rule.className;
            const price = `₹${tier.rule.price}`;
            const tierName = tier.rule.tier;
            const slice = editMode ? (editableRowsByTier[tierIndex] || tier.rows) : tier.rows;
            
            return (
              <div key={`${header}-${tierIndex}`} className="relative">
                {/* Tier Header */}
                <div className="text-center mb-2">
                  <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-800 border border-gray-600">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: tier.rule.color }}></span>
                    <span className="text-sm font-semibold text-gray-200">{price}</span>
                    <span className="text-sm uppercase tracking-wide text-gray-300">{header}</span>
                    <span className="text-xs text-gray-500">{tierName}</span>
                  </div>
                </div>

                {/* Screen Section */}
                    <div className="flex justify-center">
                  <div className="relative">
                    {/* Row Labels (Left Side) - Cinema Style - Only show labels for this tier's rows */}
                    <div className="absolute -left-8 top-0 flex flex-col">
                      {tier.rowLabels.map((rowLabel, labelIndex) => (
                        <div 
                          key={rowLabel} 
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-800 dark:text-gray-200"
                          style={{ marginTop: `${labelIndex * 28}px` }}
                        >
                          {rowLabel}
                        </div>
                      ))}
                    </div>

                    {/* Seating Grid */}
                    <div className="ml-2">
                      {slice && Array.isArray(slice) ? slice.map((row, rowIdx) => (
                          <div key={rowIdx} className="flex items-center mb-1">
                            <div className="flex">
                            {row && Array.isArray(row) ? row.map((cell, colIdx) => {
                              const isHover = hoverTarget && hoverTarget.r === rowIdx && hoverTarget.c === colIdx;
                              
                                if (cell === null) {
                                  // Aisle: reserved gap, not interactive
                                  return <div key={colIdx} className="w-6 h-6 mx-0.5 opacity-20"></div>;
                                }
                              
                              const ruleColor = tier.rule.color;
                              const seatId = cell.id || `${cell.rowLabel}-${cell.number}`;
                                const processedSeat = processedSeats?.get(seatId);
                                const isActive = processedSeat?.isActive !== false;
                                const seatStatus = processedSeat?.status || 'available';
                                
                                // Debug logging
                                if (cell.isEmpty && !isActive) {
                                  console.log('Deleted seat found:', { seatId, cell, isActive, isEmpty: cell.isEmpty });
                                }
                              
                                return (
                                  <div
                                    key={colIdx}
                                  onDragOver={onDragOver(rowIdx, colIdx)}
                                    onDragLeave={onDragLeave}
                                  onDrop={onDrop(tierIndex, rowIdx, colIdx)}
                                    className={`w-6 h-6 mx-0.5 rounded relative group`}
                                  >
                                  {/* Hover highlight */}
                                  {isHover && editMode && dragFrom && (
                                      <div
                                        className="absolute inset-0 rounded"
                                        style={{ outline: `2px dashed ${ruleColor}AA`, outlineOffset: -2 }}
                                      />
                                    )}
                                  
                                    {cell.isEmpty ? (
                                      // Show "+" button in edit mode (for both active and deleted seats)
                                      (() => {
                                        console.log('Empty cell found:', { 
                                          seatId: cell.id || `${cell.rowLabel}-${cell.number}`, 
                                          isEmpty: cell.isEmpty, 
                                          isActive, 
                                          editMode,
                                          cell 
                                        });
                                        return editMode;
                                      })() ? (
                                        <button
                                          onClick={handleCellClickEdit(tierIndex, rowIdx, colIdx, cell.rowLabel, ruleColor)}
                                          className="w-full h-full rounded border border-dashed text-[9px] text-gray-400 flex items-center justify-center"
                                          style={{ borderColor: `${ruleColor}77`, backgroundColor: 'transparent' }}
                                          title={isActive ? "Add seat here" : "Restore deleted seat"}
                                        >
                                          +
                                        </button>
                                      ) : (
                                        // In view mode, show empty space
                                        <div className="w-full h-full rounded"></div>
                                      )
                                    ) : (
                                      <>
                                        <button
                                        draggable={editMode}
                                        onDragStart={onDragStart(tierIndex, rowIdx, colIdx)}
                                          onDragEnd={onDragEnd}
                                        onClick={() => onSeatClick?.(`${cell.rowLabel}-${cell.number}`, { 
                                          rowLabel: cell.rowLabel, 
                                          columnNumber: cell.number, 
                                          seatClass: tier.rule 
                                        })}
                                          onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (isActive === false) {
                                              onSeatRestoration?.(cell.id);
                                            } else {
                                              onSeatDeletion?.(cell.id);
                                            }
                                          }}
                                          title={cell.tooltip}
                                          disabled={reservedSeats.has(`${cell.rowLabel}-${cell.number}`)}
                                        className={`w-full h-full rounded border text-[9px] text-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                                            isActive === false ? 'opacity-50' : ''
                                        } ${reservedSeats.has(`${cell.rowLabel}-${cell.number}`) ? 'opacity-50 cursor-not-allowed' : ''} ${
                                            selectedSeats.has(`${cell.rowLabel}-${cell.number}`) ? 'ring-2 ring-yellow-400' : ''
                                        } ${editMode ? 'cursor-move' : 'cursor-pointer'}`}
                                        onClick={() => {
                                          const seatKey = `${cell.rowLabel}-${cell.number}`;
                                          const isReserved = reservedSeats.has(seatKey);
                                          const isSelected = selectedSeats.has(seatKey);
                                          console.log('Seat clicked:', {
                                            seatKey,
                                            cellId: cell.id,
                                            isReserved,
                                            isSelected,
                                            reservedSeats: Array.from(reservedSeats),
                                            selectedSeats: Array.from(selectedSeats),
                                            cell: { rowLabel: cell.rowLabel, number: cell.number, id: cell.id }
                                          });
                                          if (!isReserved) {
                                            // Use seatKey as the seatId to ensure consistent ID format
                                            onSeatClick?.(seatKey, cell);
                                          }
                                        }}
                                          style={{ 
                                            backgroundColor: reservedSeats.has(`${cell.rowLabel}-${cell.number}`) 
                                              ? 'rgba(107, 114, 128, 0.3)' 
                                              : selectedSeats.has(`${cell.rowLabel}-${cell.number}`)
                                                ? 'rgba(251, 191, 36, 0.3)'
                                                : isActive === false 
                                                  ? 'rgba(239,68,68,0.08)' 
                                                  : 'rgba(34,197,94,0.08)', 
                                            borderColor: reservedSeats.has(`${cell.rowLabel}-${cell.number}`)
                                              ? '#6b7280'
                                              : selectedSeats.has(`${cell.rowLabel}-${cell.number}`)
                                                ? '#fbbf24'
                                                : isActive === false 
                                                  ? '#ef4444' 
                                                  : ruleColor, 
                                            borderWidth: 2 as any 
                                          }}
                                        >
                                          {cell.number}
                                        </button>
                                      
                                      {isActive !== false && editMode && (
                                          <button
                                            aria-label="Delete seat"
                                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] leading-3 hidden group-hover:flex items-center justify-center hover:bg-red-700 transition-colors"
                                            style={{ zIndex: 10 as any }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                            deleteSeatAt(tierIndex, rowIdx, colIdx)(e);
                                            }}
                                          >
                                            ×
                                          </button>
                                        )}
                                      
                                      {isActive === false && editMode && (
                                          <button
                                            aria-label="Restore seat"
                                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-600 text-white text-[9px] leading-3 hidden group-hover:flex items-center justify-center hover:bg-green-700 transition-colors"
                                            style={{ zIndex: 10 as any }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              onSeatRestoration?.(cell.id);
                                            }}
                                          >
                                            ↺
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                            }) : null}
                          </div>
                      </div>
                      )) : null}
                    </div>
                            </div>
                          </div>

              </div>
            );
          })}
          
          
          {/* Screen Display */}
          <div className="mt-8 flex justify-center">
            <div className="w-64 h-3 bg-gradient-to-b from-blue-200 to-blue-300 rounded-b-2xl opacity-70"></div>
          </div>
        </div>
      </div>

      <style>{`
        /* Unified theme for both view and edit modes (edit mode theme) */
        .seat-picker .seat { border-radius: 6px !important; transition: background-color .15s ease, border-color .15s ease, transform .1s ease !important; }
        .seat-picker .seat.available { background-color: rgba(34,197,94,0.08) !important; border: 2px solid #22c55e !important; color: #d1fae5 !important; }
        .seat-picker .seat.available:hover { background-color: rgba(34,197,94,0.18) !important; border-color: #34d399 !important; transform: translateY(-1px) !important; }
        .seat-picker .seat.selected { background-color: #e11d48 !important; border-color: #e11d48 !important; color: #fff !important; }
        .seat-picker .seat.reserved { background-color: #4b5563 !important; border-color: #6b7280 !important; color: #e5e7eb !important; }
        .seat-picker .row-number { color: #9ca3af !important; }
        .seat-picker { background-color: #0b0f19 !important; width: 100% !important; }
        .seat-picker > div { margin-left: auto !important; margin-right: auto !important; }
      `}</style>
    </div>
  );
};

export default SeatLayoutBuilder;