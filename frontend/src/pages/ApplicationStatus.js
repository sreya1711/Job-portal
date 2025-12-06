import React from 'react';
import ApplicationTracker from '../components/ApplicationTracker';

function ApplicationStatus() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Application Status</h2>
      <ApplicationTracker />
    </div>
  );
}

export default ApplicationStatus;