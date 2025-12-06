// models/User.js
import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: String, required: true }, // YYYY-MM format
  endDate: { type: String }, // YYYY-MM format or "Present"
  duration: { type: String }, // Keep your existing field for backward compatibility
  description: { type: String }
});

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  school: { type: String }, // Keep your existing field name
  institution: { type: String }, // Alternative name for consistency
  startDate: { type: String }, // YYYY-MM format
  endDate: { type: String }, // YYYY-MM format
  year: { type: String }, // Keep your existing field for backward compatibility
  gpa: { type: String },
  description: { type: String }
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM format
  url: { type: String }, // Keep your existing field
  description: { type: String }
});

const resumeSchema = new mongoose.Schema({
  name: { type: String }, // Keep your existing field
  fileName: { type: String }, // Alternative name for consistency
  size: { type: Number },
  type: { type: String },
  uploadDate: { type: Date, default: Date.now },
  uploadedAt: { type: Date }, // Alternative name for consistency
  url: { type: String },
  base64: { type: String } // For storing small resume files as base64
});

const videoResumeSchema = new mongoose.Schema({
  fileName: { type: String },
  base64: { type: String },
  duration: { type: Number }, // in seconds
  uploadedAt: { type: Date, default: Date.now },
  title: { type: String },
  description: { type: String }
});

const skillBadgeSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  badge: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  endorsements: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  assessmentScore: { type: Number }, // 0-100
  endorsedBy: [{ type: String }], // User IDs who endorsed this skill
  addedDate: { type: Date, default: Date.now }
});

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String },
  type: { type: String, enum: ['github', 'project', 'writing', 'other'], default: 'project' },
  githubUrl: { type: String },
  projectUrl: { type: String },
  writingUrl: { type: String },
  image: { type: String }, // Base64 or URL
  technologies: [{ type: String }],
  startDate: { type: String }, // YYYY-MM format
  endDate: { type: String }, // YYYY-MM format
  addedDate: { type: Date, default: Date.now }
});

const profileSchema = new mongoose.Schema({
  bio: { type: String },
  phone: { type: String },
  location: { type: String },
  website: { type: String },
  linkedin: { type: String },
  skills: [{ type: String }],
  isPublic: { type: Boolean, default: true },

  // Updated experience structure (keeping both old and new for compatibility)
  experience: [experienceSchema], // Your existing field name
  experiences: [experienceSchema], // Alternative name for consistency

  // Updated education structure (keeping both old and new for compatibility)
  education: [educationSchema], // Your existing field name
  educations: [educationSchema], // Alternative name for consistency

  certifications: [certificationSchema],
  resume: resumeSchema,
  
  // New interactive profile features
  videoResume: videoResumeSchema,
  skillBadges: [skillBadgeSchema],
  portfolio: [portfolioItemSchema]
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['jobseeker', 'employer', 'admin'], default: 'jobseeker' },
  
  // Employer-specific fields
  company: { type: String },
  department: { type: String },
  
  // General fields
  avatar: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  joinedDate: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  
  // Profile information
  profile: profileSchema,
  
}, { 
  timestamps: true 
});

// Pre-save middleware to sync experience and experiences arrays
userSchema.pre('save', function(next) {
  if (this.profile) {
    // Sync experience to experiences if experiences is empty but experience has data
    if (this.profile.experience && this.profile.experience.length > 0 && (!this.profile.experiences || this.profile.experiences.length === 0)) {
      this.profile.experiences = this.profile.experience;
    }
    // Sync experiences to experience if experience is empty but experiences has data
    else if (this.profile.experiences && this.profile.experiences.length > 0 && (!this.profile.experience || this.profile.experience.length === 0)) {
      this.profile.experience = this.profile.experiences;
    }
    
    // Sync education to educations
    if (this.profile.education && this.profile.education.length > 0 && (!this.profile.educations || this.profile.educations.length === 0)) {
      this.profile.educations = this.profile.education;
    }
    else if (this.profile.educations && this.profile.educations.length > 0 && (!this.profile.education || this.profile.education.length === 0)) {
      this.profile.education = this.profile.educations;
    }
    
    // Sync resume fields
    if (this.profile.resume) {
      if (this.profile.resume.name && !this.profile.resume.fileName) {
        this.profile.resume.fileName = this.profile.resume.name;
      }
      if (this.profile.resume.fileName && !this.profile.resume.name) {
        this.profile.resume.name = this.profile.resume.fileName;
      }
      if (this.profile.resume.uploadDate && !this.profile.resume.uploadedAt) {
        this.profile.resume.uploadedAt = this.profile.resume.uploadDate;
      }
      if (this.profile.resume.uploadedAt && !this.profile.resume.uploadDate) {
        this.profile.resume.uploadDate = this.profile.resume.uploadedAt;
      }
    }
  }
  next();
});

export default mongoose.model('User', userSchema);