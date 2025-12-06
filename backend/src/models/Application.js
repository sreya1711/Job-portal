import mongoose from 'mongoose';

const statusUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['job_seeker', 'employer', 'system'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { _id: true, timestamps: true });

const interviewSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['in-person', 'phone', 'video'],
    default: 'in-person',
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled',
  },
}, { _id: false, timestamps: true });

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  jobSeeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'interviewed', 'accepted', 'rejected'],
    default: 'pending',
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  resume: {
    type: String, // URL to the resume file
  },
  coverLetter: {
    type: String,
  },
  interview: {
    type: interviewSchema,
  },
  statusHistory: [statusUpdateSchema],
  messages: [messageSchema],
}, { timestamps: true });

export default mongoose.model('Application', applicationSchema);