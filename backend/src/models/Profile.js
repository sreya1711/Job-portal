import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    location: { type: String },
    linkedin: { type: String },
    bio: { type: String },
    experiences: { type: String }, // Stored as text (comma or newline separated)
    educations: [
      {
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String },
      },
    ],
    certifications: { type: String }, // Stored as text (comma or newline separated)
    resume: {
      fileName: { type: String },
      base64: { type: String },
      uploadedAt: { type: Date },
    },
    videoResume: {
      fileName: { type: String },
      base64: { type: String },
      url: { type: String },
      title: { type: String },
      duration: { type: Number }, // in seconds
      description: { type: String },
      uploadedAt: { type: Date },
      views: { type: Number, default: 0 },
    },
    portfolio: {
      github: { type: String },
      website: { type: String },
      projects: [
        {
          title: { type: String },
          description: { type: String },
          link: { type: String },
          technologies: [{ type: String }],
        },
      ],
    },
    skills: { type: String }, // Stored as text (comma or comma-space separated)
  },
  { timestamps: true }
);

export default mongoose.model('Profile', profileSchema);