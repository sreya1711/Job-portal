import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  LayoutDashboard, Users, Briefcase, FileText, 
  Settings, Bell, LogOut, ChevronRight
} from 'lucide-react';
import AdminDashboardStats from '../../components/admin/AdminDashboardStats';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { notifications } = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'notifications') {
      setUnreadCount(0);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{user?.name || 'Admin'}</h3>
                <p className="text-sm text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'dashboard' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('users')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'users' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-3" />
                    <span>Users</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('jobs')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'jobs' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-3" />
                    <span>Jobs</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('applications')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'applications' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-3" />
                    <span>Applications</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleTabChange('notifications')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'notifications' 
                      ? 'bg-purple-50 text-purple-700' 
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
                  onClick={() => handleTabChange('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                    activeTab === 'settings' 
                      ? 'bg-purple-50 text-purple-700' 
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
              <li className="pt-4 mt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Admin Dashboard</h2>
                <AdminDashboardStats />
              </div>
            )}
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">User Management</h2>
                <p className="text-gray-500">User management functionality would go here.</p>
              </div>
            )}
            
            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Job Management</h2>
                <p className="text-gray-500">Job management functionality would go here.</p>
              </div>
            )}
            
            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Management</h2>
                <p className="text-gray-500">Application management functionality would go here.</p>
              </div>
            )}
            
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Notifications</h2>
                <p className="text-gray-500">Notifications functionality would go here.</p>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">System Settings</h2>
                <p className="text-gray-500">Settings functionality would go here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;