import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';
import SeatLayoutBuilder, { SeatLayoutConfig, SeatClassRule, PricingTier } from '../components/SeatLayoutBuilder';
import { apiService } from '../services/api';

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
  const [seatStats, setSeatStats] = useState<{ total: number; byClass: Record<string, number> }>({ total: 0, byClass: {} });
  const [aisleInput, setAisleInput] = useState<string>('5, 9');
  const [aisleError, setAisleError] = useState<boolean>(false);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [layoutSaved, setLayoutSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [processedSeats, setProcessedSeats] = useState<Map<string, any>>(new Map());
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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
  };

  const updateRule = (index: number, patch: Partial<SeatClassRule>) => {
    setSeatConfig((prev) => {
      const rules = prev.seatClassRules.slice();
      rules[index] = { ...rules[index], ...patch } as SeatClassRule;
      return { ...prev, seatClassRules: rules };
    });
    setHasUnsavedChanges(true);
  };

  const addRule = () => {
    setSeatConfig((prev) => ({
      ...prev,
      seatClassRules: prev.seatClassRules.concat({ rows: 'A', className: 'New Class', price: 0, tier: 'Base', color: '#64748b' })
    }));
    setHasUnsavedChanges(true);
  };

  const removeRule = (index: number) => {
    setSeatConfig((prev) => ({
      ...prev,
      seatClassRules: prev.seatClassRules.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  // Load saved layout for a screen
  const loadScreenLayout = async (screenId: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.getScreenLayout(screenId);
      
      if (response.success && response.data) {
        const layout = response.data;
        
        // Restore the exact configuration
        setSeatConfig({
          numRows: layout.meta?.rows || 8,
          numCols: layout.meta?.columns || 12,
          aisleColumns: layout.meta?.aisles || [5, 9],
          seatClassRules: layout.seatClasses?.map((sc: any) => ({
            rows: sc.rows,
            className: sc.className,
            price: sc.price,
            tier: sc.tier,
            color: sc.color
          })) || [
            { rows: 'A-C', className: 'Gold', price: 250, tier: 'Premium', color: '#f59e0b' },
            { rows: 'D-F', className: 'Silver', price: 180, tier: 'Base', color: '#9ca3af' },
            { rows: 'G-H', className: 'Balcony', price: 320, tier: 'VIP', color: '#22c55e' }
          ]
        });
        
        setAisleInput(layout.meta?.aisles?.join(', ') || '5, 9');
        
        // Store the complete seat data for rendering
        if (layout.seats && layout.seats.length > 0) {
          // Process saved seats to restore exact layout
          processSavedSeats(layout.seats);
        }
        
        setLayoutSaved(true);
        setHasUnsavedChanges(false);
      } else {
        // No saved layout, use defaults
        setLayoutSaved(false);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading screen layout:', error);
      // On error, use default configuration
      setLayoutSaved(false);
      setHasUnsavedChanges(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Process saved seats to restore exact layout including positions and deletions
  const processSavedSeats = (savedSeats: any[]) => {
    const seatsById = new Map<string, any>();
    savedSeats.forEach((seat) => {
      const key = `${seat.rowLabel}-${seat.number}`;
      seatsById.set(key, seat); // include inactive seats so they stay hidden
    });
    console.log('Loaded seats from DB:', savedSeats.length, 'mapped:', seatsById.size);
    setProcessedSeats(seatsById);
  };

  // Save current layout for a screen
  const saveScreenLayout = async () => {
    console.log('Save layout clicked, selectedScreenId:', selectedScreenId);
    if (!selectedScreenId) {
      console.log('No screen selected, cannot save');
      return;
    }
    
    try {
      setIsSavingLayout(true);
      console.log('Starting to save layout...');
      
      // Get current seat grid data from the SeatLayoutBuilder
      const currentSeats = getCurrentSeatData();
      console.log('Current seats data:', currentSeats);
      
      const layoutData = {
        screenId: selectedScreenId,
        screenName: screens.find(s => s.id === selectedScreenId)?.name || `Screen ${selectedScreenId}`,
        meta: {
          rows: seatConfig.numRows,
          columns: seatConfig.numCols,
          aisles: seatConfig.aisleColumns
        },
        seatClasses: seatConfig.seatClassRules.map(rule => ({
          className: rule.className,
          price: rule.price,
          color: rule.color,
          tier: rule.tier,
          rows: rule.rows
        })),
        seats: currentSeats,
        updatedAt: new Date().toISOString()
      };

      console.log('Layout data to save:', layoutData);
      const response = await apiService.saveScreenLayout(selectedScreenId, layoutData);
      console.log('Save response:', response);
      
      if (response.success) {
        setLayoutSaved(true);
        setHasUnsavedChanges(false);
        // Show success message
        setTimeout(() => setLayoutSaved(false), 3000);
      } else {
        console.error('Failed to save layout:', response.error);
      }
    } catch (error) {
      console.error('Error saving screen layout:', error);
    } finally {
      setIsSavingLayout(false);
    }
  };

  // Get current seat data from the layout builder, merged with processed overrides (positions/deletions)
  const getCurrentSeatData = () => {
    const seats: any[] = [];
    const seatClassByName = new Map<string, SeatClassRule>();
    
    seatConfig.seatClassRules.forEach(rule => {
      seatClassByName.set(rule.className, rule);
    });

    for (let r = 0; r < seatConfig.numRows; r++) {
      const rowLabel = String.fromCharCode('A'.charCodeAt(0) + r);
      let seatNumber = 1;
      for (let c = 1; c <= seatConfig.numCols + seatConfig.aisleColumns.length; c++) {
        if (seatConfig.aisleColumns.includes(c)) {
          continue;
        }
        const seatClass = findSeatClassForRow(rowLabel, seatConfig.seatClassRules);
        if (seatClass) {
          const defaultX = (c - 1) * 40;
          const defaultY = r * 40;
          const seatId = `${rowLabel}-${seatNumber}`;
          const override = processedSeats.get(seatId);
          seats.push({
            rowLabel,
            number: seatNumber,
            x: override?.x ?? defaultX,
            y: override?.y ?? defaultY,
            className: seatClass.className,
            price: seatClass.price,
            color: seatClass.color,
            status: override?.status ?? 'available',
            isActive: override?.isActive !== false,
            originalRow: rowLabel,
            originalNumber: seatNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        seatNumber++;
      }
    }
    return seats;
  };

  // Handle seat deletion (mark as inactive instead of removing)
  const handleSeatDeletion = (seatId: string) => {
    setProcessedSeats(prev => {
      const newSeats = new Map(prev);
      const seat = newSeats.get(seatId);
      if (seat) {
        newSeats.set(seatId, {
          ...seat,
          isActive: false,
          status: 'deleted',
          updatedAt: new Date().toISOString()
        });
      }
      return newSeats;
    });
    setHasUnsavedChanges(true);
  };

  // Handle seat drag and drop position updates
  const handleSeatPositionUpdate = (seatId: string, newX: number, newY: number) => {
    setProcessedSeats(prev => {
      const newSeats = new Map(prev);
      const seat = newSeats.get(seatId);
      if (seat) {
        newSeats.set(seatId, {
          ...seat,
          x: newX,
          y: newY,
          updatedAt: new Date().toISOString()
        });
      }
      return newSeats;
    });
    setHasUnsavedChanges(true);
  };

  // Handle seat restoration (mark as active again)
  const handleSeatRestoration = (seatId: string) => {
    setProcessedSeats(prev => {
      const newSeats = new Map(prev);
      const seat = newSeats.get(seatId);
      if (seat) {
        newSeats.set(seatId, {
          ...seat,
          isActive: true,
          status: 'available',
          updatedAt: new Date().toISOString()
        });
      }
      return newSeats;
    });
    setHasUnsavedChanges(true);
  };

  // Helper function to find seat class for a row
  const findSeatClassForRow = (rowLabel: string, rules: SeatClassRule[]): SeatClassRule | undefined => {
    for (const rule of rules) {
      const parts = rule.rows.split(',');
      for (const part of parts) {
        const covered = parseRowRange(part);
        if (covered.has(rowLabel)) return rule;
      }
    }
    return undefined;
  };

  // Helper function to parse row ranges
  const parseRowRange = (range: string): Set<string> => {
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
  };

  // Handle screen selection
  const handleScreenSelect = (screenId: string) => {
    setSelectedScreenId(screenId);
    loadScreenLayout(screenId);
  };

  useEffect(() => {
    // Simulate loading screens
    setScreens([
      {
        id: '1',
        name: 'Screen 1',
        capacity: 120,
        type: '2D',
        status: 'active',
        currentMovie: 'Superman',
        nextShowtime: '7:30 PM',
        occupancy: 85
      },
      {
        id: '2',
        name: 'Screen 2',
        capacity: 150,
        type: '3D',
        status: 'active',
        currentMovie: 'Saiyara',
        nextShowtime: '8:00 PM',
        occupancy: 92
      },
      {
        id: '3',
        name: 'Screen 3',
        capacity: 200,
        type: 'IMAX',
        status: 'active',
        currentMovie: 'F1: The Movie',
        nextShowtime: '6:30 PM',
        occupancy: 78
      },
      {
        id: '4',
        name: 'Screen 4',
        capacity: 80,
        type: '4DX',
        status: 'maintenance',
        currentMovie: 'None',
        nextShowtime: 'N/A',
        occupancy: 0
      }
    ]);
    // Prefill from signup if available
    try {
      const rawSignup = localStorage.getItem('theatreOwnerSignupScreens');
      const rawOwner = localStorage.getItem('theatreOwnerData');
      let screensFromSignup: any[] | null = null;
      if (rawSignup) {
        screensFromSignup = JSON.parse(rawSignup);
      } else if (rawOwner) {
        const parsed = JSON.parse(rawOwner);
        if (parsed && parsed.screens) screensFromSignup = parsed.screens;
      }
      if (Array.isArray(screensFromSignup) && screensFromSignup.length > 0) {
        const first = screensFromSignup[0];
        const numRows = parseInt(first?.rows || '');
        const numCols = parseInt(first?.columns || '');
        const aisleCols: number[] = (first?.aisleColumns || '')
          .split(',')
          .map((v: string) => parseInt(v.trim(), 10))
          .filter((n: number) => !isNaN(n))
          .sort((a: number, b: number) => a - b);
        const cls = (first?.seatClasses || []) as Array<{ label: string; price: string }>;
        setSeatConfig(prev => {
          const baseRows = !isNaN(numRows) ? numRows : prev.numRows;
          const baseCols = !isNaN(numCols) ? numCols : prev.numCols;
          const baseAisles = aisleCols.length ? aisleCols : prev.aisleColumns;
          const nextRules = prev.seatClassRules.map(r => {
            const match = cls.find(c => c.label.toLowerCase() === r.className.toLowerCase());
            return {
              ...r,
              price: match ? parseInt(match.price || '0', 10) || r.price : r.price,
              layout: { numRows: baseRows, numCols: baseCols, aisleColumns: baseAisles },
            } as any;
          });
          setAisleInput(baseAisles.join(', '));
          return { ...prev, numRows: baseRows, numCols: baseCols, aisleColumns: baseAisles, seatClassRules: nextRules };
        });
      }
    } catch {}
    // Auto-select first screen so Save button has an id by default
    setSelectedScreenId(prev => prev ?? '1');
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
              onClick={async () => {
                try {
                  const profile = await apiService.getTheatreOwnerProfile();
                  const ownerId = profile?.success ? (profile.data?.id || profile.data?._id) : JSON.parse(localStorage.getItem('theatreOwnerData') || '{}')._id;
                  if (!ownerId) return;
                  const name = window.prompt('Screen name (optional):', `Screen ${screens.length + 1}`) || `Screen ${screens.length + 1}`;
                  const res = await apiService.addOwnerScreen(ownerId as string, { name });
                  if (res.success) {
                    // Reflect basic count locally
                    const updated = (res.data?.screens || []).map((s:any) => ({
                      id: String(s.screenNumber),
                      name: s.name || `Screen ${s.screenNumber}`,
                      capacity: 120,
                      type: (s.type || '2D') as any,
                      status: 'active' as const,
                      currentMovie: 'None',
                      nextShowtime: 'N/A',
                      occupancy: 0
                    }));
                    setScreens(updated);
                    setSelectedScreenId(String(updated.length));
                  }
                } catch (e) {
                  console.error('Add screen failed', e);
                }
              }}
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
                  onChange={(e) => handleConfigNumberChange('numRows', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-light-gray mb-1">Seats Per Row (excluding aisles)</label>
                <input
                  type="number"
                  min={1}
                  value={seatConfig.numCols}
                  onChange={(e) => handleConfigNumberChange('numCols', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-dark/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div>
                <label className="block text-sm text-brand-light-gray mb-1">Aisle Columns (1-based, comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g., 5, 9"
                  value={aisleInput}
                  onChange={(e) => handleAislesChange(e.target.value)}
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
                            onChange={(e) => updateRule(idx, { rows: e.target.value })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Class Name</label>
                          <input
                            type="text"
                            value={rule.className}
                            onChange={(e) => updateRule(idx, { className: e.target.value })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={rule.price}
                            onChange={(e) => updateRule(idx, { price: parseInt(e.target.value, 10) || 0 })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Tier</label>
                          <select
                            value={rule.tier}
                            onChange={(e) => updateRule(idx, { tier: e.target.value as PricingTier })}
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
                            onChange={(e) => updateRule(idx, { color: e.target.value })}
                            className="w-16 h-8 bg-black/30 border border-brand-dark/30 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Rows for {rule.className}</label>
                          <input
                            type="number"
                            min={1}
                            value={(rule.layout?.numRows) ?? seatConfig.numRows}
                            onChange={(e) => updateRuleLayout(idx, { numRows: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-light-gray mb-1">Seats/Row for {rule.className}</label>
                          <input
                            type="number"
                            min={1}
                            value={(rule.layout?.numCols) ?? seatConfig.numCols}
                            onChange={(e) => updateRuleLayout(idx, { numCols: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="w-full px-2 py-1.5 bg-black/30 border border-brand-dark/30 rounded text-white text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-brand-light-gray mb-1">Aisles for {rule.className} (1-based, comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g., 5, 9"
                            value={(rule.layout?.aisleColumns ?? seatConfig.aisleColumns).join(', ')}
                            onChange={(e) => updateRuleLayout(idx, { aisleColumns: e.target.value.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n)).sort((a,b)=>a-b) })}
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
                    <input type="checkbox" checked={editMode} onChange={(e) => setEditMode(e.target.checked)} />
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
                processedSeats={processedSeats}
                onSeatDeletion={handleSeatDeletion}
                onSeatPositionUpdate={handleSeatPositionUpdate}
                onSeatRestoration={handleSeatRestoration}
                onManualLayoutChange={(_ids) => {
                  // Handle manual layout changes if needed
                  setHasUnsavedChanges(true);
                }}
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
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-brand-light-gray">
                    Manual layout changes will be saved with your screen configuration.
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-gray-400">
                      Screen ID: {selectedScreenId || 'None'}
                    </div>
                    {hasUnsavedChanges && (
                      <span className="text-yellow-400 text-sm">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        Unsaved changes
                      </span>
                    )}
                    {layoutSaved && (
                      <span className="text-green-400 text-sm">
                        <i className="fas fa-check-circle mr-1"></i>
                        Layout saved!
                      </span>
                    )}
                    <button
                      onClick={() => {
                        console.log('Save button clicked');
                        saveScreenLayout();
                      }}
                      disabled={isSavingLayout || !selectedScreenId}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      {isSavingLayout ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i>
                          <span>Save Layout</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
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
                  <button 
                    onClick={() => {
                      setEditMode(true);
                      handleScreenSelect(screen.id);
                    }}
                    className="flex-1 bg-brand-red text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit Layout
                  </button>
                  <button 
                    onClick={() => {
                      setEditMode(false);
                      handleScreenSelect(screen.id);
                    }}
                    className="flex-1 bg-brand-dark text-white py-2 rounded-lg hover:bg-brand-dark/80 transition-colors text-sm"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View Layout
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