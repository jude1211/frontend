import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePassword, deleteUser, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AccountSettings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    setError('');
    setMessage('');

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordData.newPassword);
      
      setMessage('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setError('New password is too weak');
      } else {
        setError('Failed to update password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;

    try {
      await sendPasswordResetEmail(currentUser.auth, currentUser.email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      setError('Failed to send password reset email');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeletingAccount(true);
    setError('');

    try {
      await deleteUser(currentUser);
      setMessage('Account deleted successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Account deletion error:', error);
      if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before deleting your account');
      } else {
        setError('Failed to delete account');
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const exportData = () => {
    // Mock data export - in a real app, this would fetch user data from your backend
    const userData = {
      profile: {
        name: currentUser?.displayName,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified,
        createdAt: currentUser?.metadata.creationTime,
        lastSignIn: currentUser?.metadata.lastSignInTime
      },
      bookings: [], // Would fetch from your backend
      preferences: {} // Would fetch from your backend
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'booknview-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
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

      {/* Password Settings */}
      <div className="bg-brand-dark rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          <i className="fa fa-lock mr-2"></i>
          Password & Security
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-brand-gray border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-brand-gray border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 bg-brand-gray border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              required
              minLength={6}
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="bg-brand-red text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
            >
              {isChangingPassword && <i className="fa fa-spinner fa-spin mr-2"></i>}
              Change Password
            </button>
            
            <button
              type="button"
              onClick={handlePasswordReset}
              className="border border-gray-600 text-gray-300 px-6 py-2 rounded-md hover:bg-brand-gray transition-colors"
            >
              Send Reset Email
            </button>
          </div>
        </form>
      </div>

      {/* Privacy & Data */}
      <div className="bg-brand-dark rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          <i className="fa fa-shield-alt mr-2"></i>
          Privacy & Data
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Download Your Data</h4>
              <p className="text-gray-400 text-sm">Export all your account data and booking history</p>
            </div>
            <button
              onClick={exportData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <i className="fa fa-download mr-2"></i>
              Export Data
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Account Created</h4>
              <p className="text-gray-400 text-sm">
                {currentUser?.metadata.creationTime ? 
                  new Date(currentUser.metadata.creationTime).toLocaleDateString() : 
                  'Unknown'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Last Sign In</h4>
              <p className="text-gray-400 text-sm">
                {currentUser?.metadata.lastSignInTime ? 
                  new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 
                  'Unknown'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900 border border-red-600 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          <i className="fa fa-exclamation-triangle mr-2"></i>
          Danger Zone
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Delete Account</h4>
              <p className="text-gray-300 text-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-gray rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              <i className="fa fa-exclamation-triangle text-red-500 mr-2"></i>
              Delete Account
            </h3>
            
            <p className="text-gray-300 mb-4">
              This action will permanently delete your account and all associated data. 
              This cannot be undone.
            </p>
            
            <p className="text-gray-300 mb-4">
              Type <strong>DELETE</strong> to confirm:
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-brand-dark border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              placeholder="Type DELETE to confirm"
            />
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setError('');
                }}
                className="flex-1 border border-gray-600 text-gray-300 py-2 px-4 rounded-md hover:bg-brand-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeletingAccount && <i className="fa fa-spinner fa-spin mr-2"></i>}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
