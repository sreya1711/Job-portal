import React, { useState, useEffect } from 'react';
import {
  Building, Plus, Briefcase, Users, MapPin, Clock, DollarSign,
  Calendar, Trash2, X, Eye, MessageSquare, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';
import { useAuth } from '../hooks/useAuth';
import ApplicationsSection from './ApplicationsSection'; // Import the new component
import NotificationCenter from '../components/NotificationCenter';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
    requirements: '',
    category: 'Technology'
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [interviewDetails, setInterviewDetails] = useState({
    date: '',
    time: '',
    location: '',
    type: 'in-person',
    notes: ''
  });
  const [feedbackDetails, setFeedbackDetails] = useState({
    rating: 0,
    comments: ''
  });

  useEffect(() => {
    const fetchJobsAndApplications = async () => {
      setLoading(true);
      try {
        const fetchedJobs = await jobsApi.getEmployerJobs();
        setJobs(fetchedJobs);

        const fetchedApplications = [];
        for (const job of fetchedJobs) {
          const apps = await jobsApi.getApplicationsForJob(job._id);
          fetchedApplications.push(...apps);
        }
        setApplications(fetchedApplications);
      } catch (error) {
        toast.error('Failed to fetch data.');
        console.error('Error fetching employer data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'employer') {
      fetchJobsAndApplications();
    }
  }, [user]);

  const handlePostJob = async (e) => {
    e.preventDefault();

    if (!newJob.title || !newJob.description || !newJob.location || !newJob.requirements) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      toast.error('Unable to determine employer. Please log in again.');
      return;
    }

    const numericSalary = newJob.salary ? Number(newJob.salary) : undefined;
    if (newJob.salary && Number.isNaN(numericSalary)) {
      toast.error('Salary must be a valid number');
      return;
    }

    try {
      setLoading(true);
      const jobData = {
        title: newJob.title,
        description: newJob.description,
        company: newJob.company || user.company || '',
        location: newJob.location,
        type: newJob.type,
        salary: numericSalary,
        requirements: newJob.requirements.split(',').map(req => req.trim()).filter(Boolean),
        postedBy: user.id,
        category: newJob.category
      };

      const postedJob = await jobsApi.createJob(jobData);
      setJobs(prevJobs => [...prevJobs, postedJob]);
      setNewJob({
        title: '',
        location: '',
        type: 'Full-time',
        salary: '',
        description: '',
        requirements: '',
        company: '',
        category: 'Technology'
      });
      toast.success(`Job "${postedJob.title}" posted successfully!`);
    } catch (error) {
      console.error('Error posting job:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error('Failed to post job');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        setLoading(true);
        await jobsApi.deleteJob(jobId);
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
        setApplications(prevApps => prevApps.filter(app => app.job !== jobId));
        toast.success('Job deleted successfully');
      } catch (error) {
        console.error('Error deleting job:', error);
        toast.error('Failed to delete job');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      setLoading(true);
      const updatedApplication = await jobsApi.updateApplicationStatus(appId, status);
      setApplications(prevApps => prevApps.map(app =>
        app._id === appId ? { ...app, status: updatedApplication.application.status } : app
      ));
      toast.success(`Application status updated to ${status}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (applicationId, jobSeekerId) => {
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      await jobsApi.sendMessage({
        applicationId,
        jobSeekerId,
        senderId: user.id,
        content: messageContent,
        timestamp: new Date().toISOString()
      });
      setMessageContent('');
      setShowMessageModal(false);
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async (applicationId) => {
    if (!interviewDetails.date || !interviewDetails.time) {
      toast.error('Please specify date and time for the interview');
      return;
    }

    try {
      setLoading(true);
      const interviewData = {
        applicationId,
        jobSeekerId: selectedApplication.jobSeeker._id,
        employerId: user.id,
        date: interviewDetails.date,
        time: interviewDetails.time,
        location: interviewDetails.location,
        type: interviewDetails.type,
        notes: interviewDetails.notes
      };

      await jobsApi.scheduleInterview(interviewData);
      await jobsApi.updateApplicationStatus(applicationId, 'interviewed');
      setApplications(prevApps => prevApps.map(app =>
        app._id === applicationId ? { ...app, status: 'interviewed' } : app
      ));
      setShowScheduleModal(false);
      setInterviewDetails({
        date: '',
        time: '',
        location: '',
        type: 'in-person',
        notes: ''
      });
      toast.success('Interview scheduled successfully');
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast.error('Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (applicationId) => {
    if (!feedbackDetails.comments.trim()) {
      toast.error('Please provide feedback comments');
      return;
    }

    try {
      setLoading(true);
      const feedbackData = {
        applicationId,
        content: feedbackDetails.comments,
        rating: feedbackDetails.rating,
        type: 'general'
      };

      await jobsApi.submitFeedback(feedbackData);
      setShowFeedbackModal(false);
      setFeedbackDetails({ rating: 0, comments: '' });
      toast.success('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
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
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'postJob', label: 'Post Job', icon: Plus },
    { id: 'postedJobs', label: 'Posted Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: Users }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.company ? user.company[0] : 'YC'}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{user?.company || 'Your Company'}</h1>
              <p className="text-gray-600">Employer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-blue-600">{jobs.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-green-600">{applications.length}</p>
            </div>
            {/* Employer Notifications */}
            <div className="ml-4">
              <NotificationCenter userId={user?.id} />
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
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('postJob')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                View Applications
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Job Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Jobs:</span>
                <span className="font-semibold">{jobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Applications:</span>
                <span className="font-semibold">{applications.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              {jobs.slice(0, 3).map(job => (
                <div key={job._id}>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-gray-600">{job.applications.length || 0} applications</p>
                </div>
              ))}
              {jobs.length === 0 && <p className="text-gray-600">No jobs posted yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Post Job Tab */}
      {activeTab === 'postJob' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-6">Post a New Job</h2>
          <form onSubmit={handlePostJob} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  value={newJob.company || user?.company || ''}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., ABC Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary *</label>
                <input
                  type="number"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newJob.category}
                  onChange={(e) => setNewJob({ ...newJob, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
              <textarea
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                required
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requirements & Skills *</label>
              <input
                type="text"
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., React, TypeScript, 3+ years experience (comma-separated)"
              />
              <p className="text-sm text-gray-500 mt-1">Separate multiple requirements with commas</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posted Jobs Tab */}
      {activeTab === 'postedJobs' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Posted Jobs</h2>
            <button
              onClick={() => setActiveTab('postJob')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </button>
          </div>

          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job._id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600">{job.location} • {job.type}</p>
                    <p className="text-sm text-gray-500">Posted on {new Date(job.postedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Applications</p>
                      <p className="font-semibold text-blue-600">{job.applications.length || 0}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                <p className="text-gray-600 mb-4">Start by posting your first job to attract candidates.</p>
                <button
                  onClick={() => setActiveTab('postJob')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Post Your First Job
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <ApplicationsSection
          applications={applications}
          setActiveTab={setActiveTab}
          handleUpdateStatus={handleUpdateStatus}
          setSelectedApplication={setSelectedApplication}
          setShowProfileModal={setShowProfileModal}
          setShowMessageModal={setShowMessageModal}
          setShowScheduleModal={setShowScheduleModal}
          setShowFeedbackModal={setShowFeedbackModal}
          getStatusColor={getStatusColor}
          loading={loading}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Candidate Profile: {selectedApplication.jobSeeker.name}</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Personal Information */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name:</p>
                    <p className="text-gray-600">{selectedApplication.jobSeeker.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email:</p>
                    <p className="text-gray-600">{selectedApplication.jobSeeker.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone:</p>
                    <p className="text-gray-600">{selectedApplication.jobSeeker.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location:</p>
                    <p className="text-gray-600">{selectedApplication.jobSeeker.location || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">LinkedIn:</p>
                    {selectedApplication.jobSeeker.linkedin ? (
                      <a
                        href={selectedApplication.jobSeeker.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View LinkedIn Profile
                      </a>
                    ) : (
                      <p className="text-gray-600">Not provided</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Professional Summary:</p>
                  <p className="text-gray-600">{selectedApplication.jobSeeker.bio || 'Not provided'}</p>
                </div>
              </div>

              {/* Resume */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">Resume</h4>
                {selectedApplication.resume ? (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Resume:</p>
                    <p className="text-sm text-gray-600">{selectedApplication.resume.fileName || 'Resume'}</p>
                    <p className="text-sm text-gray-500">Uploaded on {selectedApplication.resume.uploadedAt || getTimeAgo(selectedApplication.appliedDate)}</p>
                    <a
                      href={selectedApplication.resume.base64 || selectedApplication.resume}
                      download={selectedApplication.resume.fileName || 'resume.pdf'}
                      className="inline-block mt-2 text-blue-600 hover:underline"
                    >
                      Download Resume
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-600">No resume provided</p>
                )}
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">Skills</h4>
                {selectedApplication.jobSeeker.skills && selectedApplication.jobSeeker.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.jobSeeker.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No skills listed</p>
                )}
              </div>

              {/* Work Experience */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">Work Experience</h4>
                {selectedApplication.jobSeeker.experiences && selectedApplication.jobSeeker.experiences.length > 0 ? (
                  selectedApplication.jobSeeker.experiences.map((exp, index) => (
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
              </div>

              {/* Education */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">Education</h4>
                {selectedApplication.jobSeeker.educations && selectedApplication.jobSeeker.educations.length > 0 ? (
                  selectedApplication.jobSeeker.educations.map((edu, index) => (
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
              </div>

              {/* Certifications */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">Certifications</h4>
                {selectedApplication.jobSeeker.certifications && selectedApplication.jobSeeker.certifications.length > 0 ? (
                  selectedApplication.jobSeeker.certifications.map((cert, index) => (
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
              </div>

              {/* Cover Letter */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-4">Cover Letter</h4>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-md">{selectedApplication.coverLetter || 'No cover letter provided'}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleUpdateStatus(selectedApplication._id, 'accepted')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApplication._id, 'rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Message {selectedApplication.jobSeeker.name}</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={6}
              placeholder="Type your message here..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendMessage(selectedApplication._id, selectedApplication.jobSeeker._id)}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Schedule Interview with {selectedApplication.jobSeeker.name}</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Date *</label>
                <input
                  type="date"
                  value={interviewDetails.date}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Time *</label>
                <input
                  type="time"
                  value={interviewDetails.time}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location/Link</label>
                <input
                  type="text"
                  value={interviewDetails.location}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Office address or Zoom link"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                <select
                  value={interviewDetails.type}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="in-person">In-Person</option>
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={interviewDetails.notes}
                  onChange={(e) => setInterviewDetails({ ...interviewDetails, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Any additional information for the candidate..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScheduleInterview(selectedApplication._id)}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Provide Feedback for {selectedApplication.jobSeeker.name}</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackDetails({ ...feedbackDetails, rating: star })}
                      className={`text-2xl ${feedbackDetails.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Comments *</label>
                <textarea
                  value={feedbackDetails.comments}
                  onChange={(e) => setFeedbackDetails({ ...feedbackDetails, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={6}
                  placeholder="Provide detailed feedback about the candidate..."
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitFeedback(selectedApplication._id)}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;