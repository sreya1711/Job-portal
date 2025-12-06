import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';

const ProfileEditSection = ({ profile, onProfileUpdate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    linkedin: profile?.linkedin || '',
    bio: profile?.bio || ''
  });

  // Parse string fields into arrays for display (comma-separated)
  const parseStringToArray = (str) => {
    if (!str) return [];
    return str.split(',').map(item => item.trim()).filter(item => item);
  };

  // Initialize state from string or array
  const [skills, setSkills] = useState(
    typeof profile?.skills === 'string' 
      ? parseStringToArray(profile.skills)
      : Array.isArray(profile?.skills)
      ? profile.skills.map(skill => typeof skill === 'object' ? skill.name : skill)
      : []
  );
  const [newSkill, setNewSkill] = useState('');

  const [experiences, setExperiences] = useState(
    typeof profile?.experiences === 'string'
      ? parseStringToArray(profile.experiences)
      : Array.isArray(profile?.experiences) && profile.experiences.length > 0 && typeof profile.experiences[0] === 'object'
      ? profile.experiences.map(exp => `${exp.title} at ${exp.company} (${exp.startDate}${exp.endDate ? ' - ' + exp.endDate : ''})`)
      : Array.isArray(profile?.experiences)
      ? profile.experiences
      : []
  );
  const [newExperience, setNewExperience] = useState('');

  const [certifications, setCertifications] = useState(
    typeof profile?.certifications === 'string'
      ? parseStringToArray(profile.certifications)
      : Array.isArray(profile?.certifications) && profile.certifications.length > 0 && typeof profile.certifications[0] === 'object'
      ? profile.certifications.map(cert => `${cert.name} from ${cert.issuer}`)
      : Array.isArray(profile?.certifications)
      ? profile.certifications
      : []
  );
  const [newCertification, setNewCertification] = useState('');

  const [educations, setEducations] = useState(
    Array.isArray(profile?.educations) ? profile.educations : []
  );
  const [editingEduIndex, setEditingEduIndex] = useState(null);

  const [resumeFile, setResumeFile] = useState(null);

  // Handle basic form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Skills Management (as string)
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  // Experience Management (as string)
  const addExperience = () => {
    if (newExperience.trim()) {
      setExperiences(prev => [...prev, newExperience.trim()]);
      setNewExperience('');
    }
  };

  const removeExperience = (index) => {
    setExperiences(prev => prev.filter((_, i) => i !== index));
  };

  const editExperience = (index, value) => {
    setExperiences(prev =>
      prev.map((exp, i) => i === index ? value : exp)
    );
  };

  // Certification Management (as string)
  const addCertification = () => {
    if (newCertification.trim()) {
      setCertifications(prev => [...prev, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (index) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const editCertification = (index, value) => {
    setCertifications(prev =>
      prev.map((cert, i) => i === index ? value : cert)
    );
  };

  // Education Management
  const addEducation = () => {
    setEducations(prev => [...prev, {
      degree: '',
      institution: '',
      startDate: '',
      endDate: '',
      description: ''
    }]);
  };

  const updateEducation = (index, field, value) => {
    setEducations(prev =>
      prev.map((edu, i) => i === index ? { ...edu, [field]: value } : edu)
    );
  };

  const removeEducation = (index) => {
    setEducations(prev => prev.filter((_, i) => i !== index));
  };

  // Convert arrays back to comma-separated strings for submission
  const convertToString = (array) => {
    return array.join(', ');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    setLoading(true);
    try {
      // Format data for backend - convert arrays to strings
      const profileData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        linkedin: formData.linkedin || undefined,
        bio: formData.bio || undefined,
        skills: convertToString(skills) || undefined, // Store as comma-separated string
        experiences: convertToString(experiences) || undefined, // Store as comma-separated string
        educations: educations.filter(edu => edu.degree && edu.institution), // Keep as array
        certifications: convertToString(certifications) || undefined // Store as comma-separated string
      };

      console.log('Submitting profile data:', profileData);

      const response = await jobsApi.updateProfile(profileData);
      console.log('Profile updated successfully:', response);

      toast.success('Profile updated successfully!');
      
      if (onProfileUpdate) {
        onProfileUpdate(profileData);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle resume upload
  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        const resumeData = {
          fileName: resumeFile.name,
          base64: base64Data,
          uploadedAt: new Date().toISOString()
        };

        const response = await jobsApi.uploadResume(resumeData);
        console.log('Resume uploaded:', response);
        toast.success('Resume uploaded successfully!');
        setResumeFile(null);
      };
      reader.readAsDataURL(resumeFile);
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Basic Information */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York, NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleFormChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about yourself..."
            />
          </div>
        </section>

        {/* Skills Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="e.g., React, Python, UI Design"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-blue-600 hover:text-blue-800 p-0 h-5 w-5 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Experience Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newExperience}
              onChange={(e) => setNewExperience(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExperience())}
              placeholder="e.g., Senior Developer at Tech Company (2020-2023)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addExperience}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {experiences.map((exp, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700">{exp}</span>
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              placeholder="e.g., AWS Solutions Architect from Amazon (2023)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addCertification}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-700">{cert}</span>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Education Section */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
          <div className="space-y-4">
            {educations.map((edu, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Degree *
                    </label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Bachelor of Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution *
                    </label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="University Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2018"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2022"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={edu.description}
                    onChange={(e) => updateEducation(index, 'description', e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any additional details..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="mt-3 text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addEducation}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Education
          </button>
        </section>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileEditSection;