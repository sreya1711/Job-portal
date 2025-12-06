import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    title: { type: String, default: '' },
    department: { type: String, default: '' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    skills: { type: [String], default: [] },
    joinedAt: { type: Date },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Employee', EmployeeSchema);
