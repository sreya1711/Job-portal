

// services/jobsApi.js - Updated jobs API with new methods
const jobsApi = {
  // Job listings
  getJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await api.get(`/jobs?${queryParams}`);
  },

  getJobById: async (jobId) => {
    return await api.get(`/jobs/${jobId}`);
  },

  // Employer job management
  createJob: async (jobData) => {
    return await api.post('/jobs', jobData);
  },

  updateJob: async (jobId, jobData) => {
    return await api.put(`/jobs/${jobId}`, jobData);
  },

  deleteJob: async (jobId) => {
    return await api.delete(`/jobs/${jobId}`);
  },

  getMyJobs: async () => {
    return await api.get('/jobs/my-jobs');
  },

  // Profile related (now moved to profileApi but kept for backward compatibility)
  updateProfile: profileApi.updateProfile,
  uploadResume: profileApi.uploadResume,
  
  // Application related (now moved to applicationsApi but kept for backward compatibility)
  applyForJob: applicationsApi.applyForJob,
  getMyApplications: applicationsApi.getMyApplications,
};

export default jobsApi;