import express from 'express';
import { authRequired } from '../../middleware/auth.js';
import User from '../../models/User.js';
import Job from '../../models/Job.js';
import Application from '../../models/Application.js';
import Message from '../../models/Message.js';
import InterviewSchedule from '../../models/InterviewSchedule.js';

const router = express.Router();

// Ensure admin role
const adminRequired = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// All routes require auth and admin role
router.use(authRequired);
router.use(adminRequired);

// GET /api/admin/stats - get dashboard statistics
router.get('/', async (req, res) => {
  try {
    // Get counts
    let totalUsers = 0;
    let totalJobs = 0;
    let totalApplications = 0;
    
    try {
      totalUsers = await User.countDocuments();
    } catch (e) {
      console.warn('Error counting users:', e.message);
      totalUsers = 0;
    }
    
    try {
      totalJobs = await Job.countDocuments({ status: 'active' });
    } catch (e) {
      console.warn('Error counting active jobs:', e.message);
      totalJobs = 0;
    }
    
    try {
      totalApplications = await Application.countDocuments();
    } catch (e) {
      console.warn('Error counting applications:', e.message);
      totalApplications = 0;
    }
    
    // Get applications by status
    let applicationsByStatus = [];
    try {
      const applicationStatusCounts = await Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      applicationsByStatus = applicationStatusCounts.map(item => ({
        name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
        value: item.count
      }));
    } catch (e) {
      console.warn('Error getting application status counts:', e.message);
    }
    
    // Get users by role
    let usersByRole = [];
    try {
      const userRoleCounts = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      usersByRole = userRoleCounts.map(item => ({
        name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
        value: item.count
      }));
    } catch (e) {
      console.warn('Error getting user role counts:', e.message);
    }
    
    // Get jobs by status
    let jobsByStatus = [];
    try {
      const jobStatusCounts = await Job.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      jobsByStatus = jobStatusCounts.map(item => ({
        name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
        value: item.count
      }));
    } catch (e) {
      console.warn('Error getting job status counts:', e.message);
    }
    
    // Get recent activity (simplified)
    let recentActivity = [];
    try {
      const recentApplications = await Application.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('jobSeeker', 'name')
        .populate('job', 'title')
        .lean();
      
      recentActivity = [
        ...recentApplications
          .filter(app => app.jobSeeker && app.job)
          .map(app => ({
            timestamp: app.createdAt,
            userName: app.jobSeeker.name,
            action: 'Applied',
            details: `Applied for ${app.job.title}`
          }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    } catch (e) {
      console.warn('Error getting recent activity:', e.message);
    }
    
    res.json({
      totalUsers,
      totalJobs,
      totalApplications,
      applicationsByStatus,
      usersByRole,
      jobsByStatus,
      recentActivity
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/users - get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('name email role createdAt status')
      .lean();
    
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      joinDate: new Date(user.createdAt).toLocaleDateString()
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/jobs - get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find()
      .select('title company status createdAt')
      .populate('employer', 'name')
      .lean();
    
    const formattedJobs = jobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.company || (job.employer ? job.employer.name : 'N/A'),
      status: job.status || 'active',
      postedDate: new Date(job.createdAt).toLocaleDateString(),
      premium: false,
      flagged: false
    }));
    
    res.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/analytics - get analytics data
router.get('/analytics', async (req, res) => {
  try {
    // Get monthly data for the last 4 months
    const now = new Date();
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: monthNames[date.getMonth()],
        startDate: new Date(date.getFullYear(), date.getMonth(), 1),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
      });
    }
    
    const analyticsData = await Promise.all(months.map(async (month) => {
      const users = await User.countDocuments({
        createdAt: { $gte: month.startDate, $lte: month.endDate }
      });
      
      const jobs = await Job.countDocuments({
        createdAt: { $gte: month.startDate, $lte: month.endDate }
      });
      
      const applications = await Application.countDocuments({
        createdAt: { $gte: month.startDate, $lte: month.endDate }
      });
      
      return {
        name: month.name,
        users: users || 0,
        jobs: jobs || 0,
        applications: applications || 0
      };
    }));
    
    res.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/revenue - get revenue data
router.get('/revenue', async (req, res) => {
  try {
    // Calculate revenue from job postings (assuming fee per job)
    const jobPostingFee = 99; // $99 per job posting
    const totalJobs = await Job.countDocuments();
    const jobPostsRevenue = totalJobs * jobPostingFee;
    
    // Calculate revenue from premium users (assuming monthly subscription)
    const premiumUserFee = 49; // $49 per premium user per month
    const totalUsers = await User.countDocuments();
    // Assume 20% of users are premium
    const premiumUsers = Math.ceil(totalUsers * 0.2);
    const premiumUsersRevenue = premiumUsers * premiumUserFee;
    
    const monthlyRevenue = jobPostsRevenue + premiumUsersRevenue;
    
    // Calculate growth (comparing with previous month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    
    const lastMonthJobs = await Job.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    
    const lastMonthApplications = await Application.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    
    const lastMonthRevenue = (lastMonthJobs * jobPostingFee) + (Math.ceil((totalUsers * 0.2)) * premiumUserFee);
    const growthRate = lastMonthRevenue > 0 
      ? parseFloat(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2))
      : 0;
    
    res.json({
      jobPosts: jobPostsRevenue,
      premiumUsers: premiumUsersRevenue,
      monthly: monthlyRevenue,
      growth: growthRate
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;