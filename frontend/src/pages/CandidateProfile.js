import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProfile } from '../services/api';
import { ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-6">
    <h4 className="text-md font-semibold mb-4">{title}</h4>
    {children}
  </div>
);

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await getPublicProfile(id);
        if (mounted) setProfile(res.profile);
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="animate-pulse h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>
        <div className="bg-white border border-red-200 text-red-700 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Normalize skills to an array for rendering safety
  const normalizedSkills = Array.isArray(profile.skills)
    ? profile.skills
    : (typeof profile.skills === 'string'
        ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
        : []);

  // Normalize experiences to array of objects
  const normalizedExperiences = Array.isArray(profile.experiences)
    ? profile.experiences
    : (typeof profile.experiences === 'string'
        ? profile.experiences.split(',').map(s => s.trim()).filter(Boolean).map(txt => ({
            title: txt,
            company: '',
            startDate: '',
            endDate: '',
            description: ''
          }))
        : []);

  // Normalize educations to array of objects
  const normalizedEducations = Array.isArray(profile.educations)
    ? profile.educations
    : (typeof profile.educations === 'string'
        ? profile.educations.split(',').map(s => s.trim()).filter(Boolean).map(txt => ({
            degree: txt,
            institution: '',
            startDate: '',
            endDate: '',
            description: ''
          }))
        : []);

  // Normalize certifications to array of objects
  const normalizedCertifications = Array.isArray(profile.certifications)
    ? profile.certifications
    : (typeof profile.certifications === 'string'
        ? profile.certifications.split(',').map(s => s.trim()).filter(Boolean).map(txt => ({
            name: txt,
            issuer: '',
            date: '',
            description: ''
          }))
        : []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Candidate Profile: {profile.name}</h3>
        </div>

        <Section title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Name:</p>
              <p className="text-gray-600">{profile.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Email:</p>
              <p className="text-gray-600">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Phone:</p>
              <p className="text-gray-600">{profile.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Location:</p>
              <p className="text-gray-600">{profile.location || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700">LinkedIn:</p>
              {profile.linkedin ? (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View LinkedIn Profile
                </a>
              ) : (
                <p className="text-gray-600">Not provided</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-700">Professional Summary:</p>
              <p className="text-gray-600">{profile.bio || 'Not provided'}</p>
            </div>
          </div>
        </Section>

        <Section title="Resume">
          {profile.resume ? (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700">Resume:</p>
              <p className="text-sm text-gray-600">{profile.resume.fileName || 'Resume'}</p>
              <p className="text-sm text-gray-500">Uploaded on {profile.resume.uploadedAt ? new Date(profile.resume.uploadedAt).toLocaleDateString() : 'N/A'}</p>
              {profile.resume.base64 && (
                <a href={profile.resume.base64} download={profile.resume.fileName || 'resume.pdf'} className="inline-block mt-2 text-blue-600 hover:underline">
                  Download Resume
                </a>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No resume provided</p>
          )}
        </Section>

        <Section title="Skills">
          {normalizedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {normalizedSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                  {typeof skill === 'object' ? (skill.name || '') : skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No skills listed</p>
          )}
        </Section>

        <Section title="Work Experience">
          {normalizedExperiences && normalizedExperiences.length > 0 ? (
            normalizedExperiences.map((exp, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">{exp.title}</p>
                <p className="text-gray-600">{exp.company}</p>
                <p className="text-sm text-gray-500">
                  {exp.startDate} - {exp.endDate || 'Present'}
                </p>
                <p className="text-gray-600 mt-2">{exp.description || 'No description provided'}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No work experience listed</p>
          )}
        </Section>

        <Section title="Education">
          {normalizedEducations && normalizedEducations.length > 0 ? (
            normalizedEducations.map((edu, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">{edu.degree}</p>
                <p className="text-gray-600">{edu.institution}</p>
                <p className="text-sm text-gray-500">
                  {edu.startDate} - {edu.endDate}
                </p>
                <p className="text-gray-600 mt-2">{edu.description || 'No description provided'}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No education listed</p>
          )}
        </Section>

        <Section title="Certifications">
          {normalizedCertifications && normalizedCertifications.length > 0 ? (
            normalizedCertifications.map((cert, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">{cert.name}</p>
                <p className="text-gray-600">{cert.issuer}</p>
                <p className="text-sm text-gray-500">{cert.date}</p>
                <p className="text-gray-600 mt-2">{cert.description || 'No description provided'}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No certifications listed</p>
          )}
        </Section>
      </div>
    </div>
  );
}
