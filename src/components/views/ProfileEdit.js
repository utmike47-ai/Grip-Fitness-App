import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import toast from 'react-hot-toast';
import Logo from '../Logo';

const ProfileEdit = ({ user, onBack, onProfileUpdate }) => {
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
      
      toast.success('Profile updated! ✓');
      onBack();
    } catch (error) {
      toast.error('Couldn\'t update profile. Please try again.');
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

      toast.success('Password updated! ✓');
    } catch (error) {
      const errorMessage = 'Couldn\'t update password. Please try again.';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gym-secondary shadow-lg border-b border-gym-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="medium" variant="dark" />
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="text-white hover:text-gym-accent transition-colors"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Edit Profile Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[12px] shadow-gym p-4">
          <h2 className="text-lg font-poppins font-bold text-gym-text-dark mb-4">
            Edit Profile
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent"
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent"
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 border-2 border-gym-accent text-gym-accent bg-transparent py-3 rounded-grip font-semibold hover:bg-gym-accent hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gym-primary text-white py-3 rounded-grip font-semibold hover:bg-[#ff8555]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChange} className="bg-white rounded-[12px] shadow-gym p-4">
          <h2 className="text-lg font-poppins font-bold text-gym-text-dark mb-4">
            Change Password
          </h2>
          
          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-grip">
              <p className="text-sm text-red-600">{passwordError}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent"
              placeholder="Enter new password (min 8 characters)"
              minLength={8}
              required
            />
            <p className="text-xs text-gray-600 mt-1">Must be at least 8 characters</p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gym-text-dark mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-grip focus:outline-none focus:ring-2 focus:ring-gym-primary focus:border-transparent"
              placeholder="Confirm new password"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading || !newPassword || !confirmPassword}
            className="w-full bg-gym-primary text-white py-3 rounded-grip font-semibold hover:bg-[#ff8555] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
