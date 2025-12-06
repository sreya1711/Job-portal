import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import jobsApi from '../services/jobsApi';

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await jobsApi.getJobById(id);
        setJob(data);
      } catch (error) {
        console.error("Error fetching job:", error);
      }
    };
    fetchJob();
  }, [id]);

  if (!job) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800">{job.title}</h2>

        {/* Company + Location */}
        <p className="text-gray-600 mb-4">
          {job.company} • {job.location}
        </p>

        {/* Description */}
        <h3 className="text-xl font-semibold mb-2">Job Description</h3>
        <p className="text-gray-700 mb-4">{job.description}</p>

        {/* Salary */}
        {job.salary && (
          <>
            <h3 className="text-xl font-semibold mb-2">Salary</h3>
            <p className="text-gray-700 mb-4">{job.salary}</p>
          </>
        )}

        {/* Requirements */}
        {job.requirements && (
          <>
            <h3 className="text-xl font-semibold mb-2">Requirements</h3>
            <ul className="list-disc ml-6 text-gray-700">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </>
        )}

        {/* Apply Button */}
        <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Apply Now
        </button>

      </div>
    </div>
  );
}

export default JobDetails;
