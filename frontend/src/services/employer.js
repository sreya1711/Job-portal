import { http } from './http';

// Get employer's posted jobs
export async function getEmployerJobs() {
  const res = await http.get('/api/employer/jobs');
  return res;
}

// Create a new job
export async function createJob(jobData) {
  const res = await http.post('/api/employer/jobs', jobData);
  return res;
}

// Delete a job
export async function deleteJob(jobId) {
  const res = await http.del(`/api/employer/jobs/${jobId}`);
  return res;
}

// Get applications for employer's jobs
export async function getEmployerApplications() {
  const res = await http.get('/api/employer/applications');
  return res;
}

// Update application status
export async function updateApplicationStatus(applicationId, status) {
  const res = await http.put(`/api/employer/applications/${applicationId}/status`, { status });
  return res;
}

// Get employer profile
export async function getEmployerProfile() {
  const res = await http.get('/api/employer/profile');
  return res;
}

// Update employer profile
export async function updateEmployerProfile(profileData) {
  const res = await http.put('/api/employer/profile', profileData);
  return res;
}