import mongoose from 'mongoose';

const LoginAuditSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: false },
    message: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('LoginAudit', LoginAuditSchema);
