import mongoose from 'mongoose';

const interviewScheduleSchema = new mongoose.Schema(
  {
    application: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Application', 
      required: true 
    },
    jobSeeker: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    employer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    job: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    time: { 
      type: String, 
      required: true 
    },
    duration: { 
      type: Number, 
      default: 60 // in minutes
    },
    location: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      enum: ['in-person', 'phone', 'video'], 
      default: 'video' 
    },
    notes: { 
      type: String 
    },
    status: { 
      type: String, 
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], 
      default: 'scheduled' 
    },
    jobSeekerConfirmed: { 
      type: Boolean, 
      default: false 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

export default mongoose.model('InterviewSchedule', interviewScheduleSchema);