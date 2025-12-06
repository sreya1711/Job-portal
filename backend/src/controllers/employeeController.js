import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';

export async function listEmployees(req, res) {
  const { q, department, status } = req.query;
  const filter = {};
  if (q) {
    // search on denormalized fields in future; currently key off user ObjectId string
    const maybeId = mongoose.isValidObjectId(q) ? new mongoose.Types.ObjectId(q) : null;
    filter.$or = [
      ...(maybeId ? [{ user: maybeId }] : []),
      { department: { $regex: q, $options: 'i' } },
      { skills: { $elemMatch: { $regex: q, $options: 'i' } } },
    ];
  }
  if (department) filter.department = { $regex: department, $options: 'i' };
  if (status) filter.status = status;

  const items = await Employee.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(items);
}

export async function getMe(req, res) {
  const userId = req.user?.id;
  const doc = await Employee.findOne({ user: userId });
  if (!doc) return res.status(404).json({ message: 'Employee profile not found' });
  res.json(doc);
}

export async function getEmployee(req, res) {
  const doc = await Employee.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Employee not found' });
  res.json(doc);
}

export async function createEmployee(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { user, title, department, manager, phone, location, skills, joinedAt, status } = req.body;

  const exists = await Employee.findOne({ user });
  if (exists) return res.status(409).json({ message: 'Employee profile already exists for this user' });

  const doc = await Employee.create({ user, title, department, manager, phone, location, skills, joinedAt, status });
  res.status(201).json(doc);
}

export async function updateEmployee(req, res) {
  const allowed = ['title', 'department', 'manager', 'phone', 'location', 'skills', 'joinedAt', 'status'];
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
  );

  const doc = await Employee.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Employee not found' });
  res.json(doc);
}

export async function updateMe(req, res) {
  const allowed = ['title', 'phone', 'location', 'skills'];
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([k]) => allowed.includes(k))
  );
  const userId = req.user?.id;
  const doc = await Employee.findOneAndUpdate({ user: userId }, { $set: updates }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Employee profile not found' });
  res.json(doc);
}

export async function deleteEmployee(req, res) {
  const doc = await Employee.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Employee not found' });
  res.json({ success: true });
}
