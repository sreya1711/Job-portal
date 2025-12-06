import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import LoginAudit from '../models/LoginAudit.js';
import { emitAnalyticsUpdate } from '../utils/helpers.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role = 'jobseeker', company, department } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({
      message:
        "We noticed this email address is already registered with us. To continue, please sign in using your existing account credentials. If you’ve forgotten your password, you can reset it using the ‘Forgot Password’ option. Alternatively, you can use a different email address to create a new account.",
    });
  }

  const hash = await bcrypt.hash(password, 10);
  const userData = { name, email, password: hash, role };

  if (role === 'employer' && company) {
    userData.company = company;
  }
  if (role === 'admin' && department) {
    userData.department = department;
  }

  const user = await User.create(userData);

  const io = req.app.get('io');
  await emitAnalyticsUpdate(io);

  const token = signToken(user);
  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company, department: user.department },
    token,
  });
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const user = await User.findOne({ email });
  if (!user) {
    await LoginAudit.create({ email, ip, userAgent, success: false, message: 'User not found' });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    await LoginAudit.create({ user: user._id, email, ip, userAgent, success: false, message: 'Incorrect password' });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user);
  await LoginAudit.create({ user: user._id, email, ip, userAgent, success: true, message: 'Login success' });

  return res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company, department: user.department },
    token,
  });
}
