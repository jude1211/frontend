import React, { useState, useEffect } from 'react';
import BookNViewLoader from '../components/BookNViewLoader';
import { apiService } from '../services/api';

interface AnalyticsData {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    noShowBookings: number;
    totalSeats: number;
    averageBookingValue: number;
  };
  dailyStats: Array<{
    _id: {
      year: number;
      month: number;
      day: number;
    };
    bookings: number;
    revenue: number;
  }>;
  movieStats: Array<{
    _id: string;
    title: string;
    bookings: number;
    revenue: number;
    averageRating: number;
  }>;
  screenStats: Array<{
    _id: string;
    screenNumber: number;
    screenType: string;
    bookings: number;
    revenue: number;
    occupancyRate: number;
  }>;
  timeSlotStats: Array<{
    _id: string;
    bookings: number;
    revenue: number;
  }>;
  paymentMethodStats: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

const BookingAnalytics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [selectedTab, setSelectedTab] = useState<'overview' | 'movies' | 'screens' | 'timing'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/theatre-owner/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (response.success) {
        setAnalyticsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // For demo purposes, use mock data
      setAnalyticsData({
        summary: {
          totalBookings: 1247,
          totalRevenue: 1250000,
          confirmedBookings: 1100,
          cancelledBookings: 89,
          completedBookings: 1050,
          noShowBookings: 58,
          totalSeats: 2480,
          averageBookingValue: 1003.2
        },
        dailyStats: [
          { _id: { year: 2025, month: 1, day: 7 }, bookings: 45, revenue: 45000 },
          { _id: { year: 2025, month: 1, day: 6 }, bookings: 52, revenue: 52000 },
          { _id: { year: 2025, month: 1, day: 5 }, bookings: 38, revenue: 38000 },
          { _id: { year: 2025, month: 1, day: 4 }, bookings: 41, revenue: 41000 },
          { _id: { year: 2025, month: 1, day: 3 }, bookings: 47, revenue: 47000 }
        ],
        movieStats: [
          { _id: '1', title: 'Superman', bookings: 320, revenue: 320000, averageRating: 4.5 },
          { _id: '2', title: 'Saiyara', bookings: 280, revenue: 280000, averageRating: 4.2 },
          { _id: '3', title: 'F1: The Movie', bookings: 250, revenue: 250000, averageRating: 4.7 },
          { _id: '4', title: 'Action Hero', bookings: 200, revenue: 200000, averageRating: 4.1 }
        ],
        screenStats: [
          { _id: '1', screenNumber: 1, screenType: 'IMAX', bookings: 400, revenue: 400000, occupancyRate: 85 },
          { _id: '2', screenNumber: 2, screenType: '3D', bookings: 350, revenue: 350000, occupancyRate: 78 },
          { _id: '3', screenNumber: 3, screenType: '2D', bookings: 300, revenue: 300000, occupancyRate: 72 },
          { _id: '4', screenNumber: 4, screenType: '4DX', bookings: 197, revenue: 200000, occupancyRate: 65 }
        ],
        timeSlotStats: [
          { _id: '10:00 AM', bookings: 120, revenue: 120000 },
          { _id: '1:00 PM', bookings: 180, revenue: 180000 },
          { _id: '4:00 PM', bookings: 220, revenue: 220000 },
          { _id: '7:30 PM', bookings: 350, revenue: 350000 },
          { _id: '10:30 PM', bookings: 200, revenue: 200000 }
        ],
        paymentMethodStats: [
          { _id: 'online', count: 800, totalAmount: 800000 },
          { _id: 'cash', count: 300, totalAmount: 300000 },
          { _id: 'card', count: 147, totalAmount: 150000 }
        ]
      });
    }
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: { year: number; month: number; day: number }) => {
    return new Date(date.year, date.month - 1, date.day).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  if (isLoading) {
    return <BookNViewLoader fullScreen={true} text="Loading Analytics..." />;
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-chart-line text-6xl text-brand-red mb-4"></i>
          <h2 className="text-2xl font-bold text-white mb-2">No Analytics Data</h2>
          <p className="text-brand-light-gray">Unable to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      {/* Header */}
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Booking Analytics</h1>
                <p className="text-brand-light-gray">Comprehensive booking insights and reports</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-brand-light-gray text-sm">From:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-brand-dark border border-brand-dark/30 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-brand-light-gray text-sm">To:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-brand-dark border border-brand-dark/30 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <button
                onClick={fetchAnalyticsData}
                className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-white">{analyticsData.summary.totalBookings.toLocaleString()}</p>
                <p className="text-green-400 text-sm">
                  {calculatePercentage(analyticsData.summary.confirmedBookings, analyticsData.summary.totalBookings)}% Confirmed
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-ticket-alt text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(analyticsData.summary.totalRevenue)}</p>
                <p className="text-green-400 text-sm">
                  Avg: {formatCurrency(analyticsData.summary.averageBookingValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <i className="fas fa-rupee-sign text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Cancellation Rate</p>
                <p className="text-3xl font-bold text-white">
                  {calculatePercentage(analyticsData.summary.cancelledBookings, analyticsData.summary.totalBookings)}%
                </p>
                <p className="text-red-400 text-sm">
                  {analyticsData.summary.cancelledBookings} cancelled
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <i className="fas fa-times-circle text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-light-gray text-sm">Total Seats Sold</p>
                <p className="text-3xl font-bold text-white">{analyticsData.summary.totalSeats.toLocaleString()}</p>
                <p className="text-blue-400 text-sm">
                  {analyticsData.summary.noShowBookings} no-shows
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-chair text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg mb-8">
          <div className="flex space-x-1 bg-brand-dark rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: 'fas fa-chart-pie' },
              { id: 'movies', label: 'Movies', icon: 'fas fa-film' },
              { id: 'screens', label: 'Screens', icon: 'fas fa-tv' },
              { id: 'timing', label: 'Timing', icon: 'fas fa-clock' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
                  selectedTab === tab.id
                    ? 'bg-brand-red text-white'
                    : 'text-brand-light-gray hover:text-white hover:bg-brand-dark/50'
                }`}
              >
                <i className={`${tab.icon} text-sm`}></i>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Revenue Chart */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Daily Revenue Trend</h3>
              <div className="space-y-4">
                {analyticsData.dailyStats.slice(0, 7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{formatDate(day._id)}</span>
                        <span className="text-green-400 font-bold">{formatCurrency(day.revenue)}</span>
                      </div>
                      <div className="w-full bg-brand-dark rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-red to-red-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((day.revenue / Math.max(...analyticsData.dailyStats.map(d => d.revenue))) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-brand-light-gray mt-1">
                        <span>{day.bookings} bookings</span>
                        <span>Avg: {formatCurrency(day.revenue / day.bookings)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Payment Methods</h3>
              <div className="space-y-4">
                {analyticsData.paymentMethodStats.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        method._id === 'online' ? 'bg-blue-500' :
                        method._id === 'cash' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-white capitalize">{method._id}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{method.count} ({calculatePercentage(method.count, analyticsData.summary.totalBookings)}%)</div>
                      <div className="text-green-400 text-sm">{formatCurrency(method.totalAmount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'movies' && (
          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">Movie Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-dark/30">
                    <th className="text-left text-brand-light-gray py-3">Movie</th>
                    <th className="text-left text-brand-light-gray py-3">Bookings</th>
                    <th className="text-left text-brand-light-gray py-3">Revenue</th>
                    <th className="text-left text-brand-light-gray py-3">Avg Rating</th>
                    <th className="text-left text-brand-light-gray py-3">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.movieStats.map((movie, index) => (
                    <tr key={index} className="border-b border-brand-dark/20">
                      <td className="py-4">
                        <div className="text-white font-medium">{movie.title}</div>
                      </td>
                      <td className="py-4">
                        <div className="text-white">{movie.bookings}</div>
                        <div className="text-brand-light-gray text-sm">
                          {calculatePercentage(movie.bookings, analyticsData.summary.totalBookings)}% of total
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="text-green-400 font-bold">{formatCurrency(movie.revenue)}</div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">{movie.averageRating}</span>
                          <i className="fas fa-star text-yellow-400 text-sm"></i>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="w-24 bg-brand-dark rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-brand-red to-red-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((movie.bookings / Math.max(...analyticsData.movieStats.map(m => m.bookings))) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'screens' && (
          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">Screen Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyticsData.screenStats.map((screen, index) => (
                <div key={index} className="bg-brand-dark rounded-xl p-6 border border-brand-dark/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-white font-bold text-lg">Screen {screen.screenNumber}</h4>
                      <p className="text-brand-light-gray text-sm">{screen.screenType}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-lg">{formatCurrency(screen.revenue)}</div>
                      <div className="text-white text-sm">{screen.bookings} bookings</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-brand-light-gray">Occupancy Rate</span>
                        <span className="text-white">{screen.occupancyRate}%</span>
                      </div>
                      <div className="w-full bg-brand-gray rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                          style={{ width: `${screen.occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-light-gray">Avg per booking</span>
                      <span className="text-white">{formatCurrency(screen.revenue / screen.bookings)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'timing' && (
          <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">Show Time Performance</h3>
            <div className="space-y-4">
              {analyticsData.timeSlotStats.map((slot, index) => (
                <div key={index} className="flex items-center justify-between bg-brand-dark rounded-xl p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-brand-red rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-white"></i>
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">{slot._id}</div>
                      <div className="text-brand-light-gray text-sm">{slot.bookings} bookings</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">{formatCurrency(slot.revenue)}</div>
                    <div className="text-white text-sm">
                      Avg: {formatCurrency(slot.revenue / slot.bookings)}
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="w-full bg-brand-gray rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-brand-red to-red-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((slot.bookings / Math.max(...analyticsData.timeSlotStats.map(s => s.bookings))) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingAnalytics;
