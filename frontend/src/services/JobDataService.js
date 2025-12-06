class JobDataService {
  constructor() {
    this.jobs = [
      {
        id: 1,
        title: 'Senior Frontend Developer',
        company: 'Tech Solutions Inc',
        companyLogo: 'https://ui-avatars.com/api/?name=Tech+Solutions&background=3b82f6&color=fff',
        location: 'San Francisco, CA',
        type: 'Full-time',
        salary: '$120,000 - $150,000',
        salaryMin: 120000,
        salaryMax: 150000,
        experience: 'Senior',
        description: 'We are looking for an experienced frontend developer to join our dynamic team. You will work on cutting-edge projects using React, TypeScript, and modern web technologies.',
        requirements: 'React, TypeScript, Node.js, 5+ years experience',
        skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Node.js'],
        postedDate: '2024-01-20',
        applicants: 24,
        views: 156,
        isBookmarked: false,
        isRemote: false,
        category: 'Technology',
        companySize: '51-200',
        rating: 4.5,
        employerId: 'emp1'
      }
    ];

    this.applications = [];
    this.subscribers = [];
    this.userProfiles = {
      'user123': {
        id: 'user123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        resume: null // { fileName: string, base64: string, uploadedAt: string }
      }
    };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.jobs, this.applications, this.userProfiles);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.jobs, this.applications, this.userProfiles));
  }

  addJob(jobData) {
    const newJob = {
      id: Date.now(),
      ...jobData,
      postedDate: new Date().toISOString().split('T')[0],
      applicants: 0,
      views: 0,
      isBookmarked: false,
      skills: jobData.requirements ? jobData.requirements.split(',').map(s => s.trim()).filter(s => s) : [],
      salaryMin: this.extractSalaryMin(jobData.salary),
      salaryMax: this.extractSalaryMax(jobData.salary),
      rating: 4.0 + Math.random() * 1,
      companySize: '11-50'
    };

    this.jobs.unshift(newJob);
    this.notify();
    return newJob;
  }

  extractSalaryMin(salary) {
    const match = salary.match(/(\d{1,3}(?:,\d{3})*)/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  }

  extractSalaryMax(salary) {
    const matches = salary.match(/(\d{1,3}(?:,\d{3})*)/g);
    return matches && matches.length > 1 ? parseInt(matches[1].replace(/,/g, '')) : this.extractSalaryMin(salary);
  }

  deleteJob(jobId, employerId) {
    this.jobs = this.jobs.filter(job => !(job.id === jobId && job.employerId === employerId));
    this.notify();
  }

  toggleBookmark(jobId) {
    this.jobs = this.jobs.map(job =>
      job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
    );
    this.notify();
  }

  addApplication(application) {
    this.applications.push(application);
    this.jobs = this.jobs.map(job =>
      job.id === application.jobId
        ? { ...job, applicants: (job.applicants || 0) + 1 }
        : job
    );
    this.notify();
  }

  updateApplicationStatus(appId, status) {
    this.applications = this.applications.map(app =>
      app.id === appId ? { ...app, status } : app
    );
    this.notify();
  }

  updateUserProfile(userId, profileData) {
    this.userProfiles[userId] = {
      ...this.userProfiles[userId],
      ...profileData
    };
    this.notify();
  }

  uploadResume(userId, file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        this.userProfiles[userId] = {
          ...this.userProfiles[userId],
          resume: {
            fileName: file.name,
            base64: reader.result,
            uploadedAt: new Date().toISOString().split('T')[0]
          }
        };
        this.notify();
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getUserProfile(userId) {
    return this.userProfiles[userId] || null;
  }
}

export const jobDataService = new JobDataService();