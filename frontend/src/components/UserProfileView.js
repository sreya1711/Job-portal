import React, { useState } from 'react';
import {
  Mail, Phone, MapPin, Download, Edit2, Linkedin, Github, Globe,
  Briefcase, GraduationCap, Award, MessageSquare, ExternalLink
} from 'lucide-react';

const UserProfileView = ({ profile, onEdit, isLoading = false }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 w-32 bg-slate-200 rounded-full mx-auto" />
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const initials = profile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section with Avatar */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Banner Background */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

          {/* Profile Info Container */}
          <div className="px-8 pb-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col md:flex-row md:items-end md:gap-6 -mt-20 mb-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>

              {/* Name and Headline */}
              <div className="flex-grow mt-4 md:mt-0 pb-2">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{profile?.name || 'User Profile'}</h1>
                <p className="text-lg text-slate-600 mb-4">{profile?.headline || profile?.bio?.substring(0, 100)}</p>

                {/* Contact Info Row */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {profile?.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <a href={`mailto:${profile.email}`} className="hover:text-blue-600">
                        {profile.email}
                      </a>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <a href={`tel:${profile.phone}`} className="hover:text-blue-600">
                        {profile.phone}
                      </a>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4 md:mt-0">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
                {profile?.resume && (
                  <a
                    href={profile.resume}
                    download
                    className="flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Resume
                  </a>
                )}
              </div>
            </div>

            {/* Social Links */}
            {(profile?.linkedin || profile?.github || profile?.portfolio) && (
              <div className="flex gap-4 mb-6">
                {profile?.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                    title="LinkedIn Profile"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span className="text-sm font-medium">LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile?.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
                    title="GitHub Profile"
                  >
                    <Github className="w-4 h-4" />
                    <span className="text-sm font-medium">GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {profile?.portfolio && (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                    title="Portfolio"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 mb-6 flex-wrap">
          {['overview', 'experience', 'education', 'skills'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-50 shadow'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bio Section */}
            {profile?.bio && (
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  About
                </h2>
                <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                  <p className="text-sm text-slate-600">Experience</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {profile?.experiences?.length || 0}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-slate-600">Education</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {profile?.educations?.length || 0}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-slate-600">Skills</p>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {profile?.skills?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-orange-600" />
              Work Experience
            </h2>
            {profile?.experiences && profile.experiences.length > 0 ? (
              <div className="space-y-6">
                {profile.experiences.map((exp, index) => (
                  <div key={index} className="relative pl-8 pb-6 border-l-2 border-orange-300 last:pb-0">
                    <div className="absolute -left-4 -top-1 w-6 h-6 bg-orange-600 rounded-full border-4 border-white"></div>
                    <div className="bg-slate-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{exp.title || exp.role}</h3>
                          <p className="text-lg text-orange-600 font-semibold">{exp.company}</p>
                        </div>
                        <span className="text-sm text-slate-600 whitespace-nowrap ml-4">
                          {formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-slate-700 mt-3">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">No work experience added yet</p>
            )}
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-green-600" />
              Education
            </h2>
            {profile?.educations && profile.educations.length > 0 ? (
              <div className="space-y-6">
                {profile.educations.map((edu, index) => (
                  <div key={index} className="relative pl-8 pb-6 border-l-2 border-green-300 last:pb-0">
                    <div className="absolute -left-4 -top-1 w-6 h-6 bg-green-600 rounded-full border-4 border-white"></div>
                    <div className="bg-slate-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{edu.degree}</h3>
                          <p className="text-lg text-green-600 font-semibold">{edu.institution}</p>
                        </div>
                        <span className="text-sm text-slate-600 whitespace-nowrap ml-4">
                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                        </span>
                      </div>
                      {edu.description && (
                        <p className="text-slate-700 mt-3">{edu.description}</p>
                      )}
                      {edu.grade && (
                        <p className="text-sm text-slate-600 mt-2">GPA: {edu.grade}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">No education added yet</p>
            )}

            {/* Certifications */}
            {profile?.certifications && profile.certifications.length > 0 && (
              <div className="mt-10 pt-10 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Certifications
                </h3>
                <div className="space-y-4">
                  {profile.certifications.map((cert, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{cert.name}</p>
                          <p className="text-sm text-slate-600">{cert.issuer}</p>
                        </div>
                        <span className="text-sm text-slate-600 whitespace-nowrap ml-4">{formatDate(cert.date)}</span>
                      </div>
                      {cert.credentialId && (
                        <p className="text-sm text-blue-600 mt-2">Credential ID: {cert.credentialId}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              Skills & Expertise
            </h2>
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {profile.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full text-sm font-medium text-slate-800 hover:shadow-md transition-shadow cursor-default"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">No skills added yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileView;