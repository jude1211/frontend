import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface ShowTiming {
  _id: string;
  type: 'weekday' | 'weekend' | 'special';
  timings: string[];
  specialDate?: string;
  description?: string;
  isActive: boolean;
}

const ManageShowTimings: React.FC = () => {
  const [ownerId, setOwnerId] = useState<string>('');
  const [weekdayTimings, setWeekdayTimings] = useState<string[]>([]);
  const [weekendTimings, setWeekendTimings] = useState<string[]>([]);
  const [specialTimings, setSpecialTimings] = useState<ShowTiming[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Special timing form
  const [showSpecialForm, setShowSpecialForm] = useState(false);
  const [specialDate, setSpecialDate] = useState('');
  const [specialDescription, setSpecialDescription] = useState('');
  const [specialTimingsInput, setSpecialTimingsInput] = useState('');

  // New timing input
  const [newTiming, setNewTiming] = useState('');
  const [activeSection, setActiveSection] = useState<'weekday' | 'weekend' | 'special'>('weekday');

  useEffect(() => {
    loadOwnerId();
  }, []);

  useEffect(() => {
    if (ownerId) {
      loadTimings();
    }
  }, [ownerId]);

  const loadOwnerId = async () => {
    try {
      const profile = await apiService.getTheatreOwnerProfile?.();
      const id = profile?.success ? (profile.data?.id || profile.data?._id) : null;
      if (!id) {
        const ownerLocal = localStorage.getItem('theatreOwnerData');
        if (ownerLocal) {
          const parsed = JSON.parse(ownerLocal);
          setOwnerId(parsed._id || parsed.id);
        }
      } else {
        setOwnerId(id);
      }
    } catch (error) {
      console.error('Failed to load owner ID:', error);
    }
  };

  const loadTimings = async () => {
    if (!ownerId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getShowTimings(ownerId);
      if (response.success) {
        const timings = response.data || [];
        
        const weekday = timings.find(t => t.type === 'weekday');
        const weekend = timings.find(t => t.type === 'weekend');
        const special = timings.filter(t => t.type === 'special');
        
        setWeekdayTimings(weekday?.timings || []);
        setWeekendTimings(weekend?.timings || []);
        setSpecialTimings(special);
      }
    } catch (error) {
      console.error('Failed to load timings:', error);
      showMessage('error', 'Failed to load show timings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const parseTimings = (input: string): string[] => {
    return input.split(',').map(t => t.trim()).filter(Boolean);
  };

  const addTiming = (timings: string[], setTimings: (timings: string[]) => void) => {
    if (!newTiming.trim()) return;
    
    const parsed = parseTimings(newTiming);
    const updated = [...timings, ...parsed];
    setTimings(updated);
    setNewTiming('');
  };

  const removeTiming = (timings: string[], setTimings: (timings: string[]) => void, index: number) => {
    const updated = timings.filter((_, i) => i !== index);
    setTimings(updated);
  };

  const saveWeekdayTimings = async () => {
    if (!ownerId) return;
    
    try {
      setSaving(true);
      const response = await apiService.saveWeekdayTimings(ownerId, weekdayTimings);
      if (response.success) {
        showMessage('success', 'Weekday timings saved successfully');
      } else {
        showMessage('error', response.error || 'Failed to save weekday timings');
      }
    } catch (error) {
      console.error('Save weekday timings error:', error);
      showMessage('error', 'Failed to save weekday timings');
    } finally {
      setSaving(false);
    }
  };

  const saveWeekendTimings = async () => {
    if (!ownerId) return;
    
    try {
      setSaving(true);
      const response = await apiService.saveWeekendTimings(ownerId, weekendTimings);
      if (response.success) {
        showMessage('success', 'Weekend timings saved successfully');
      } else {
        showMessage('error', response.error || 'Failed to save weekend timings');
      }
    } catch (error) {
      console.error('Save weekend timings error:', error);
      showMessage('error', 'Failed to save weekend timings');
    } finally {
      setSaving(false);
    }
  };

  const createSpecialTiming = async () => {
    if (!ownerId || !specialDate || !specialTimingsInput.trim()) return;
    
    try {
      setSaving(true);
      const timings = parseTimings(specialTimingsInput);
      const response = await apiService.createSpecialTiming(ownerId, timings, specialDate, specialDescription);
      if (response.success) {
        showMessage('success', 'Special timing created successfully');
        setShowSpecialForm(false);
        setSpecialDate('');
        setSpecialDescription('');
        setSpecialTimingsInput('');
        loadTimings();
      } else {
        showMessage('error', response.error || 'Failed to create special timing');
      }
    } catch (error) {
      console.error('Create special timing error:', error);
      showMessage('error', 'Failed to create special timing');
    } finally {
      setSaving(false);
    }
  };

  const deleteSpecialTiming = async (timingId: string) => {
    try {
      const response = await apiService.deleteSpecialTiming(timingId);
      if (response.success) {
        showMessage('success', 'Special timing deleted successfully');
        loadTimings();
      } else {
        showMessage('error', response.error || 'Failed to delete special timing');
      }
    } catch (error) {
      console.error('Delete special timing error:', error);
      showMessage('error', 'Failed to delete special timing');
    }
  };

  const renderTimingSection = (
    title: string,
    timings: string[],
    setTimings: (timings: string[]) => void,
    onSave: () => void,
    type: 'weekday' | 'weekend'
  ) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm"
        >
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTiming}
            onChange={(e) => setNewTiming(e.target.value)}
            placeholder="e.g. 10:00 AM, 1:30 PM, 7:00 PM"
            className="flex-1 bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && addTiming(timings, setTimings)}
          />
          <button
            onClick={() => addTiming(timings, setTimings)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            ➕ Add Time
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {timings.map((timing, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
              <span className="text-white">{timing}</span>
              <button
                onClick={() => removeTiming(timings, setTimings, index)}
                className="text-red-400 hover:text-red-300"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        
        {timings.length === 0 && (
          <p className="text-gray-400 text-sm">No timings added yet. Add some showtimes above.</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading show timings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Manage Show Timings</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'weekday', label: 'Weekday (Mon-Fri)', icon: '📅' },
            { key: 'weekend', label: 'Weekend (Sat-Sun)', icon: '🎉' },
            { key: 'special', label: 'Special Showtimes', icon: '⭐' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === key
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Weekday Section */}
        {activeSection === 'weekday' && renderTimingSection(
          'Weekday Showtimes (Monday - Friday)',
          weekdayTimings,
          setWeekdayTimings,
          saveWeekdayTimings,
          'weekday'
        )}

        {/* Weekend Section */}
        {activeSection === 'weekend' && renderTimingSection(
          'Weekend Showtimes (Saturday - Sunday)',
          weekendTimings,
          setWeekendTimings,
          saveWeekendTimings,
          'weekend'
        )}

        {/* Special Showtimes Section */}
        {activeSection === 'special' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Special Showtimes</h3>
                <button
                  onClick={() => setShowSpecialForm(!showSpecialForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  ➕ Add Special Showtime
                </button>
              </div>

              {showSpecialForm && (
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-medium mb-3">Create Special Showtime</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={specialDate}
                        onChange={(e) => setSpecialDate(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                      <input
                        type="text"
                        value={specialDescription}
                        onChange={(e) => setSpecialDescription(e.target.value)}
                        placeholder="e.g. Festival Special, Holiday Show"
                        className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-400 mb-1">Showtimes (comma separated)</label>
                      <input
                        type="text"
                        value={specialTimingsInput}
                        onChange={(e) => setSpecialTimingsInput(e.target.value)}
                        placeholder="e.g. 10:00 AM, 1:30 PM, 7:00 PM"
                        className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={createSpecialTiming}
                      disabled={saving || !specialDate || !specialTimingsInput.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm"
                    >
                      {saving ? 'Creating...' : 'Create Special Showtime'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSpecialForm(false);
                        setSpecialDate('');
                        setSpecialDescription('');
                        setSpecialTimingsInput('');
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {specialTimings.map((timing) => (
                  <div key={timing._id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">
                          {new Date(timing.specialDate!).toLocaleDateString()}
                          {timing.description && (
                            <span className="text-gray-400 ml-2">- {timing.description}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {timing.timings.map((t, idx) => (
                            <span key={idx} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSpecialTiming(timing._id)}
                        className="text-red-400 hover:text-red-300 px-2 py-1"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {specialTimings.length === 0 && (
                  <p className="text-gray-400 text-sm">No special showtimes added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-200 font-medium mb-2">💡 How it works</h4>
          <ul className="text-blue-100 text-sm space-y-1">
            <li>• <strong>Weekday timings</strong> apply to Monday through Friday</li>
            <li>• <strong>Weekend timings</strong> apply to Saturday and Sunday</li>
            <li>• <strong>Special showtimes</strong> override regular timings for specific dates</li>
            <li>• These timings will automatically appear in the Show Management section</li>
            <li>• Use formats like "10:00 AM", "1:30 PM", "7:00 PM" for best results</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default ManageShowTimings;
