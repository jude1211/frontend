import React from 'react';

const BookingAnalytics: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Booking Analytics</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <p className="text-gray-300">Analytics dashboard coming soon. We will display KPIs such as total bookings, revenue, occupancy trends, and top movies.</p>
        </div>
      </main>
    </div>
  );
};

export default BookingAnalytics;

