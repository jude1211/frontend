import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Seat {
  _id: string;
  seatId: string;
  rowNumber: number;
  columnNumber: number;
  rowLabel: string;
  classType: 'Gold' | 'Silver' | 'Balcony';
  isAvailable: boolean;
  status: 'available' | 'booked' | 'aisle';
  color: string;
  price: number;
  tier: 'Base' | 'Premium' | 'VIP';
  gridRow: number;
  gridCol: number;
}

interface SeatClass {
  _id: string;
  name: 'Gold' | 'Silver' | 'Balcony';
  color: string;
  price: number;
  tier: 'Base' | 'Premium' | 'VIP';
  rowRange: string;
  layout: {
    numRows: number;
    numCols: number;
    aisleColumns: number[];
  };
}

interface SeatLayout {
  _id: string;
  config: {
    numRows: number;
    numCols: number;
    aisleColumns: number[];
  };
  seatClasses: SeatClass[];
  totalRows: number;
  totalSeats: number;
}

interface SeatManagementProps {
  theatreId: string;
  screenId: string;
  onLayoutChange?: (layout: SeatLayout) => void;
}

const SeatManagement: React.FC<SeatManagementProps> = ({
  theatreId,
  screenId,
  onLayoutChange
}) => {
  const [layout, setLayout] = useState<SeatLayout | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showAddSeatForm, setShowAddSeatForm] = useState(false);
  const [newSeatData, setNewSeatData] = useState({
    rowLabel: 'A',
    columnNumber: 1,
    classType: 'Gold' as 'Gold' | 'Silver' | 'Balcony',
    price: 200,
    tier: 'Base' as 'Base' | 'Premium' | 'VIP'
  });

  // Fetch layout and seats data
  const fetchLayoutData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [layoutResponse, seatsResponse] = await Promise.all([
        fetch(`/api/v1/seat-layouts/theatre/${theatreId}/screen/${screenId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/v1/seats/layout/${layout?._id || 'temp'}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (layoutResponse.ok) {
        const layoutData = await layoutResponse.json();
        setLayout(layoutData.data);
        setSeatClasses(layoutData.data.seatClasses || []);
      }

      if (seatsResponse.ok) {
        const seatsData = await seatsResponse.json();
        setSeats(seatsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching layout data:', error);
    } finally {
      setLoading(false);
    }
  }, [theatreId, screenId, layout?._id]);

  useEffect(() => {
    fetchLayoutData();
  }, [fetchLayoutData]);

  // Generate seats based on layout configuration
  const generateSeats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/seats/layout/${layout?._id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          seatClasses: seatClasses
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSeats(data.data.seats);
        setLayout(prev => prev ? { ...prev, ...data.data } : null);
        onLayoutChange?.(layout!);
      }
    } catch (error) {
      console.error('Error generating seats:', error);
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceSeat = seats.find(seat => seat._id === result.draggableId);
    
    if (!sourceSeat) return;

    const newGridRow = destination.droppableId.split('-')[1];
    const newGridCol = destination.index;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/seats/${sourceSeat.seatId}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newRow: parseInt(newGridRow) + 1,
          newCol: newGridCol + 1,
          newGridRow: parseInt(newGridRow),
          newGridCol: newGridCol
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSeats(prev => prev.map(seat => 
          seat._id === sourceSeat._id ? data.data : seat
        ));
      }
    } catch (error) {
      console.error('Error updating seat position:', error);
    }
  };

  // Add new seat
  const addSeat = async () => {
    try {
      const token = localStorage.getItem('token');
      const seatId = `${newSeatData.classType}-${newSeatData.rowLabel}${newSeatData.columnNumber}`;
      
      const response = await fetch('/api/v1/seats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          seatId,
          rowNumber: newSeatData.rowLabel.charCodeAt(0) - 'A'.charCodeAt(0) + 1,
          columnNumber: newSeatData.columnNumber,
          rowLabel: newSeatData.rowLabel,
          classType: newSeatData.classType,
          color: seatClasses.find(c => c.name === newSeatData.classType)?.color || '#22c55e',
          price: newSeatData.price,
          tier: newSeatData.tier,
          gridRow: newSeatData.rowLabel.charCodeAt(0) - 'A'.charCodeAt(0),
          gridCol: newSeatData.columnNumber - 1,
          seatLayoutId: layout?._id,
          theatreId,
          screenId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSeats(prev => [...prev, data.data]);
        setShowAddSeatForm(false);
        setNewSeatData({
          rowLabel: 'A',
          columnNumber: 1,
          classType: 'Gold',
          price: 200,
          tier: 'Base'
        });
      }
    } catch (error) {
      console.error('Error adding seat:', error);
    }
  };

  // Delete seat
  const deleteSeat = async (seatId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/seats/${seatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSeats(prev => prev.filter(seat => seat.seatId !== seatId));
      }
    } catch (error) {
      console.error('Error deleting seat:', error);
    }
  };

  // Group seats by class for rendering
  const seatsByClass = seats.reduce((acc, seat) => {
    if (!acc[seat.classType]) {
      acc[seat.classType] = [];
    }
    acc[seat.classType].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort seats within each class by grid position
  Object.keys(seatsByClass).forEach(classType => {
    seatsByClass[classType].sort((a, b) => {
      if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
      return a.gridCol - b.gridCol;
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Seat Management</h2>
          <p className="text-gray-400">
            Total Rows: {layout?.totalRows || 0} | Total Seats: {layout?.totalSeats || 0}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded-lg font-medium ${
              editing 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {editing ? 'Exit Edit' : 'Edit Layout'}
          </button>
          <button
            onClick={generateSeats}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Generate Seats
          </button>
          {editing && (
            <button
              onClick={() => setShowAddSeatForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              Add Seat
            </button>
          )}
        </div>
      </div>

      {/* Layout Configuration Display */}
      {layout && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Layout Configuration</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Number of Rows:</span>
              <span className="text-white ml-2">{layout.config.numRows}</span>
            </div>
            <div>
              <span className="text-gray-400">Seats Per Row:</span>
              <span className="text-white ml-2">{layout.config.numCols}</span>
            </div>
            <div>
              <span className="text-gray-400">Aisle Columns:</span>
              <span className="text-white ml-2">{layout.config.aisleColumns.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Seat Classes Legend */}
      <div className="flex flex-wrap gap-4">
        {seatClasses.map(seatClass => (
          <div key={seatClass._id} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: seatClass.color }}
            ></div>
            <span className="text-white">
              {seatClass.name} - ₹{seatClass.price} - {seatClass.tier}
            </span>
          </div>
        ))}
      </div>

      {/* Seat Layout */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {Object.entries(seatsByClass).map(([classType, classSeats]) => {
            const seatClass = seatClasses.find(sc => sc.name === classType);
            if (!seatClass) return null;

            return (
              <div key={classType} className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {classType} Class ({classSeats.length} seats)
                </h3>
                
                <Droppable droppableId={`class-${classType}`}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${seatClass.layout.numCols + seatClass.layout.aisleColumns.length}, 1fr)`
                      }}
                    >
                      {classSeats.map((seat, index) => (
                        <Draggable
                          key={seat._id}
                          draggableId={seat._id}
                          index={index}
                          isDragDisabled={!editing || seat.status === 'aisle'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                relative p-2 rounded text-center text-xs font-medium cursor-pointer
                                ${editing && seat.status !== 'aisle' ? 'cursor-move' : ''}
                                ${snapshot.isDragging ? 'opacity-50' : ''}
                                ${seat.status === 'aisle' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}
                              `}
                              style={{
                                backgroundColor: seat.status === 'aisle' ? '#4B5563' : seat.color + '20',
                                borderColor: seat.color,
                                borderWidth: '2px'
                              }}
                              onClick={() => setSelectedSeat(seat)}
                            >
                              {seat.status === 'aisle' ? 'A' : seat.rowLabel + seat.columnNumber}
                              
                              {editing && seat.status !== 'aisle' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSeat(seat.seatId);
                                  }}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Add Seat Form Modal */}
      {showAddSeatForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Seat</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Row Label
                </label>
                <input
                  type="text"
                  value={newSeatData.rowLabel}
                  onChange={(e) => setNewSeatData(prev => ({ ...prev, rowLabel: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  maxLength={1}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Column Number
                </label>
                <input
                  type="number"
                  value={newSeatData.columnNumber}
                  onChange={(e) => setNewSeatData(prev => ({ ...prev, columnNumber: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Class Type
                </label>
                <select
                  value={newSeatData.classType}
                  onChange={(e) => setNewSeatData(prev => ({ ...prev, classType: e.target.value as 'Gold' | 'Silver' | 'Balcony' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Balcony">Balcony</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={newSeatData.price}
                  onChange={(e) => setNewSeatData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tier
                </label>
                <select
                  value={newSeatData.tier}
                  onChange={(e) => setNewSeatData(prev => ({ ...prev, tier: e.target.value as 'Base' | 'Premium' | 'VIP' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="Base">Base</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddSeatForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addSeat}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Seat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Seat Details */}
      {selectedSeat && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Seat Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Seat ID:</span>
              <span className="text-white ml-2">{selectedSeat.seatId}</span>
            </div>
            <div>
              <span className="text-gray-400">Position:</span>
              <span className="text-white ml-2">{selectedSeat.rowLabel}{selectedSeat.columnNumber}</span>
            </div>
            <div>
              <span className="text-gray-400">Class:</span>
              <span className="text-white ml-2">{selectedSeat.classType}</span>
            </div>
            <div>
              <span className="text-gray-400">Price:</span>
              <span className="text-white ml-2">₹{selectedSeat.price}</span>
            </div>
            <div>
              <span className="text-gray-400">Tier:</span>
              <span className="text-white ml-2">{selectedSeat.tier}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="text-white ml-2">{selectedSeat.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatManagement;