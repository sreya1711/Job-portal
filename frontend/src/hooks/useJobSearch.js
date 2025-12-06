import { useState, useEffect } from 'react';
import { searchJobs } from '../services/api';
import { getSocket } from '../services/socket';

export function useJobSearch(initialParams = {}) {
  const [jobs, setJobs] = useState([]);
  const [params, setParams] = useState(initialParams);

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await searchJobs(params);
      setJobs(data);
    };
    fetchJobs();

    const socket = getSocket();
    const onNewJob = (job) => {
      setJobs((prev) => [job, ...prev]);
    };
    socket.on('job:new', onNewJob);
    return () => {
      socket.off('job:new', onNewJob);
    };
  }, [params]);

  return { jobs, setParams };
}