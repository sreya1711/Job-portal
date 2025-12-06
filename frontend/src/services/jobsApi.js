import api from './api';

const jobsApi = {
  getJobs: async () => {
    try {
      const response = await api.get('/jobs');
      console.log('Raw jobs API response:', response);
      // Return the data as is - the component will handle different response structures
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error?.response?.data || error.message);
      throw error;
    }
  },

  sendMessage: async ({ applicationId, content }) => {
    try {
      const response = await api.post(`/messages`, { applicationId, content });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error?.response?.data || error.message);
      throw error;
    }
  },

  getApplicationMessages: async (applicationId) => {
    try {
      const response = await api.get(`/messages/application/${applicationId}`);
      return response.data.messages || [];
    } catch (error) {
      console.error('Error fetching application messages:', error?.response?.data || error.message);
      throw error;
    }
  },

  // Scheduling and feedback (stubs if backend not present)
  scheduleInterview: async (interviewData) => {
    try {
      const response = await api.post('/applications/schedule', interviewData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling interview:', error?.response?.data || error.message);
      throw error;
    }
  },

  submitFeedback: async (feedbackData) => {
    try {
      const response = await api.post('/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error?.response?.data || error.message);
      throw error;
    }
  },

  getMyFeedback: async () => {
    try {
      const response = await api.get('/feedback/my');
      return response.data.feedback || [];
    } catch (error) {
      console.error('Error fetching feedback:', error?.response?.data || error.message);
      throw error;
    }
  },

  getJobById: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error?.response?.data || error.message);
      throw error;
    }
  },

  getEmployerJobs: async () => {
    try {
      const response = await api.get('/jobs/employer/my-jobs');
      return response.data;
    } catch (error) {
      console.error('Error fetching employer jobs:', error?.response?.data || error.message);
      throw error;
    }
  },

  createJob: async (jobData) => {
    try {
      console.log('Posting job data:', JSON.stringify(jobData, null, 2));
      const response = await api.post('/jobs', jobData, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error?.response?.data || error.message);
      throw error;
    }
  },

  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error?.response?.data || error.message);
      throw error;
    }
  },

  deleteJob: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error?.response?.data || error.message);
      throw error;
    }
  },

  applyForJob: async (applicationData) => {
    try {
      console.log('Submitting application with data:', JSON.stringify({
        ...applicationData,
        resume: applicationData.resume ? 'Resume data present' : 'No resume data'
      }, null, 2));
      
      const response = await api.post('/applications', applicationData);
      console.log('Application submission successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error applying for job:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data ? JSON.parse(error.config.data) : null
        }
      });
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        // Log the full error for debugging
        console.error('Server error details:', {
          status,
          data,
          headers: error.response.headers
        });
        
        if (status === 400) {
          if (data.message === 'You have already applied for this job') {
            throw new Error('You have already applied to this job.');
          }
          
          if (data.message && data.message.includes('resume')) {
            throw new Error('A resume is required to apply. Please upload a resume to your profile first.');
          }
          
          // For other 400 errors, use the server's error message
          throw new Error(data.message || 'Invalid application data. Please check your information and try again.');
        }
        
        if (status === 404) {
          throw new Error('Job not found or no longer available.');
        }
        
        if (status === 500) {
          throw new Error('Server error while processing your application. Please try again later.');
        }
      }
      
      // For network errors or other issues
      throw new Error('Failed to submit application. Please check your connection and try again.');
    }
  },

  getApplicationsForJob: async (jobId) => {
    try {
      const response = await api.get(`/applications/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching applications for job ${jobId}:`, error?.response?.data || error.message);
      throw error;
    }
  },

  getMyApplications: async () => {
    try {
      const response = await api.get('/applications/jobseeker/my-applications');
      // Normalize to always return an array of applications
      const payload = response.data;
      let applications = [];
      if (Array.isArray(payload)) {
        applications = payload;
      } else if (Array.isArray(payload?.data)) {
        applications = payload.data;
      } else if (Array.isArray(payload?.applications)) {
        applications = payload.applications;
      } else if (Array.isArray(payload?.data?.applications)) {
        applications = payload.data.applications;
      } else {
        console.warn('[jobsApi.getMyApplications] Unexpected response shape', payload);
        applications = [];
      }
      return applications;
    } catch (error) {
      console.error('Error fetching my applications:', error?.response?.data || error.message);
      throw error;
    }
  },

  updateApplicationStatus: async (id, status) => {
    try {
      const response = await api.put(`/applications/status/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating application status for ${id}:`, error?.response?.data || error.message);
      throw error;
    }
  },

  // Profile functions
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      // Backend returns { profile: {...} }, so extract the profile object
      const profileData = response.data.profile || response.data;
      console.log('Fetched profile from API:', profileData);
      return profileData;
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          console.warn('[jobsApi.getProfile] 404 on /profile - retrying /jobseeker/profile');
          const response = await api.get('/jobseeker/profile');
          const profileData = response.data.profile || response.data;
          return profileData;
        } catch (retryError) {
          console.error('Retry failed for /jobseeker/profile:', retryError?.response?.data || retryError.message);
        }
      }
      console.error('Error fetching profile:', error?.response?.data || error.message);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error?.response?.data || error.message);
      throw error;
    }
  },

  uploadResume: async (resumeData) => {
    try {
      const response = await api.post('/profile/resume', resumeData);
      return response.data;
    } catch (error) {
      console.error('Error uploading resume:', error?.response?.data || error.message);
      throw error;
    }
  },

  getMyInterviews: async () => {
    try {
      const response = await api.get('/interviews/my');
      return response.data.interviews || [];
    } catch (error) {
      console.error('Error fetching interviews:', error?.response?.data || error.message);
      throw error;
    }
  },

  markFeedbackAsRead: async (feedbackId) => {
    try {
      const response = await api.put(`/feedback/${feedbackId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking feedback as read:', error?.response?.data || error.message);
      throw error;
    }
  },

  getMyMessages: async () => {
    try {
      const response = await api.get('/messages/my');
      return response.data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error?.response?.data || error.message);
      throw error;
    }
  },

  // Video Resume functions
  updateVideoResume: async (videoData) => {
    try {
      const response = await api.post('/profile/video-resume', videoData);
      return response.data;
    } catch (error) {
      console.error('Error updating video resume:', error?.response?.data || error.message);
      throw error;
    }
  },

  deleteVideoResume: async () => {
    try {
      const response = await api.delete('/profile/video-resume');
      return response.data;
    } catch (error) {
      console.error('Error deleting video resume:', error?.response?.data || error.message);
      throw error;
    }
  },

  // Portfolio functions
  updatePortfolio: async (portfolioData) => {
    try {
      const response = await api.put('/profile/portfolio', portfolioData);
      return response.data;
    } catch (error) {
      console.error('Error updating portfolio:', error?.response?.data || error.message);
      throw error;
    }
  },

  // Skills functions
  updateSkills: async (skills) => {
    try {
      const response = await api.put('/profile/skills', { skills });
      return response.data;
    } catch (error) {
      console.error('Error updating skills:', error?.response?.data || error.message);
      throw error;
    }
  },

  endorseSkill: async (skillName) => {
    try {
      const response = await api.post(`/profile/skills/${skillName}/endorse`);
      return response.data;
    } catch (error) {
      console.error('Error endorsing skill:', error?.response?.data || error.message);
      throw error;
    }
  },

  verifySkill: async (skillName) => {
    try {
      const response = await api.post(`/profile/skills/${skillName}/verify`);
      return response.data;
    } catch (error) {
      console.error('Error verifying skill:', error?.response?.data || error.message);
      throw error;
    }
  },

  getAdminStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error?.response?.data || error.message);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/stats/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error?.response?.data || error.message);
      throw error;
    }
  },

  getAllJobs: async () => {
    try {
      const response = await api.get('/admin/stats/jobs');
      return response.data;
    } catch (error) {
      console.error('Error fetching all jobs:', error?.response?.data || error.message);
      throw error;
    }
  },

  getAnalyticsData: async () => {
    try {
      const response = await api.get('/admin/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics data:', error?.response?.data || error.message);
      throw error;
    }
  },

  getRevenueData: async () => {
    try {
      const response = await api.get('/admin/revenue');
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue data:', error?.response?.data || error.message);
      throw error;
    }
  },
};

export default jobsApi;