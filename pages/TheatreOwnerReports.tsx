import React from 'react';

const TheatreOwnerReports: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <i className="fas fa-chart-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
              <p className="text-brand-light-gray">Track bookings, revenue, and performance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg">
          <p className="text-brand-light-gray">Reports module placeholder. We will connect real data from offline and online bookings.</p>
        </div>
      </div>
    </div>
  );
};

export default TheatreOwnerReports;

