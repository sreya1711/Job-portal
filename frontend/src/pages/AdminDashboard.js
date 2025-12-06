import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, Users, Building, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, Eye, Edit, Trash2, Search, Filter,
  BarChart3, PieChart, Calendar, Mail, Activity, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-toastify';
import jobsApi from '../services/jobsApi';
import notificationService from '../services/notificationService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    applicationsByStatus: [],
    usersByRole: [],
    jobsByStatus: [],
    recentActivity: []
  });

  const [analyticsData, setAnalyticsData] = useState([
    { name: 'Jan', users: 120, jobs: 45, applications: 234 },
    { name: 'Feb', users: 150, jobs: 52, applications: 289 },
    { name: 'Mar', users: 180, jobs: 48, applications: 312 },
    { name: 'Apr', users: 220, jobs: 61, applications: 387 }
  ]);

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [revenueData, setRevenueData] = useState({
    jobPosts: 45000,
    premiumUsers: 28500,
    monthly: 73500,
    growth: 12.5
  });

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const data = await jobsApi.getAdminStats();
      console.log('Admin stats fetched:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await jobsApi.getAllUsers();
      setUsers(response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await jobsApi.getAllJobs();
      setJobs(response || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await jobsApi.getAnalyticsData();
      setAnalyticsData(response || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await jobsApi.getRevenueData();
      setRevenueData(response || {
        jobPosts: 0,
        premiumUsers: 0,
        monthly: 0,
        growth: 0
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchUsers();
    fetchJobs();
    fetchAnalyticsData();
    fetchRevenueData();

    notificationService.connect(user?.id);

    const handleNewApplication = (data) => {
      console.log('Real-time application update:', data);
      setStats(prev => ({
        ...prev,
        totalApplications: prev.totalApplications + 1,
        recentActivity: [
          {
            timestamp: new Date(),
            userName: data.jobSeekerName || 'Job Seeker',
            action: 'Applied',
            details: `Applied for ${data.jobTitle}`
          },
          ...prev.recentActivity
        ].slice(0, 10)
      }));
    };

    const handleNewMessage = (data) => {
      console.log('Real-time message update:', data);
      setStats(prev => ({
        ...prev,
        recentActivity: [
          {
            timestamp: new Date(),
            userName: data.senderName || 'User',
            action: 'Sent Message',
            details: data.message || 'New message'
          },
          ...prev.recentActivity
        ].slice(0, 10)
      }));
    };

    const handleNewUser = (data) => {
      console.log('Real-time user registration:', data);
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        recentActivity: [
          {
            timestamp: new Date(),
            userName: data.name || 'New User',
            action: 'Registered',
            details: `Joined as ${data.role}`
          },
          ...prev.recentActivity
        ].slice(0, 10)
      }));
    };

    const handleInterviewScheduled = (data) => {
      console.log('Real-time interview scheduled:', data);
      setStats(prev => ({
        ...prev,
        recentActivity: [
          {
            timestamp: new Date(),
            userName: data.employerName || 'Employer',
            action: 'Scheduled Interview',
            details: `Interview with ${data.jobSeekerName}`
          },
          ...prev.recentActivity
        ].slice(0, 10)
      }));
    };

    const handleAnalyticsUpdate = (data) => {
      console.log('Real-time analytics update:', data);
      setAnalyticsData(data || []);
    };

    const handleRevenueUpdate = (data) => {
      console.log('Real-time revenue update:', data);
      setRevenueData(data || {
        jobPosts: 0,
        premiumUsers: 0,
        monthly: 0,
        growth: 0
      });
    };

    notificationService.on('application-updated', handleNewApplication);
    notificationService.on('message-received', handleNewMessage);
    notificationService.on('user-registered', handleNewUser);
    notificationService.on('interview-scheduled', handleInterviewScheduled);
    notificationService.on('analytics-updated', handleAnalyticsUpdate);
    notificationService.on('revenue-updated', handleRevenueUpdate);

    return () => {
      notificationService.off('application-updated', handleNewApplication);
      notificationService.off('message-received', handleNewMessage);
      notificationService.off('user-registered', handleNewUser);
      notificationService.off('interview-scheduled', handleInterviewScheduled);
      notificationService.off('analytics-updated', handleAnalyticsUpdate);
      notificationService.off('revenue-updated', handleRevenueUpdate);
    };
  }, [user?.id]);

  const handleUserAction = (userId, action) => {
    toast.success(`User ${action} successfully!`);
  };

  const handleJobAction = (jobId, action) => {
    toast.success(`Job ${action} successfully!`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Building },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'revenue', label: 'Revenue', icon: DollarSign }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage users, jobs, and platform analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="font-semibold">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
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
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalJobs}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalApplications}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.recentActivity.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Platform Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#3b82f6" />
                  <Bar dataKey="jobs" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
              {stats.usersByRole && stats.usersByRole.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={stats.usersByRole}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.usersByRole.map((entry, index) => {
                          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-4 mt-4 flex-wrap">
                    {stats.usersByRole.map((item, index) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                      return (
                        <div key={index} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: colors[index % colors.length] }}></div>
                          <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500">No user data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
            </div>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => {
                  const getActivityColor = (action) => {
                    switch (action) {
                      case 'Applied': return 'bg-blue-50 text-blue-800';
                      case 'Registered': return 'bg-green-50 text-green-800';
                      case 'Sent Message': return 'bg-purple-50 text-purple-800';
                      case 'Scheduled Interview': return 'bg-yellow-50 text-yellow-800';
                      default: return 'bg-gray-50 text-gray-800';
                    }
                  };

                  const getTimeAgo = (timestamp) => {
                    const now = new Date();
                    const diff = Math.floor((now - new Date(timestamp)) / 1000);
                    if (diff < 60) return `${diff}s ago`;
                    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                    return `${Math.floor(diff / 86400)}d ago`;
                  };

                  return (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${getActivityColor(activity.action)}`}>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{activity.userName}</p>
                        <p className="text-xs">{activity.action}: {activity.details}</p>
                      </div>
                      <span className="text-xs ml-4 whitespace-nowrap">{getTimeAgo(activity.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">User Management</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>

          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUserAction(user.id, 'viewed')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'verified')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'suspended')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">No users to display</p>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Job Management</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
            </div>
          </div>

          {jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-gray-600">{job.company}</p>
                      <p className="text-sm text-gray-500">Posted: {job.postedDate}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {job.premium && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Premium
                        </span>
                      )}
                      {job.flagged && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          Flagged
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleJobAction(job.id, 'viewed')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleJobAction(job.id, 'approved')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleJobAction(job.id, 'rejected')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleJobAction(job.id, 'deleted')}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6">No jobs to display</p>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Platform Growth</h2>
            {analyticsData && analyticsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#3b82f6" name="New Users" />
                  <Bar dataKey="jobs" fill="#10b981" name="New Jobs" />
                  <Bar dataKey="applications" fill="#f59e0b" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">No analytics data available</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600">Total New Users</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {analyticsData?.reduce((sum, item) => sum + (item.users || 0), 0) || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600">Total New Jobs</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {analyticsData?.reduce((sum, item) => sum + (item.jobs || 0), 0) || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600">Total Applications</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {analyticsData?.reduce((sum, item) => sum + (item.applications || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Job Posts Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${revenueData.jobPosts.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Premium Users</p>
                  <p className="text-2xl font-bold text-gray-900">${revenueData.premiumUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className="text-2xl font-bold text-gray-900">+{revenueData.growth}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-md">
                <span className="font-medium text-green-800">Job Posting Fees</span>
                <span className="text-green-900 font-bold">${revenueData.jobPosts.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
                <span className="font-medium text-blue-800">Premium Memberships</span>
                <span className="text-blue-900 font-bold">${revenueData.premiumUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <span className="font-medium text-gray-800">Total Monthly Revenue</span>
                <span className="text-gray-900 font-bold">${revenueData.monthly.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
