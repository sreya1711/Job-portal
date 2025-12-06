import React, { useState } from 'react';
import {
  Mail, Phone, MapPin, Download, Edit2, Linkedin, Github,
  Briefcase, GraduationCap, Play, Trash2, Upload, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';

const ProfileSection = ({
  user,
  userProfile,
  experiences = [],
  educations = [],
  onEdit,
  onDownloadResume,
  pdfResume = null,
  videoResume = null,
  onVideoUpdate,
  onPdfUpdate
}) => {
  const [expandedSections, setExpandedSections] = useState({
    experience: true,
    education: true
  });

  const [videoUploading, setVideoUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(videoResume?.url || null);
  const [videoTitle, setVideoTitle] = useState(videoResume?.title || 'My Video Resume');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = React.useRef(null);
  const pdfInputRef = React.useRef(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be less than 100MB');
      return;
    }

    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      if (video.duration > 300) {
        toast.error('Video must be less than 5 minutes');
        return;
      }
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    };
    video.src = URL.createObjectURL(file);
  };

  const uploadVideoResume = async () => {
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    try {
      setVideoUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target.result;
          const video = document.createElement('video');
          video.onloadedmetadata = async () => {
            const videoData = {
              fileName: videoFile.name,
              base64: base64Data,
              title: videoTitle,
              duration: Math.round(video.duration),
            };

            await jobsApi.updateVideoResume(videoData);
            if (onVideoUpdate) {
              onVideoUpdate(videoData);
            }
            
            toast.success('Video resume uploaded successfully!');
            setVideoFile(null);
            setVideoPreview(base64Data);
          };
          video.src = base64Data;
        } catch (error) {
          console.error('Error processing video:', error);
          toast.error('Failed to process video. Please try again.');
        } finally {
          setVideoUploading(false);
        }
      };
      reader.readAsDataURL(videoFile);
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video. Please try again.');
      setVideoUploading(false);
    }
  };

  const deleteVideoResume = async () => {
    if (!videoPreview) return;

    try {
      setVideoUploading(true);
      await jobsApi.deleteVideoResume();
      setVideoPreview(null);
      setVideoFile(null);
      if (onVideoUpdate) {
        onVideoUpdate(null);
      }
      toast.success('Video resume deleted');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setVideoUploading(false);
    }
  };

  const handlePdfFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF must be less than 10MB');
      return;
    }

    setPdfFile(file);
  };

  const uploadPdfResume = async () => {
    if (!pdfFile) {
      toast.error('Please select a PDF file');
      return;
    }

    try {
      setPdfUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target.result;
          const pdfData = {
            fileName: pdfFile.name,
            base64: base64Data,
            uploadedAt: new Date().toISOString()
          };

          console.log('Uploading PDF with:', {
            fileName: pdfData.fileName,
            base64Length: base64Data.length,
            uploadedAt: pdfData.uploadedAt
          });

          const response = await jobsApi.uploadResume(pdfData);
          
          console.log('PDF upload response:', response);
          
          toast.success('PDF resume uploaded successfully!');
          setPdfFile(null);
          if (pdfInputRef.current) {
            pdfInputRef.current.value = '';
          }
          
          if (onPdfUpdate) {
            onPdfUpdate(pdfData);
          }
        } catch (error) {
          console.error('Error uploading PDF:', error);
          console.error('Error response:', error.response?.data);
          const errorMsg = error.response?.data?.details?.[0]?.message || error.response?.data?.message || error.message || 'Failed to upload PDF. Please try again.';
          toast.error(errorMsg);
        } finally {
          setPdfUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error('Error reading PDF file');
        setPdfUploading(false);
      };
      reader.readAsDataURL(pdfFile);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF. Please try again.');
      setPdfUploading(false);
    }
  };

  const parseExperience = (exp) => {
    if (typeof exp === 'string') {
      const match = exp.match(/(.+?)\sat\s(.+?)\s\((.+?)\)/);
      if (match) {
        return { title: match[1], company: match[2], duration: match[3] };
      }
      return { title: exp, company: '', duration: '' };
    }
    return {
      title: exp.title || exp.role || '',
      company: exp.company || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      duration: exp.startDate ? `${exp.startDate}${exp.endDate ? ' - ' + exp.endDate : ' - Present'}` : ''
    };
  };

  const experiencesList = experiences.map(parseExperience).filter(e => e.title || e.company);
  
  const initials = (userProfile?.name || user?.name || '')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const profileData = {
    name: userProfile?.name || user?.name || '',
    email: userProfile?.email || user?.email || '',
    phone: userProfile?.phone || user?.profile?.phone || '',
    location: userProfile?.location || user?.profile?.location || '',
    bio: userProfile?.bio || user?.profile?.bio || '',
    linkedin: userProfile?.linkedin || user?.profile?.linkedin || '',
    github: userProfile?.github || user?.profile?.github || '',
    avatar: userProfile?.avatar || user?.avatar || ''
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          {/* Banner */}
          <div className="h-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

          {/* Profile Content */}
          <div className="px-6 md:px-10 pb-8">
            {/* Avatar & Header */}
            <div className="flex flex-col md:flex-row md:items-end md:gap-6 -mt-28 mb-8">
              {/* Avatar */}
              <div className="flex-shrink-0 mb-4 md:mb-0">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt={profileData.name}
                    className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>

              {/* Header Info */}
              <div className="flex-grow">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  {profileData.name || 'Your Profile'}
                </h1>
                <p className="text-slate-600 mb-4 text-sm md:text-base">
                  {profileData.bio?.substring(0, 100) || 'Professional Profile'}
                </p>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {profileData.email && (
                    <a
                      href={`mailto:${profileData.email}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-100 rounded-full transition text-slate-700 hover:text-blue-700"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">{profileData.email}</span>
                    </a>
                  )}
                  {profileData.phone && (
                    <a
                      href={`tel:${profileData.phone}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-green-100 rounded-full transition text-slate-700 hover:text-green-700"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="hidden sm:inline">{profileData.phone}</span>
                    </a>
                  )}
                  {profileData.location && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-700">
                      <MapPin className="w-4 h-4" />
                      <span className="hidden sm:inline">{profileData.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 md:mt-0 flex-wrap md:flex-nowrap">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
                {onDownloadResume && (
                  <button
                    onClick={onDownloadResume}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Resume</span>
                  </button>
                )}
              </div>
            </div>

            {/* Social Links */}
            {(profileData.linkedin || profileData.github) && (
              <div className="flex gap-3 mb-10 flex-wrap">
                {profileData.linkedin && (
                  <a
                    href={profileData.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm border border-blue-200 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {profileData.github && (
                  <a
                    href={profileData.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm border border-slate-800 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}
              </div>
            )}

            {/* Bio Section */}
            {profileData.bio && (
              <div className="mb-10 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                  Professional Summary
                </h3>
                <p className="text-slate-800 leading-relaxed">{profileData.bio}</p>
              </div>
            )}

            {/* Resume Section */}
            <div className="mb-10 border-b border-slate-200 pb-10">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Resume</h3>

              {/* PDF Resume */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  PDF Resume
                </h4>
                {pdfResume?.base64 || pdfResume?.fileName ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{pdfResume?.fileName || 'Resume.pdf'}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Uploaded on {pdfResume?.uploadedAt ? new Date(pdfResume.uploadedAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <a
                      href={pdfResume?.base64}
                      download={pdfResume?.fileName || 'resume.pdf'}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                ) : (
                  <div>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-3">
                        Upload your PDF resume (max 10MB)
                      </p>
                      <button
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        Select PDF
                      </button>
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfFileSelect}
                        className="hidden"
                      />
                    </div>

                    {pdfFile && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">
                            File selected: {pdfFile.name}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Ready to upload. Click the upload button below.
                          </p>
                        </div>
                      </div>
                    )}

                    {pdfFile && (
                      <button
                        onClick={uploadPdfResume}
                        disabled={pdfUploading}
                        className="w-full mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {pdfUploading ? 'Uploading...' : 'Upload PDF Resume'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Video Resume */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Video Resume
                </h4>
                {videoPreview ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full rounded-lg bg-slate-900 max-h-80 mb-4"
                    />
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-600 block mb-2">Video Title</label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="e.g., My Introduction"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <button
                        onClick={deleteVideoResume}
                        disabled={videoUploading}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition">
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-3">
                        Upload a video introduction (max 5 minutes, 100MB)
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        Select Video
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileSelect}
                        className="hidden"
                      />
                    </div>

                    {videoFile && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-900">
                            File selected: {videoFile.name}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Ready to upload. Click the upload button below.
                          </p>
                        </div>
                      </div>
                    )}

                    {videoFile && (
                      <button
                        onClick={uploadVideoResume}
                        disabled={videoUploading}
                        className="w-full mt-4 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {videoUploading ? 'Uploading...' : 'Upload Video Resume'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Experience Section */}
            {experiencesList.length > 0 && (
              <div className="mb-8 border-b border-slate-200 pb-8">
                <button
                  onClick={() => toggleSection('experience')}
                  className="w-full flex items-center justify-between group mb-4 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900">Work Experience</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {experiencesList.length} position{experiencesList.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {expandedSections.experience ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {expandedSections.experience && (
                  <div className="pl-16 space-y-4 pt-2">
                    {experiencesList.map((exp, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-8 top-1.5 w-4 h-4 bg-orange-600 rounded-full border-3 border-white shadow-md" />
                        {index < experiencesList.length - 1 && (
                          <div className="absolute -left-6 top-6 w-0.5 h-24 bg-orange-200" />
                        )}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-orange-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-grow">
                              <h4 className="font-bold text-slate-900 text-sm md:text-base">
                                {exp.title}
                              </h4>
                              <p className="text-sm font-semibold text-orange-600">
                                {exp.company}
                              </p>
                            </div>
                            <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
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
            {educations && educations.length > 0 && (
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('education')}
                  className="w-full flex items-center justify-between group mb-4 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900">Education</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {educations.length} degree{educations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {expandedSections.education ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {expandedSections.education && (
                  <div className="pl-16 space-y-4 pt-2">
                    {educations.map((edu, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-8 top-1.5 w-4 h-4 bg-green-600 rounded-full border-3 border-white shadow-md" />
                        {index < educations.length - 1 && (
                          <div className="absolute -left-6 top-6 w-0.5 h-24 bg-green-200" />
                        )}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-green-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-grow">
                              <h4 className="font-bold text-slate-900 text-sm md:text-base">
                                {edu.degree}
                              </h4>
                              <p className="text-sm font-semibold text-green-600">
                                {edu.institution}
                              </p>
                              {edu.description && (
                                <p className="text-xs text-slate-600 mt-2">
                                  {edu.description}
                                </p>
                              )}
                            </div>
                            {(edu.startDate || edu.endDate) && (
                              <span className="text-xs text-slate-600 whitespace-nowrap font-medium">
                                {edu.startDate} - {edu.endDate}
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
    </div>
  );
};

export default ProfileSection;
