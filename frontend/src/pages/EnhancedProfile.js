import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, uploadResume } from '../services/api';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, 
  Award, Upload, Download, Edit, Save, X, Plus, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnhancedProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    linkedin: '',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    resume: null
  });

  // Fetch profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const data = await getUserProfile();
          const p = data?.profile || {};
          setProfileData({
            // keep identity from auth user
            name: user.name || '',
            email: user.email || '',
            // profile fields from server
            phone: p.phone || '',
            location: p.location || '',
            bio: p.bio || '',
            website: p.website || '',
            linkedin: p.linkedin || '',
            skills: Array.isArray(p.skills) ? p.skills : [],
            experience: Array.isArray(p.experience) ? p.experience : [],
            education: Array.isArray(p.education) ? p.education : [],
            certifications: Array.isArray(p.certifications) ? p.certifications : [],
            resume: p.resume || null
          });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          toast.error('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const [newSkill, setNewSkill] = useState('');
  const [newExperience, setNewExperience] = useState({
    title: '', company: '', duration: '', description: ''
  });
  const [newEducation, setNewEducation] = useState({
    degree: '', school: '', year: '', gpa: ''
  });
  const [newCertification, setNewCertification] = useState({
    name: '', issuer: '', date: '', url: ''
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateUserProfile(profileData);
      updateUser({ profile: profileData });
      setIsEditing(false);
      toast.success('profile saved successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.includes('document')) {
        try {
          setLoading(true);
          // Convert file to base64 for upload
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const fileData = {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileData: reader.result
              };
              
              const response = await uploadResume(fileData);
              setProfileData({ ...profileData, resume: response.resume });
              toast.success('Resume uploaded successfully!');
            } catch (error) {
              console.error('Failed to upload resume:', error);
              toast.error('Failed to upload resume');
            } finally {
              setLoading(false);
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Failed to upload resume:', error);
          toast.error('Failed to upload resume');
          setLoading(false);
        }
      } else {
        toast.error('Please upload a PDF or Word document');
      }
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((_, i) => i !== index)
    });
  };

  const addExperience = () => {
    if (newExperience.title && newExperience.company) {
      setProfileData({
        ...profileData,
        experience: [...profileData.experience, { ...newExperience, id: Date.now() }]
      });
      setNewExperience({ title: '', company: '', duration: '', description: '' });
    }
  };

  const removeExperience = (id) => {
    setProfileData({
      ...profileData,
      experience: profileData.experience.filter(exp => exp.id !== id)
    });
  };

  const addEducation = () => {
    if (newEducation.degree && newEducation.school) {
      setProfileData({
        ...profileData,
        education: [...profileData.education, { ...newEducation, id: Date.now() }]
      });
      setNewEducation({ degree: '', school: '', year: '', gpa: '' });
    }
  };

  const removeEducation = (id) => {
    setProfileData({
      ...profileData,
      education: profileData.education.filter(edu => edu.id !== id)
    });
  };

  const addCertification = () => {
    if (newCertification.name && newCertification.issuer) {
      setProfileData({
        ...profileData,
        certifications: [...profileData.certifications, { ...newCertification, id: Date.now() }]
      });
      setNewCertification({ name: '', issuer: '', date: '', url: '' });
    }
  };

  const removeCertification = (id) => {
    setProfileData({
      ...profileData,
      certifications: profileData.certifications.filter(cert => cert.id !== id)
    });
  };

  if (loading && !profileData.name) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(user?.joinedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Edit Profile')}
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                placeholder="Your phone number"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                disabled={!isEditing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            disabled={!isEditing}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      {/* Resume Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Resume
        </h2>
        
        {profileData.resume ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded">
                <Upload className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium">{profileData.resume.name}</p>
                <p className="text-sm text-gray-500">
                  {(profileData.resume.size / 1024 / 1024).toFixed(2)} MB • 
                  Uploaded {new Date(profileData.resume.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                <Download className="h-4 w-4" />
              </button>
              {isEditing && (
                <button 
                  onClick={() => setProfileData({ ...profileData, resume: null })}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">Upload your resume</p>
            <p className="text-sm text-gray-500 mb-4">PDF or Word document, max 10MB</p>
            {isEditing && (
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Skills
        </h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {profileData.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill}
              {isEditing && (
                <button
                  onClick={() => removeSkill(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>

        {isEditing && (
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Briefcase className="h-5 w-5 mr-2" />
          Experience
        </h2>
        
        <div className="space-y-4">
          {profileData.experience.map((exp) => (
            <div key={exp.id} className="border-l-4 border-blue-500 pl-4 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{exp.title}</h3>
                  <p className="text-blue-600 font-medium">{exp.company}</p>
                  <p className="text-sm text-gray-500 mb-2">{exp.duration}</p>
                  <p className="text-gray-700">{exp.description}</p>
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeExperience(exp.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-3">Add Experience</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Job Title"
                value={newExperience.title}
                onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Company"
                value={newExperience.company}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              placeholder="Duration (e.g., Jan 2020 - Present)"
              value={newExperience.duration}
              onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <textarea
              placeholder="Description"
              value={newExperience.description}
              onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              rows={3}
            />
            <button
              onClick={addExperience}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Experience
            </button>
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <GraduationCap className="h-5 w-5 mr-2" />
          Education
        </h2>
        
        <div className="space-y-4">
          {profileData.education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-md">
              <div>
                <h3 className="font-semibold">{edu.degree}</h3>
                <p className="text-blue-600">{edu.school}</p>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span>{edu.year}</span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={() => removeEducation(edu.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-3">Add Education</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Degree"
                value={newEducation.degree}
                onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="School/University"
                value={newEducation.school}
                onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Year (e.g., 2020)"
                value={newEducation.year}
                onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="GPA (optional)"
                value={newEducation.gpa}
                onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={addEducation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Education
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedProfile;
