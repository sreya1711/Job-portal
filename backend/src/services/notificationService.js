export function emitJobNew(io, job) {
  io.emit('job:new', { id: job._id, title: job.title, company: job.company, location: job.location });
}

export function emitApplicationEvent(io, event, payload) {
  try {
    if (!io) return;
    // Prefer targeted rooms to prevent leaking events to all users
    if (payload?.jobSeekerId) {
      io.to(payload.jobSeekerId.toString()).emit(`application:${event}`, payload);
      return;
    }
    if (payload?.employerId) {
      io.to(payload.employerId.toString()).emit(`application:${event}`, payload);
      return;
    }
    // Fallback: do not broadcast sensitive application events globally
    // If absolutely needed for legacy, uncomment the next line.
    // io.emit(`application:${event}`, payload);
  } catch (e) {
    console.warn('emitApplicationEvent error:', e?.message || e);
  }
}
