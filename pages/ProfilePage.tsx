import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// Removed DocumentManager import as the documents section is no longer used

const ProfilePage: React.FC = () => {
  const { userData, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (userData) {
      setEditForm(userData);
    }
  }, [userData]);

  const handleInputChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    console.log('Saving profile:', editForm);
    setIsEditing(false);
  };

  // Redirect if not authenticated
  if (!isAuthenticated || !userData) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-brand-red">
            <i className="fas fa-user-slash text-4xl text-brand-red"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-brand-light-gray mb-6">Please log in to view your profile.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-brand-dark py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-brand-gray rounded-lg shadow-lg border border-brand-dark p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-brand-red to-red-600 rounded-full flex items-center justify-center shadow-lg border-4 border-brand-red">
                {userData?.profilePicture ? (
                  <img
                    src={userData.profilePicture}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {userData?.firstName?.charAt(0) || userData?.displayName?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {userData?.displayName || `${userData?.firstName} ${userData?.lastName}` || 'User Profile'}
                </h1>
                <p className="text-brand-light-gray text-lg mb-3">{userData?.email}</p>
                <div className="flex items-center space-x-4">
                  {userData?.isEmailVerified ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
                      <i className="fas fa-check-circle mr-2"></i>
                      Verified Account
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-600 text-white">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Unverified
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                    <i className="fas fa-user mr-2"></i>
                    {userData?.authProvider === 'google' ? 'Google Account' : 'Email Account'}
                  </span>
                  <span className="text-brand-light-gray text-sm">
                    Member since {userData?.createdAt ? new Date(userData.createdAt).getFullYear() : new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center shadow-lg"
            >
              <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} mr-2`}></i>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-brand-gray rounded-lg shadow-lg border border-brand-dark p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <i className="fas fa-user-circle mr-3 text-brand-red"></i>
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="Enter first name"
                    />
                  ) : (
                    <div className="bg-brand-dark px-4 py-3 rounded-lg border border-brand-dark">
                      <p className="text-white">{userData?.firstName || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="Enter last name"
                    />
                  ) : (
                    <div className="bg-brand-dark px-4 py-3 rounded-lg border border-brand-dark">
                      <p className="text-white">{userData?.lastName || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Display Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.displayName || ''}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="Enter display name"
                    />
                  ) : (
                    <div className="bg-brand-dark px-4 py-3 rounded-lg border border-brand-dark">
                      <p className="text-white">{userData?.displayName || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Email Address</label>
                  <div className="bg-brand-dark px-4 py-3 rounded-lg border border-brand-dark">
                    <p className="text-white">{userData?.email}</p>
                    <p className="text-xs text-brand-light-gray mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phoneNumber || ''}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="bg-brand-dark px-4 py-3 rounded-lg border border-brand-dark">
                      <p className="text-white">{userData?.phoneNumber || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-light-gray mb-2">Date of Birth</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editForm.dateOfBirth || ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
                    />
                  ) : (
                    <div className="bg-brand-dark px-4 py-3 rounded-lg border border-brand-dark">
                      <p className="text-white">
                        {userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-brand-light-gray rounded-lg text-brand-light-gray font-medium hover:bg-brand-dark transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-3 bg-brand-red text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Account Activity */}
            <div className="bg-brand-gray rounded-lg shadow-lg border border-brand-dark p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <i className="fas fa-chart-line mr-3 text-brand-red"></i>
                Account Activity
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-dark p-4 rounded-lg border border-brand-dark hover:border-blue-500 transition-colors">
                  <div className="flex items-center">
                    <i className="fas fa-ticket-alt text-blue-500 text-2xl mr-3"></i>
                    <div>
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-sm text-brand-light-gray">Total Bookings</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-dark p-4 rounded-lg border border-brand-dark hover:border-green-500 transition-colors">
                  <div className="flex items-center">
                    <i className="fas fa-heart text-green-500 text-2xl mr-3"></i>
                    <div>
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-sm text-brand-light-gray">Favorites</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-dark p-4 rounded-lg border border-brand-dark hover:border-purple-500 transition-colors">
                  <div className="flex items-center">
                    <i className="fas fa-star text-purple-500 text-2xl mr-3"></i>
                    <div>
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-sm text-brand-light-gray">Reviews</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-brand-gray rounded-lg shadow-lg border border-brand-dark p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <i className="fas fa-shield-alt mr-2 text-brand-red"></i>
                Account Status
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-brand-light-gray">Email Verification</span>
                  {userData?.isEmailVerified ? (
                    <span className="text-green-400 flex items-center">
                      <i className="fas fa-check-circle mr-1"></i>
                      Verified
                    </span>
                  ) : (
                    <span className="text-yellow-400 flex items-center">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-brand-light-gray">Account Type</span>
                  <span className="text-blue-400 capitalize">{userData?.authProvider}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-brand-light-gray">Member Since</span>
                  <span className="text-white">
                    {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-brand-light-gray">Last Updated</span>
                  <span className="text-white">
                    {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-brand-gray rounded-lg shadow-lg border border-brand-dark p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <i className="fas fa-bolt mr-2 text-brand-red"></i>
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors group">
                  <div className="flex items-center">
                    <i className="fas fa-ticket-alt text-blue-500 mr-3 group-hover:scale-110 transition-transform"></i>
                    <div>
                      <p className="font-medium text-white">My Bookings</p>
                      <p className="text-sm text-brand-light-gray">View booking history</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors group">
                  <div className="flex items-center">
                    <i className="fas fa-heart text-red-500 mr-3 group-hover:scale-110 transition-transform"></i>
                    <div>
                      <p className="font-medium text-white">Favorites</p>
                      <p className="text-sm text-brand-light-gray">Saved movies & events</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors group">
                  <div className="flex items-center">
                    <i className="fas fa-bell text-purple-500 mr-3 group-hover:scale-110 transition-transform"></i>
                    <div>
                      <p className="font-medium text-white">Notifications</p>
                      <p className="text-sm text-brand-light-gray">Manage preferences</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors group">
                  <div className="flex items-center">
                    <i className="fas fa-cog text-gray-400 mr-3 group-hover:scale-110 transition-transform"></i>
                    <div>
                      <p className="font-medium text-white">Settings</p>
                      <p className="text-sm text-brand-light-gray">Account preferences</p>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors group">
                  <div className="flex items-center">
                    <i className="fas fa-question-circle text-indigo-400 mr-3 group-hover:scale-110 transition-transform"></i>
                    <div>
                      <p className="font-medium text-white">Help & Support</p>
                      <p className="text-sm text-brand-light-gray">Get assistance</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Security */}
            <div className="bg-brand-gray rounded-lg shadow-lg border border-brand-dark p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <i className="fas fa-lock mr-2 text-brand-red"></i>
                Security
              </h3>

              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="fas fa-key text-blue-500 mr-3"></i>
                      <span className="font-medium text-white">Change Password</span>
                    </div>
                    <i className="fas fa-chevron-right text-brand-light-gray"></i>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="fas fa-mobile-alt text-green-500 mr-3"></i>
                      <span className="font-medium text-white">Two-Factor Auth</span>
                    </div>
                    <i className="fas fa-chevron-right text-brand-light-gray"></i>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 rounded-lg border border-brand-dark hover:bg-brand-dark hover:border-brand-red transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="fas fa-history text-purple-500 mr-3"></i>
                      <span className="font-medium text-white">Login History</span>
                    </div>
                    <i className="fas fa-chevron-right text-brand-light-gray"></i>
                  </div>
                </button>
              </div>
            </div>

            {/* Documents section removed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
