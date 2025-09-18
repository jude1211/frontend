import React, { useMemo, Suspense } from 'react';
// Lazy import to bypass Vite optimizeDeps for this package
const LazySeatPicker = React.lazy(() => import('react-seat-picker')) as any;

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

const SeatLayoutBuilder: React.FC<SeatLayoutBuilderProps> = ({ config, maxReservableSeats = 10, onSeatClick }) => {
  const { rows, legend } = useMemo(() => {
    const generatedRows: any[][] = [];
    const legendMap = new Map<string, SeatClassRule>();

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
    }

    return { rows: generatedRows, legend: Array.from(legendMap.values()) };
  }, [config]);

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

      <div className="bg-gray-900 rounded-lg border border-gray-700 p-3 overflow-x-auto">
        <Suspense fallback={<div className="text-gray-400 text-sm">Loading seat map…</div>}>
          <LazySeatPicker
            rows={rows}
            alpha
            maxReservableSeats={maxReservableSeats}
            addSeatCallback={addSeatCallback}
            removeSeatCallback={removeSeatCallback}
            visible
            continuous
          />
        </Suspense>
      </div>

      <style>{`
        .seat-picker .seat { border-radius: 6px !important; }
        .seat-picker .seat.available { background-color: #2b2f36 !important; border: 1px solid #3a3f47 !important; }
        .seat-picker .seat.selected { background-color: #e11d48 !important; border-color: #e11d48 !important; }
        .seat-picker .seat.reserved { background-color: #4b5563 !important; }
      `}</style>
    </div>
  );
};

export default SeatLayoutBuilder;