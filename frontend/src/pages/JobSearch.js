import React, { useState, useEffect } from 'react';
import {
  Search, Filter, MapPin, Building, Clock, DollarSign,
  Users, Calendar, ArrowRight, Briefcase, Heart, Eye,
  ChevronDown, X, Bookmark, Star, TrendingUp, Grid,
  List, SortAsc, SortDesc
} from 'lucide-react';
import jobsApi from '../services/jobsApi';
import { useAuth } from '../hooks/useAuth';

// Mock toast functionality
const toast = {
  success: (message) => console.log('Success:', message),
  error: (message) => console.log('Error:', message)
};

const JobSearch = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState(false);
  
  // UI states
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const jobsPerPage = 12;

  // Filter options
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const experienceLevels = ['Entry', 'Mid', 'Senior', 'Executive'];
  const categories = ['Technology', 'Design', 'Marketing', 'Sales', 'Product', 'Operations'];
  const salaryRanges = ['0-50000', '50000-75000', '75000-100000', '100000-150000', '150000+'];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await jobsApi.getJobs();
        // Ensure we always set an array, even if the response is not as expected
        if (Array.isArray(response)) {
          setJobs(response);
        } else if (response && Array.isArray(response.jobs)) {
          // Handle case where jobs are nested in a jobs property
          setJobs(response.jobs);
        } else if (response && response.data && Array.isArray(response.data)) {
          // Handle case where jobs are in response.data
          setJobs(response.data);
        } else {
          console.error('Unexpected API response format:', response);
          setJobs([]); // Set to empty array as fallback
          toast.error('Unexpected data format received from server');
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs([]); // Ensure jobs is always an array
        toast.error('Failed to fetch jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter and sort jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.requirements.some(req => req.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation = !locationFilter || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesType = !jobTypeFilter || job.type === jobTypeFilter;
    
    const matchesExperience = !experienceFilter || job.experience === experienceFilter;
    
    const matchesCategory = !categoryFilter || job.category === categoryFilter;
    
    const matchesRemote = !remoteFilter || job.location.toLowerCase() === 'remote';

    const matchesSalary = !salaryFilter || (() => {
      // Simple check for salary string for now, could parse range later if needed
      return job.salary.toLowerCase().includes(salaryFilter.toLowerCase());
    })();

    return matchesSearch && matchesLocation && matchesType && 
           matchesExperience && matchesCategory && matchesRemote && matchesSalary;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.postedDate) - new Date(a.postedDate);
      case 'oldest':
        return new Date(a.postedDate) - new Date(b.postedDate);
      case 'salary-high':
        // Assuming salary is a string like "$X - $Y". Need to parse.
        const aSalary = parseInt(a.salary.replace(/[^\d]/g, ''));
        const bSalary = parseInt(b.salary.replace(/[^\d]/g, ''));
        return bSalary - aSalary;
      case 'salary-low':
        const aSalaryLow = parseInt(a.salary.replace(/[^\d]/g, ''));
        const bSalaryLow = parseInt(b.salary.replace(/[^\d]/g, ''));
        return aSalaryLow - bSalaryLow;
      case 'relevance':
        // No direct relevance field in the new schema, default to newest
        return new Date(b.postedDate) - new Date(a.postedDate);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = sortedJobs.slice(startIndex, startIndex + jobsPerPage);

  const handleBookmark = (jobId) => {
    if (!isAuthenticated) {
      toast.error('Please login to save jobs');
      return;
    }

    // Implement bookmarking logic using API call if needed
    toast.success('Job bookmarking not yet implemented');
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleApplyNow = async (jobId) => {
    if (!isAuthenticated || user.role !== 'jobseeker') {
      toast.error('Please login as a job seeker to apply');
      return;
    }

    // In a real app, this would open an application form
    // For now, let's mock an application submission.
    try {
      const applicationData = {
        jobId: jobId,
        // Send a URL/base64 string, not the whole resume object
        resume: user.profile?.resume?.url || user.profile?.resume?.base64 || 'mock_resume_url',
        coverLetter: 'This is a mock cover letter.'
      };
      await jobsApi.applyForJob(applicationData);
      toast.success('Application submitted successfully!');
      setShowJobModal(false);
    } catch (error) {
      toast.error('Failed to submit application.');
      console.error('Error submitting application:', error);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setJobTypeFilter('');
    setExperienceFilter('');
    setSalaryFilter('');
    setCategoryFilter('');
    setRemoteFilter(false);
    setCurrentPage(1);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Find Your Dream Job</h1>
            <p className="text-xl opacity-90">Discover opportunities that match your skills and aspirations</p>
          </div>
          
          {/* Main Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City, state, or remote"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Search Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Job Type Filter */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Job Type</h3>
                  <div className="space-y-2">
                    {jobTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="jobType"
                          value={type}
                          checked={jobTypeFilter === type}
                          onChange={(e) => setJobTypeFilter(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Experience Level</h3>
                  <select
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Experience</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level} Level</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Category</h3>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Salary Range */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Salary Range</h3>
                  <select
                    value={salaryFilter}
                    onChange={(e) => setSalaryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Salary</option>
                    <option value="0-50000">$0 - $50,000</option>
                    <option value="50000-75000">$50,000 - $75,000</option>
                    <option value="75000-100000">$75,000 - $100,000</option>
                    <option value="100000-150000">$100,000 - $150,000</option>
                    <option value="150000+">$150,000+</option>
                  </select>
                </div>

                {/* Remote Work */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={remoteFilter}
                      onChange={(e) => setRemoteFilter(e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote Work Only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {sortedJobs.length} Jobs Found
                  </h2>
                  {searchQuery && (
                    <p className="text-gray-600">Results for "{searchQuery}"</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  {/* View Mode Toggle */}
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="salary-high">Salary: High to Low</option>
                    <option value="salary-low">Salary: Low to High</option>
                    <option value="relevance">Most Relevant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Listings */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : paginatedJobs.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
                {paginatedJobs.map((job) => (
                  <div key={job._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=3b82f6&color=fff`}
                          alt={job.company}
                          className="w-12 h-12 rounded-lg mr-4"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                              onClick={() => handleJobClick(job)}>
                            {job.title}
                          </h3>
                          <p className="text-gray-600 font-medium">{job.company}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBookmark(job._id)}
                        className={`p-2 rounded-full transition-colors ${
                          job.isBookmarked 
                            ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${job.isBookmarked ? 'fill-current' : ''}`} />
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
                      {job.requirements?.slice(0, 4).map((req, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                          {req}
                        </span>
                      ))}
                      {job.requirements?.length > 4 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          +{job.requirements.length - 4} more
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
                      
                      <button
                        onClick={() => handleJobClick(job)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.company)}&background=3b82f6&color=fff`}
                    alt={selectedJob.company}
                    className="w-16 h-16 rounded-lg mr-4"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                    <p className="text-lg text-gray-600">{selectedJob.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                      <ul className="list-disc list-inside space-y-2">
                        {selectedJob.requirements?.map((req, index) => (
                          <li key={index} className="text-gray-700">{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.requirements?.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Job Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{selectedJob.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{selectedJob.type}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>{selectedJob.salary}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="h-4 w-4 mr-2" />
                          <span>{selectedJob.category}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Briefcase className="h-4 w-4 mr-2" />
                          <span>{selectedJob.experience} Level</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{selectedJob.companySize} employees</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Posted {getTimeAgo(selectedJob.postedDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {selectedJob.applications?.length || 0} applicants
                        </span>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => handleBookmark(selectedJob._id)}
                          className={`w-full flex items-center justify-center px-4 py-2 border rounded-md transition-colors ${
                            selectedJob.isBookmarked
                              ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Heart className={`h-4 w-4 mr-2 ${selectedJob.isBookmarked ? 'fill-current' : ''}`} />
                          {selectedJob.isBookmarked ? 'Saved' : 'Save Job'}
                        </button>
                        
                        <button 
                          onClick={() => handleApplyNow(selectedJob._id)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold mb-4">About {selectedJob.company}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1 fill-current" />
                    <span>{selectedJob.rating || 'N/A'}/5.0</span>
                  </div>
                  <span>•</span>
                  <span>{selectedJob.companySize || 'N/A'} employees</span>
                  <span>•</span>
                  <span>{selectedJob.category || 'N/A'} Industry</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSearch;