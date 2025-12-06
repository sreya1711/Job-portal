import express from 'express';
import { authRequired } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Application from '../models/Application.js';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require auth
router.use(authRequired);

router.post('/', async (req, res) => {
  try {
    const { applicationId, jobSeekerId, content } = req.body;
    if (!applicationId || !content) {
      return res.status(400).json({ message: 'applicationId and content are required' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const senderId = new mongoose.Types.ObjectId(req.user.id);
    console.log(`Message from user ${senderId}, App employer: ${application.employer}, App jobSeeker: ${application.jobSeeker}`);
    
    const isEmployer = application.employer.toString() === senderId.toString();
    const isJobSeeker = application.jobSeeker.toString() === senderId.toString();
    console.log(`isEmployer: ${isEmployer}, isJobSeeker: ${isJobSeeker}`);
    
    if (!isEmployer && !isJobSeeker) {
      return res.status(403).json({ message: 'Not authorized to message on this application' });
    }

    const recipientId = isEmployer ? application.jobSeeker : application.employer;
    console.log(`Recipient ID: ${recipientId}`);

    const message = await Message.create({
      application: application._id,
      sender: senderId,
      recipient: recipientId,
      content,
      sentAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role');

    const io = req.app.get('io');
    if (io) {
      const messageData = {
        _id: populatedMessage._id,
        applicationId: application._id.toString(),
        content: populatedMessage.content,
        sender: populatedMessage.sender,
        recipient: populatedMessage.recipient,
        sentAt: populatedMessage.sentAt,
        createdAt: populatedMessage.createdAt,
      };
      
      const recipientIdStr = recipientId.toString();
      const appIdStr = application._id.toString();
      
      console.log(`Emitting message to recipient room: ${recipientIdStr}`);
      console.log(`Emitting message to application room: application:${appIdStr}`);
      
      io.to(recipientIdStr).emit('message:new', messageData);
      io.to(`application:${appIdStr}`).emit('message:new', messageData);
      console.log('Message emitted via socket');
    }

    res.status(201).json({ message: 'Message sent', data: populatedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const messages = await Message.find({
      $or: [{ recipient: userId }, { sender: userId }],
    })
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .populate({ path: 'application', select: 'job', populate: { path: 'job', select: 'title company' } })
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    console.error('Get my messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/application/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    console.log(`Fetching messages for application ${id}, user ${userId}`);
    
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const isJobSeeker = application.jobSeeker.toString() === userId.toString();
    const isEmployer = application.employer.toString() === userId.toString();
    
    console.log(`isJobSeeker: ${isJobSeeker}, isEmployer: ${isEmployer}`);
    
    if (!isJobSeeker && !isEmployer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }
    
    const messages = await Message.find({ application: id })
      .populate('sender', 'name role email')
      .populate('recipient', 'name role email')
      .sort({ createdAt: 1 });
    
    console.log(`Found ${messages.length} messages for application ${id}`);
    
    if (messages.length > 0) {
      await Message.updateMany(
        { application: id, recipient: userId.toString(), read: false },
        { $set: { read: true } }
      );
      console.log(`Marked unread messages as read for user ${userId}`);
    }
    
    res.json({ messages });
  } catch (error) {
    console.error('Get application messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only the recipient can mark a message as read
    if (message.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }
    
    message.read = true;
    await message.save();
    
    res.json({ message: 'Message marked as read', data: message });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
