import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';

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
  const [showAddModal, setShowAddModal] = useState(false);

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