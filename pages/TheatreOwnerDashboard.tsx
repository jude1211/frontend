import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import OfflineBookingManagement from '../components/OfflineBookingManagement';

interface TheatreOwner {
  _id: string;
  username: string;
  email: string;
  ownerName: string;
  theatreName: string;
  theatreType: string;
  phone: string;
  screenCount: number;
  seatingCapacity: number;
  isActive: boolean;
  createdAt: string;
}

const TheatreOwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [theatreOwner, setTheatreOwner] = useState<TheatreOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'shows' | 'screens' | 'reports' | 'profile' | 'offline-bookings'>('dashboard');
  const [showOfflineBooking, setShowOfflineBooking] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('theatreOwnerToken');
      if (!token) {
        navigate('/theatre-owner/login');
        return;
      }

      const response = await apiService.getTheatreOwnerProfile();
      if (response.success) {
        setTheatreOwner(response.data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      if (err.message.includes('token') || err.message.includes('401')) {
        navigate('/theatre-owner/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('theatreOwnerToken');
    localStorage.removeItem('theatreOwnerData');
    navigate('/theatre-owner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-white text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/theatre-owner/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-building text-white"></i>
              </div>
              <h1 className="text-xl font-semibold text-white">Theatre Owner Portal</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        {activeSection !== 'dashboard' && (
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => setActiveSection('dashboard')}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <i className="fas fa-home mr-1"></i>
                Dashboard
              </button>
              <i className="fas fa-chevron-right text-gray-600"></i>
              <span className="text-white font-medium capitalize">
                {activeSection.replace('-', ' ')}
              </span>
            </nav>
          </div>
        )}
        {/* Welcome Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-building text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{theatreOwner?.theatreName}</h1>
                <p className="text-gray-400">Theatre Management Dashboard</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Account Status</p>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                theatreOwner?.isActive ? 'bg-green-500 text-green-100' : 'bg-red-500 text-red-100'
              }`}>
                {theatreOwner?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Screens</p>
                <p className="text-3xl font-bold text-white">{theatreOwner?.screenCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-desktop text-white text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Seats</p>
                <p className="text-3xl font-bold text-white">{theatreOwner?.seatingCapacity}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-chair text-white text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Today's Shows</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <i className="fas fa-film text-white text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-ticket-alt text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/theatre-owner/movies')}
                className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3"
              >
                <i className="fas fa-plus text-xl"></i>
                <span>Add New Show</span>
              </button>
              <button 
                onClick={() => navigate('/theatre-owner/screens')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3"
              >
                <i className="fas fa-cog text-xl"></i>
                <span>Manage Screens</span>
              </button>
              <button 
                onClick={() => navigate('/theatre-owner/snacks')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3"
              >
                <i className="fas fa-hamburger text-xl"></i>
                <span>Manage Snacks</span>
              </button>
              <button 
                onClick={() => navigate('/theatre-owner/reports')}
                className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3"
              >
                <i className="fas fa-chart-bar text-xl"></i>
                <span>View Reports</span>
              </button>
              <button 
                onClick={() => navigate('/theatre-owner/profile')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3"
              >
                <i className="fas fa-user-edit text-xl"></i>
                <span>Edit Profile</span>
              </button>
              <button 
                onClick={() => setShowOfflineBooking(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3"
              >
                <i className="fas fa-ticket-alt text-xl"></i>
                <span>Offline Bookings</span>
              </button>
            </div>
          </div>

          {/* Theatre Information */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Theatre Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Theatre Name</label>
                <p className="text-white font-medium">{theatreOwner?.theatreName}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Theatre Type</label>
                <p className="text-white font-medium">{theatreOwner?.theatreType}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Owner</label>
                <p className="text-white font-medium">{theatreOwner?.ownerName}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Contact</label>
                <p className="text-white font-medium">{theatreOwner?.phone}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-white font-medium">{theatreOwner?.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Member Since</label>
                <p className="text-white font-medium">
                  {theatreOwner?.createdAt ? new Date(theatreOwner.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Based on Active Section */}
        {activeSection === 'dashboard' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">🚀 Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Show Management</h3>
                <p className="text-gray-400 text-sm">Add and manage movie shows, timings, and pricing</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Booking Analytics</h3>
                <p className="text-gray-400 text-sm">Track bookings, revenue, and customer insights</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Seat Configuration</h3>
                <p className="text-gray-400 text-sm">Configure seating layouts and pricing tiers</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'shows' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Show Management</h2>
            <div className="text-center py-12">
              <i className="fas fa-film text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-semibold text-white mb-2">Show Management Coming Soon</h3>
              <p className="text-gray-400 mb-6">Add and manage movie shows, timings, and pricing for your theatre</p>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {activeSection === 'screens' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Screen Management</h2>
            <div className="text-center py-12">
              <i className="fas fa-desktop text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-semibold text-white mb-2">Screen Management Coming Soon</h3>
              <p className="text-gray-400 mb-6">Configure and manage your theatre screens and seating arrangements</p>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Reports & Analytics</h2>
            <div className="text-center py-12">
              <i className="fas fa-chart-bar text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-semibold text-white mb-2">Reports Coming Soon</h3>
              <p className="text-gray-400 mb-6">Track bookings, revenue, and customer insights with detailed analytics</p>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Profile Management</h2>
            <div className="text-center py-12">
              <i className="fas fa-user-edit text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-semibold text-white mb-2">Profile Management Coming Soon</h3>
              <p className="text-gray-400 mb-6">Update your theatre information and personal details</p>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Offline Booking Modal */}
        {showOfflineBooking && (
          <OfflineBookingManagement
            theatreOwner={theatreOwner}
            onClose={() => setShowOfflineBooking(false)}
          />
        )}
      </main>
    </div>
  );
};

export default TheatreOwnerDashboard;
