import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';

const MemberManagement = ({ user, profiles = [], onBack, showToast, onRefreshProfiles }) => {
  const userRole = user?.user_metadata?.role || 'student';
  const isAuthorized = userRole === 'coach' || userRole === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form state for add member
  const [addFormData, setAddFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [addFormErrors, setAddFormErrors] = useState({});
  const [addFormLoading, setAddFormLoading] = useState(false);

  // Form state for edit member
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'student'
  });
  const [editFormLoading, setEditFormLoading] = useState(false);

  // Fetch all members with their email from auth
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        // Get all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .order('last_name', { ascending: true });

        if (profilesError) throw profilesError;

        // Get emails from auth users (we can get this from the auth metadata stored during signup)
        // For now, we'll work with what we have in profiles and note that email is in auth
        const membersWithData = (profilesData || []).map(profile => ({
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          role: profile.role || 'student',
          email: '' // Email is stored in auth, not profiles
        }));

        setMembers(membersWithData);
      } catch (error) {
        console.error('Error fetching members:', error);
        showToast('Couldn\'t load members. Please try refreshing.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMembers();
    }
  }, [user]);

  // Filter and sort members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return members;
    }

    const query = searchQuery.toLowerCase().trim();
    return members.filter(member => {
      // Safely get first and last names with fallback to empty string
      const firstName = (member.first_name || '').toLowerCase();
      const lastName = (member.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Check if query matches first name, last name, or full name
      return firstName.includes(query) || 
             lastName.includes(query) ||
             fullName.includes(query);
    });
  }, [members, searchQuery]);

  // Handle add member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddFormErrors({});

    // Validation
    const errors = {};
    if (!addFormData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!addFormData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!addFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!addFormData.password) {
      errors.password = 'Password is required';
    } else if (addFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    setAddFormLoading(true);

    try {
      // Create user in Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addFormData.email.trim(),
        password: addFormData.password,
        options: {
          data: {
            first_name: addFormData.firstName.trim(),
            last_name: addFormData.lastName.trim(),
            role: addFormData.role
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setAddFormErrors({ email: 'An account with this email already exists' });
        } else {
          throw authError;
        }
        setAddFormLoading(false);
        return;
      }

      if (authData.user) {
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            first_name: addFormData.firstName.trim(),
            last_name: addFormData.lastName.trim(),
            role: addFormData.role
          }]);

        if (profileError && profileError.code !== '23505') {
          // If profile creation fails, we should still have the auth user
          // but log the error
          console.error('Profile creation error:', profileError);
        }

        // Refresh members list
        if (onRefreshProfiles) {
          await onRefreshProfiles();
        }
        
        // Refetch members
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .order('last_name', { ascending: true });

        if (!profilesError && profilesData) {
          const membersWithData = (profilesData || []).map(profile => ({
            id: profile.id,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            role: profile.role || 'student',
            email: ''
          }));
          setMembers(membersWithData);
        }

        // Reset form and close modal
        setAddFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'student'
        });
        setAddModalOpen(false);
        showToast('Member added! ✓', 'success');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      showToast('Couldn\'t add member. Please try again.', 'error');
    } finally {
      setAddFormLoading(false);
    }
  };

  // Handle edit member
  const handleEditMember = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    setEditFormLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editFormData.firstName.trim(),
          last_name: editFormData.lastName.trim(),
          role: editFormData.role
        })
        .eq('id', selectedMember.id);

      if (error) throw error;

      // Refresh members list
      if (onRefreshProfiles) {
        await onRefreshProfiles();
      }

      // Refetch members
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .order('last_name', { ascending: true });

      if (!profilesError && profilesData) {
        const membersWithData = (profilesData || []).map(profile => ({
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          role: profile.role || 'student',
          email: ''
        }));
        setMembers(membersWithData);
      }

      setEditModalOpen(false);
      setSelectedMember(null);
      showToast('Member updated! ✓', 'success');
    } catch (error) {
      console.error('Error updating member:', error);
      showToast('Couldn\'t update member. Please try again.', 'error');
    } finally {
      setEditFormLoading(false);
    }
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    try {
      // Delete profile (and cascade should handle related records)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedMember.id);

      if (error) throw error;

      // Refresh members list
      if (onRefreshProfiles) {
        await onRefreshProfiles();
      }

      // Refetch members
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .order('last_name', { ascending: true });

      if (!profilesError && profilesData) {
        const membersWithData = (profilesData || []).map(profile => ({
          id: profile.id,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          role: profile.role || 'student',
          email: ''
        }));
        setMembers(membersWithData);
      }

      setDeleteModalOpen(false);
      setSelectedMember(null);
      showToast('Member deleted! ✓', 'success');
    } catch (error) {
      console.error('Error deleting member:', error);
      showToast('Couldn\'t delete member. Please try again.', 'error');
    }
  };

  // Open edit modal
  const openEditModal = (member) => {
    setSelectedMember(member);
    setEditFormData({
      firstName: member.first_name || '',
      lastName: member.last_name || '',
      role: member.role || 'student'
    });
    setEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (member) => {
    setSelectedMember(member);
    setDeleteModalOpen(true);
  };

  // Redirect if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-mjg-bg-primary pb-20 flex items-center justify-center">
        <div className="bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border p-4 text-center max-w-md mx-4">
          <p className="text-xl font-semibold text-mjg-text-card mb-2">Access Denied</p>
          <p className="text-mjg-text-secondary mb-4">You don't have permission to access this page.</p>
          <button
            onClick={onBack}
              className="bg-mjg-accent text-white px-4 py-3 rounded-mjg font-medium hover:opacity-90 transition-all min-h-[48px]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mjg-bg-primary pb-20">
      {/* Header */}
      <div className="bg-mjg-bg-secondary shadow-mjg border-b border-mjg-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 text-mjg-accent hover:text-mjg-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-poppins font-semibold text-mjg-text-primary">
                Manage Members
              </h1>
            </div>
            <button
              onClick={() => {
                setAddFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  role: 'student'
                });
                setAddFormErrors({});
                setAddModalOpen(true);
              }}
              className="bg-mjg-accent text-white px-4 py-3 rounded-mjg font-medium hover:opacity-90 transition-all min-h-[48px]"
            >
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search members by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-mjg-border rounded-mjg focus:outline-none focus:ring-2 focus:ring-mjg-accent focus:border-transparent transition-colors"
          />
        </div>

        {/* Member List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-mjg-border border-t-mjg-accent rounded-full animate-spin"></div>
            <p className="mt-4 text-mjg-text-secondary">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
                <p className="text-xl font-semibold text-mjg-text-card mb-2">
              {searchQuery.trim() 
                ? `No members found matching '${searchQuery}'` 
                : 'No members yet'}
            </p>
            {!searchQuery.trim() && (
              <p className="text-mjg-text-secondary text-sm mt-2">Click "Add Member" to get started</p>
            )}
            <p className="text-mjg-text-secondary">
              {searchQuery.trim() 
                ? 'Try a different search term' 
                : 'Add your first member to get started'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-mjg-bg-secondary">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-mjg-text-primary">First Name</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-mjg-text-primary">Last Name</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-mjg-text-primary">Role</th>
                    <th className="px-4 py-4 text-right text-sm font-semibold text-mjg-text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-mjg-text-primary">{member.first_name}</td>
                      <td className="px-4 py-4 text-sm text-mjg-text-primary">{member.last_name}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          member.role === 'coach' || member.role === 'admin'
                            ? 'bg-mjg-accent text-white'
                            : 'bg-mjg-bg-secondary text-mjg-text-secondary'
                        }`}>
                          {member.role === 'coach' || member.role === 'admin' ? 'Coach' : 'Student'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="px-4 py-2 text-sm bg-mjg-bg-secondary text-mjg-text-primary rounded-mjg hover:bg-mjg-bg-secondary/70 transition-all min-h-[48px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(member)}
                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-mjg hover:bg-red-600 transition-all min-h-[48px]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-mjg shadow-mjg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-mjg-text-primary">
                        {member.first_name} {member.last_name}
                      </h3>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        member.role === 'coach' || member.role === 'admin'
                          ? 'bg-mjg-accent text-white'
                          : 'bg-mjg-bg-secondary text-mjg-text-primary'
                      }`}>
                        {member.role === 'coach' || member.role === 'admin' ? 'Coach' : 'Student'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditModal(member)}
                      className="flex-1 px-4 py-3 text-sm bg-mjg-bg-secondary text-mjg-text-primary rounded-mjg hover:bg-mjg-bg-secondary/70 transition-all font-medium min-h-[48px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(member)}
                      className="flex-1 px-4 py-3 text-sm bg-red-500 text-white rounded-mjg hover:bg-red-600 transition-all font-semibold min-h-[48px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Member Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-mjg-card rounded-mjg shadow-mjg border border-mjg-border p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-mjg-text-card">Add Member</h2>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setAddFormErrors({});
                }}
                className="text-mjg-text-secondary hover:text-mjg-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={addFormData.firstName}
                    onChange={(e) => {
                      setAddFormData({ ...addFormData, firstName: e.target.value });
                      setAddFormErrors({ ...addFormErrors, firstName: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-mjg bg-mjg-card focus:outline-none transition-colors ${
                      addFormErrors.firstName ? 'border-mjg-error' : 'border-mjg-border focus:ring-2 focus:ring-mjg-accent focus:border-transparent'
                    }`}
                    required
                  />
                  {addFormErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={addFormData.lastName}
                    onChange={(e) => {
                      setAddFormData({ ...addFormData, lastName: e.target.value });
                      setAddFormErrors({ ...addFormErrors, lastName: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-mjg focus:outline-none transition-colors ${
                      addFormErrors.lastName ? 'border-red-500' : 'border-mjg-border focus:ring-2 focus:ring-mjg-accent focus:border-transparent'
                    }`}
                    required
                  />
                  {addFormErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => {
                      setAddFormData({ ...addFormData, email: e.target.value });
                      setAddFormErrors({ ...addFormErrors, email: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-mjg focus:outline-none transition-colors ${
                      addFormErrors.email ? 'border-red-500' : 'border-mjg-border focus:ring-2 focus:ring-mjg-accent focus:border-transparent'
                    }`}
                    required
                  />
                  {addFormErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    Password * (min 6 characters)
                  </label>
                  <input
                    type="password"
                    value={addFormData.password}
                    onChange={(e) => {
                      setAddFormData({ ...addFormData, password: e.target.value });
                      setAddFormErrors({ ...addFormErrors, password: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-mjg focus:outline-none transition-colors ${
                      addFormErrors.password ? 'border-red-500' : 'border-mjg-border focus:ring-2 focus:ring-mjg-accent focus:border-transparent'
                    }`}
                    minLength={6}
                    required
                  />
                  {addFormErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{addFormErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    Role *
                  </label>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-mjg-border rounded-mjg focus:outline-none focus:ring-2 focus:ring-mjg-accent focus:border-transparent transition-colors"
                  >
                    <option value="student">Student</option>
                    <option value="coach">Coach</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setAddFormErrors({});
                  }}
                  className="flex-1 bg-mjg-bg-secondary text-mjg-text-primary py-3 rounded-mjg font-medium hover:bg-mjg-bg-secondary/80 transition-all min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addFormLoading}
                  className="flex-1 bg-mjg-accent text-white py-3 rounded-mjg font-medium hover:opacity-90 transition-all disabled:bg-mjg-bg-secondary disabled:cursor-not-allowed min-h-[48px]"
                >
                  {addFormLoading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-mjg-text-card">Edit Member</h2>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedMember(null);
                }}
                className="text-mjg-text-secondary hover:text-mjg-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedMember.email || 'N/A'}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-mjg bg-mjg-bg-secondary text-mjg-text-secondary cursor-not-allowed"
                  />
                  <p className="text-xs text-mjg-text-secondary mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-mjg-border rounded-mjg focus:outline-none focus:ring-2 focus:ring-mjg-accent focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-mjg-border rounded-mjg focus:outline-none focus:ring-2 focus:ring-mjg-accent focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-mjg-text-card mb-2">
                    Role *
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-mjg-border rounded-mjg focus:outline-none focus:ring-2 focus:ring-mjg-accent focus:border-transparent transition-colors"
                  >
                    <option value="student">Student</option>
                    <option value="coach">Coach</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedMember(null);
                  }}
                  className="flex-1 bg-mjg-bg-secondary text-mjg-text-primary py-3 rounded-mjg font-medium hover:bg-mjg-bg-secondary/80 transition-all min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editFormLoading}
                  className="flex-1 bg-mjg-accent text-white py-3 rounded-mjg font-medium hover:opacity-90 transition-all disabled:bg-mjg-bg-secondary disabled:cursor-not-allowed min-h-[48px]"
                >
                  {editFormLoading ? 'Updating...' : 'Update Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-mjg-text-card">Delete Member</h2>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedMember(null);
                }}
                className="text-mjg-text-secondary hover:text-mjg-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-8">
              <p className="text-mjg-text-card mb-4">
                Delete <span className="font-semibold text-mjg-text-card">
                  {selectedMember.first_name} {selectedMember.last_name}
                </span>?
              </p>
              <p className="text-mjg-text-secondary text-sm">
                This will remove their account and all their class registrations. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedMember(null);
                }}
                className="flex-1 bg-mjg-bg-secondary text-mjg-text-primary py-3 rounded-mjg font-semibold hover:bg-mjg-bg-secondary transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                className="flex-1 bg-red-500 text-white py-3 rounded-mjg font-semibold hover:bg-red-600 transition-all min-h-[48px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;

