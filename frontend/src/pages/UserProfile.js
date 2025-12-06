import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, updateUserProfile } from '../services/api';

function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ 
    name: '', 
    email: '', 
    profile: {
      bio: '',
      phone: '',
      location: '',
      skills: [],
      experience: [],
      education: [],
      resume: null
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const data = await getUserProfile();
          setProfile(data);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          // Set basic user info if profile fetch fails
          setProfile({
            name: user.name || '',
            email: user.email || '',
            profile: {
              bio: '',
              phone: '',
              location: '',
              skills: [],
              experience: [],
              education: [],
              resume: null
            }
          });
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'email') {
      setProfile((prev) => ({ ...prev, [name]: value }));
    } else {
      setProfile((prev) => ({
        ...prev,
        profile: { ...prev.profile, [name]: value }
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await updateUserProfile(profile.profile);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="container mx-auto px-4 py-8">Please login</div>;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={profile.profile.phone || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={profile.profile.location || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={profile.profile.bio || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              rows="4"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;