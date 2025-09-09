import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const TheatreOwnerProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    ownerName: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await apiService.getTheatreOwnerProfile();
      if (res.success && res.data) {
        setForm({
          ownerName: res.data.ownerName || '',
          phone: res.data.phone || '',
          bio: res.data.bio || ''
        });
      } else {
        setError(res.error || 'Failed to load profile');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const res = await apiService.updateTheatreOwnerProfile(form);
    if (res.success) {
      setSuccess('Profile updated successfully');
    } else {
      setError(res.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark via-black to-brand-gray">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-black to-brand-gray">
      <div className="bg-brand-gray border-b border-brand-dark/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center">
              <i className="fas fa-user-cog text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
              <p className="text-brand-light-gray">Update your theatre owner information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>
        )}

        <form onSubmit={handleSave} className="bg-brand-gray rounded-2xl p-6 border border-brand-dark/40 shadow-lg max-w-2xl">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-brand-light-gray text-sm mb-2">Owner Name</label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
              />
            </div>
            <div>
              <label className="block text-brand-light-gray text-sm mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
              />
            </div>
            <div>
              <label className="block text-brand-light-gray text-sm mb-2">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 bg-brand-dark border border-brand-dark/30 rounded-xl text-white placeholder-brand-light-gray focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-brand-red text-white rounded-xl hover:bg-red-600 disabled:bg-brand-dark/60 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TheatreOwnerProfile;

