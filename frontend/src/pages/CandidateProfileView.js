import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserProfileView from '../components/UserProfileView';
import { getPublicProfile } from '../services/api';

/**
 * Candidate Profile View Page
 * Displays a professional profile view of a job candidate
 */
export default function CandidateProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await getPublicProfile(id);
        
        if (mounted) {
          // Transform API response to match UserProfileView structure
          const profileData = res.profile;
          
          setProfile({
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            headline: profileData.headline || '',
            bio: profileData.bio || '',
            avatar: profileData.avatar || null,
            resume: profileData.resume?.base64 || null,
            resumeFileName: profileData.resume?.fileName || 'resume.pdf',
            linkedin: profileData.linkedin || null,
            github: profileData.github || null,
            portfolio: profileData.portfolio || null,
            skills: Array.isArray(profileData.skills) ? profileData.skills : [],
            experiences: Array.isArray(profileData.experiences) 
              ? profileData.experiences.map(exp => ({
                  ...exp,
                  title: exp.title || exp.role,
                  role: exp.role || exp.title
                }))
              : [],
            educations: Array.isArray(profileData.educations) ? profileData.educations : [],
            certifications: Array.isArray(profileData.certifications) ? profileData.certifications : []
          });
        }
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || 'Failed to load profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadProfile();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Profile</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Back Button */}
      <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Results
          </button>
        </div>
      </div>

      {/* Profile View */}
      <UserProfileView
        profile={profile}
        isLoading={loading}
      />
    </div>
  );
}