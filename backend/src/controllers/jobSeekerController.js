import Job from '../models/Job.js';

export async function search(req, res) {
  // Delegate to jobsController style filter
  const { keyword, location, type, experience, featured } = req.query;
  const filter = {};
  if (keyword) {
    filter.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { company: { $regex: keyword, $options: 'i' } },
      { skills: { $elemMatch: { $regex: keyword, $options: 'i' } } },
    ];
  }
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (type) filter.type = type;
  if (experience) filter.experience = experience;
  if (featured) filter.featured = featured === 'true';
  const jobs = await Job.find(filter).sort({ featured: -1, createdAt: -1 }).limit(100);
  res.json(jobs);
}
