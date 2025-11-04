import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookNViewLoader from '../components/BookNViewLoader';

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  todayRevenue: number;
  activeMovies: number;
  totalScreens: number;
}

interface RecentBooking {
  id: string;
  movieTitle: string;
  customerName: string;
  showtime: string;
  seats: string[];
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  date: string;
}

const TheatreOwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeMovies: 0,
    totalScreens: 0
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats({
        totalBookings: 1247,
        todayBookings: 89,
        totalRevenue: 1250000,
        todayRevenue: 45000,
        activeMovies: 8,
        totalScreens: 12
      });
      setRecentBookings([
        {
          id: '1',
          movieTitle: 'Superman',
          customerName: 'Rahul Sharma',
          showtime: '7:30 PM',
          seats: ['A5', 'A6'],
          amount: 800,
          status: 'confirmed',
          date: '2025-08-07'
        },
        {
          id: '2',
          movieTitle: 'Saiyara',
          customerName: 'Priya Patel',
          showtime: '10:00 AM',
          seats: ['C12'],
          amount: 400,
          status: 'confirmed',
          date: '2025-08-07'
        },
        {
          id: '3',
          movieTitle: 'F1: The Movie',
          customerName: 'Amit Kumar',
          showtime: '4:00 PM',
          seats: ['B8', 'B9', 'B10'],
          amount: 1200,
          status: 'pending',
          date: '2025-08-07'
        }
      ]);
      setIsLoading(false);
    }, 2000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <BookNViewLoader fullScreen={true} text="Loading Dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      {/* Header */}
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-film text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Theatre Owner Dashboard</h1>
                <p className="text-brand-light-gray">Manage your theatre operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                <i className="fas fa-plus mr-2"></i>
                Add Movie
              </button>
              <button className="text-brand-light-gray hover:text-white transition-colors">
                <i className="fas fa-bell text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Bookings</p>
                <p className="text-2xl font-bold text-white">{stats.totalBookings.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-ticket-alt text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Today's Bookings</p>
                <p className="text-2xl font-bold text-white">{stats.todayBookings}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-calendar-day text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <i className="fas fa-rupee-sign text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Today's Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-line text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Active Movies</p>
                <p className="text-2xl font-bold text-white">{stats.activeMovies}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <i className="fas fa-film text-white"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Screens</p>
                <p className="text-2xl font-bold text-white">{stats.totalScreens}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <i className="fas fa-tv text-white"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/theatre-owner/movies')}
                  className="w-full bg-gradient-to-r from-brand-red to-red-600 text-white p-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-between"
                >
                  <span>Manage Movies</span>
                  <i className="fas fa-film"></i>
                </button>
                <button 
                  onClick={() => navigate('/theatre-owner/screens')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-between"
                >
                  <span>Manage Screens</span>
                  <i className="fas fa-tv"></i>
                </button>
                <button 
                  onClick={() => navigate('/theatre-owner/bookings')}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-between"
                >
                  <span>View Bookings</span>
                  <i className="fas fa-ticket-alt"></i>
                </button>
                <button 
                  onClick={() => navigate('/theatre-owner/reports')}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-between"
                >
                  <span>Generate Reports</span>
                  <i className="fas fa-chart-bar"></i>
                </button>
                <button 
                  onClick={() => navigate('/theatre-owner/snacks')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-between"
                >
                  <span>Manage Snacks</span>
                  <i className="fas fa-utensils"></i>
                </button>
                <button 
                  onClick={() => navigate('/theatre-owner/analytics')}
                  className="bg-gray-700 rounded-lg p-4 text-left hover:bg-gray-600 transition w-full"
                >
                  <h3 className="text-white font-semibold mb-2">Booking Analytics</h3>
                  <p className="text-gray-400 text-sm">Comprehensive booking insights and reports</p>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
                <button 
                  onClick={() => navigate('/theatre-owner/bookings')}
                  className="text-brand-red hover:text-red-400 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="bg-brand-dark rounded-xl p-4 border border-brand-dark/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-white font-semibold">{booking.movieTitle}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-brand-light-gray text-sm mt-1">
                          {booking.customerName} • {booking.showtime} • {booking.seats.join(', ')}
                        </p>
                        <p className="text-brand-light-gray text-xs mt-1">{booking.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatCurrency(booking.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheatreOwnerDashboard; 