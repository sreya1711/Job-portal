import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserProfileView from './UserProfileView';
import jobsApi from '../services/jobsApi';

/**
 * Example integration of UserProfileView component
 * This component handles fetching profile data and displaying it
 */
const ProfileViewExample = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        const response = await jobsApi.getProfile(id);
        
        // Format the profile data to match UserProfileView expectations
        const formattedProfile = {
          name: response.name || '',
          email: response.email || '',
          phone: response.phone || '',
          location: response.location || '',
          headline: response.headline || '',
          bio: response.bio || '',
          avatar: response.avatar || null,
          resume: response.resume || null,
          linkedin: response.linkedin || null,
          github: response.github || null,
          portfolio: response.portfolio || null,
          skills: response.skills || [],
          experiences: response.experiences || [],
          educations: response.educations || [],
          certifications: response.certifications || [],
        };
        
        setProfile(formattedProfile);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  const handleEditProfile = () => {
    navigate(`/edit-profile/${id}`);
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Profile</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserProfileView
      profile={profile}
      onEdit={handleEditProfile}
      isLoading={loading}
    />
  );
};

export default ProfileViewExample;