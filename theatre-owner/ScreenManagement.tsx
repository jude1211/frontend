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
  originalData?: any; // Store original database data
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
  const [currentGridData, setCurrentGridData] = useState<any[]>([]);
  const [aisleInput, setAisleInput] = useState<string>('5, 9');
  const [aisleError, setAisleError] = useState<boolean>(false);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [layoutSaved, setLayoutSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [processedSeats, setProcessedSeats] = useState<Map<string, any>>(new Map());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Add Screen Modal State
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenType, setNewScreenType] = useState<'2D' | '3D' | 'IMAX' | '4DX'>('2D');
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  
  // Delete Screen Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [screenToDelete, setScreenToDelete] = useState<Screen | null>(null);
  const [isDeletingScreen, setIsDeletingScreen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Show toast notification
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle adding a new screen
  const handleAddScreen = async () => {
    if (!newScreenName.trim()) {
      showToastMessage('Please enter a screen name');
      return;
    }

    setIsAddingScreen(true);
    try {
      const profile = await apiService.getTheatreOwnerProfile();
      const ownerId = profile?.success ? (profile.data?.id || profile.data?._id) : JSON.parse(localStorage.getItem('theatreOwnerData') || '{}')._id;
      if (!ownerId) {
        showToastMessage('Unable to identify theatre owner');
        return;
      }
      
      const res = await apiService.addOwnerScreen(ownerId as string, { 
        name: newScreenName.trim(), 
        type: newScreenType
      });
      
      if (res.success) {
        // Close modal and reset form
        setShowAddScreenModal(false);
        setNewScreenName('');
        setNewScreenType('2D');
        
        // Reload screens from database to get updated data
        await loadScreens();
        showToastMessage('Screen added successfully!');
      } else {
        console.error('Failed to add screen:', res.error);
        showToastMessage('Failed to add screen. Please try again.');
      }
    } catch (e) {
      console.error('Add screen failed', e);
      showToastMessage('Failed to add screen. Please try again.');
    } finally {
      setIsAddingScreen(false);
    }
  };

  // Open add screen modal
  const openAddScreenModal = () => {
    setNewScreenName(`Screen ${screens.length + 1}`);
    setNewScreenType('2D');
    setShowAddScreenModal(true);
  };

  // Handle deleting a screen
  const handleDeleteScreen = async () => {
    if (!screenToDelete) return;

    setIsDeletingScreen(true);
    try {
      const profile = await apiService.getTheatreOwnerProfile();
      const ownerId = profile?.success ? (profile.data?.id || profile.data?._id) : JSON.parse(localStorage.getItem('theatreOwnerData') || '{}')._id;
      if (!ownerId) {
        showToastMessage('Unable to identify theatre owner');
        return;
      }
      
      const res = await apiService.deleteOwnerScreen(ownerId as string, screenToDelete.id);
      
      if (res.success) {
        // Close modal and reset state
        setShowDeleteModal(false);
        setScreenToDelete(null);
        
        // Reload screens from database to get updated data
        await loadScreens();
        showToastMessage(`Screen deleted successfully! Removed from all database collections.`);
      } else {
        console.error('Failed to delete screen:', res.error);
        showToastMessage('Failed to delete screen. Please try again.');
      }
    } catch (e) {
      console.error('Delete screen failed', e);
      showToastMessage('Failed to delete screen. Please try again.');
    } finally {
      setIsDeletingScreen(false);
    }
  };

  // Open delete screen modal
  const openDeleteModal = (screen: Screen) => {
    setScreenToDelete(screen);
    setDeleteConfirmation('');
    setShowDeleteModal(true);
  };

  // Refresh layout from database
  const refreshLayout = async () => {
    if (!selectedScreenId) return;
    
    console.log('Manually refreshing layout from database...');
    const success = await loadScreenLayout(selectedScreenId);
    if (success) {
      showToastMessage('Layout refreshed from database successfully!');
    } else {
      showToastMessage('Failed to refresh layout from database');
    }
  };

  // Sync missing screen layouts
  const syncScreenLayouts = async () => {
    try {
      const theatreOwnerData = JSON.parse(localStorage.getItem('theatreOwnerData') || '{}');
      const theatreOwnerId = theatreOwnerData._id;
      
      if (!theatreOwnerId) {
        showToastMessage('Theatre owner ID not found');
        return;
      }

      console.log('Syncing missing screen layouts...');
      const response = await apiService.syncScreenLayouts(theatreOwnerId);
      
      if (response.success) {
        const { createdLayouts, existingLayouts, totalScreens } = response.data;
        if (createdLayouts.length > 0) {
          showToastMessage(`Synced ${createdLayouts.length} missing screen layouts using Screen 1's configuration!`);
        } else {
          showToastMessage('All screen layouts are already up to date!');
        }
        console.log('Sync result:', { createdLayouts, existingLayouts, totalScreens });
        
        // Refresh the screens list
        await loadScreens();
      } else {
        showToastMessage('Failed to sync screen layouts');
      }
    } catch (error) {
      console.error('Error syncing screen layouts:', error);
      showToastMessage('Error syncing screen layouts');
    }
  };

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

  // Load saved layout for a screen (always fetches fresh data)
  const loadScreenLayout = async (screenId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Loading fresh screen layout for screenId:', screenId);
      
      // Always fetch fresh data from database
      const response = await apiService.getScreenLayout(screenId);
      console.log('Fresh screen layout API response:', response);
      
      if (response.success && response.data) {
        const layout = response.data;
        console.log('Found saved layout in database:', {
          screenId: layout.screenId,
          seatsCount: layout.seats?.length || 0,
          meta: layout.meta,
          seatClasses: layout.seatClasses?.length || 0
        });
        
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
          console.log('Found saved seats in layout:', layout.seats.length);
          console.log('Sample saved seat:', layout.seats[0]);
          // Process saved seats to restore exact layout
          processSavedSeats(layout.seats);
        } else {
          console.log('No saved seats found in layout');
        }
        
        setLayoutSaved(true);
        setHasUnsavedChanges(false);
        return true; // Layout was successfully loaded
      } else {
        // No saved layout, use defaults
        setLayoutSaved(false);
        setHasUnsavedChanges(false);
        return false; // No layout found
      }
    } catch (error) {
      console.error('Error loading screen layout:', error);
      // On error, use default configuration
      setLayoutSaved(false);
      setHasUnsavedChanges(false);
      return false; // Error loading layout
    } finally {
      setIsLoading(false);
    }
  };

  // Process saved seats to restore exact layout including positions and deletions
  const processSavedSeats = (savedSeats: any[]) => {
    console.log('Processing saved seats:', savedSeats.length);
    console.log('Sample saved seats:', savedSeats.slice(0, 3));
    
    const seatsById = new Map<string, any>();
    let activeSeats = 0;
    let deletedSeats = 0;
    
    savedSeats.forEach((seat) => {
      const key = `${seat.rowLabel}-${seat.number}`;
      seatsById.set(key, seat); // include inactive seats so they stay hidden
      
      if (seat.isActive === false) {
        deletedSeats++;
      } else {
        activeSeats++;
      }
    });
    
    console.log('Loaded seats from DB:', {
      total: savedSeats.length,
      active: activeSeats,
      deleted: deletedSeats,
      mapped: seatsById.size
    });
    console.log('Setting processedSeats state...');
    setProcessedSeats(seatsById);
    console.log('processedSeats state set with', seatsById.size, 'seats');
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
      console.log('Current seats data for saving:', {
        totalSeats: currentSeats.length,
        activeSeats: currentSeats.filter(s => s.isActive !== false).length,
        deletedSeats: currentSeats.filter(s => s.isActive === false).length,
        sampleSeat: currentSeats[0]
      });
      
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
      
      // Update the seat layout using PUT method
      const response = await apiService.updateScreenLayout(selectedScreenId, layoutData);
      console.log('Update response:', response);
      
      if (response.success) {
        // Show success message
        console.log('Layout updated successfully!');
        showToastMessage('Layout updated successfully!');
        
        // Automatically refetch the latest layout from database
        console.log('Refetching latest layout from database...');
        const refetchResponse = await apiService.getScreenLayout(selectedScreenId);
        if (refetchResponse.success && refetchResponse.data) {
          console.log('Successfully refetched layout from database');
          // Process the refetched data to ensure we have the latest state
          const layout = refetchResponse.data;
          if (layout.seats && layout.seats.length > 0) {
            processSavedSeats(layout.seats);
          }
        } else {
          console.warn('Failed to refetch layout from database');
          showToastMessage('Layout saved but failed to refresh from database');
        }
        // Also update the screen data in the database with new configuration
        try {
          const profile = await apiService.getTheatreOwnerProfile();
          const ownerId = profile?.success ? (profile.data?.id || profile.data?._id) : JSON.parse(localStorage.getItem('theatreOwnerData') || '{}')._id;
          
          if (ownerId && selectedScreenId) {
            // Update screen data in the theatre owner application
            const updateData = {
              rows: seatConfig.numRows.toString(),
              columns: seatConfig.numCols.toString(),
              aisleColumns: seatConfig.aisleColumns.join(','),
              seatClasses: seatConfig.seatClassRules.map(rule => ({
                label: rule.className,
                price: rule.price.toString()
              })),
              seatingCapacity: (seatConfig.numRows * seatConfig.numCols).toString()
            };
            
            // Update screen configuration in the database
            const updateResponse = await apiService.updateScreenConfiguration(ownerId, selectedScreenId, updateData);
            if (updateResponse.success) {
              console.log('Screen configuration updated successfully:', updateResponse.data);
            } else {
              console.warn('Failed to update screen configuration:', updateResponse.error);
            }
          }
        } catch (updateError) {
          console.warn('Failed to update screen configuration:', updateError);
          // Don't fail the entire save process for this
        }
        
        setLayoutSaved(true);
        setHasUnsavedChanges(false);
        // Show success message
        setTimeout(() => setLayoutSaved(false), 3000);
      } else {
        console.error('Failed to save layout:', response.error);
        alert('Failed to save layout. Please try again.');
      }
    } catch (error) {
      console.error('Error saving screen layout:', error);
      alert('Error saving screen layout. Please try again.');
    } finally {
      setIsSavingLayout(false);
    }
  };

  // Get current seat data from the layout builder, using real-time grid data
  const getCurrentSeatData = () => {
    const seats: any[] = [];
    
    // Use real-time grid data if available, otherwise fall back to processed seats
    if (currentGridData.length > 0) {
      console.log('Using currentGridData for saving, rows:', currentGridData.length);
      // Process the current grid data from SeatLayoutBuilder
      currentGridData.forEach((row) => {
        row.forEach((cell: any) => {
          if (cell && cell.number > 0 && cell.className) {
            // Determine tier from className or use default
            let tier = cell.tier;
            if (!tier) {
              if (cell.className?.toLowerCase().includes('vip') || cell.className?.toLowerCase().includes('balcony')) {
                tier = 'VIP';
              } else if (cell.className?.toLowerCase().includes('premium') || cell.className?.toLowerCase().includes('gold')) {
                tier = 'Premium';
              } else {
                tier = 'Base';
              }
            }
            
            seats.push({
              rowLabel: cell.rowLabel,
              number: cell.number,
              x: cell.x || 0,
              y: cell.y || 0,
              className: cell.className,
              price: cell.price || 0,
              color: cell.color || '#6b7280',
              status: cell.status || 'available',
              isActive: cell.isActive !== false,
              tier: tier,
              originalRow: cell.rowLabel,
              originalNumber: cell.number,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });
      });
      console.log('Seats from currentGridData:', seats.length);
      
      // Also include deleted seats from processedSeats that might not be in currentGridData
      processedSeats.forEach((seat) => {
        if (seat.isActive === false) {
          // Check if this deleted seat is not already in the seats array
          const exists = seats.some(s => s.rowLabel === seat.rowLabel && s.number === seat.number);
          if (!exists) {
            // Determine tier from className or use existing tier
            let tier = seat.tier;
            if (!tier) {
              if (seat.className?.toLowerCase().includes('vip') || seat.className?.toLowerCase().includes('balcony')) {
                tier = 'VIP';
              } else if (seat.className?.toLowerCase().includes('premium') || seat.className?.toLowerCase().includes('gold')) {
                tier = 'Premium';
              } else {
                tier = 'Base';
              }
            }
            
            seats.push({
              rowLabel: seat.rowLabel,
              number: seat.number,
              x: seat.x || 0,
              y: seat.y || 0,
              className: seat.className,
              price: seat.price || 0,
              color: seat.color || '#6b7280',
              status: seat.status || 'deleted',
              isActive: false,
              tier: tier,
              originalRow: seat.originalRow || seat.rowLabel,
              originalNumber: seat.originalNumber || seat.number,
              createdAt: seat.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      });
    } else {
      // Fallback to the old method using processed seats
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
  const handleScreenSelect = async (screenId: string) => {
    setSelectedScreenId(screenId);
    
    // First, try to load saved layout from database
    const layoutLoaded = await loadScreenLayout(screenId);
    
    // If no saved layout was found, fall back to original data
    if (!layoutLoaded) {
    const selectedScreen = screens.find(s => s.id === screenId);
    if (selectedScreen && selectedScreen.originalData) {
      const screenData = selectedScreen.originalData;
      
      // Load layout configuration from the screen data
      if (screenData.rows && screenData.columns) {
        const numRows = parseInt(screenData.rows);
        const numCols = parseInt(screenData.columns);
        const aisleCols: number[] = (screenData.aisleColumns || '')
          .split(',')
          .map((v: string) => parseInt(v.trim(), 10))
          .filter((n: number) => !isNaN(n))
          .sort((a: number, b: number) => a - b);
        
        const seatClasses = (screenData.seatClasses || []).map((sc: any) => ({
          rows: getRowRangeForSeatClass(sc.label, numRows),
          className: sc.label,
          price: parseInt(sc.price) || 200,
          tier: getTierForSeatClass(sc.label),
          color: getColorForSeatClass(sc.label)
        }));
        
        setSeatConfig({
          numRows,
          numCols,
          aisleColumns: aisleCols,
          seatClassRules: seatClasses.length > 0 ? seatClasses : [
            { rows: 'A-C', className: 'Gold', price: 250, tier: 'Premium', color: '#f59e0b' },
            { rows: 'D-F', className: 'Silver', price: 180, tier: 'Base', color: '#9ca3af' },
            { rows: 'G-H', className: 'Balcony', price: 320, tier: 'VIP', color: '#22c55e' }
          ]
        });
        
        setAisleInput(aisleCols.join(', '));
        setHasUnsavedChanges(false);
        setLayoutSaved(false);
      }
    }
    }
  };

  // Track processedSeats changes
  useEffect(() => {
    console.log('processedSeats changed:', processedSeats?.size || 0, 'seats');
    if (processedSeats && processedSeats.size > 0) {
      console.log('Sample processedSeats entry:', Array.from(processedSeats.entries())[0]);
    }
  }, [processedSeats]);

  // Load screens from database
  const loadScreens = async () => {
    try {
      setIsLoading(true);
      
      // Get theatre owner profile to get owner ID
      const profile = await apiService.getTheatreOwnerProfile();
      const ownerId = profile?.success ? (profile.data?.id || profile.data?._id) : JSON.parse(localStorage.getItem('theatreOwnerData') || '{}')._id;
      
      if (!ownerId) {
        console.error('No owner ID found');
        return;
      }

      // Fetch screens from database
      const response = await apiService.getOwnerScreens(ownerId);
      
      if (response.success && response.data) {
        const screensArray = Array.isArray(response.data) ? response.data : response.data.screens || [];
        console.log('Loaded screens from API:', screensArray.map(s => ({ screenNumber: s.screenNumber, name: s.name })));
        
        const screensData = screensArray.map((screen: any) => ({
          id: screen.screenNumber.toString(),
          name: screen.name || `Screen ${screen.screenNumber}`,
          capacity: parseInt(screen.seatingCapacity) || 120,
          type: (screen.type || '2D') as '2D' | '3D' | 'IMAX' | '4DX',
          status: 'active' as const,
          currentMovie: 'None',
          nextShowtime: 'N/A',
          occupancy: 0,
          // Store original data for layout configuration
          originalData: screen
        }));
        
        console.log('Processed screens data:', screensData.map(s => ({ id: s.id, name: s.name })));
        setScreens(screensData);
        
        // If we have screen data, load the first screen's layout
        if (screensData.length > 0) {
          const firstScreen = screensData[0];
          setSelectedScreenId(firstScreen.id);
          
          // Load layout configuration from the screen data
          const screenData = firstScreen.originalData;
          if (screenData.rows && screenData.columns) {
            const numRows = parseInt(screenData.rows);
            const numCols = parseInt(screenData.columns);
            const aisleCols: number[] = (screenData.aisleColumns || '')
          .split(',')
          .map((v: string) => parseInt(v.trim(), 10))
          .filter((n: number) => !isNaN(n))
          .sort((a: number, b: number) => a - b);
            
            const seatClasses = (screenData.seatClasses || []).map((sc: any) => ({
              rows: getRowRangeForSeatClass(sc.label, numRows),
              className: sc.label,
              price: parseInt(sc.price) || 200,
              tier: getTierForSeatClass(sc.label),
              color: getColorForSeatClass(sc.label)
            }));
            
            setSeatConfig({
              numRows,
              numCols,
              aisleColumns: aisleCols,
              seatClassRules: seatClasses.length > 0 ? seatClasses : [
                { rows: 'A-C', className: 'Gold', price: 250, tier: 'Premium', color: '#f59e0b' },
                { rows: 'D-F', className: 'Silver', price: 180, tier: 'Base', color: '#9ca3af' },
                { rows: 'G-H', className: 'Balcony', price: 320, tier: 'VIP', color: '#22c55e' }
              ]
            });
            
            setAisleInput(aisleCols.join(', '));
          }
        }
      } else {
        console.error('Failed to load screens:', response.error);
        // Fallback to empty state
        setScreens([]);
      }
    } catch (error) {
      console.error('Error loading screens:', error);
      setScreens([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for seat class configuration
  const getColorForSeatClass = (className: string): string => {
    const colors: Record<string, string> = {
      'Gold': '#f59e0b',
      'Silver': '#9ca3af', 
      'Balcony': '#22c55e',
      'Premium': '#8b5cf6',
      'VIP': '#ef4444'
    };
    return colors[className] || '#6b7280';
  };

  const getTierForSeatClass = (className: string): 'Base' | 'Premium' | 'VIP' => {
    const tiers: Record<string, 'Base' | 'Premium' | 'VIP'> = {
      'Gold': 'Premium',
      'Silver': 'Base',
      'Balcony': 'VIP',
      'Premium': 'Premium',
      'VIP': 'VIP'
    };
    return tiers[className] || 'Base';
  };

  const getRowRangeForSeatClass = (className: string, totalRows: number): string => {
    if (totalRows <= 0) return 'A';
    
    // Updated distribution: Gold gets more seats (50%), Silver and Balcony get fewer (25% each)
    const ranges: Record<string, { start: number; end: number }> = {
      'Gold': { start: 0, end: Math.floor(totalRows * 0.5) - 1 },
      'Silver': { start: Math.floor(totalRows * 0.5), end: Math.floor(totalRows * 0.75) - 1 },
      'Balcony': { start: Math.floor(totalRows * 0.75), end: totalRows - 1 },
      'Premium': { start: 0, end: Math.floor(totalRows * 0.5) - 1 }, // Same as Gold
      'VIP': { start: Math.floor(totalRows * 0.75), end: totalRows - 1 } // Same as Balcony
    };
    
    const range = ranges[className] || { start: 0, end: totalRows - 1 };
    const startRow = String.fromCharCode('A'.charCodeAt(0) + Math.max(0, range.start));
    const endRow = String.fromCharCode('A'.charCodeAt(0) + Math.min(totalRows - 1, range.end));
    
    return startRow === endRow ? startRow : `${startRow}-${endRow}`;
  };

  useEffect(() => {
    loadScreens();
  }, []);

  // Load fresh layout data whenever selectedScreenId changes
  useEffect(() => {
    if (selectedScreenId) {
      console.log('Screen ID changed, loading fresh layout data...');
      loadScreenLayout(selectedScreenId);
    }
  }, [selectedScreenId]);

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
              onClick={openAddScreenModal}
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
                key={`${selectedScreenId}-${processedSeats.size}-${seatConfig.numRows}-${seatConfig.numCols}-${seatConfig.aisleColumns.join(',')}-${seatConfig.seatClassRules.length}`}
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
                  // Store the current grid data for saving
                  setCurrentGridData(grid);
                  
                  // Update seat statistics
                  const counts: Record<string, number> = {};
                  let total = 0;
                  grid.forEach(row => row.forEach(cell => {
                    if (cell.number > 0 && (cell as any).className) {
                      total += 1;
                      counts[(cell as any).className] = (counts[(cell as any).className] || 0) + 1;
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
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          console.log('Sync button clicked');
                          syncScreenLayouts();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        title="Sync missing screen layouts using Screen 1's configuration"
                      >
                        <i className="fas fa-sync"></i>
                        <span>Sync Layouts</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('Refresh button clicked');
                          refreshLayout();
                        }}
                        disabled={!selectedScreenId}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <i className="fas fa-sync-alt"></i>
                        <span>Refresh Layout</span>
                      </button>
                      
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
                <p className="text-xs text-brand-light-gray mt-1">
                  New screens inherit Screen 1's configuration
                </p>
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
                  <button 
                    onClick={() => openDeleteModal(screen)}
                    className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    title="Delete Screen"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Screen Modal */}
      {showAddScreenModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-3xl p-0 border border-brand-dark/40 shadow-2xl overflow-hidden w-full max-w-md">
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-6 border-b border-brand-dark/40 bg-gradient-to-r from-brand-gray to-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-plus text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Add New Screen</h2>
                    <p className="text-brand-light-gray text-sm">Create a new screen for your theatre</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddScreenModal(false)}
                  className="text-brand-light-gray hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Screen Name Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Screen Name
                </label>
                <input
                  type="text"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="Enter screen name"
                  className="w-full bg-black/40 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all duration-300"
                  autoFocus
                />
              </div>

              {/* Screen Type Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Screen Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['2D', '3D', 'IMAX', '4DX'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewScreenType(type)}
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                        newScreenType === type
                          ? 'border-brand-red bg-brand-red/20 text-brand-red'
                          : 'border-gray-600 bg-black/40 text-white hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <i className={`fas ${
                          type === '2D' ? 'fa-tv' :
                          type === '3D' ? 'fa-cube' :
                          type === 'IMAX' ? 'fa-expand' :
                          'fa-star'
                        }`}></i>
                        <span className="font-medium">{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Text */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Configuration Note</p>
                    <p>New screens will inherit the seat layout configuration from Screen 1, including rows, columns, aisles, and seat classes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-brand-dark/40 bg-gradient-to-r from-brand-gray to-brand-dark">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowAddScreenModal(false)}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium"
                  disabled={isAddingScreen}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddScreen}
                  disabled={isAddingScreen || !newScreenName.trim()}
                  className="flex-1 bg-brand-red text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isAddingScreen ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      <span>Add Screen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Screen Confirmation Modal */}
      {showDeleteModal && screenToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-brand-gray to-brand-dark rounded-3xl p-0 border border-brand-dark/40 shadow-2xl overflow-hidden w-full max-w-md">
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-6 border-b border-brand-dark/40 bg-gradient-to-r from-brand-gray to-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Delete Screen</h2>
                    <p className="text-brand-light-gray text-sm">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-brand-light-gray hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Warning Message */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-exclamation-triangle text-red-400 mt-0.5"></i>
                  <div className="text-sm text-red-200">
                    <p className="font-medium mb-1">Warning: Permanent Action</p>
                    <p>You are about to delete <strong>{screenToDelete.name}</strong>. This will permanently remove the screen and ALL its associated data from the database including:</p>
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      <li>Seat layouts and configurations</li>
                      <li>Show schedules and timings</li>
                      <li>All bookings (regular and offline)</li>
                      <li>Screen application data</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Screen Details */}
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Screen Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{screenToDelete.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{screenToDelete.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{screenToDelete.capacity} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      screenToDelete.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      screenToDelete.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {screenToDelete.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Type "DELETE" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full bg-black/40 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-brand-dark/40 bg-gradient-to-r from-brand-gray to-brand-dark">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-all duration-300 font-medium"
                  disabled={isDeletingScreen}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteScreen}
                  disabled={isDeletingScreen || deleteConfirmation !== 'DELETE'}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isDeletingScreen ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash"></i>
                      <span>Delete Screen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <i className="fas fa-check-circle"></i>
          <span>{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 text-white hover:text-gray-200"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default ScreenManagement; 