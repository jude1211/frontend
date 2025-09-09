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
  screens?: Array<{
    screenNumber: number;
    seatingCapacity: string;
    seatLayout: string;
    baseTicketPrice: string;
    premiumPrice: string;
    vipPrice: string;
  }>;
  internetConnectivity: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isEmailVerified: boolean;
  authProvider: string;
  preferredCity?: string;
  totalBookings: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastActiveAt?: string;
  createdAt: string;
  isActive?: boolean;
  membershipTier?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  const [applications, setApplications] = useState<TheatreApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    verifiedUsers: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<TheatreApplication | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [activeSection, setActiveSection] = useState<'applications' | 'users'>('applications');
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showApplicationDetailsModal, setShowApplicationDetailsModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');


  // Check if user is admin
  useEffect(() => {
    if (!userData || (!userData.isAdmin && userData.role !== 'admin')) {
      console.log('❌ User is not admin:', userData);
      navigate('/');
      return;
    }
    console.log('✅ User is admin:', userData);
  }, [userData, navigate]);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both applications and users data
      const [applicationsResponse, usersResponse] = await Promise.all([
        apiService.getTheatreApplications({ limit: 100 }),
        apiService.getAllUsers({ limit: 100 })
      ]);

      if (applicationsResponse.success && applicationsResponse.data) {
        setApplications(applicationsResponse.data.applications || []);

        // Update stats from applications
        const appStats = applicationsResponse.data.stats || {};
        setStats(prev => ({
          ...prev,
          totalApplications: appStats.total || 0,
          pendingApplications: appStats.pending || 0,
          approvedApplications: appStats.approved || 0,
          rejectedApplications: appStats.rejected || 0
        }));

        // Also update stats when applications change
        const apps = applicationsResponse.data.applications || [];
        const realStats = {
          totalApplications: apps.length,
          pendingApplications: apps.filter((app: TheatreApplication) => app.status === 'pending').length,
          approvedApplications: apps.filter((app: TheatreApplication) => app.status === 'approved').length,
          rejectedApplications: apps.filter((app: TheatreApplication) => app.status === 'rejected').length
        };

        setStats(prev => ({
          ...prev,
          ...realStats
        }));
      }

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data.users || []);

        // Update stats from users
        const userStats = usersResponse.data.stats || {};
        setStats(prev => ({
          ...prev,
          totalUsers: userStats.totalUsers || 0,
          activeUsers: userStats.activeUsers || 0,
          newUsersThisMonth: userStats.newUsersThisMonth || 0,
          verifiedUsers: userStats.verifiedUsers || 0
        }));
      }

    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Failed to fetch data');

      // Fallback to mock data if API fails
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
          screenCount: '3',
          seatingCapacity: '450',
          screens: [
            {
              screenNumber: 1,
              seatingCapacity: '150',
              seatLayout: 'Standard',
              baseTicketPrice: '200',
              premiumPrice: '300',
              vipPrice: '500'
            },
            {
              screenNumber: 2,
              seatingCapacity: '150',
              seatLayout: 'Premium',
              baseTicketPrice: '250',
              premiumPrice: '350',
              vipPrice: '600'
            },
            {
              screenNumber: 3,
              seatingCapacity: '150',
              seatLayout: 'IMAX',
              baseTicketPrice: '300',
              premiumPrice: '400',
              vipPrice: '700'
            }
          ],
          internetConnectivity: 'High Speed WiFi',
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        }
      ];
      setApplications(mockApplications);

      const mockUsers: User[] = [
        {
          _id: '1',
          email: 'user1@example.com',
          displayName: 'John User',
          firstName: 'John',
          lastName: 'User',
          isEmailVerified: true,
          authProvider: 'manual',
          preferredCity: 'Mumbai',
          totalBookings: 5,
          totalSpent: 2500,
          loyaltyPoints: 250,
          createdAt: '2024-01-10T10:30:00Z',
          isActive: true,
          membershipTier: 'Bronze'
        }
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setShowViewProfileModal(true);
  };



  const handleSuspendUser = (user: User) => {
    setSelectedUser(user);
    setShowSuspendConfirm(true);
  };



  const confirmSuspendUser = async () => {
    if (!selectedUser) return;

    try {
      const newStatus = !selectedUser.isActive;
      const response = await apiService.updateUserStatus(selectedUser._id, newStatus);

      if (response.success) {
        // Update user status locally with response data
        setUsers(prev => prev.map(user =>
          user._id === selectedUser._id
            ? { ...user, ...response.data }
            : user
        ));

        setShowSuspendConfirm(false);
        setSelectedUser(null);
      } else {
        console.error('Failed to update user status:', response.error);
      }
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  // Application handlers
  const handleViewApplicationDetails = (application: TheatreApplication) => {
    setSelectedApplication(application);
    setShowApplicationDetailsModal(true);
  };

  const handleApproveApplication = (application: TheatreApplication) => {
    setSelectedApplication(application);
    setShowApproveConfirm(true);
  };

  const handleRejectApplication = (application: TheatreApplication) => {
    setSelectedApplication(application);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmApproveApplication = async () => {
    if (!selectedApplication) return;

    try {
      console.log('🚀 Starting approve application process...');
      console.log('Application ID:', selectedApplication._id);
      console.log('Application details:', selectedApplication);
      
      // Check if we have a valid token
      const token = localStorage.getItem('authToken');
      console.log('Auth token exists:', !!token);
      if (token) {
        console.log('Token preview:', token.substring(0, 50) + '...');
      }
      
      const response = await apiService.approveApplication(selectedApplication._id);
      console.log('API Response:', response);

      if (response.success) {
        console.log('✅ Application approved successfully:', response.data);
        // Update application status locally with response data
        const updatedApps = applications.map(app =>
          app._id === selectedApplication._id
            ? { ...app, ...response.data }
            : app
        );
        setApplications(updatedApps);

        // Update stats
        setStats(prev => ({
          ...prev,
          pendingApplications: updatedApps.filter(app => app.status === 'pending').length,
          approvedApplications: updatedApps.filter(app => app.status === 'approved').length,
          rejectedApplications: updatedApps.filter(app => app.status === 'rejected').length
        }));

        setShowApproveConfirm(false);
        setSelectedApplication(null);
        
        // Show success popup
        setSuccessMessage('Application approved successfully! The theatre owner will receive an email with their login credentials.');
        setShowSuccessModal(true);
      } else {
        console.error('❌ Failed to approve application:', response.error);
        console.error('Response details:', response);
        setSuccessMessage('Failed to approve application: ' + (response.error || response.message || 'Unknown error'));
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('❌ Error approving application:', error);
      const anyErr = error as any;
      const detail = anyErr?.data?.details || anyErr?.details || anyErr?.data?.error;
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name,
        details: detail
      });
              setSuccessMessage('Error approving application: ' + (error as Error).message + (detail ? ' - ' + detail : ''));
        setShowSuccessModal(true);
    }
  };

  const confirmRejectApplication = async () => {
    if (!selectedApplication || !rejectReason.trim()) return;

    try {
      const response = await apiService.rejectApplication(selectedApplication._id, rejectReason);

      if (response.success) {
        // Update application status locally with response data
        const updatedApps = applications.map(app =>
          app._id === selectedApplication._id
            ? { ...app, ...response.data }
            : app
        );
        setApplications(updatedApps);

        // Update stats
        setStats(prev => ({
          ...prev,
          pendingApplications: updatedApps.filter(app => app.status === 'pending').length,
          approvedApplications: updatedApps.filter(app => app.status === 'approved').length,
          rejectedApplications: updatedApps.filter(app => app.status === 'rejected').length
        }));

        setShowRejectModal(false);
        setSelectedApplication(null);
        setRejectReason('');
      } else {
        console.error('Failed to reject application:', response.error);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-yellow-100';
      case 'approved': return 'bg-green-500 text-green-100';
      case 'rejected': return 'bg-red-500 text-red-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  const getTabCount = (status: string) => {
    if (status === 'all') return stats.totalApplications;
    switch (status) {
      case 'pending': return stats.pendingApplications;
      case 'approved': return stats.approvedApplications;
      case 'rejected': return stats.rejectedApplications;
      default: return applications.filter(app => app.status === status).length;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Title */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                <i className="fas fa-shield-alt text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400">Manage theatre applications and users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-white text-xl"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500"></div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Users</p>
                <p className="text-3xl font-bold text-white">{stats.activeUsers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-user-check text-white text-xl"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500"></div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Pending Applications</p>
                <p className="text-3xl font-bold text-white">{stats.pendingApplications.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <i className="fas fa-clock text-white text-xl"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-500"></div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">New This Month</p>
                <p className="text-3xl font-bold text-white">{stats.newUsersThisMonth.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-user-plus text-white text-xl"></i>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500"></div>
          </div>
        </div>

        {/* Quick Actions and Recent Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <button className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3">
                <i className="fas fa-film text-xl"></i>
                <span>Manage Movies</span>
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3">
                <i className="fas fa-desktop text-xl"></i>
                <span>Manage Screens</span>
              </button>
              <button
                onClick={() => setActiveSection('applications')}
                className={`w-full p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                  activeSection === 'applications'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <i className="fas fa-building text-xl"></i>
                <span>View Applications</span>
              </button>
              <button
                onClick={() => setActiveSection('users')}
                className={`w-full p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 ${
                  activeSection === 'users'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <i className="fas fa-users text-xl"></i>
                <span>Manage Users</span>
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3">
                <i className="fas fa-chart-bar text-xl"></i>
                <span>Generate Reports</span>
              </button>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3">
                <i className="fas fa-utensils text-xl"></i>
                <span>Manage Snacks</span>
              </button>
            </div>
          </div>

          {/* Recent Data */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {activeSection === 'applications' ? 'Recent Applications' : 'Recent Users'}
              </h2>
              <button className="text-red-400 hover:text-red-300 text-sm font-medium">View All</button>
            </div>
            <div className="space-y-4">
              {activeSection === 'applications' ? (
                filteredApplications.slice(0, 3).map((application) => (
                  <div key={application._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{application.theatreName}</h3>
                        <p className="text-gray-400 text-sm">{application.ownerName} • {application.locationText}</p>
                        <p className="text-gray-500 text-xs mt-1">{new Date(application.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                        <span className="text-white font-bold">{application.screenCount} screens</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                users.slice(0, 3).map((user) => (
                  <div key={user._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{user.displayName}</h3>
                        <p className="text-gray-400 text-sm">{user.email} • {user.preferredCity || 'No city'}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Joined {new Date(user.createdAt).toLocaleDateString()} •
                          {user.isEmailVerified ? ' Verified' : ' Unverified'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          user.isEmailVerified ? 'bg-green-500 text-green-100' : 'bg-yellow-500 text-yellow-100'
                        }`}>
                          {user.isEmailVerified ? 'Verified' : 'Pending'}
                        </span>
                        <span className="text-white font-bold">{user.totalBookings} bookings</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {activeSection === 'applications' && (
            <div className="border-b border-gray-700">
              <nav className="-mb-px flex space-x-8 px-6">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-red-500 text-red-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {tab} ({getTabCount(tab)})
                  </button>
                ))}
              </nav>
            </div>
          )}

          {activeSection === 'users' && (
            <div className="border-b border-gray-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white">User Management</h3>
              <p className="text-gray-400 text-sm">Manage registered users and their accounts</p>
            </div>
          )}

          {/* Table Content */}
          <div className="overflow-x-auto">
            {activeSection === 'applications' ? (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Theatre Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredApplications.map((application) => (
                    <tr key={application._id} className="hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{application.theatreName}</div>
                          <div className="text-sm text-gray-400">{application.theatreType} • {application.screenCount} screens</div>
                          <div className="text-sm text-gray-500">{application.locationText}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{application.ownerName}</div>
                          <div className="text-sm text-gray-400">{application.email}</div>
                          <div className="text-sm text-gray-500">{application.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewApplicationDetails(application)}
                          className="text-blue-400 hover:text-blue-300 mr-4 transition-colors duration-200"
                        >
                          View Details
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveApplication(application)}
                              className="text-green-400 hover:text-green-300 mr-2 transition-colors duration-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectApplication(application)}
                              className="text-red-400 hover:text-red-300 transition-colors duration-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{user.displayName}</div>
                          <div className="text-sm text-gray-400">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.authProvider} • {user.preferredCity || 'No city'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{user.email}</div>
                          <div className="text-sm text-gray-400">{user.phone || 'No phone'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.isEmailVerified ? 'bg-green-500 text-green-100' : 'bg-yellow-500 text-yellow-100'
                          }`}>
                            {user.isEmailVerified ? 'Verified' : 'Unverified'}
                          </span>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-blue-500 text-blue-100' : 'bg-red-500 text-red-100'
                          }`}>
                            {user.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div>
                          <div>{user.totalBookings} bookings</div>
                          <div>₹{user.totalSpent.toLocaleString()} spent</div>
                          <div>{user.loyaltyPoints} points</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewProfile(user)}
                          className="text-blue-400 hover:text-blue-300 mr-4 transition-colors duration-200"
                        >
                          View Profile
                        </button>

                        <button
                          onClick={() => handleSuspendUser(user)}
                          className={`transition-colors duration-200 ${
                            user.isActive
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-green-400 hover:text-green-300'
                          }`}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {((activeSection === 'applications' && filteredApplications.length === 0) ||
            (activeSection === 'users' && users.length === 0)) && (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-gray-600 text-4xl mb-4"></i>
              <p className="text-gray-400">
                {activeSection === 'applications'
                  ? `No ${activeTab === 'all' ? '' : activeTab} applications found.`
                  : 'No users found.'
                }
              </p>
            </div>
          )}
        </div>
      </main>

      {/* View Profile Modal */}
      {showViewProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">User Profile</h2>
              <button
                onClick={() => setShowViewProfileModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Full Name</label>
                    <p className="text-white font-medium">{selectedUser.displayName}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-white font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Phone</label>
                    <p className="text-white font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Preferred City</label>
                    <p className="text-white font-medium">{selectedUser.preferredCity || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Auth Provider</label>
                    <p className="text-white font-medium capitalize">{selectedUser.authProvider}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Status</label>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.isActive ? 'bg-green-500 text-green-100' : 'bg-red-500 text-red-100'
                    }`}>
                      {selectedUser.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Activity & Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{selectedUser.totalBookings}</p>
                    <p className="text-gray-400 text-sm">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">₹{selectedUser.totalSpent.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{selectedUser.loyaltyPoints}</p>
                    <p className="text-gray-400 text-sm">Loyalty Points</p>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Email Verified</label>
                    <p className="text-white font-medium">
                      {selectedUser.isEmailVerified ? (
                        <span className="text-green-400"><i className="fas fa-check mr-1"></i>Verified</span>
                      ) : (
                        <span className="text-red-400"><i className="fas fa-times mr-1"></i>Not Verified</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Membership Tier</label>
                    <p className="text-white font-medium capitalize">{selectedUser.membershipTier || 'Bronze'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Joined Date</label>
                    <p className="text-white font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Last Active</label>
                    <p className="text-white font-medium">
                      {selectedUser.lastActiveAt
                        ? new Date(selectedUser.lastActiveAt).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowViewProfileModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Suspend/Activate Confirmation Modal */}
      {showSuspendConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                selectedUser.isActive ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <i className={`fas text-2xl ${
                  selectedUser.isActive
                    ? 'fa-user-slash text-red-600'
                    : 'fa-user-check text-green-600'
                }`}></i>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {selectedUser.isActive ? 'Suspend User' : 'Activate User'}
              </h3>

              <p className="text-gray-400 mb-6">
                Are you sure you want to {selectedUser.isActive ? 'suspend' : 'activate'} <strong className="text-white">{selectedUser.displayName}</strong>?
                {selectedUser.isActive && (
                  <span className="block mt-2 text-sm">
                    This user will no longer be able to access their account.
                  </span>
                )}
              </p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowSuspendConfirm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSuspendUser}
                  className={`px-6 py-2 rounded-lg transition-colors text-white ${
                    selectedUser.isActive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {selectedUser.isActive ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Application Details Modal */}
      {showApplicationDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Theatre Application Details</h2>
              <button
                onClick={() => setShowApplicationDetailsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Theatre Information */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <i className="fas fa-building mr-2 text-red-400"></i>
                  Theatre Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Theatre Name</label>
                    <p className="text-white font-medium">{selectedApplication.theatreName}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Theatre Type</label>
                    <p className="text-white font-medium">{selectedApplication.theatreType}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Number of Screens</label>
                    <p className="text-white font-medium">{selectedApplication.screenCount}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Seating Capacity</label>
                    <p className="text-white font-medium">{selectedApplication.seatingCapacity}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-gray-400 text-sm">Location</label>
                    <p className="text-white font-medium">{selectedApplication.locationText}</p>
                  </div>
                  {selectedApplication.screens && selectedApplication.screens.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="text-gray-400 text-sm">Screen Details</label>
                      <div className="mt-2 space-y-3">
                        {selectedApplication.screens.map((screen, index) => (
                          <div key={index} className="bg-gray-600 rounded-lg p-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Screen {screen.screenNumber}:</span>
                                <span className="text-white ml-2">{screen.seatingCapacity} seats</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Layout:</span>
                                <span className="text-white ml-2">{screen.seatLayout}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Base Price:</span>
                                <span className="text-white ml-2">₹{screen.baseTicketPrice}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Premium:</span>
                                <span className="text-white ml-2">₹{screen.premiumPrice}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-gray-400 text-sm">Description</label>
                    <p className="text-white font-medium">{selectedApplication.description}</p>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <i className="fas fa-user mr-2 text-blue-400"></i>
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Owner Name</label>
                    <p className="text-white font-medium">{selectedApplication.ownerName}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-white font-medium">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Phone</label>
                    <p className="text-white font-medium">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Internet Connectivity</label>
                    <p className="text-white font-medium">{selectedApplication.internetConnectivity}</p>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <i className="fas fa-info-circle mr-2 text-yellow-400"></i>
                  Application Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Current Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Application Date</label>
                    <p className="text-white font-medium">{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Last Updated</label>
                    <p className="text-white font-medium">{new Date(selectedApplication.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              {selectedApplication.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowApplicationDetailsModal(false);
                      handleApproveApplication(selectedApplication);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <i className="fas fa-check"></i>
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowApplicationDetailsModal(false);
                      handleRejectApplication(selectedApplication);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <i className="fas fa-times"></i>
                    <span>Reject</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setShowApplicationDetailsModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Application Confirmation Modal */}
      {showApproveConfirm && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-2xl text-green-600"></i>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Approve Application</h3>

              <p className="text-gray-400 mb-6">
                Are you sure you want to approve the application for <strong className="text-white">{selectedApplication.theatreName}</strong>?
                <span className="block mt-2 text-sm">
                  This will grant the theatre owner access to the platform.
                </span>
              </p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApproveApplication}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Application Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-times text-2xl text-red-600"></i>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Reject Application</h3>

              <p className="text-gray-400 mb-4">
                You are about to reject the application for <strong className="text-white">{selectedApplication.theatreName}</strong>.
              </p>

              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2 text-left">Reason for Rejection *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this application..."
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejectApplication}
                  disabled={!rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                successMessage.includes('successfully') ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <i className={`fas text-2xl ${
                  successMessage.includes('successfully')
                    ? 'fa-check text-green-600'
                    : 'fa-exclamation-triangle text-red-600'
                }`}></i>
              </div>

              <h3 className={`text-xl font-bold mb-2 ${
                successMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'
              }`}>
                {successMessage.includes('successfully') ? 'Success!' : 'Error'}
              </h3>

              <p className="text-gray-300 mb-6">
                {successMessage}
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className={`px-6 py-2 rounded-lg transition-colors text-white ${
                  successMessage.includes('successfully')
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
