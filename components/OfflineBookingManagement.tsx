import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface OfflineBooking {
  _id: string;
  bookingId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    idProof: string;
    idNumber: string;
  };
  movie: {
    title: string;
    poster?: string;
    genre: string[];
    duration: number;
    rating: string;
    language: string;
  };
  theatre: {
    theatreId: string;
    name: string;
    screen: {
      screenNumber: number;
      screenType: string;
    };
  };
  showtime: {
    date: string;
    time: string;
  };
  seats: Array<{
    seatNumber: string;
    row: string;
    seatType: string;
    price: number;
  }>;
  pricing: {
    seatTotal: number;
    snackTotal: number;
    subtotal: number;
    totalAmount: number;
  };
  payment: {
    method: string;
    status: string;
    paidAmount: number;
    changeGiven: number;
  };
  status: string;
  bookingDate: string;
  showDate: string;
}

interface OfflineBookingManagementProps {
  theatreOwner: any;
  onClose: () => void;
}

const OfflineBookingManagement: React.FC<OfflineBookingManagementProps> = ({ theatreOwner, onClose }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'stats'>('list');
  const [bookings, setBookings] = useState<OfflineBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Create booking form state
  const [createForm, setCreateForm] = useState({
    customer: {
      name: '',
      phone: '',
      email: '',
      idProof: 'aadhar',
      idNumber: ''
    },
    movie: {
      title: '',
      genre: [],
      duration: 0,
      rating: '',
      language: 'Hindi'
    },
    theatre: {
      theatreId: '',
      name: theatreOwner?.theatreName || '',
      screen: {
        screenNumber: 1,
        screenType: '2D'
      }
    },
    showtime: {
      date: '',
      time: ''
    },
    seats: [] as Array<{
      seatNumber: string;
      row: string;
      seatType: string;
      price: number;
    }>,
    snacks: [] as Array<{
      name: string;
      category: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      size: string;
    }>,
    payment: {
      method: 'cash',
      paidAmount: 0
    },
    notes: ''
  });

  useEffect(() => {
    if (activeTab === 'list') {
      fetchBookings();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await apiService.getOfflineBookings();
      if (response.success) {
        setBookings(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await apiService.getOfflineBookingStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch stats');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiService.createOfflineBooking(createForm);
      if (response.success) {
        alert('Offline booking created successfully!');
        setCreateForm({
          customer: { name: '', phone: '', email: '', idProof: 'aadhar', idNumber: '' },
          movie: { title: '', genre: [], duration: 0, rating: '', language: 'Hindi' },
          theatre: { theatreId: '', name: theatreOwner?.theatreName || '', screen: { screenNumber: 1, screenType: '2D' } },
          showtime: { date: '', time: '' },
          seats: [],
          snacks: [],
          payment: { method: 'cash', paidAmount: 0 },
          notes: ''
        });
        setActiveTab('list');
        fetchBookings();
      } else {
        setError(response.error || 'Failed to create booking');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const addSeat = () => {
    setCreateForm(prev => ({
      ...prev,
      seats: [...prev.seats, { seatNumber: '', row: '', seatType: 'regular', price: 0 }]
    }));
  };

  const removeSeat = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      seats: prev.seats.filter((_, i) => i !== index)
    }));
  };

  const updateSeat = (index: number, field: string, value: any) => {
    setCreateForm(prev => ({
      ...prev,
      seats: prev.seats.map((seat, i) => 
        i === index ? { ...seat, [field]: value } : seat
      )
    }));
  };

  const calculateTotal = () => {
    const seatTotal = createForm.seats.reduce((sum, seat) => sum + (seat.price || 0), 0);
    const snackTotal = createForm.snacks.reduce((sum, snack) => sum + (snack.totalPrice || 0), 0);
    const subtotal = seatTotal + snackTotal;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    return subtotal + tax;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-900';
      case 'cancelled': return 'text-red-400 bg-red-900';
      case 'completed': return 'text-blue-400 bg-blue-900';
      case 'no_show': return 'text-yellow-400 bg-yellow-900';
      default: return 'text-gray-400 bg-gray-900';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'fas fa-money-bill-wave';
      case 'card': return 'fas fa-credit-card';
      case 'upi': return 'fas fa-mobile-alt';
      case 'netbanking': return 'fas fa-university';
      case 'wallet': return 'fas fa-wallet';
      default: return 'fas fa-money-bill-wave';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Offline Booking Management</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-list mr-2"></i>
              Bookings List
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'create'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-plus mr-2"></i>
              Create Booking
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'stats'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-chart-bar mr-2"></i>
              Statistics
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {activeTab === 'list' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">All Offline Bookings</h3>
                <button
                  onClick={fetchBookings}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                  <p className="mt-4 text-gray-300">Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-ticket-alt text-6xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 text-lg">No offline bookings found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">#{booking.bookingId}</h4>
                          <p className="text-gray-400">{booking.customer.name} • {booking.customer.phone}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.toUpperCase()}
                          </span>
                          <div className="text-right">
                            <p className="text-white font-semibold">₹{booking.pricing.totalAmount}</p>
                            <p className="text-gray-400 text-sm">
                              <i className={`${getPaymentMethodIcon(booking.payment.method)} mr-1`}></i>
                              {booking.payment.method.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">Movie</p>
                          <p className="text-white font-medium">{booking.movie.title}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Show Time</p>
                          <p className="text-white font-medium">
                            {new Date(booking.showtime.date).toLocaleDateString()} {booking.showtime.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Screen</p>
                          <p className="text-white font-medium">
                            Screen {booking.theatre.screen.screenNumber} ({booking.theatre.screen.screenType})
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-400 text-sm">Seats ({booking.seats.length})</p>
                          <p className="text-white font-medium">
                            {booking.seats.map(seat => seat.seatNumber).join(', ')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                            <i className="fas fa-eye mr-1"></i>
                            View
                          </button>
                          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                            <i className="fas fa-edit mr-1"></i>
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Create New Offline Booking</h3>
              
              <form onSubmit={handleCreateBooking} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Customer Name *</label>
                      <input
                        type="text"
                        value={createForm.customer.name}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          customer: { ...prev.customer, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={createForm.customer.phone}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          customer: { ...prev.customer, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Email (Optional)</label>
                      <input
                        type="email"
                        value={createForm.customer.email}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          customer: { ...prev.customer, email: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">ID Proof Type *</label>
                      <select
                        value={createForm.customer.idProof}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          customer: { ...prev.customer, idProof: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      >
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="driving_license">Driving License</option>
                        <option value="passport">Passport</option>
                        <option value="voter_id">Voter ID</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">ID Number *</label>
                      <input
                        type="text"
                        value={createForm.customer.idNumber}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          customer: { ...prev.customer, idNumber: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Movie Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Movie Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Movie Title *</label>
                      <input
                        type="text"
                        value={createForm.movie.title}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          movie: { ...prev.movie, title: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Language</label>
                      <input
                        type="text"
                        value={createForm.movie.language}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          movie: { ...prev.movie, language: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={createForm.movie.duration}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          movie: { ...prev.movie, duration: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Rating</label>
                      <input
                        type="text"
                        value={createForm.movie.rating}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          movie: { ...prev.movie, rating: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Show Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Show Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Show Date *</label>
                      <input
                        type="date"
                        value={createForm.showtime.date}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          showtime: { ...prev.showtime, date: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Show Time *</label>
                      <input
                        type="time"
                        value={createForm.showtime.time}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          showtime: { ...prev.showtime, time: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Screen Number *</label>
                      <input
                        type="number"
                        value={createForm.theatre.screen.screenNumber}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          theatre: {
                            ...prev.theatre,
                            screen: { ...prev.theatre.screen, screenNumber: parseInt(e.target.value) || 1 }
                          }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Seats */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-white">Seats</h4>
                    <button
                      type="button"
                      onClick={addSeat}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add Seat
                    </button>
                  </div>
                  
                  {createForm.seats.map((seat, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-700 rounded-lg">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Seat Number *</label>
                        <input
                          type="text"
                          value={seat.seatNumber}
                          onChange={(e) => updateSeat(index, 'seatNumber', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Row</label>
                        <input
                          type="text"
                          value={seat.row}
                          onChange={(e) => updateSeat(index, 'row', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Seat Type</label>
                        <select
                          value={seat.seatType}
                          onChange={(e) => updateSeat(index, 'seatType', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-red-500"
                        >
                          <option value="regular">Regular</option>
                          <option value="premium">Premium</option>
                          <option value="recliner">Recliner</option>
                          <option value="vip">VIP</option>
                        </select>
                      </div>
                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-gray-300 text-sm font-medium mb-2">Price *</label>
                          <input
                            type="number"
                            value={seat.price}
                            onChange={(e) => updateSeat(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-red-500"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSeat(index)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Payment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Payment Method *</label>
                      <select
                        value={createForm.payment.method}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          payment: { ...prev.payment, method: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="netbanking">Net Banking</option>
                        <option value="wallet">Wallet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">Amount Paid *</label>
                      <input
                        type="number"
                        value={createForm.payment.paidAmount}
                        onChange={(e) => setCreateForm(prev => ({
                          ...prev,
                          payment: { ...prev.payment, paidAmount: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Total Calculation */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Booking Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Seat Total:</span>
                      <span className="text-white">₹{createForm.seats.reduce((sum, seat) => sum + (seat.price || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Snack Total:</span>
                      <span className="text-white">₹{createForm.snacks.reduce((sum, snack) => sum + (snack.totalPrice || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Subtotal:</span>
                      <span className="text-white">₹{createForm.seats.reduce((sum, seat) => sum + (seat.price || 0), 0) + createForm.snacks.reduce((sum, snack) => sum + (snack.totalPrice || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tax (18% GST):</span>
                      <span className="text-white">₹{Math.round((createForm.seats.reduce((sum, seat) => sum + (seat.price || 0), 0) + createForm.snacks.reduce((sum, snack) => sum + (snack.totalPrice || 0), 0)) * 0.18)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-white">Total Amount:</span>
                        <span className="text-red-400">₹{calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Create Booking
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-6">Offline Booking Statistics</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                  <p className="mt-4 text-gray-300">Loading statistics...</p>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <i className="fas fa-ticket-alt text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-400 text-sm">Total Bookings</p>
                        <p className="text-white text-2xl font-bold">{stats.summary.totalBookings}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <i className="fas fa-rupee-sign text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-400 text-sm">Total Revenue</p>
                        <p className="text-white text-2xl font-bold">₹{stats.summary.totalRevenue}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-600 rounded-lg">
                        <i className="fas fa-check-circle text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-400 text-sm">Confirmed</p>
                        <p className="text-white text-2xl font-bold">{stats.summary.confirmedBookings}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <i className="fas fa-chart-line text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-gray-400 text-sm">Avg. Value</p>
                        <p className="text-white text-2xl font-bold">₹{Math.round(stats.summary.averageBookingValue)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-chart-bar text-6xl text-gray-600 mb-4"></i>
                  <p className="text-gray-400 text-lg">No statistics available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineBookingManagement;