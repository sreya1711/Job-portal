import React, { useState, useEffect, useRef } from 'react';
import {
  Search, MapPin, Clock, DollarSign, Users, Calendar,
  ArrowRight, Heart, Send, Bookmark, X, User, MessageSquare, FileText, Briefcase, BarChart3, Bell
} from 'lucide-react';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';
import { useAuth } from '../hooks/useAuth';
import ProfileSection from './ProfileSection';
import ProfileEditSection from '../components/ProfileEditSection';
import ATSAnalyzer from '../components/ATSAnalyzer';
import VideoResume from '../components/VideoResume';
import NotificationCenter from '../components/notifications/NotificationCenter';
import notificationService from '../services/notificationService';

const JobSeekerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState('');
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewsError, setInterviewsError] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showATSAnalyzer, setShowATSAnalyzer] = useState(false);
  const [atsAnalysisResult, setAtsAnalysisResult] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    bio: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Career Assistant state
  const [careerForm, setCareerForm] = useState({
    name: '',
    education: '',
    skills: '',
    experience: '',
    certifications: '',
    interests: ''
  });
  const [careerAnalysis, setCareerAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Real-Time Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const prevAppStatusesRef = useRef({});

  const fetchMyApplications = async () => {
    try {
      console.log('Fetching my applications...');
      setApplicationsLoading(true);
      const response = await jobsApi.getMyApplications();
      console.log('Applications API response:', response);
      
      // Handle different response structures
      let applicationsData = [];
      if (Array.isArray(response)) {
        applicationsData = response;
      } else if (response && response.applications) {
        applicationsData = response.applications;
      } else if (response && response.data) {
        applicationsData = Array.isArray(response.data) ? response.data : [response.data];
      } else if (response && response.data && response.data.applications) {
        applicationsData = response.data.applications;
      }
      
      console.log('Processed applications:', applicationsData);
      
      // Process applications in parallel to fetch messages for each
      const applicationsWithMessages = await Promise.all(
        applicationsData
          .filter(app => app && app._id && app.job)
          .map(async (app) => {
            try {
              // Fetch messages for this application
              const messagesResponse = await jobsApi.getApplicationMessages(app._id);
              const messages = Array.isArray(messagesResponse) ? messagesResponse : [];
              
              // Process messages to ensure they have the correct structure
              const processedMessages = messages.map(msg => {
                const isFromEmployer = msg.role === 'employer' || 
                  (msg.sender && 
                   (msg.sender.role === 'employer' || 
                    (msg.sender._id && app.employer?._id && msg.sender._id.toString() === app.employer._id.toString()) ||
                    (typeof msg.sender === 'string' && app.employer?._id && msg.sender === app.employer._id.toString())));
                
                // Get sender info
                let senderInfo = {};
                if (isFromEmployer) {
                  senderInfo = {
                    _id: app.employer?._id || (msg.sender?._id ? msg.sender._id.toString() : msg.sender),
                    name: app.employer?.companyName || app.employer?.name || 'Employer',
                    email: app.employer?.email,
                    role: 'employer'
                  };
                } else {
                  senderInfo = {
                    _id: app.jobSeeker?._id || user?._id,
                    name: app.jobSeeker?.name || 'You',
                    email: app.jobSeeker?.email || user?.email,
                    role: 'job_seeker'
                  };
                }
                
                return {
                  _id: msg._id || `msg-${Math.random().toString(36).substr(2, 9)}`,
                  content: msg.content || '',
                  role: isFromEmployer ? 'employer' : 'job_seeker',
                  timestamp: msg.timestamp || msg.sentAt || msg.createdAt || new Date(),
                  sentAt: msg.sentAt || msg.timestamp || msg.createdAt || new Date(),
                  read: msg.read || false,
                  sender: senderInfo
                };
              });

      // Handle direct server emitted status updates
      notificationService.on('application-status-update', (data) => {
        try { console.log('[ui] received application-status-update', data); } catch {}
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'application-status',
          title: 'Application Status Update',
          message: `Your application for ${data.jobTitle || 'a job'} is ${data.status}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        fetchMyApplications();
      });
              
              return {
                ...app,
                interviewSchedule: app.interview || app.interviewSchedule || null,
                messages: processedMessages,
                unreadMessageCount: processedMessages.filter(m => !m.read && m.role === 'employer').length,
                // Ensure statusUpdates is an array
                statusUpdates: Array.isArray(app.statusHistory) 
                  ? app.statusHistory 
                  : (app.status ? [{ status: app.status, timestamp: new Date() }] : [])
              };
            } catch (error) {
              console.error(`Error fetching messages for application ${app._id}:`, error);
              return {
                ...app,
                interviewSchedule: app.interview || app.interviewSchedule || null,
                messages: [],
                unreadMessageCount: 0,
                // Ensure statusUpdates is an array even if there's an error
                statusUpdates: Array.isArray(app.statusHistory) 
                  ? app.statusHistory 
                  : (app.status ? [{ status: app.status, timestamp: new Date() }] : [])
              };
            }
          })
      );
      
      // Filter out any null/undefined applications that might have resulted from errors
      const validApplications = applicationsWithMessages.filter(app => app !== null && app !== undefined);
      
      console.log('Final applications with messages:', validApplications);

      // Detect application status changes since last fetch to create offline-safe notifications
      try {
        const prevMap = prevAppStatusesRef.current || {};
        const nextMap = {};
        validApplications.forEach(app => {
          if (!app || !app._id) return;
          nextMap[app._id] = app.status;
          const prevStatus = prevMap[app._id];
          const currStatus = app.status;
          const latestHistory = Array.isArray(app.statusHistory) && app.statusHistory.length > 0
            ? app.statusHistory[0]
            : null;
          const hasPrevious = !!latestHistory?.previousStatus;
          if ((prevStatus && currStatus && prevStatus !== currStatus) ||
              (!prevStatus && currStatus && currStatus !== 'pending' && hasPrevious)) {
            const notification = {
              id: `notif-${app._id}-${Date.now()}`,
              type: 'application-status',
              title: 'Application Status Update',
              message: `Your application for ${app.job?.title || 'a job'} is ${currStatus}`,
              timestamp: new Date(),
              read: false,
              data: {
                applicationId: app._id,
                jobTitle: app.job?.title,
                status: currStatus,
                previousStatus: prevStatus,
              }
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadNotificationCount(prev => prev + 1);
            try {
              notificationService.emit('application-updated', {
                applicationId: app._id,
                jobTitle: app.job?.title,
                status: currStatus,
                previousStatus: prevStatus,
                jobSeekerId: user?.id,
                updatedAt: new Date().toISOString(),
              });
            } catch (_) {}
          }
        });
        prevAppStatusesRef.current = nextMap;
      } catch (e) {
        console.warn('Failed to diff application statuses for notifications:', e?.message || e);
      }

      setApplications(validApplications);
      setApplicationsError('');
    } catch (error) {
      console.error('Error fetching applications:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load applications. Please try again.';
      setApplicationsError(errorMessage);
      toast.error(errorMessage);
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchMyInterviews = async () => {
    try {
      setInterviewsLoading(true);
      const response = await jobsApi.getMyInterviews();
      setInterviews(Array.isArray(response) ? response : []);
      setInterviewsError('');
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setInterviewsError(error.message || 'Failed to load interviews');
      setInterviews([]);
    } finally {
      setInterviewsLoading(false);
    }
  };

  const fetchMyFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const response = await jobsApi.getMyFeedback();
      setFeedback(Array.isArray(response) ? response : []);
      setFeedbackError('');
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedbackError(error.message || 'Failed to load feedback');
      setFeedback([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchMyMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await jobsApi.getMyMessages();
      setMessages(Array.isArray(response) ? response : []);
      setMessagesError('');
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessagesError(error.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const jobsPerPage = 6;

  const fetchJobs = async () => {
    try {
      console.log('Fetching jobs...');
      const response = await jobsApi.getJobs();
      console.log('Raw jobs API response:', response);
      
      // Check if response is an array or has a jobs property
      let jobsData = [];
      if (Array.isArray(response)) {
        jobsData = response;
      } else if (response && Array.isArray(response.jobs)) {
        jobsData = response.jobs;
      } else if (response && response.data && Array.isArray(response.data)) {
        jobsData = response.data;
      }
      
      console.log('Processed jobs data:', jobsData);
      console.log('First job sample:', jobsData[0]);
      
      // Ensure all jobs have required fields
      const validJobs = jobsData.filter(job => job && job._id);
      console.log(`Found ${validJobs.length} valid jobs out of ${jobsData.length}`);
      
      setJobs(validJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  // Fetch initial data when component mounts or authentication state changes
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || user.role !== 'jobseeker') return;

      try {
        // Fetch jobs, applications, interviews, feedback, and messages in parallel
        await Promise.all([
          fetchJobs(),
          fetchMyApplications(),
          fetchMyInterviews(),
          fetchMyFeedback(),
          fetchMyMessages()
        ]);

        // Fetch fresh profile data from MongoDB (not from localStorage cache)
        try {
          const freshProfile = await jobsApi.getProfile();
          console.log('Fetched fresh profile from MongoDB:', freshProfile);
          
          // Set user profile and form data from fresh MongoDB data
          setUserProfile({ ...user, ...freshProfile });
          setProfileForm({
            name: freshProfile.name || user.name || '',
            email: freshProfile.email || user.email || '',
            phone: freshProfile.phone || user.profile?.phone || '',
            location: freshProfile.location || user.profile?.location || '',
            linkedin: freshProfile.linkedin || user.profile?.linkedin || '',
            bio: freshProfile.bio || user.profile?.bio || ''
          });
          // Format skills for display - handle both string and array formats
          const skillsData = freshProfile.skills || user.profile?.skills || '';
          const skillsArray = typeof skillsData === 'string' 
            ? skillsData.split(',').map(s => s.trim()).filter(s => s)
            : Array.isArray(skillsData)
            ? skillsData.map(skill => typeof skill === 'object' ? skill.name : skill)
            : [];
          setSkills(skillsArray);
          
          // Format experiences - handle both string and array formats
          const experiencesData = freshProfile.experiences || user.profile?.experiences || '';
          const experiencesArray = typeof experiencesData === 'string' 
            ? experiencesData.split(',').map(e => e.trim()).filter(e => e)
            : Array.isArray(experiencesData)
            ? experiencesData
            : [];
          setExperiences(experiencesArray);
          
          setEducations(freshProfile.educations || user.profile?.educations || []);
          
          // Format certifications - handle both string and array formats
          const certificationsData = freshProfile.certifications || user.profile?.certifications || '';
          const certificationsArray = typeof certificationsData === 'string'
            ? certificationsData.split(',').map(c => c.trim()).filter(c => c)
            : Array.isArray(certificationsData)
            ? certificationsData
            : [];
          setCertifications(certificationsArray);
        } catch (profileError) {
          console.warn('Could not fetch fresh profile, using cached data:', profileError);
          // Fallback to user data from auth context
          setUserProfile(user);
          setProfileForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.profile?.phone || '',
            location: user.profile?.location || '',
            linkedin: user.profile?.linkedin || '',
            bio: user.profile?.bio || ''
          });
          // Format skills for display - handle both string and array formats
          const skillsData = user.profile?.skills || '';
          const skillsArray = typeof skillsData === 'string' 
            ? skillsData.split(',').map(s => s.trim()).filter(s => s)
            : Array.isArray(skillsData)
            ? skillsData.map(skill => typeof skill === 'object' ? skill.name : skill)
            : [];
          setSkills(skillsArray);
          
          // Format experiences - handle both string and array formats
          const experiencesData = user.profile?.experiences || '';
          const experiencesArray = typeof experiencesData === 'string' 
            ? experiencesData.split(',').map(e => e.trim()).filter(e => e)
            : Array.isArray(experiencesData)
            ? experiencesData
            : [];
          setExperiences(experiencesArray);
          
          setEducations(user.profile?.educations || []);
          
          // Format certifications - handle both string and array formats
          const certificationsData = user.profile?.certifications || '';
          const certificationsArray = typeof certificationsData === 'string'
            ? certificationsData.split(',').map(c => c.trim()).filter(c => c)
            : Array.isArray(certificationsData)
            ? certificationsData
            : [];
          setCertifications(certificationsArray);
        }

        // Load bookmarked jobs from localStorage
        const savedBookmarks = localStorage.getItem(`bookmarks_${user.id}`);
        if (savedBookmarks) {
          setBookmarkedJobs(JSON.parse(savedBookmarks));
        }
      } catch (error) {
        toast.error('Failed to fetch dashboard data.');
        console.error('Error fetching job seeker dashboard data:', error);
      }
    };
    
    fetchData();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`bookmarks_${user.id}`, JSON.stringify(bookmarkedJobs));
    }
  }, [bookmarkedJobs, user?.id]);

  // Initialize real-time notifications
  useEffect(() => {
    const isJobSeekerRole = user?.role === 'jobseeker' || user?.role === 'job_seeker';
    if (!isAuthenticated || !isJobSeekerRole) return;

    try {
      // Initialize notification service
      try { console.log('[ui] init notifications for', user?.id, 'role=', user?.role); } catch {}
      notificationService.connect(user.id);

      // Listen for real-time notifications
      // Job posted (compatibility: notify and non-notify)
      notificationService.on('notify:job-posted', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'job-posted',
          title: 'New Job Posted',
          message: `${data.jobTitle} at ${data.company} matches your skills`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        toast.info(`New job posted: ${data.jobTitle}`);
      });
      notificationService.on('job-posted', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'job-posted',
          title: 'New Job Posted',
          message: `${data.jobTitle} at ${data.company}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        toast.info(`New job posted: ${data.jobTitle}`);
      });

      notificationService.on('notify:application-status', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'application-status',
          title: 'Application Status Update',
          message: `Your application for ${data.jobTitle} is ${data.status}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        toast.info(`Application status: ${data.status}`);
        // Refresh applications list to reflect new status
        fetchMyApplications();
      });

      // Handle socket-driven application updates
      notificationService.on('application-updated', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'application-status',
          title: 'Application Status Update',
          message: `Your application for ${data.jobTitle || 'a job'} is ${data.status}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        fetchMyApplications();
      });

      // Direct server event (no notify prefix)
      notificationService.on('application-status-update', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'application-status',
          title: 'Application Status Update',
          message: `Your application for ${data.jobTitle || 'a job'} is ${data.status}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        fetchMyApplications();
      });

      // Namespaced event emitted by backend
      notificationService.on('application:status', (data) => {
        try { console.log('[ui] received application:status', data); } catch {}
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'application-status',
          title: 'Application Status Update',
          message: `Your application for ${data.jobTitle || 'a job'} is ${data.status}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        fetchMyApplications();
      });

      // New messages from employers
      notificationService.on('message-received', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'message',
          title: 'New Message',
          message: `New message from ${data.senderName || 'Employer'}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        // Optionally refresh applications to update unread counts
        fetchMyApplications();
      });

      // Feedback from employer
      notificationService.on('feedback-received', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'feedback',
          title: 'New Feedback',
          message: `Feedback on ${data.jobTitle || 'your application'}${data.type ? `: ${data.type}` : ''}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        fetchMyFeedback();
      });

      notificationService.on('notify:skill-match', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'skill-match',
          title: 'Skill Match Alert',
          message: `Your ${data.skillName} skill matches ${data.matchPercentage}% of requirements for ${data.jobTitle}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
      });

      notificationService.on('notify:interview-scheduled', (data) => {
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'interview-scheduled',
          title: 'Interview Scheduled',
          message: `Interview scheduled for ${data.jobTitle} on ${data.interviewDate}`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
        toast.success(`Interview scheduled for ${data.jobTitle}`);
        // Refresh interviews list when a new interview is scheduled
        fetchMyInterviews();
      });

      // Also handle socket events without notify prefix
      notificationService.on('interview-scheduled', () => fetchMyInterviews());
      notificationService.on('interview:scheduled', () => fetchMyInterviews());

      // Cross-party profile updates
      notificationService.on('profile-updated', (data) => {
        try { console.log('[ui] received profile-updated', data); } catch {}
        const who = data.actorRole === 'employer' ? 'Employer' : 'Candidate';
        const notification = {
          id: `notif-${Date.now()}`,
          type: 'profile-updated',
          title: `${who} Profile Updated`,
          message: data.name ? `${who} updated profile: ${data.name}` : `${who} updated profile`,
          timestamp: new Date(),
          read: false,
          data
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotificationCount(prev => prev + 1);
      });

      return () => {
        notificationService.disconnect();
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [isAuthenticated, user?.id, user?.role]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      // Format skills properly - convert strings to objects with required fields
      const formattedSkills = skills.map(skill => {
        if (typeof skill === 'string') {
          return {
            name: skill,
            endorsements: 0,
            badge: 'bronze',
            verifiedByAssessment: false,
            assessmentScore: 0
          };
        }
        return skill;
      });

      // Update user profile via API
      const updatedProfile = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        location: profileForm.location,
        linkedin: profileForm.linkedin,
        bio: profileForm.bio,
        skills: formattedSkills,
        experiences,
        educations,
        certifications
      };
      await jobsApi.updateProfile(updatedProfile);
      setUserProfile(prev => ({ ...prev, ...updatedProfile }));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast.error('Please select a resume file');
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result;
        const resumeData = {
          fileName: resumeFile.name,
          base64: base64Data,
          uploadedAt: new Date().toISOString()
        };
        await jobsApi.uploadResume(resumeData);
        setUserProfile(prev => ({
          ...prev,
          profile: { ...prev.profile, resume: resumeData }
        }));
        toast.success('Resume uploaded successfully');
        setResumeFile(null);
      };
      reader.readAsDataURL(resumeFile);
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperiences(prev => [...prev, { title: '', company: '', startDate: '', endDate: '', description: '' }]);
  };

  const removeExperience = (index) => {
    setExperiences(prev => prev.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    setExperiences(prev => prev.map((exp, i) => i === index ? { ...exp, [field]: value } : exp));
  };

  const addEducation = () => {
    setEducations(prev => [...prev, { degree: '', institution: '', startDate: '', endDate: '', description: '' }]);
  };

  const removeEducation = (index) => {
    setEducations(prev => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index, field, value) => {
    setEducations(prev => prev.map((edu, i) => i === index ? { ...edu, [field]: value } : edu));
  };

  const addCertification = () => {
    setCertifications(prev => [...prev, { name: '', issuer: '', date: '', description: '' }]);
  };

  const removeCertification = (index) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const updateCertification = (index, field, value) => {
    setCertifications(prev => prev.map((cert, i) => i === index ? { ...cert, [field]: value } : cert));
  };

  const analyzeCareer = async () => {
    if (!careerForm.name || !careerForm.education || !careerForm.skills) {
      toast.error('Please fill in at least name, education, and skills');
      return;
    }

    try {
      setAnalyzing(true);

      // Fetch available jobs from the platform
      const jobsResponse = await jobsApi.getJobs();
      console.log('Available jobs for analysis:', jobsResponse);

      // Extract jobs array from response (handle different response structures)
      let availableJobs = [];
      if (Array.isArray(jobsResponse)) {
        availableJobs = jobsResponse;
      } else if (jobsResponse && Array.isArray(jobsResponse.jobs)) {
        availableJobs = jobsResponse.jobs;
      } else if (jobsResponse && jobsResponse.data && Array.isArray(jobsResponse.data)) {
        availableJobs = jobsResponse.data;
      } else {
        console.warn('Unexpected jobs response structure:', jobsResponse);
        availableJobs = [];
      }

      // Parse user's skills
      const userSkills = careerForm.skills.toLowerCase().split(',').map(skill => skill.trim());
      const userExperience = careerForm.experience ? careerForm.experience.toLowerCase() : '';
      const userEducation = careerForm.education.toLowerCase();

      // Analyze job matches
      const jobMatches = [];
      const skillGaps = new Set();
      const industries = new Set();
      const companies = new Set();

      // Process each job to find matches
      availableJobs.forEach(job => {
        if (!job || !job._id || !job.requirements) return;

        const jobSkills = job.requirements.map(req => req.toLowerCase());
        const jobTitle = job.title.toLowerCase();
        const jobDescription = job.description ? job.description.toLowerCase() : '';

        // Calculate skill match percentage
        const matchingSkills = userSkills.filter(userSkill =>
          jobSkills.some(jobSkill => jobSkill.includes(userSkill) || userSkill.includes(jobSkill))
        );

        const matchPercentage = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 0;

        // Check for experience level match
        let experienceMatch = false;
        if (userExperience.includes('senior') || userExperience.includes('lead') || userExperience.includes('manager')) {
          experienceMatch = job.type === 'Full-time' || job.type === 'Contract';
        } else if (userExperience.includes('junior') || userExperience.includes('intern')) {
          experienceMatch = job.type === 'Internship' || job.type === 'Part-time';
        } else {
          experienceMatch = true; // Assume entry/mid level can apply for various roles
        }

        // Education match
        let educationMatch = false;
        if (userEducation.includes('b.tech') || userEducation.includes('bachelor') || userEducation.includes('computer science') ||
            userEducation.includes('engineering') || userEducation.includes('m.tech') || userEducation.includes('master')) {
          educationMatch = true; // Tech degrees match tech jobs
        }

        // Calculate overall suitability
        let suitabilityScore = matchPercentage;
        if (experienceMatch) suitabilityScore += 20;
        if (educationMatch) suitabilityScore += 15;

        // Add to matches if suitable
        if (suitabilityScore >= 40) {
          jobMatches.push({
            job: job,
            matchPercentage: Math.round(matchPercentage),
            suitabilityScore: Math.round(suitabilityScore),
            matchingSkills: matchingSkills,
            reason: `You have ${matchingSkills.length} out of ${jobSkills.length} required skills (${Math.round(matchPercentage)}% match)`
          });

          // Collect industries and companies
          if (job.category) industries.add(job.category);
          if (job.company) companies.add(job.company);
        }

        // Identify skill gaps
        jobSkills.forEach(jobSkill => {
          const hasSkill = userSkills.some(userSkill =>
            jobSkill.includes(userSkill) || userSkill.includes(jobSkill)
          );
          if (!hasSkill) {
            skillGaps.add(jobSkill);
          }
        });
      });

      // Sort matches by suitability score
      jobMatches.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

      // Take top 5 matches
      const topMatches = jobMatches.slice(0, 5);

      // Generate learning path based on skill gaps
      const learningPath = [];
      const skillGapArray = Array.from(skillGaps).slice(0, 5);

      if (skillGapArray.includes('javascript') || skillGapArray.includes('react')) {
        learningPath.push('Complete JavaScript and React certification courses');
      }
      if (skillGapArray.includes('python') || skillGapArray.includes('data analysis')) {
        learningPath.push('Learn Python for data analysis and machine learning');
      }
      if (skillGapArray.includes('cloud') || skillGapArray.includes('aws') || skillGapArray.includes('azure')) {
        learningPath.push('Get AWS or Azure cloud certification');
      }
      if (skillGapArray.includes('agile') || skillGapArray.includes('scrum')) {
        learningPath.push('Complete Scrum Master or Agile certification');
      }
      if (skillGapArray.includes('leadership') || skillGapArray.includes('management')) {
        learningPath.push('Take leadership and team management courses');
      }

      // Default learning suggestions if no specific gaps identified
      if (learningPath.length === 0) {
        learningPath.push('Build a portfolio showcasing your projects');
        learningPath.push('Practice coding challenges on platforms like LeetCode');
        learningPath.push('Contribute to open source projects');
        learningPath.push('Network with professionals in your field');
        learningPath.push('Stay updated with latest technology trends');
      }

      const analysis = {
        jobMatches: topMatches,
        industries: Array.from(industries).slice(0, 5),
        skillGaps: skillGapArray,
        learningPath: learningPath,
        companies: Array.from(companies).slice(0, 5),
        totalJobsAnalyzed: availableJobs.length,
        suitableJobsFound: jobMatches.length
      };

      setCareerAnalysis(analysis);
      toast.success(`Career analysis completed! Found ${jobMatches.length} suitable job matches.`);
    } catch (error) {
      console.error('Error analyzing career:', error);
      toast.error('Failed to analyze career. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const isJobBookmarked = (jobId) => {
    return bookmarkedJobs.includes(jobId);
  };

  const hasAppliedToJob = (jobId) => {
    if (!jobId) {
      return false;
    }
    return applications.some(app => app?.job?._id === jobId);
  };

  const handleBookmark = async (jobId) => {
    if (!isAuthenticated) {
      toast.error('Please login to save jobs');
      return;
    }

    try {
      const isCurrentlyBookmarked = isJobBookmarked(jobId);
      if (isCurrentlyBookmarked) {
        setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
        toast.success('Job removed from saved jobs');
      } else {
        setBookmarkedJobs(prev => [...prev, jobId]);
        toast.success('Job saved successfully');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
      console.error('Error updating bookmark:', error);
    }
  };

  const filteredJobs = jobs
    .filter(job => {
      const isValid = job && job._id;
      if (!isValid) {
        console.log('Filtering out invalid job:', job);
        return false;
      }
      return true;
    })
    .filter(job => {
      const matchesSearch =
        !searchQuery ||
        (job.title && job.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.company && job.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (job.requirements?.some(req => req && req.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesLocation = !locationFilter || 
        (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));
      
      const matchesType = !jobTypeFilter || job.type === jobTypeFilter;
      const matchesCategory = !categoryFilter || job.category === categoryFilter;

      const isIncluded = matchesSearch && matchesLocation && matchesType && matchesCategory;
      
      if (!isIncluded) {
        console.log('Job filtered out:', {
          id: job._id,
          title: job.title,
          company: job.company,
          matchesSearch,
          matchesLocation,
          matchesType,
          matchesCategory,
          searchQuery,
          locationFilter,
          jobTypeFilter,
          categoryFilter
        });
      }

      return isIncluded;
    });

  console.log('Filtered jobs count:', filteredJobs.length);
  console.log('All jobs count:', jobs.length);

  const savedJobs = jobs.filter(job => isJobBookmarked(job._id));

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  const handleApplyToJob = async (jobId, coverLetter = '') => {
    if (!isAuthenticated || user.role !== 'jobseeker') {
      toast.error('Please login as a job seeker to apply');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user has uploaded a resume before proceeding
      if (!userProfile?.profile?.resume) {
        toast.error('Please upload a resume before applying for jobs.');
        setShowApplicationModal(false);
        setShowProfileModal(true);
        return;
      }

      const applicationData = {
        jobId: jobId,
        jobSeeker: {
          name: profileForm.name || userProfile.name,
          email: profileForm.email || userProfile.email,
          phone: profileForm.phone || userProfile.phone,
          location: profileForm.location || userProfile.location,
          linkedin: profileForm.linkedin || userProfile.linkedin,
          bio: profileForm.bio || userProfile.bio,
          skills: skills.length > 0 ? skills : (userProfile.skills || []),
          experiences: experiences.length > 0 ? experiences : (userProfile.experiences || []),
          educations: educations.length > 0 ? educations : (userProfile.educations || []),
          certifications: certifications.length > 0 ? certifications : (userProfile.certifications || [])
        },
        // Server expects a URL/string; fall back to base64 if present
        resume: userProfile.profile?.resume?.url || userProfile.profile?.resume?.base64 || null,
        coverLetter: coverLetter,
      };

      const response = await jobsApi.applyForJob(applicationData);
      console.log('Application response:', response);
      
      // The response could have data property or application property or be the application directly
      const newApplication = response.data || response.application || response;
      
      if (!newApplication) {
        throw new Error('No application data received from server');
      }
      
      // Update UI with the new application
      setApplications(prev => {
        // Filter out any existing application for this job to avoid duplicates
        const filtered = prev.filter(app => app.job?._id !== newApplication.job?._id);
        return [...filtered, newApplication];
      });
      
      // Close the modal and reset state
      setShowApplicationModal(false);
      setSelectedJob(null);
      
      // Show success message with application status
      const status = newApplication.status || 'submitted';
      toast.success(`Application submitted successfully! Current status: ${status}`);
      
      // Refresh the applications list to ensure we have the latest data
      fetchMyApplications();
      
    } catch (error) {
      console.error('Error in handleApplyToJob:', error);
      
      // Handle specific error cases
      if (error.message.includes('already applied')) {
        toast.warning(error.message);
        // Refresh the applications list to get the latest status
        fetchMyApplications();
      } else if (error.message.includes('resume')) {
        toast.error(error.message);
        // Redirect to profile to upload resume
        setShowApplicationModal(false);
        setShowProfileModal(true);
      } else if (error.response?.data?.errors) {
        // Handle validation errors from server
        const errorMessages = Object.values(error.response.data.errors)
          .flat()
          .map(msg => `• ${msg}`)
          .join('\n');
        toast.error(`Validation error(s):\n${errorMessages}`, {
          autoClose: 10000, // Show for 10 seconds
          closeOnClick: false
        });
      } else if (error.response?.data?.message) {
        // Handle other server errors with specific messages
        toast.error(error.response.data.message);
      } else {
        // For other errors, show a generic error message
        toast.error(error.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interviewed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInDays = Math.floor((now - posted) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const tabs = [
    { id: 'jobs', label: 'Find Jobs', icon: Search },
    { id: 'applications', label: 'My Applications', icon: Send },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'feedback', label: 'Feedback', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'career', label: 'Career Assistant', icon: Briefcase },
    { id: 'bookmarks', label: 'Saved Jobs', icon: Bookmark },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'JS'}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'Job Seeker'}</h1>
              <p className="text-gray-600">Find your dream job</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <NotificationCenter />
            <div className="text-center">
              <p className="text-sm text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Saved Jobs</p>
              <p className="text-2xl font-bold text-green-600">{bookmarkedJobs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {tab.id === 'bookmarks' && bookmarkedJobs.length > 0 && (
                    <span className="ml-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      {bookmarkedJobs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <ProfileSection
            user={user}
            userProfile={userProfile}
            experiences={experiences}
            educations={educations}
            onEdit={() => setShowProfileModal(true)}
            onDownloadResume={() => {
              if (userProfile?.profile?.resume?.base64) {
                const a = document.createElement('a');
                a.href = userProfile.profile.resume.base64;
                a.download = userProfile.profile.resume.fileName || 'resume.pdf';
                a.click();
              } else {
                toast.info('No PDF resume uploaded yet');
              }
            }}
            pdfResume={userProfile?.profile?.resume}
            videoResume={userProfile?.profile?.videoResume}
            onVideoUpdate={(videoData) => {
              setUserProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, videoResume: videoData }
              }));
            }}
            onPdfUpdate={(pdfData) => {
              setUserProfile(prev => ({
                ...prev,
                profile: { ...prev.profile, resume: pdfData }
              }));
            }}
          />

          {/* Edit Profile Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <ProfileEditSection
                profile={userProfile}
                onProfileUpdate={(updatedProfile) => {
                  setUserProfile(updatedProfile);
                  setShowProfileModal(false);
                  toast.success('Profile updated successfully!');
                }}
                onClose={() => setShowProfileModal(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Find Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-gray-600">
              Showing {paginatedJobs.length} of {filteredJobs.length} jobs
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedJobs.filter(job => job && job._id).map((job) => {
              const isBookmarked = isJobBookmarked(job._id);
              const isApplied = hasAppliedToJob(job._id);
              return (
                <div key={job._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=3b82f6&color=fff`}
                        alt={job.company}
                        className="w-12 h-12 rounded-lg mr-4"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600 font-medium">{job.company}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookmark(job._id)}
                      className={`p-2 rounded-full transition-colors ${
                        isBookmarked
                          ? 'text-red-500 bg-red-50 hover:bg-red-100'
                          : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
                      }`}
                      title={isBookmarked ? 'Remove from saved jobs' : 'Save job'}
                    >
                      <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {job.type}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salary}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {getTimeAgo(job.postedDate)}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requirements?.slice(0, 3).map((req, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                        {req}
                      </span>
                    ))}
                    {job.requirements?.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        +{job.requirements.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {job.applications?.length || 0} applicants
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowATSAnalyzer(true);
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                        title="Analyze your resume against this job"
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analyze
                      </button>
                      {isApplied ? (
                        <button
                          onClick={() => setActiveTab('applications')}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md cursor-pointer flex items-center"
                        >
                          View Application
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setShowApplicationModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                          Apply Now
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredJobs.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search criteria.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-2 border rounded-md ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Interview Schedule</h2>
          {interviewsLoading && <p className="text-gray-600">Loading interviews...</p>}
          {interviewsError && (
            <div className="border border-red-200 text-red-700 p-3 rounded mb-4">{interviewsError}</div>
          )}
          {!interviewsLoading && !interviewsError && (
            <div className="space-y-4">
              {interviews.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
                  <p className="text-gray-600">When an employer schedules, you'll see it here.</p>
                </div>
              ) : (
                interviews.map(interview => (
                  <div key={interview._id} className="border border-blue-200 rounded-lg p-6 bg-blue-50 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{interview.job?.title || 'Job Title'}</h3>
                        <p className="text-gray-600 font-medium">{interview.job?.company || 'Company'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        interview.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        interview.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Date & Time</p>
                        <p className="text-base font-medium text-gray-900">
                          {new Date(interview.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })} at {interview.time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="text-base font-medium text-gray-900">{interview.duration} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Interview Type</p>
                        <p className="text-base font-medium text-gray-900 capitalize">
                          {interview.type === 'in-person' ? 'In-Person' :
                           interview.type === 'phone' ? 'Phone' :
                           'Video'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Location</p>
                        <p className="text-base font-medium text-gray-900">{interview.location || 'N/A'}</p>
                      </div>
                    </div>
                    {interview.notes && (
                      <div className="bg-white p-3 rounded border border-blue-100 mb-4">
                        <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                        <p className="text-gray-900">{interview.notes}</p>
                      </div>
                    )}
                    {interview.status === 'scheduled' && !interview.jobSeekerConfirmed && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        Please confirm your attendance for this interview
                      </div>
                    )}
                    {interview.jobSeekerConfirmed && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                        You have confirmed your attendance
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Feedback</h2>
          {feedbackLoading && <p className="text-gray-600">Loading feedback...</p>}
          {feedbackError && (
            <div className="border border-red-200 text-red-700 p-3 rounded mb-4">{feedbackError}</div>
          )}
          {!feedbackLoading && !feedbackError && (
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
                  <p className="text-gray-600">When an employer shares feedback, it will appear here.</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Feedback for {item.application?.job?.title || 'Job Application'}
                          </h3>
                          <p className="text-gray-600 font-medium">
                            {item.application?.job?.company || 'Company'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.type === 'positive' ? 'bg-green-100 text-green-800' :
                        item.type === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'General'}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-700">{item.content || item.feedback}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>From: {item.employer?.name || item.employer?.companyName || 'Employer'}</span>
                      <span>{new Date(item.createdAt || item.sentAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                    {item.rating && (
                      <div className="mt-3">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">Rating:</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-lg ${i < item.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">({item.rating}/5)</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* My Applications Tab */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">My Applications</h2>
          <div className="space-y-6">
            {applications.map((app) => {
              // Format application date
              const appliedDate = new Date(app.appliedDate || app.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              // Get status color based on application status
              const statusColors = {
                applied: 'bg-blue-100 text-blue-800 border-blue-200',
                reviewed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                interviewed: 'bg-purple-100 text-purple-800 border-purple-200',
                accepted: 'bg-green-100 text-green-800 border-green-200',
                rejected: 'bg-red-100 text-red-800 border-red-200',
                default: 'bg-gray-100 text-gray-800 border-gray-200'
              };

              const statusColor = statusColors[app.status?.toLowerCase()] || statusColors.default;

              return (
                <div key={app._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{app.job?.title || 'Job Title N/A'}</h3>
                        <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Applied'}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium">{app.job?.company || 'Company N/A'}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Applied on {appliedDate}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {app.status?.toLowerCase() === 'interviewed' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Interview Completed
                        </span>
                      )}
                      {app.status?.toLowerCase() === 'accepted' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Offer Accepted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interview Schedule Section */}
                  {app.interviewSchedule && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Interview Scheduled
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Date & Time</p>
                          <p className="font-medium">
                            {new Date(app.interviewSchedule.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                            {' at '}
                            {app.interviewSchedule.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Location/Type</p>
                          <p className="font-medium">
                            {app.interviewSchedule.location || 'N/A'}
                            {app.interviewSchedule.type ? ` (${app.interviewSchedule.type})` : ''}
                          </p>
                        </div>
                        {app.interviewSchedule.notes && (
                          <div className="md:col-span-2">
                            <p className="text-gray-600">Additional Notes</p>
                            <p className="font-medium">{app.interviewSchedule.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Application Details */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Application Details</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Cover Letter</p>
                          <p className="text-gray-800 mt-1">
                            {app.coverLetter || 'No cover letter provided'}
                          </p>
                        </div>
                        {app.resume && (
                          <div>
                            <p className="text-sm text-gray-600">Resume</p>
                            <a 
                              href={app.resume.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center mt-1"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages Section */}
                  {app.messages && app.messages.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {app.messages.map((message, idx) => {
                          // Determine if message is from employer or job seeker
                          const isEmployer = message.role === 'employer';
                          const senderInfo = message.sender || {};
                          const senderName = senderInfo.name || (isEmployer ? 'Employer' : 'You');
                          
                          // Format the timestamp
                          const messageDate = message.timestamp || message.sentAt || message.createdAt || new Date();
                          
                          // Format the message content
                          const messageContent = message.content || '';
                          
                          return (
                            <div 
                              key={message._id || idx} 
                              className={`p-3 rounded-lg mb-2 ${!isEmployer ? 'bg-blue-50 ml-auto max-w-[80%]' : 'bg-gray-100 mr-auto max-w-[80%]'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-medium text-gray-600">
                                  {senderName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(messageDate).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 break-words">{messageContent}</p>
                              {isEmployer && !message.read && (
                                <div className="text-right mt-1">
                                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Status History */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Status Updates</h4>
                    <div className="space-y-4">
                      <div className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          </div>
                          <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Application Submitted</p>
                          <p className="text-xs text-gray-500">{appliedDate}</p>
                        </div>
                      </div>

                      {app.statusUpdates?.map((update, idx) => (
                        <div key={idx} className="flex">
                          <div className="flex flex-col items-center mr-4">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            {idx < (app.statusUpdates?.length - 1 || 0) && (
                              <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Status updated to: {update.status?.charAt(0).toUpperCase() + update.status?.slice(1) || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(update.updatedAt || new Date()).toLocaleString()}
                            </p>
                            {update.notes && (
                              <p className="text-sm text-gray-700 mt-1">{update.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {applications.length === 0 && (
              <div className="text-center py-12">
                <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Start applying to jobs to see them here.</p>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Browse Jobs
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Messages</h2>
          {messagesLoading && <p className="text-gray-600">Loading messages...</p>}
          {messagesError && (
            <div className="border border-red-200 text-red-700 p-3 rounded mb-4">{messagesError}</div>
          )}
          {!messagesLoading && !messagesError && (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600">You will see messages from employers here.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Message from {message.sender?.name || message.sender?.companyName || 'Employer'}
                          </h3>
                          {message.application?.job && (
                            <p className="text-gray-600 font-medium">
                              Regarding: {message.application.job.title} at {message.application.job.company}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(message.sentAt || message.createdAt || message.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {!message.read && (
                          <div className="mt-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.application && (
                      <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                        <span>Application Status: {message.application.status || 'Applied'}</span>
                        <span>Applied: {new Date(message.application.appliedDate || message.application.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Career Assistant Tab */}
      {activeTab === 'career' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Career Assistant</h2>

          {!careerAnalysis ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Get Career Guidance</h3>
                <p className="text-blue-700">
                  Fill in your resume details below and get personalized career recommendations including job roles,
                  industries, skill gaps, and learning paths.
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={careerForm.name}
                      onChange={(e) => setCareerForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education *</label>
                    <input
                      type="text"
                      value={careerForm.education}
                      onChange={(e) => setCareerForm(prev => ({ ...prev, education: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., B.Tech Computer Science, 2023"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technical & Soft Skills *</label>
                  <textarea
                    value={careerForm.skills}
                    onChange={(e) => setCareerForm(prev => ({ ...prev, skills: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., JavaScript, React, Python, Communication, Problem Solving"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <textarea
                    value={careerForm.experience}
                    onChange={(e) => setCareerForm(prev => ({ ...prev, experience: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Software Intern at XYZ Corp, Full-stack Developer at ABC Ltd"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  <textarea
                    value={careerForm.certifications}
                    onChange={(e) => setCareerForm(prev => ({ ...prev, certifications: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., AWS Certified Developer, Google Data Analytics Certificate"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Career Interests & Goals</label>
                  <textarea
                    value={careerForm.interests}
                    onChange={(e) => setCareerForm(prev => ({ ...prev, interests: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Interested in AI/ML, want to work in tech startups, career goals"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={analyzeCareer}
                    disabled={analyzing}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {analyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Briefcase className="h-5 w-5 mr-2" />
                        Analyze My Career
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Your Career Analysis</h3>
                <button
                  onClick={() => setCareerAnalysis(null)}
                  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Analyze Again
                </button>
              </div>

              {/* Top Job Matches from Platform */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Top Job Matches from Platform
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({careerAnalysis.suitableJobsFound} matches found from {careerAnalysis.totalJobsAnalyzed} jobs)
                  </span>
                </h4>
                {careerAnalysis.jobMatches.length > 0 ? (
                  <div className="space-y-4">
                    {careerAnalysis.jobMatches.map((match, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 text-lg">{match.job.title}</h5>
                            <p className="text-gray-600 font-medium">{match.job.company}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {match.job.location}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {match.job.type}
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {match.job.salary}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{match.matchPercentage}%</div>
                            <div className="text-sm text-gray-600">Skill Match</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Suitability: {match.suitabilityScore}/100
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{match.job.description}</p>

                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">{match.reason}</p>
                          {match.matchingSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {match.matchingSkills.slice(0, 3).map((skill, skillIndex) => (
                                <span key={skillIndex} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  {skill}
                                </span>
                              ))}
                              {match.matchingSkills.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{match.matchingSkills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {match.job.requirements?.slice(0, 2).map((req, reqIndex) => (
                              <span key={reqIndex} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                                {req}
                              </span>
                            ))}
                            {match.job.requirements?.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{match.job.requirements.length - 2} skills
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedJob(match.job);
                                setShowATSAnalyzer(true);
                                setActiveTab('jobs'); // Switch to jobs tab
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                              title="Analyze your resume against this job"
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Analyze
                            </button>
                            <button
                              onClick={() => {
                                setSelectedJob(match.job);
                                setShowApplicationModal(true);
                                setActiveTab('jobs'); // Switch to jobs tab
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              Apply Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-900 mb-2">No suitable job matches found</h5>
                    <p className="text-gray-600 mb-4">
                      Based on your current skills and the jobs available on our platform,
                      we couldn't find strong matches. Consider updating your skills or exploring entry-level positions.
                    </p>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Browse All Jobs
                    </button>
                  </div>
                )}
              </div>

              {/* Best Matching Industries */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Best Matching Industries</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {careerAnalysis.industries.map((industry, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-800">{industry}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gap Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Skill Gap Analysis</h4>
                <div className="space-y-3">
                  {careerAnalysis.skillGaps.map((skill, index) => (
                    <div key={index} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-gray-800">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Learning Path */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Suggested Learning Path</h4>
                <div className="space-y-3">
                  {careerAnalysis.learningPath.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <span className="text-xs font-medium text-blue-800">{index + 1}</span>
                      </div>
                      <span className="text-gray-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Companies with Matching Jobs */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Companies with Matching Jobs
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Based on your skill matches)
                  </span>
                </h4>
                {careerAnalysis.companies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {careerAnalysis.companies.map((company, index) => (
                      <div key={index} className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-sm">
                            {company.split(' ').map(word => word[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{company}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">No specific companies identified from your matches</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <ProfileEditSection
          profile={userProfile}
          onProfileUpdate={(updatedProfile) => {
            setUserProfile(updatedProfile);
          }}
        />
      )}

      {/* Saved Jobs Tab */}
      {activeTab === 'bookmarks' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Saved Jobs</h2>
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div key={job._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=3b82f6&color=fff`}
                      alt={job.company}
                      className="w-12 h-12 rounded-lg mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600 font-medium">{job.company}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.type}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {getTimeAgo(job.postedDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleBookmark(job._id)}
                      className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                      title="Remove from saved jobs"
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowATSAnalyzer(true);
                      }}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                      title="Analyze your resume against this job"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analyze
                    </button>
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setShowApplicationModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      Apply Now
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-gray-700 text-sm line-clamp-2">{job.description}</p>
                </div>
                {job.requirements && job.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {job.requirements.slice(0, 4).map((req, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                        {req}
                      </span>
                    ))}
                    {job.requirements.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{job.requirements.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {savedJobs.length === 0 && (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
                <p className="text-gray-600 mb-4">Save interesting jobs to easily find them later.</p>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Browse Jobs
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Apply for {selectedJob.title}</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.company)}&background=3b82f6&color=fff`}
                    alt={selectedJob.company}
                    className="w-8 h-8 rounded mr-3"
                  />
                  <div>
                    <p className="font-medium">{selectedJob.company}</p>
                    <p className="text-sm text-gray-600">{selectedJob.location} • {selectedJob.type}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{selectedJob.salary}</p>
                {userProfile?.profile?.resume && (
                  <p className="text-sm text-gray-600 mt-2">
                    Resume: <a href={userProfile.profile.resume.base64} download={userProfile.profile.resume.fileName} className="text-blue-600 hover:underline">{userProfile.profile.resume.fileName}</a>
                  </p>
                )}
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Resume Analysis</h4>
                  <button
                    type="button"
                    onClick={() => setShowATSAnalyzer(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Resume with ATS
                  </button>
                </div>

                {atsAnalysisResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-green-800">ATS Analysis Complete</h5>
                        <p className="text-green-700 text-sm">
                          Your resume scored {atsAnalysisResult.overallScore}% compatibility
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{atsAnalysisResult.overallScore}%</div>
                        <div className="text-xs text-green-600">ATS Score</div>
                      </div>
                    </div>
                  </div>
                )}

                {userProfile?.profile?.resume && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Resume:</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{userProfile.profile.resume.fileName}</span>
                      <a
                        href={userProfile.profile.resume.base64}
                        download={userProfile.profile.resume.fileName}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const coverLetter = e.target.coverLetter.value;
                  handleApplyToJob(selectedJob._id, coverLetter);
                }}
              >
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter *</label>
                  <textarea
                    name="coverLetter"
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell them why you're perfect for this role..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ATS Analyzer Modal */}
      {showATSAnalyzer && selectedJob && (
        <ATSAnalyzer
          job={selectedJob}
          onAnalysisComplete={(result) => {
            setAtsAnalysisResult(result);
            setShowATSAnalyzer(false);
            toast.success('ATS analysis completed! Review the results above.');
          }}
          onClose={() => setShowATSAnalyzer(false)}
        />
      )}
    </div>
  );
};

export default JobSeekerDashboard;