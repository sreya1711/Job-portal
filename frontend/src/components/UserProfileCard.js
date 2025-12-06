import React, { useState } from 'react';
import {
  Mail, Phone, MapPin, Download, Edit2, Linkedin, Github, Globe,
  Briefcase, GraduationCap, Award, ArrowRight, ExternalLink, Calendar
} from 'lucide-react';

const UserProfileCard = ({ profile, onEdit, onDownloadResume, isLoading = false }) => {
  const [expandedSection, setExpandedSection] = useState('skills');

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto" />
          <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
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
    if (typeof date === 'string') {
      const [year, month] = date.split('-');
      if (year && month) {
        const d = new Date(`${year}-${month}-01`);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }
    }
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const parseExperience = (exp) => {
    if (typeof exp === 'string') {
      const match = exp.match(/(.+?)\sat\s(.+?)\s\((.+?)\)/);
      if (match) {
        return {
          title: match[1],
          company: match[2],
          duration: match[3]
        };
      }
      return { title: exp, company: '', duration: '' };
    }
    return {
      title: exp.title || exp.role || '',
      company: exp.company || '',
      duration: exp.startDate ? `${exp.startDate}${exp.endDate ? ' - ' + exp.endDate : ' - Present'}` : ''
    };
  };

  const parseSkills = (skills) => {
    if (Array.isArray(skills)) {
      return skills.map(s => typeof s === 'string' ? s : s.name || s);
    }
    if (typeof skills === 'string') {
      return skills.split(',').map(s => s.trim()).filter(s => s);
    }
    return [];
  };

  const skillsList = parseSkills(profile?.skills || []);
  const experiencesList = Array.isArray(profile?.experiences) 
    ? profile.experiences.map(parseExperience)
    : [];
  const educationsList = Array.isArray(profile?.educations) ? profile.educations : [];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Main Profile Card */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        {/* Profile Content */}
        <div className="px-8 pb-8">
          {/* Avatar and Header */}
          <div className="flex flex-col md:flex-row md:items-end md:gap-6 -mt-20 mb-8">
            {/* Avatar Circle */}
            <div className="flex-shrink-0">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile?.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl font-bold text-white">{initials}</span>
                </div>
              )}
            </div>

            {/* Profile Header Info */}
            <div className="flex-grow mt-4 md:mt-0 md:pb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{profile?.name || 'User Profile'}</h1>
              <p className="text-slate-600 mb-4 text-sm md:text-base">{profile?.bio?.substring(0, 80) || 'Professional Profile'}</p>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {profile?.email && (
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a href={`mailto:${profile.email}`} className="hover:text-blue-600 transition">
                      {profile.email}
                    </a>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                    <Phone className="w-4 h-4 text-green-600" />
                    <a href={`tel:${profile.phone}`} className="hover:text-green-600 transition">
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 md:mt-0 flex-wrap md:flex-nowrap">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              {(profile?.resume || onDownloadResume) && (
                <button
                  onClick={onDownloadResume}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Resume</span>
                </button>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(profile?.linkedin || profile?.github || profile?.portfolio) && (
            <div className="flex gap-3 mb-8 flex-wrap">
              {profile?.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm border border-blue-200 hover:border-blue-300"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {profile?.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors font-medium text-sm border border-slate-700 hover:border-slate-600"
                  title="GitHub Profile"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {profile?.portfolio && (
                <a
                  href={profile.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors font-medium text-sm border border-purple-200 hover:border-purple-300"
                  title="Portfolio"
                >
                  <Globe className="w-4 h-4" />
                  Portfolio
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Bio Section */}
          {profile?.bio && (
            <div className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Professional Summary</h3>
              <p className="text-slate-800 leading-relaxed text-sm md:text-base">{profile.bio}</p>
            </div>
          )}

          {/* Skills Section */}
          {skillsList.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setExpandedSection(expandedSection === 'skills' ? null : 'skills')}
                className="w-full flex items-center justify-between mb-4 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition">
                    <Award className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900">Skills & Expertise</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{skillsList.length} skills</p>
                  </div>
                </div>
                <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'skills' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedSection === 'skills' && (
                <div className="flex flex-wrap gap-2.5 pl-12">
                  {skillsList.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Experience Section */}
          {experiencesList.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setExpandedSection(expandedSection === 'experience' ? null : 'experience')}
                className="w-full flex items-center justify-between mb-4 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900">Work Experience</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{experiencesList.length} position{experiencesList.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'experience' ? 'rotate-90' : ''}`} />
              </button>

              {expandedSection === 'experience' && (
                <div className="pl-12 space-y-4">
                  {experiencesList.map((exp, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-8 top-1.5 w-4 h-4 bg-orange-600 rounded-full border-3 border-white shadow-md" />
                      {index < experiencesList.length - 1 && (
                        <div className="absolute -left-6 top-6 w-0.5 h-16 bg-orange-300" />
                      )}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-orange-300 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h4 className="font-bold text-slate-900">{exp.title}</h4>
                            <p className="text-sm font-semibold text-orange-600">{exp.company}</p>
                          </div>
                          <span className="text-xs text-slate-600 whitespace-nowrap ml-4 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {exp.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Education Section */}
          {educationsList.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setExpandedSection(expandedSection === 'education' ? null : 'education')}
                className="w-full flex items-center justify-between mb-4 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900">Education</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{educationsList.length} degree{educationsList.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedSection === 'education' ? 'rotate-90' : ''}`} />
              </button>

              {expandedSection === 'education' && (
                <div className="pl-12 space-y-4">
                  {educationsList.map((edu, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-8 top-1.5 w-4 h-4 bg-green-600 rounded-full border-3 border-white shadow-md" />
                      {index < educationsList.length - 1 && (
                        <div className="absolute -left-6 top-6 w-0.5 h-20 bg-green-300" />
                      )}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-green-300 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h4 className="font-bold text-slate-900">{edu.degree}</h4>
                            <p className="text-sm font-semibold text-green-600">{edu.institution}</p>
                          </div>
                          {(edu.startDate || edu.endDate) && (
                            <span className="text-xs text-slate-600 whitespace-nowrap ml-4 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
