import React, { useMemo } from 'react';
import SeatPicker from 'react-seat-picker';

export type PricingTier = 'Base' | 'Premium' | 'VIP';

export interface SeatClassRule {
  rows: string; // e.g., "A-C" or "D" or "G-J"
  className: string; // e.g., Gold, Silver, Balcony
  price: number;
  tier: PricingTier;
  color: string; // hex or tailwind color for legend; SeatPicker colors are limited, so we show legend
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

const SeatLayoutBuilder: React.FC<SeatLayoutBuilderProps> = ({ config, maxReservableSeats = 10, onSeatClick, editMode = false, onManualLayoutChange }) => {
  const { rows, legend, groups } = useMemo(() => {
    const generatedRows: any[][] = [];
    const legendMap = new Map<string, SeatClassRule>();
    const classGroups: Array<{ startIndex: number; endIndex: number; rule?: SeatClassRule }> = [];

    for (let r = 0; r < config.numRows; r++) {
      const rowLabel = getRowLabel(r);
      const rowClass = findSeatClassForRow(rowLabel, config.seatClassRules);
      if (rowClass) legendMap.set(rowClass.className, rowClass);

      const row: any[] = [];
      const totalVisualCols = config.numCols + config.aisleColumns.length;
      let seatCounter = 0;
      for (let c = 1; c <= totalVisualCols; c++) {
        if (config.aisleColumns.includes(c)) {
          row.push(null);
          continue;
        }
        seatCounter += 1;
        const seatId = `${rowLabel}-${seatCounter}`;
        const tooltip = `${rowLabel}${seatCounter} · ${rowClass ? rowClass.className : 'Standard'} · ₹${rowClass ? rowClass.price : 0} · ${rowClass ? rowClass.tier : 'Base'}`;
        const isVip = rowClass?.tier === 'VIP';
        row.push({
          id: seatId,
          number: seatCounter,
          tooltip,
          isReserved: false,
          isVIP: isVip,
        });
      }
      generatedRows.push(row);

      // Track contiguous groups per class for section headers/previews
      const prev = classGroups[classGroups.length - 1];
      if (!prev) {
        classGroups.push({ startIndex: r, endIndex: r, rule: rowClass });
      } else if (
        (prev.rule?.className || '') === (rowClass?.className || '') &&
        (prev.rule?.price || 0) === (rowClass?.price || 0) &&
        (prev.rule?.tier || '') === (rowClass?.tier || '')
      ) {
        prev.endIndex = r;
      } else {
        classGroups.push({ startIndex: r, endIndex: r, rule: rowClass });
      }
    }

    return { rows: generatedRows, legend: Array.from(legendMap.values()), groups: classGroups };
  }, [config]);

  const [editableRows, setEditableRows] = React.useState<any[][]>(rows);
  React.useEffect(() => {
    setEditableRows(rows);
  }, [rows]);

  const emitManual = (next: any[][]) => {
    const ids = next.map(r => r.map(cell => (cell && cell.id) || ''));
    onManualLayoutChange?.(ids);
  };

  const [dragFrom, setDragFrom] = React.useState<{ r: number; c: number } | null>(null);
  const onDragStart = (r: number, c: number) => () => setDragFrom({ r, c });
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (toR: number, toC: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragFrom) return;
    setEditableRows((prev) => {
      const next = prev.map(row => row.slice());
      const a = next[dragFrom.r][dragFrom.c];
      const b = next[toR][toC];
      if (a === null || b === null) return prev; // keep aisles intact
      next[dragFrom.r][dragFrom.c] = b;
      next[toR][toC] = a;
      emitManual(next);
      return next;
    });
    setDragFrom(null);
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

      <div className="bg-gray-900 rounded-lg border border-gray-700 p-3 overflow-x-auto" style={{ minHeight: 360 }}>
        <div className="space-y-6">
          {groups
            .filter((g) => !!g.rule && ['Base', 'Premium', 'VIP'].includes(g.rule!.tier))
            .map((g, idx) => {
            const header = g.rule ? `${g.rule.className}` : 'Standard';
            const price = g.rule ? `₹${g.rule.price}` : '';
            const tier = g.rule ? g.rule.tier : '';
              const slice = (editMode ? editableRows : rows).slice(g.startIndex, g.endIndex + 1);
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
                            <div className="w-6 text-right pr-2 text-xs text-gray-400">{getRowLabel(g.startIndex + rowIdx)}</div>
                            <div className="flex">
                              {row.map((cell, colIdx) => {
                                const globalR = g.startIndex + rowIdx;
                                const globalC = colIdx;
                                if (cell === null) {
                                  return <div key={colIdx} className="w-6 h-6 mx-0.5"></div>;
                                }
                                const ruleColor = g.rule?.color || '#22c55e';
                                return (
                                  <button
                                    key={colIdx}
                                    draggable
                                    onDragStart={onDragStart(globalR, globalC)}
                                    onDragOver={onDragOver}
                                    onDrop={onDrop(globalR, globalC)}
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
                  ) : (
                    <div className="flex justify-center">
                      <div>
                        {slice.map((row, rowIdx) => (
                          <div key={rowIdx} className="flex items-center mb-1">
                            <div className="w-6 text-right pr-2 text-xs text-gray-400">{getRowLabel(g.startIndex + rowIdx)}</div>
                            <div className="flex">
                              {row.map((cell, colIdx) => {
                                const globalR = g.startIndex + rowIdx;
                                const globalC = colIdx;
                                if (cell === null) {
                                  return <div key={colIdx} className="w-6 h-6 mx-0.5"></div>;
                                }
                                const ruleColor = g.rule?.color || '#22c55e';
                                const rowLabel = getRowLabel(globalR);
                                const seatClass = findSeatClassForRow(rowLabel, config.seatClassRules);
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