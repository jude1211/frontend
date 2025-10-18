import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface ApiMonitorProps {
  show?: boolean;
}

const ApiMonitor: React.FC<ApiMonitorProps> = ({ show = false }) => {
  const [stats, setStats] = useState({ cacheSize: 0, pendingRequests: 0 });
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    const updateStats = () => {
      setStats(apiService.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">API Monitor</span>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="space-y-1">
        <div>Cache: {stats.cacheSize} entries</div>
        <div>Pending: {stats.pendingRequests} requests</div>
        <button 
          onClick={() => apiService.clearCache()}
          className="text-red-400 hover:text-red-300 underline"
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
};

export default ApiMonitor;



