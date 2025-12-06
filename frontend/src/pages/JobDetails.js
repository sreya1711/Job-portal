import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import jobsApi from '../services/jobsApi';

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      const data = await jobsApi.getJobById(id);
      setJob(data);
    };
    fetchJob();
  }, [id]);

  if (!job) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800">{job.title}</h2>
        <p className="text-gray-600 mb-4">{job.company} • {job.location} • {job.type}</p>
        <p className="text-gray-700 mb-4">{job.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Posted {job.posted}</span>
          <ApplyButton jobId={job.id} />
        </div>
      </div>
    </div>
  );
}

export default JobDetails;