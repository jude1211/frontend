import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth';

interface ProfileFormData {
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  preferences: {
    language: string;
    notifications: boolean;
    newsletter: boolean;
  };
}

const ProfileInfo: React.FC = () => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    dateOfBirth: '',
    city: 'Mumbai',
    preferences: {
      language: 'English',
      notifications: true,
      newsletter: false
    }
  });

  const handleInputChange = (field: keyof ProfileFormData, value: string | boolean) => {
    if (field === 'preferences') return;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (preference: keyof ProfileFormData['preferences'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Update display name if changed
      if (formData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: formData.displayName
        });
      }

      // Update email if changed
      if (formData.email !== currentUser.email) {
        await updateEmail(currentUser, formData.email);
        await sendEmailVerification(currentUser);
        setMessage('Profile updated! Please check your new email for verification.');
      } else {
        setMessage('Profile updated successfully!');
      }

      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: '',
      dateOfBirth: '',
      city: 'Mumbai',
      preferences: {
        language: 'English',
        notifications: true,
        newsletter: false
      }
    });
    setIsEditing(false);
    setError('');
    setMessage('');
  };

  const sendVerificationEmail = async () => {
    if (!currentUser) return;

    try {
      await sendEmailVerification(currentUser);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      setError('Failed to send verification email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div className="bg-green-900 border border-green-600 text-green-200 px-4 py-3 rounded-md">
          <i className="fa fa-check-circle mr-2"></i>
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-md">
          <i className="fa fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* Email Verification Notice */}
      {!currentUser?.emailVerified && (
        <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <i className="fa fa-exclamation-triangle mr-2"></i>
              Your email address is not verified
            </div>
            <button
              onClick={sendVerificationEmail}
              className="bg-yellow-600 text-yellow-100 px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Send Verification
            </button>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-brand-dark border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-brand-dark border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 bg-brand-dark border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-brand-dark border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4">Preferences</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preferred City</label>
            <select
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-brand-dark border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <select
              value={formData.preferences.language}
              onChange={(e) => handleInputChange('preferences', e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-3 bg-brand-dark border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.notifications}
                onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                disabled={!isEditing}
                className="mr-3 w-4 h-4 text-brand-red bg-brand-dark border-gray-600 rounded focus:ring-brand-red"
              />
              <span className="text-gray-300">Enable push notifications</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences.newsletter}
                onChange={(e) => handlePreferenceChange('newsletter', e.target.checked)}
                disabled={!isEditing}
                className="mr-3 w-4 h-4 text-brand-red bg-brand-dark border-gray-600 rounded focus:ring-brand-red"
              />
              <span className="text-gray-300">Subscribe to newsletter</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
        {isEditing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 bg-brand-red text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading && <i className="fa fa-spinner fa-spin mr-2"></i>}
              Save Changes
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-brand-red text-white rounded-md hover:bg-red-600 transition-colors"
          >
            <i className="fa fa-edit mr-2"></i>
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileInfo;
