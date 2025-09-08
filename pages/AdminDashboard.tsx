import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

interface TheatreApplication {
  _id: string;
  ownerName: string;
  email: string;
  phone: string;
  theatreName: string;
  theatreType: string;
  locationText: string;
  description: string;
  screenCount: string;
  seatingCapacity: string;
  internetConnectivity: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [applications, setApplications] = useState<TheatreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<TheatreApplication | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Check if user is admin
  useEffect(() => {
    if (!userData || (!userData.isAdmin && userData.role !== 'admin')) {
      navigate('/');
      return;
    }
  }, [userData, navigate]);

  // Fetch theatre applications
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockApplications: TheatreApplication[] = [
        {
          _id: '1',
          ownerName: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          theatreName: 'Grand Cinema',
          theatreType: 'Multiplex',
          locationText: '123 Main Street, Downtown',
          description: 'A modern multiplex cinema',
          screenCount: '5',
          seatingCapacity: '1200',
          internetConnectivity: 'High Speed WiFi',
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          ownerName: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1987654321',
          theatreName: 'Star Cinema',
          theatreType: 'Single Screen',
          locationText: '456 Oak Avenue, Uptown',
          description: 'A cozy single-screen cinema',
          screenCount: '1',
          seatingCapacity: '200',
          internetConnectivity: 'Standard WiFi',
          status: 'approved',
          createdAt: '2024-01-14T14:20:00Z',
          updatedAt: '2024-01-14T14:20:00Z'
        }
      ];
      
      setApplications(mockApplications);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTabCount = (status: string) => {
    if (status === 'all') return applications.length;
    return applications.filter(app => app.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-film text-white"></i>
              </div>
              <h1 className="text-xl font-semibold text-white">BookNView</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for Movies, Events, Plays..."
                  className="bg-white text-gray-900 placeholder-gray-500 px-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <i className="fas fa-map-marker-alt"></i>
                <span>Mumbai</span>
                <i className="fas fa-chevron-down text-sm"></i>
              </div>
              <span className="text-white">Hi, Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Title and User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-shield-alt text-white"></i>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Administrator</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{getTabCount('pending')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{getTabCount('approved')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-times text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{getTabCount('rejected')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-list text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{getTabCount('all')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab} ({getTabCount(tab)})
                </button>
              ))}
            </nav>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Theatre Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{application.theatreName}</div>
                        <div className="text-sm text-gray-500">{application.theatreType} • {application.screenCount} screens</div>
                        <div className="text-sm text-gray-500">{application.locationText}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{application.ownerName}</div>
                        <div className="text-sm text-gray-500">{application.email}</div>
                        <div className="text-sm text-gray-500">{application.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                      {application.status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900 mr-2">
                            Approve
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
              <p className="text-gray-500">No {activeTab === 'all' ? '' : activeTab} applications found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
