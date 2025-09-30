import React, { useState, useEffect } from 'react';
import { seatService } from '../services/seatService';
import BookNViewLoader from '../components/BookNViewLoader';
import SeatLayoutBuilder, { SeatLayoutConfig, SeatClassRule, PricingTier } from '../components/SeatLayoutBuilder';

interface Screen {
  id: string;
  name: string;
  capacity: number;
  type: '2D' | '3D' | 'IMAX' | '4DX';
  status: 'active' | 'maintenance' | 'inactive';
  currentMovie: string;
  nextShowtime: string;
  occupancy: number;
}

const ScreenManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [seatConfig, setSeatConfig] = useState<SeatLayoutConfig>({
    numRows: 8,
    numCols: 12,
    aisleColumns: [5, 9],
    seatClassRules: [
      { rows: 'A-C', className: 'Gold', price: 250, tier: 'Premium', color: '#f59e0b' },
      { rows: 'D-F', className: 'Silver', price: 180, tier: 'Base', color: '#9ca3af' },
      { rows: 'G-H', className: 'Balcony', price: 320, tier: 'VIP', color: '#22c55e' }
    ]
  });
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<{ id: string; rowLabel: string; columnNumber: number; seatClass?: SeatClassRule } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [manualLayout, setManualLayout] = useState<string[][] | null>(null);
  const [seatStats, setSeatStats] = useState<{ total: number; byClass: Record<string, number> }>({ total: 0, byClass: {} });
  const [aisleInput, setAisleInput] = useState<string>('5, 9');
  const [aisleError, setAisleError] = useState<boolean>(false);
  const updateRuleLayout = (idx: number, patch: Partial<{ numRows: number; numCols: number; aisleColumns: number[] }>) => {
    setSeatConfig(prev => {
      const rules = prev.seatClassRules.slice();
      const existing = rules[idx];
      const current = existing.layout || { numRows: prev.numRows, numCols: prev.numCols, aisleColumns: prev.aisleColumns };
      rules[idx] = { ...existing, layout: { ...current, ...patch } } as any;
      return { ...prev, seatClassRules: rules };
    });
  };

  const handleConfigNumberChange = (key: 'numRows' | 'numCols', value: number) => {
    setSeatConfig((prev) => ({ ...prev, [key]: Math.max(1, value || 0) }));
  };

  const handleAislesChange = (value: string) => {
    setAisleInput(value);
    const needsComma = value.trim().length > 0 && !value.includes(',');
    setAisleError(needsComma);
    const parsed = value
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);
    setSeatConfig((prev) => ({ ...prev, aisleColumns: parsed }));
  };

  const updateRule = (index: number, patch: Partial<SeatClassRule>) => {
    setSeatConfig((prev) => {
      const rules = prev.seatClassRules.slice();
      rules[index] = { ...rules[index], ...patch } as SeatClassRule;
      return { ...prev, seatClassRules: rules };
    });
  };

  const addRule = () => {
    setSeatConfig((prev) => ({
      ...prev,
      seatClassRules: prev.seatClassRules.concat({ rows: 'A', className: 'New Class', price: 0, tier: 'Base', color: '#64748b' })
    }));
  };

  const removeRule = (index: number) => {
    setSeatConfig((prev) => ({
      ...prev,
      seatClassRules: prev.seatClassRules.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        // Fetch saved screens from backend
        const ownerScreens = await seatService.getOwnerScreens().catch(() => null as any);
        if (!isMounted) return;
        if (ownerScreens && Array.isArray(ownerScreens.screens) && ownerScreens.screens.length > 0) {
          // Populate seat grid config from first screen for builder preview; list screens in cards
          const cards = ownerScreens.screens.map((s: any) => ({
            id: String(s.screenNumber),
            name: `Screen ${s.screenNumber}`,
            capacity: parseInt(String(s.seatingCapacity || '0'), 10) || 0,
            type: '2D' as const,
            status: 'active' as const,
            currentMovie: '—',
            nextShowtime: '—',
            occupancy: 0
          }));
          setScreens(cards);

          const first = ownerScreens.screens[0];
          const baseRows = typeof first.rows === 'number' ? first.rows : parseInt(String(first.rows || ''), 10);
          const baseCols = typeof first.columns === 'number' ? first.columns : parseInt(String(first.columns || ''), 10);
          const baseAisles: number[] = Array.isArray(first.aisleColumns) ? first.aisleColumns : [];
          const cls = (first.seatClasses || []) as Array<{ label: string; price: string }>;
          setSeatConfig(prev => {
            const rows = !isNaN(baseRows as any) && baseRows ? (baseRows as number) : prev.numRows;
            const cols = !isNaN(baseCols as any) && baseCols ? (baseCols as number) : prev.numCols;
            const aisles = baseAisles.length ? baseAisles : prev.aisleColumns;
            const nextRules = prev.seatClassRules.map(r => {
              const match = cls.find(c => c.label?.toLowerCase() === r.className.toLowerCase());
              return {
                ...r,
                price: match ? parseInt(String(match.price || '0'), 10) || r.price : r.price,
                layout: { numRows: rows, numCols: cols, aisleColumns: aisles },
              } as any;
            });
            setAisleInput(aisles.join(', '));
            return { ...prev, numRows: rows, numCols: cols, aisleColumns: aisles, seatClassRules: nextRules };
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMAX':
        return 'bg-purple-500';
      case '3D':
        return 'bg-blue-500';
      case '4DX':
        return 'bg-orange-500';
      default:
        return 'bg-brand-red';
    }
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return 'text-green-400';
    if (occupancy >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return <BookNViewLoader fullScreen={true} text="Loading Screens..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      {/* Header */}
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-tv text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Screen Management</h1>
                <p className="text-brand-light-gray">Manage your theatre screens and configurations</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Add Screen</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Dynamic Seat Layout Configurator */}
        <div className="bg-brand-gray rounded-2xl border border-brand-dark/40 shadow-lg mb-8">
          <div className="p-6 border-b border-brand-dark/30">
            <h2 className="text-xl font-bold text-white">Seat Layout Configurator</h2>
            <p className="text-brand-light-gray text-sm">Configure rows, columns, aisles and pricing tiers. Preview updates live.</p>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-brand-light-gray mb-1">Number of Rows</label>
                <input
                  type="number"
                  min={1}
                  value={seatConfig.numRows}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigNumberChange('numRows', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-light-gray mb-1">Seats Per Row (excluding aisles)</label>
                <input
                  type="number"
                  min={1}
                  value={seatConfig.numCols}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleConfigNumberChange('numCols', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-light-gray mb-1">Aisle Columns (1-based, comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., 5, 9"
                  value={aisleInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAislesChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-brand-dark border rounded-lg text-white focus:outline-none focus:ring-2 ${aisleError ? 'border-red-500 focus:ring-red-500' : 'border-brand-dark/30 focus:ring-brand-red'}`}
                />
                {aisleError && (
                  <p className="mt-1 text-xs text-red-400">Please include a comma between aisle columns, e.g., 5, 9</p>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-white">Seat Classes & Pricing</label>
                  <button onClick={addRule} className="text-xs bg-brand-red text-white px-2 py-1 rounded">Add Class</button>
                </div>
                <div className="space-y-3">
                  {seatConfig.seatClassRules.map((rule, idx) => (
                    <div key={idx} className="bg-brand-dark rounded-lg border border-brand-dark/30 p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Rows (e.g., A-C, D, G-J)</label>
                          <input
                            type="text"
                            value={rule.rows}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(idx, { rows: e.target.value })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Class Name</label>
                          <input
                            type="text"
                            value={rule.className}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(idx, { className: e.target.value })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={rule.price}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(idx, { price: parseInt(e.target.value, 10) || 0 })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Tier</label>
                          <select
                            value={rule.tier}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateRule(idx, { tier: e.target.value as PricingTier })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          >
                            <option value="Base">Base</option>
                            <option value="Premium">Premium</option>
                            <option value="VIP">VIP</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-brand-light-gray mb-1">Color</label>
                          <input
                            type="color"
                            value={rule.color}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(idx, { color: e.target.value })}
                            className="w-16 h-8 bg-black/30 border border-brand-dark/30 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Rows for {rule.className}</label>
                          <input
                            type="number"
                            min={1}
                            value={(rule.layout?.numRows) ?? seatConfig.numRows}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRuleLayout(idx, { numRows: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Seats/Row for {rule.className}</label>
                          <input
                            type="number"
                            min={1}
                            value={(rule.layout?.numCols) ?? seatConfig.numCols}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRuleLayout(idx, { numCols: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-brand-light-gray mb-1">Aisles for {rule.className} (1-based, comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., 5, 9"
                            value={(rule.layout?.aisleColumns ?? seatConfig.aisleColumns).join(', ')}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRuleLayout(idx, { aisleColumns: e.target.value.split(',').map((v: string) => parseInt(v.trim(), 10)).filter((n: number) => !isNaN(n)).sort((a: number,b: number)=>a-b) })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => removeRule(idx)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-white font-semibold">Live Seating Preview</h3>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-xs text-brand-light-gray">
                    <input type="checkbox" checked={editMode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditMode(e.target.checked)} />
                    <span>Edit Mode (drag & drop)</span>
                  </label>
                  {editMode && (
                    <div className="text-xs text-brand-light-gray hidden md:block">
                      Tip: Click empty block to add seat. Ctrl/Alt/Shift+Click on a seat to delete. Drag to move.
                    </div>
                  )}
                  {selectedSeatInfo && (
                    <div className="text-xs text-brand-light-gray">
                      Selected: <span className="text-white font-medium">{selectedSeatInfo.id}</span>
                      {selectedSeatInfo.seatClass && (
                        <span> · {selectedSeatInfo.seatClass.className} · ₹{selectedSeatInfo.seatClass.price} · {selectedSeatInfo.seatClass.tier}</span>
                      )}
                    </div>
                  )}
                  <div className="hidden md:flex items-center text-xs text-brand-light-gray space-x-3">
                    <span>Total: <span className="text-white">{seatStats.total}</span></span>
                    {Object.entries(seatStats.byClass).map(([k,v]) => (
                      <span key={k}>{k}: <span className="text-white">{v}</span></span>
                    ))}
                  </div>
                </div>
              </div>
              <SeatLayoutBuilder
                config={seatConfig}
                onSeatClick={(id, meta) => setSelectedSeatInfo({ id, ...meta })}
                maxReservableSeats={10}
                editMode={editMode}
                onManualLayoutChange={(ids) => setManualLayout(ids)}
                onSeatGridChange={(grid) => {
                  const counts: Record<string, number> = {};
                  let total = 0;
                  grid.forEach(row => row.forEach(cell => {
                    if (cell.number > 0 && cell.category) {
                      total += 1;
                      counts[cell.category] = (counts[cell.category] || 0) + 1;
                    }
                  }));
                  setSeatStats({ total, byClass: counts });
                }}
              />
              {editMode && (
                <div className="mt-2 text-xs text-brand-light-gray">Manual layout changes will be saved with your screen configuration.</div>
              )}
            </div>
          </div>
        </div>
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Screens</p>
                <p className="text-2xl font-bold text-white">{screens.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-tv text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Active Screens</p>
                <p className="text-2xl font-bold text-white">{screens.filter(s => s.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Capacity</p>
                <p className="text-2xl font-bold text-white">{screens.reduce((sum, screen) => sum + screen.capacity, 0)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Avg Occupancy</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(screens.reduce((sum, screen) => sum + screen.occupancy, 0) / screens.length)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-pie text-white"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Screens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <div key={screen.id} className="bg-brand-gray rounded-2xl border border-brand-dark/40 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Screen Header */}
              <div className="p-6 border-b border-brand-dark/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{screen.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(screen.status)}`}>
                    {screen.status}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(screen.type)}`}>
                    {screen.type}
                  </span>
                  <span className="text-brand-light-gray text-sm">
                    Capacity: {screen.capacity}
                  </span>
                </div>

                {/* Occupancy Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-brand-light-gray mb-1">
                    <span>Occupancy</span>
                    <span className={getOccupancyColor(screen.occupancy)}>{screen.occupancy}%</span>
                  </div>
                  <div className="w-full bg-brand-dark rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        screen.occupancy >= 80 ? 'bg-green-500' : 
                        screen.occupancy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${screen.occupancy}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Screen Info */}
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-light-gray text-sm">Current Movie:</span>
                    <span className="text-white font-medium">{screen.currentMovie}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-brand-light-gray text-sm">Next Show:</span>
                    <span className="text-white font-medium">{screen.nextShowtime}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-brand-light-gray text-sm">Available Seats:</span>
                    <span className="text-white font-medium">
                      {Math.round(screen.capacity * (100 - screen.occupancy) / 100)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 mt-6">
                  <button className="flex-1 bg-brand-red text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  <button className="flex-1 bg-brand-dark text-white py-2 rounded-lg hover:bg-brand-dark/80 transition-colors text-sm">
                    <i className="fas fa-eye mr-1"></i>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScreenManagement; 