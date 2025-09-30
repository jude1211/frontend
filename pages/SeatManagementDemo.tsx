import React, { useState, useEffect } from 'react';
import SeatManagement from '../components/SeatManagement';
import { seatService, SeatLayout, SeatClass } from '../services/seatService';

const SeatManagementDemo: React.FC = () => {
  const [theatreId, setTheatreId] = useState('theatre123');
  const [screenId, setScreenId] = useState('screen1');
  const [layout, setLayout] = useState<SeatLayout | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize with sample data
  useEffect(() => {
    initializeSampleLayout();
  }, []);

  const initializeSampleLayout = async () => {
    try {
      setLoading(true);
      
      // Create sample seat classes
      const sampleSeatClasses: Omit<SeatClass, '_id' | 'seatLayoutId' | 'theatreId' | 'screenId' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Gold',
          color: '#FFD700',
          price: 300,
          tier: 'VIP',
          rowRange: 'A-C',
          layout: {
            numRows: 3,
            numCols: 8,
            aisleColumns: [4, 5]
          }
        },
        {
          name: 'Silver',
          color: '#C0C0C0',
          price: 200,
          tier: 'Premium',
          rowRange: 'D-F',
          layout: {
            numRows: 3,
            numCols: 10,
            aisleColumns: [5, 6]
          }
        },
        {
          name: 'Balcony',
          color: '#008000',
          price: 150,
          tier: 'Base',
          rowRange: 'G-J',
          layout: {
            numRows: 4,
            numCols: 12,
            aisleColumns: [6, 7]
          }
        }
      ];

      // Create or update layout
      const layoutData = await seatService.createOrUpdateLayout(theatreId, screenId, {
        screenName: 'Screen 1',
        config: {
          numRows: 10,
          numCols: 12,
          aisleColumns: [4, 5, 6, 7]
        },
        seatClasses: sampleSeatClasses,
        totalRows: 10,
        totalSeats: 0, // Will be calculated
        manualLayout: []
      });

      setLayout(layoutData);
    } catch (error) {
      console.error('Error initializing sample layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLayoutChange = (updatedLayout: SeatLayout) => {
    setLayout(updatedLayout);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Initializing seat management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cinema Seat Layout Management System
          </h1>
          <p className="text-gray-400">
            Complete MongoDB schema implementation with drag-and-drop seat editing
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theatre ID
              </label>
              <input
                type="text"
                value={theatreId}
                onChange={(e) => setTheatreId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Screen ID
              </label>
              <input
                type="text"
                value={screenId}
                onChange={(e) => setScreenId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>
        </div>

        {/* Seat Management Component */}
        {layout && (
          <SeatManagement
            theatreId={theatreId}
            screenId={screenId}
            onLayoutChange={handleLayoutChange}
          />
        )}

        {/* Features Overview */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">MongoDB Schema</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Separate collections for Seats, SeatClasses, and SeatLayouts</li>
                <li>• Unique seatId format (Gold-A1, Silver-D5, Balcony-H12)</li>
                <li>• Grid position tracking for frontend rendering</li>
                <li>• Status management (available, booked, aisle)</li>
              </ul>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Drag & Drop</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Real-time seat position updates</li>
                <li>• Immediate MongoDB persistence</li>
                <li>• Visual feedback during drag operations</li>
                <li>• Prevent dropping into aisle columns</li>
              </ul>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Auto-calculation</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Total rows across all classes</li>
                <li>• Total seats count</li>
                <li>• Auto-filled configuration from signup</li>
                <li>• Real-time updates on changes</li>
              </ul>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Seat Management</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Add new seats with custom properties</li>
                <li>• Delete seats with confirmation</li>
                <li>• Bulk operations support</li>
                <li>• Class-based organization</li>
              </ul>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">API Endpoints</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• GET /seats/layout/:id - Fetch all seats</li>
                <li>• GET /seats/:seatId - Get specific seat</li>
                <li>• PUT /seats/:seatId/position - Update position</li>
                <li>• POST /seats - Create new seat</li>
                <li>• DELETE /seats/:seatId - Delete seat</li>
              </ul>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">Frontend Rendering</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Color-coded seat classes</li>
                <li>• Aisle visualization</li>
                <li>• Responsive grid layout</li>
                <li>• Real-time seat selection</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Usage Examples</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Fetch all Gold seats</h3>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`const goldSeats = await seatService.getSeatsByClass(layoutId, 'Gold');
console.log(goldSeats); // Array of Gold class seats`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Get seat by ID</h3>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`const seat = await seatService.getSeatById('Gold-A1');
console.log(seat); // Seat object with all properties`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Update seat position (drag & drop)</h3>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`await seatService.updateSeatPosition('Gold-A1', {
  newRow: 2,
  newCol: 3,
  newGridRow: 1,
  newGridCol: 2
});`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Generate seats from classes</h3>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`const result = await seatService.generateSeats(layoutId, [
  {
    name: 'Gold',
    color: '#FFD700',
    price: 300,
    tier: 'VIP',
    rowRange: 'A-C',
    layout: { numRows: 3, numCols: 8, aisleColumns: [4, 5] }
  }
]);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatManagementDemo;