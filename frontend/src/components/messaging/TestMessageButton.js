import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquarePlus } from 'lucide-react';

const TestMessageButton = ({ applicationId }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const createTestMessage = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await axios.post(`/api/applications/test-message/${applicationId}`, {
        content: `Test message created at ${new Date().toLocaleTimeString()}`
      });
      
      console.log('Test message created:', response.data);
      setSuccess(true);
      
      // Reload the page after 1 second to show the new message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error creating test message:', err);
      setError('Failed to create test message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={createTestMessage}
        disabled={loading || !applicationId}
        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        <MessageSquarePlus className="h-5 w-5 mr-2" />
        {loading ? 'Creating...' : 'Create Test Message'}
      </button>
      
      {success && (
        <p className="mt-2 text-sm text-green-600">Test message created successfully!</p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TestMessageButton;