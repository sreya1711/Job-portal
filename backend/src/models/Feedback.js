import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    application: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Application', 
      required: true 
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    job: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Job', 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    rating: { 
      type: Number, 
      min: 1, 
      max: 5,
      required: false
    },
    type: { 
      type: String, 
      enum: ['interview', 'application', 'general'], 
      default: 'general' 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);