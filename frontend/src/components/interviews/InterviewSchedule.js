import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Calendar, Clock, MapPin, Video, Phone, Users, Check, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const InterviewSchedule = () => {
  const { socket } = useSocket();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch interviews
  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/interviews/my');
      
      // Sort by date (upcoming first)
      const sortedInterviews = response.data.interviews.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      
      setInterviews(sortedInterviews);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Failed to load interviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInterviews();
  }, []);

  // Listen for new interviews
  useEffect(() => {
    if (socket) {
      socket.on('interview:scheduled', (interview) => {
        setInterviews(prev => {
          // Check if this interview is already in the list
          const exists = prev.some(i => i._id === interview.id);
          if (exists) return prev;
          
          // Add new interview and sort
          return [...prev, interview].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
        });
        
        toast.success('New interview scheduled!');
      });
      
      socket.on('interview:updated', (updatedInterview) => {
        setInterviews(prev => 
          prev.map(interview => 
            interview._id === updatedInterview.id 
              ? { ...interview, ...updatedInterview } 
              : interview
          )
        );
      });
      
      return () => {
        socket.off('interview:scheduled');
        socket.off('interview:updated');
      };
    }
  }, [socket]);

  const handleConfirmInterview = async (interviewId, confirm) => {
    try {
      await axios.put(`/api/interviews/${interviewId}`, {
        jobSeekerConfirmed: confirm
      });
      
      // Update local state
      setInterviews(prev => 
        prev.map(interview => 
          interview._id === interviewId 
            ? { ...interview, jobSeekerConfirmed: confirm } 
            : interview
        )
      );
      
      toast.success(confirm ? 'Interview confirmed!' : 'Interview response updated');
    } catch (err) {
      console.error('Error updating interview:', err);
      toast.error('Failed to update interview status');
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'phone':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'in-person':
        return <Users className="h-5 w-5 text-purple-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700">Upcoming Interviews</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        ) : interviews.length > 0 ? (
          interviews.filter(interview => isUpcoming(interview.date)).map((interview) => (
            <div key={interview._id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{interview.job.title}</h4>
                  <p className="text-sm text-gray-600">{interview.job.company}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getInterviewTypeIcon(interview.type)}
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {interview.type} Interview
                  </span>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(interview.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{interview.time} ({interview.duration || 60} mins)</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 md:col-span-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{interview.location}</span>
                </div>
              </div>
              
              {interview.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                  <p className="font-medium">Notes:</p>
                  <p>{interview.notes}</p>
                </div>
              )}
              
              <div className="mt-4 flex justify-end space-x-2">
                {interview.jobSeekerConfirmed === true ? (
                  <div className="flex items-center text-sm text-green-600">
                    <Check className="h-4 w-4 mr-1" />
                    <span>Confirmed</span>
                  </div>
                ) : interview.jobSeekerConfirmed === false ? (
                  <div className="flex items-center text-sm text-red-600">
                    <X className="h-4 w-4 mr-1" />
                    <span>Declined</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleConfirmInterview(interview._id, false)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleConfirmInterview(interview._id, true)}
                      className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                    >
                      Confirm
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p>No upcoming interviews</p>
          </div>
        )}
        
        {interviews.length > 0 && !interviews.some(interview => isUpcoming(interview.date)) && (
          <div className="py-8 text-center text-gray-500">
            <p>No upcoming interviews</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSchedule;