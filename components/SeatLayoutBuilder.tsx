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
  onManualLayoutChange?: (seatIdsByRow: string[][]) => void;
  onSeatGridChange?: (grid: Array<Array<{ row: number; col: number; rowLabel: string; number: number; category?: string }>>) => void;
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

const SeatLayoutBuilder: React.FC<SeatLayoutBuilderProps> = ({ config, maxReservableSeats = 10, onSeatClick, editMode = false, onManualLayoutChange, onSeatGridChange }) => {
  const { groups, legend, classByName } = useMemo(() => {
    const legendMap = new Map<string, SeatClassRule>();
    const classByNameMap = new Map<string, SeatClassRule>();
    const classGroups: Array<{ rule: SeatClassRule; rows: any[][] }> = [];

    config.seatClassRules.forEach((rule) => {
      legendMap.set(rule.className, rule);
      classByNameMap.set(rule.className, rule);
      const layout = rule.layout || { numRows: config.numRows, numCols: config.numCols, aisleColumns: config.aisleColumns };
      const rows: any[][] = [];
      for (let r = 0; r < layout.numRows; r++) {
        const rowLabel = getRowLabel(r);
        const totalVisualCols = layout.numCols + layout.aisleColumns.length;
        let seatCounter = 0;
        const row: any[] = [];
        for (let c = 1; c <= totalVisualCols; c++) {
          if (layout.aisleColumns.includes(c)) {
            row.push(null);
            continue;
          }
          seatCounter += 1;
          const seatId = `${rowLabel}-${seatCounter}`;
          const tooltip = `${rowLabel}${seatCounter} · ${rule.className} · ₹${rule.price} · ${rule.tier}`;
          const isVip = rule.tier === 'VIP';
          row.push({ id: seatId, number: seatCounter, tooltip, isReserved: false, isVIP: isVip, isEmpty: false });
        }
        rows.push(row);
      }
      classGroups.push({ rule, rows });
    });

    return { groups: classGroups, legend: Array.from(legendMap.values()), classByName: classByNameMap };
  }, [config]);

  const [editableRowsByGroup, setEditableRowsByGroup] = React.useState<any[][][]>(groups.map(g => g.rows));
  React.useEffect(() => {
    setEditableRowsByGroup(groups.map(g => g.rows));
  }, [groups]);

  const emitManual = (next: any[][]) => {
    const ids = next.map(r => r.map(cell => (cell && !cell.isEmpty ? cell.id : '')));
    onManualLayoutChange?.(ids);
    const grid = next.map((r, rIdx) => r.map((cell, cIdx) => {
      const rowLabel = getRowLabel(rIdx);
      return {
        row: rIdx,
        col: cIdx,
        rowLabel,
        number: cell ? cell.number : 0,
        category: cell && !cell.isEmpty ? (findSeatClassForRow(rowLabel, config.seatClassRules)?.className) : undefined,
      };
    }));
    onSeatGridChange?.(grid);
  };

  React.useEffect(() => {
    const flat: any[][] = [];
    editableRowsByGroup.forEach(gr => gr.forEach(r => flat.push(r)));
    emitManual(flat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableRowsByGroup]);

  const [dragFrom, setDragFrom] = React.useState<{ g: number; r: number; c: number } | null>(null);
  const [hoverTarget, setHoverTarget] = React.useState<{ r: number; c: number } | null>(null);
  const onDragStart = (g: number, r: number, c: number) => (e: React.DragEvent) => {
    // Some browsers require data to start a drag operation
    try { e.dataTransfer.setData('text/plain', `${g},${r},${c}`); } catch {}
    e.dataTransfer.effectAllowed = 'move';
    setDragFrom({ g, r, c });
  };
  const onDragOver = (toR: number, toC: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setHoverTarget({ r: toR, c: toC });
  };
  const onDragLeave = () => setHoverTarget(null);
  const onDrop = (toG: number, toR: number, toC: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragFrom) return;
    setEditableRowsByGroup((prev) => {
      const next = prev.map(group => group.map(row => row.slice()));
      const a = next[dragFrom.g][dragFrom.r][dragFrom.c];
      const b = next[toG][toR][toC];
      // Prevent dropping into aisles; only snap to valid grid blocks
      if (a === null || b === null) return prev;
      if (b.isEmpty) {
        // move into empty block
        const placeholder = { ...b };
        next[toG][toR][toC] = a;
        next[dragFrom.g][dragFrom.r][dragFrom.c] = placeholder;
      } else {
        // swap seats
        next[dragFrom.g][dragFrom.r][dragFrom.c] = b;
        next[toG][toR][toC] = a;
      }
      return next;
    });
    setDragFrom(null);
    setHoverTarget(null);
  };
  const onDragEnd = () => setHoverTarget(null);

  const handleCellClickEdit = (g: number, r: number, c: number, rowLabel: string, ruleColor: string) => (e?: React.MouseEvent) => {
    if (!editMode) return;
    setEditableRowsByGroup(prev => {
      const next = prev.map(group => group.map(row => row.slice()));
      const cell = next[g][r][c];
      if (cell === null) return prev; // aisle
      if (cell.isEmpty) {
        // add seat using the row's current class rule (Gold/Silver/Balcony)
        const classRule = config.seatClassRules[g];
        const seatId = `${rowLabel}-${cell.number}`;
        next[g][r][c] = {
          id: seatId,
          number: cell.number,
          tooltip: `${rowLabel}${cell.number} · ${classRule ? classRule.className : 'Standard'} · ₹${classRule ? classRule.price : 0} · ${classRule ? classRule.tier : 'Base'}`,
          isReserved: false,
          isVIP: classRule?.tier === 'VIP',
          isEmpty: false,
        };
      } else if (e && (e.ctrlKey || e.altKey || e.shiftKey)) {
        // quick delete with modifier key
        next[g][r][c] = { ...cell, id: '', tooltip: '', isReserved: false, isVIP: false, isEmpty: true };
      }
      return next;
    });
  };

  const deleteSeatAt = (g: number, r: number, c: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editMode) return;
    setEditableRowsByGroup(prev => {
      const next = prev.map(group => group.map(row => row.slice()));
      const cell = next[g][r][c];
      if (!cell || cell === null) return prev;
      next[g][r][c] = { ...cell, id: '', tooltip: '', isReserved: false, isVIP: false, isEmpty: true };
      return next;
    });
  };

  const addSeatCallback = ({ row, number, id }: any, addCb: any) => {
    const rowLabel = getRowLabel(row - 1);
    const seatClass = findSeatClassForRow(rowLabel, config.seatClassRules);
    onSeatClick?.(id, { rowLabel, columnNumber: number, seatClass });
    addCb(row, number, id);
  };

  const removeSeatCallback = ({ row, number, id }: any, removeCb: any) => {
    removeCb(row, number);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {legend.map((rule) => (
            <div key={rule.className} className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: rule.color }}></span>
              <span className="text-sm text-gray-300">{rule.className} · ₹{rule.price} · {rule.tier}</span>
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">Click seats to preview selection</span>
      </div>

      <div
        className="bg-gray-900 rounded-lg border border-gray-700 p-3 overflow-x-auto"
        style={{
          minHeight: 360,
          // Subtle grid background for alignment guidance across the whole preview
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(148,163,184,0.08) 0px, rgba(148,163,184,0.08) 1px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(148,163,184,0.08) 0px, rgba(148,163,184,0.08) 1px, transparent 1px, transparent 28px)'
        }}
      >
        <div className="space-y-6">
          {groups
            .filter((g) => !!g.rule && ['Base', 'Premium', 'VIP'].includes(g.rule!.tier))
            .map((g, idx) => {
            const header = g.rule ? `${g.rule.className}` : 'Standard';
            const price = g.rule ? `₹${g.rule.price}` : '';
            const tier = g.rule ? g.rule.tier : '';
              const slice = (editMode ? editableRowsByGroup[idx] : g.rows);
            return (
              <div key={`${header}-${idx}`}>
                <div className="text-center text-xs md:text-sm text-gray-300 mb-2">
                  <span className="font-semibold">{price}</span>
                  {price && ' '}
                  <span className="uppercase tracking-wide">{header}</span>
                  {tier && <span className="text-gray-500"> · {tier}</span>}
                </div>
                  {editMode ? (
                    <div className="flex justify-center">
                      <div>
                        {slice.map((row, rowIdx) => (
                          <div key={rowIdx} className="flex items-center mb-1">
                            <div className="w-6 text-right pr-2 text-xs text-gray-400">{getRowLabel(rowIdx)}</div>
                            <div className="flex">
                              {row.map((cell, colIdx) => {
                                const globalR = rowIdx;
                                const globalC = colIdx;
                                const isHover = hoverTarget && hoverTarget.r === globalR && hoverTarget.c === globalC;
                                if (cell === null) {
                                  // Aisle: reserved gap, not interactive
                                  return <div key={colIdx} className="w-6 h-6 mx-0.5 opacity-20"></div>;
                                }
                                const ruleColor = g.rule?.color || '#22c55e';
                                return (
                                  <div
                                    key={colIdx}
                                    onDragOver={onDragOver(globalR, globalC)}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop(idx, globalR, globalC)}
                                    className={`w-6 h-6 mx-0.5 rounded relative group`}
                                  >
                                    {/* placeholder highlight for snap block */}
                                    {isHover && (
                                      <div
                                        className="absolute inset-0 rounded"
                                        style={{ outline: `2px dashed ${ruleColor}AA`, outlineOffset: -2 }}
                                      />
                                    )}
                                    {cell.isEmpty ? (
                                      <button
                                        onClick={handleCellClickEdit(idx, globalR, globalC, getRowLabel(globalR), ruleColor)}
                                        className="w-full h-full rounded border border-dashed text-[10px] text-gray-400 flex items-center justify-center"
                                        style={{ borderColor: `${ruleColor}77`, backgroundColor: 'transparent' }}
                                        title="Add seat here"
                                      >
                                        +
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          draggable
                                          onDragStart={onDragStart(idx, globalR, globalC)}
                                          onDragEnd={onDragEnd}
                                          onClick={handleCellClickEdit(idx, globalR, globalC, getRowLabel(globalR), ruleColor)}
                                          title={cell.tooltip}
                                          className="w-full h-full rounded border text-[10px] text-gray-200 flex items-center justify-center"
                                          style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: ruleColor, borderWidth: 2 as any }}
                                        >
                                          {cell.number}
                                        </button>
                                        <button
                                          aria-label="Delete seat"
                                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[9px] leading-3 hidden group-hover:flex items-center justify-center"
                                          style={{ zIndex: 10 as any }}
                                          onClick={deleteSeatAt(idx, globalR, globalC)}
                                        >
                                          ×
                                        </button>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div>
                        {slice.map((row, rowIdx) => (
                          <div key={rowIdx} className="flex items-center mb-1">
                            <div className="w-6 text-right pr-2 text-xs text-gray-400">{getRowLabel(rowIdx)}</div>
                            <div className="flex">
                              {row.map((cell, colIdx) => {
                                const globalR = rowIdx;
                                const globalC = colIdx;
                                if (cell === null) {
                                  return <div key={colIdx} className="w-6 h-6 mx-0.5"></div>;
                                }
                                const ruleColor = g.rule?.color || '#22c55e';
                                const rowLabel = getRowLabel(globalR);
                                const seatClass = config.seatClassRules[idx];
                                return (
                                  <button
                                    key={colIdx}
                                    onClick={() => onSeatClick?.(cell.id, { rowLabel, columnNumber: cell.number, seatClass })}
                                    title={cell.tooltip}
                                    className="w-6 h-6 mx-0.5 rounded border text-[10px] text-gray-200 flex items-center justify-center"
                                    style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: ruleColor, borderWidth: 2 as any }}
                                  >
                                    {cell.number}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
          <div className="mt-2 flex justify-center">
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