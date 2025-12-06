import { Users, Eye, MessageSquare, Calendar, FileText } from 'lucide-react';

const ApplicationsSection = ({ applications, setActiveTab, handleUpdateStatus, setSelectedApplication, setShowProfileModal, setShowMessageModal, setShowScheduleModal, setShowFeedbackModal, getStatusColor, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-6">Job Applications</h2>
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600">Applications will appear here when candidates apply to your jobs.</p>
          </div>
        ) : (
          applications.map(app => (
            <div key={app._id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{app.jobSeeker?.name || 'Unknown Candidate'}</h3>
                  <p className="text-gray-600">Applied for: {app.job?.title || 'Unknown Job'}</p>
                  <p className="text-sm text-gray-500">Applied on: {new Date(app.appliedDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Location: {app.jobSeeker?.location || 'Not specified'}</p>
                  <span className={`px-3 py-1 mt-2 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setSelectedApplication(app); setShowProfileModal(true); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Application
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowMessageModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowScheduleModal(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowFeedbackModal(true);
                    }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Feedback
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app._id, 'accepted')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app._id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Cover Letter:</p>
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{app.coverLetter}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ApplicationsSection;