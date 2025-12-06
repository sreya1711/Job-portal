import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  Briefcase, MessageSquare, Bell, Calendar, User, 
  FileText, Settings, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Import components
import NotificationCenter from '../../components/notifications/NotificationCenter';
import MessageCenter from '../../components/messaging/MessageCenter';
import InterviewSchedule from '../../components/interviews/InterviewSchedule';
import FeedbackList from '../../components/feedback/FeedbackList';
import TestMessageButton from '../../components/messaging/TestMessageButton';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/api/applications/my');
        setApplications(response.data.applications || []);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications');
        toast.error('Failed to load your applications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, []);

  // Update unread count when new notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      setUnreadCount(prev => prev + notifications.length);
    }
  }, [notifications]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'notifications') {
      setUnreadCount(0);
    }
  };

  // Select an application for messaging
  const handleSelectApplication = (application) => {
    console.log("Selected application for messaging:", application);
    setSelectedApplication(application);
    if (activeTab !== 'messages') {
      setActiveTab('messages');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{user?.name || 'User'}</h3>
                <p className="text-sm text-gray-500">Job Seeker</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleTabChange('applications')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'applications' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-3" />
                    <span>Applications</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('messages')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'messages' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-3" />
                    <span>Messages</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('notifications')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'notifications' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 mr-3" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('interviews')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'interviews' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3" />
                    <span>Interviews</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('feedback')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'feedback' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-3" />
                    <span>Feedback</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'profile' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3" />
                    <span>Profile</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'settings' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-3" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">My Applications</h2>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                ) : applications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((application) => (
                          <tr key={application._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{application.job?.title || 'Unknown Job'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{application.job?.company || 'Unknown Company'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                application.status === 'interviewed' ? 'bg-purple-100 text-purple-800' :
                                application.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(application.appliedDate || application.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleSelectApplication(application)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Message
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-500">Start applying for jobs to see your applications here.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Messages</h2>
                {selectedApplication ? (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Selected Application:</strong> {selectedApplication.job?.title || 'Unknown Job'} at {selectedApplication.job?.company || 'Unknown Company'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Application ID: {selectedApplication._id}
                      </p>
                    </div>
                    
                    {/* For debugging only - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <TestMessageButton applicationId={selectedApplication._id} />
                    )}
                    
                    <MessageCenter applicationId={selectedApplication._id} />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No application selected</h3>
                    <p className="text-gray-500">Select an application from the Applications tab to view messages.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Notifications</h2>
                <div className="h-96">
                  <NotificationCenter />
                </div>
              </div>
            )}
            
            {/* Interviews Tab */}
            {activeTab === 'interviews' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Interviews</h2>
                <InterviewSchedule />
              </div>
            )}
            
            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Employer Feedback</h2>
                <FeedbackList />
              </div>
            )}
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">My Profile</h2>
                {/* Profile content would go here */}
                <p className="text-gray-500">Profile management functionality</p>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
                {/* Settings content would go here */}
                <p className="text-gray-500">Settings functionality</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;