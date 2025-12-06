import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

export function pick(obj, keys) {
  return keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});
}

export async function getAnalyticsData() {
  try {
    const now = new Date();
    const months = [];
    
    for (let i = 3; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = startDate.toLocaleDateString('en-US', { month: 'short' });
      
      try {
        const newUsers = await User.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate }
        });
        
        const newJobs = await Job.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate }
        });
        
        const newApplications = await Application.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate }
        });
        
        months.push({
          name: monthName,
          users: newUsers,
          jobs: newJobs,
          applications: newApplications
        });
      } catch (e) {
        console.warn(`Error fetching analytics for ${monthName}:`, e.message);
        months.push({
          name: monthName,
          users: 0,
          jobs: 0,
          applications: 0
        });
      }
    }
    
    return months;
  } catch (error) {
    console.error('Error calculating analytics data:', error);
    return [];
  }
}

export async function getRevenueData() {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const currentMonthJobs = await Job.countDocuments({
      createdAt: { $gte: currentMonthStart }
    });
    
    const lastMonthJobs = await Job.countDocuments({
      createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
    });
    
    const totalUsers = await User.countDocuments();
    const premiumUserCount = Math.ceil(totalUsers * 0.2);
    
    const jobPostsRevenue = currentMonthJobs * 99;
    const premiumUsersRevenue = premiumUserCount * 49;
    const monthlyTotal = jobPostsRevenue + premiumUsersRevenue;
    
    const lastMonthJobsRevenue = lastMonthJobs * 99;
    const lastMonthPremiumRevenue = premiumUserCount * 49;
    const lastMonthTotal = lastMonthJobsRevenue + lastMonthPremiumRevenue;
    
    const growth = lastMonthTotal > 0 ? ((monthlyTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(2) : 0;
    
    return {
      jobPosts: jobPostsRevenue,
      premiumUsers: premiumUsersRevenue,
      monthly: monthlyTotal,
      growth: parseFloat(growth)
    };
  } catch (error) {
    console.error('Error calculating revenue data:', error);
    return {
      jobPosts: 0,
      premiumUsers: 0,
      monthly: 0,
      growth: 0
    };
  }
}

export async function emitAnalyticsUpdate(io) {
  try {
    const analyticsData = await getAnalyticsData();
    const revenueData = await getRevenueData();
    
    if (io) {
      io.to('role:admin').emit('analytics-updated', analyticsData);
      io.to('role:admin').emit('revenue-updated', revenueData);
    }
  } catch (error) {
    console.error('Error emitting analytics update:', error);
  }
}
