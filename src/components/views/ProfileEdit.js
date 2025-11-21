import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

const ProfileEdit = ({ user, onBack, onProfileUpdate, showToast }) => {
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [loading, setLoading] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter both first and last name');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      onProfileUpdate({
        first_name: firstName.trim(),
        last_name: lastName.trim()
      });
      
      if (showToast) {
        showToast('Profile updated successfully!');
      } else {
        alert('Profile updated successfully!');
      }
      onBack();
    } catch (error) {
      if (showToast) {
        showToast('Error updating profile: ' + error.message, 'error');
      } else {
        alert('Error updating profile: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Success - clear form and show toast
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');

      if (showToast) {
        showToast('Password updated successfully!');
      } else {
        alert('Password updated successfully!');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update password';
      setPasswordError(errorMessage);
      if (showToast) {
        showToast(errorMessage, 'error');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grip-light pb-20">
      <div className="bg-white shadow-sm border-b border-grip-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-grip-accent hover:text-grip-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-montserrat font-bold text-grip-primary">
              Edit Profile
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Edit Profile Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-montserrat font-bold text-grip-primary mb-4">
            Edit Profile
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-grip-primary mb-2">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary"
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-grip-primary mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary"
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-grip-primary text-white py-3 rounded-lg font-semibold"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-montserrat font-bold text-grip-primary mb-4">
            Change Password
          </h2>
          
          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{passwordError}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-grip-primary mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary"
              placeholder="Enter new password (min 8 characters)"
              minLength={8}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-grip-primary mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              className="w-full px-4 py-3 border border-grip-secondary rounded-lg focus:outline-none focus:border-grip-primary"
              placeholder="Confirm new password"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading || !newPassword || !confirmPassword}
            className="w-full bg-grip-accent text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
