import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { emitAnalyticsUpdate } from '../utils/helpers.js';
import { emitApplicationEvent } from '../services/notificationService.js';

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private/JobSeeker
async function applyForJob(req, res) {
  const { jobId, resume, coverLetter = '' } = req.body;
  const jobSeekerId = req.user.id;

  try {
    // Validate jobId
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if the user has already applied for this job
    const existingApplication = await Application.findOne({ job: jobId, jobSeeker: jobSeekerId });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const employerId = job.employer;
    const jobSeeker = await User.findById(jobSeekerId);

    if (!jobSeeker) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If resume not provided, use from user's profile
    let applicationResume = resume || jobSeeker?.profile?.resume?.url;
    
    if (!applicationResume) {
      return res.status(400).json({ 
        message: 'Resume is required. Please upload a resume to your profile before applying.' 
      });
    }

    const application = await Application.create({
      job: jobId,
      jobSeeker: jobSeekerId,
      employer: employerId,
      resume: applicationResume,
      coverLetter,
      status: 'pending',
      appliedDate: new Date(),
      statusHistory: [{
        status: 'pending',
        changedBy: jobSeekerId,
        notes: 'Application submitted'
      }]
    });
    
    // Add application to job's applications array
    if (!job.applications) {
      job.applications = [];
    }
    job.applications.push(application._id);
    const savedJob = await job.save();
    
    if (!savedJob) {
      throw new Error('Failed to update job with application');
    }
    
    // Populate the job and jobSeeker fields for the response
    const populatedApplication = await Application.findById(application._id)
      .populate('job', '_id title company')
      .populate('jobSeeker', '_id name email');
    
    const io = req.app.get('io');
    await emitAnalyticsUpdate(io);
    
    // Emit application submitted event to notify employer
    // Emit to the employer's specific socket room (the employer has joined a room with their userId)
    if (io) {
      const payload = {
        applicationId: application._id,
        jobId: jobId,
        jobTitle: populatedApplication.job.title,
        jobSeekerName: populatedApplication.jobSeeker.name,
        jobSeekerEmail: populatedApplication.jobSeeker.email,
        employerId: employerId,
        appliedDate: application.appliedDate
      };

      // Emit a namespaced event that the client code listens for (`application:submitted`)
      try {
        io.to(employerId.toString()).emit('application:submitted', payload);
        // Also emit a generic application event (backwards compatibility)
        io.to(employerId.toString()).emit('application:new', payload);

        // If notification helper exists, use it to broadcast application events as well
        try {
          emitApplicationEvent(io, 'submitted', payload);
        } catch (err) {
          console.warn('emitApplicationEvent helper failed:', err?.message || err);
        }

        console.log(`Emitted application submission to employer room: ${employerId}`);
      } catch (err) {
        console.error('Error emitting application socket event:', err);
      }
    }
    
    res.status(201).json({ 
      success: true,
      message: 'Application submitted successfully', 
      data: populatedApplication
    });
  } catch (error) {
    console.error('Error in applyForJob:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// @desc    Get all applications for a specific job (Employer)
// @route   GET /api/applications/job/:jobId
// @access  Private/Employer
async function getApplicationsForJob(req, res) {
  const { jobId } = req.params;
  const employerId = req.user.id;

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employer.toString() !== employerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'User not authorized to view applications for this job' });
    }

    const applications = await Application.find({ job: jobId })
      .populate({
        path: 'jobSeeker',
        select: 'name email profile'
      })
      .populate({
        path: 'employer',
        select: 'name email companyName'
      });
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// @desc    Get all applications by a specific job seeker
// @route   GET /api/applications/jobseeker/my-applications
// @access  Private/JobSeeker
async function getMyApplications(req, res) {
  try {
    const applications = await Application.find({ jobSeeker: req.user.id })
      .populate({
        path: 'job',
        select: 'title company location type salary description requirements',
        populate: {
          path: 'company',
          select: 'name logo industry'
        }
      })
      .populate({
        path: 'jobSeeker',
        select: 'name email'
      })
      .populate({
        path: 'employer',
        select: 'name email companyName'
      })
      .sort({ updatedAt: -1 });

    // Process each application to format the data
    const applicationsWithUnreadCount = applications.map(app => {
      // Ensure messages is an array
      const messages = Array.isArray(app.messages) ? app.messages : [];
      console.log(`Application ${app._id} has ${messages.length} messages`);
      
      // Format messages with proper sender info
      const formattedMessages = messages.map(msg => {
        const isFromEmployer = msg.sender && 
          (msg.sender._id ? 
            msg.sender._id.toString() === app.employer?._id?.toString() : 
            msg.sender.toString() === app.employer?._id?.toString()
          );
        
        // For debugging
        console.log(`Message in app ${app._id}:`, {
          content: msg.content,
          sender: msg.sender,
          employerId: app.employer?._id,
          isFromEmployer
        });
        
        return {
          _id: msg._id,
          content: msg.content,
          read: msg.read,
          role: isFromEmployer ? 'employer' : 'job_seeker',
          sender: isFromEmployer ? {
            _id: app.employer?._id || msg.sender,
            name: app.employer?.companyName || app.employer?.name || 'Employer',
            email: app.employer?.email
          } : {
            _id: app.jobSeeker?._id || req.user.id,
            name: app.jobSeeker?.name || 'You',
            email: app.jobSeeker?.email || req.user.email
          },
          timestamp: msg.timestamp || msg.sentAt || msg.createdAt,
          sentAt: msg.sentAt || msg.timestamp || msg.createdAt
        };
      });

      // Sort messages by timestamp (newest first)
      formattedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Count unread messages from employer
      const unreadCount = formattedMessages.filter(
        msg => !msg.read && msg.role === 'employer'
      ).length;

      const application = app.toObject();
      
      // Add formatted messages
      application.messages = formattedMessages;
      
      // Format interview details if exists
      if (app.interview) {
        application.interview = {
          id: app.interview._id,
          date: app.interview.date,
          time: app.interview.time,
          location: app.interview.location,
          type: app.interview.type,
          notes: app.interview.notes,
          status: app.interview.status,
          createdAt: app.interview.createdAt,
          updatedAt: app.interview.updatedAt
        };
      }

      // Format status history
      application.statusHistory = (app.statusHistory || []).map(history => ({
        status: history.status,
        changedAt: history.changedAt,
        notes: history.notes,
        changedBy: history.changedBy ? {
          id: history.changedBy._id,
          name: history.changedBy.name,
          role: history.changedBy.role
        } : null,
        previousStatus: history.previousStatus,
        details: history.details
      }));

      // Sort status history by date (newest first)
      application.statusHistory.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

      // Add unread message count
      application.unreadMessageCount = unreadCount;
      
      return application;
    });

    res.status(200).json({
      success: true,
      count: applicationsWithUnreadCount.length,
      data: applicationsWithUnreadCount
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      message: 'Error fetching applications', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

// @desc    Schedule an interview for an application
// @route   POST /api/applications/schedule
// @access  Private/Employer
async function scheduleInterview(req, res) {
  const { applicationId, jobSeekerId, date, time, location, type, notes } = req.body;
  const employerId = req.user.id;

  try {
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the employer owns the job
    const job = await Job.findById(application.job);
    if (job.employer.toString() !== employerId) {
      return res.status(403).json({ message: 'Not authorized to schedule interview for this application' });
    }

    // Update application with interview details
    application.interview = {
      date,
      time,
      location,
      type: type || 'in-person',
      notes: notes || '',
      status: 'scheduled'
    };

    // Update status to indicate interview is scheduled
    application.status = 'interviewed';

    // Add status update
    const statusUpdate = {
      status: 'interview_scheduled',
      changedBy: employerId,
      notes: `Interview scheduled for ${new Date(date).toLocaleDateString()} at ${time} (${type || 'in-person'})`,
      details: {
        interviewType: type || 'in-person',
        location,
        notes
      }
    };
    
    if (!application.statusHistory) {
      application.statusHistory = [];
    }
    application.statusHistory.push(statusUpdate);

    await application.save();
    // Emit interview scheduled notifications to the job seeker
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          applicationId: application._id,
          jobTitle: job.title,
          jobId: job._id,
          jobSeekerId: application.jobSeeker.toString(),
          date,
          time,
          location,
          type: type || 'in-person',
          status: 'scheduled',
          updatedAt: new Date().toISOString(),
        };

        // Primary events listened by clients
        io.to(application.jobSeeker.toString()).emit('interview:scheduled', payload);
        // Backwards/alternate event name
        io.to(application.jobSeeker.toString()).emit('interview-scheduled', payload);
      }
    } catch (e) {
      console.warn('Failed to emit interview scheduled event:', e?.message || e);
    }

    res.status(200).json({
      message: 'Interview scheduled successfully',
      interview: application.interview
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ 
      message: 'Error scheduling interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// @desc    Update application status (Employer/Admin)
// @route   PUT /api/applications/status/:id
// @access  Private/Employer/Admin
async function updateApplicationStatus(req, res) {
  const { status, notes } = req.body;
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the employer owns the job or user is admin
    const job = await Job.findById(application.job);
    if (job.employer.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Not authorized to update this application status' 
      });
    }

    // Update status
    const previousStatus = application.status;
    application.status = status;

    // Add status update to history
    const statusUpdate = {
      status,
      changedBy: userId,
      notes: notes || `Status changed from ${previousStatus} to ${status}`,
      previousStatus
    };

    if (!application.statusHistory) {
      application.statusHistory = [];
    }
    application.statusHistory.push(statusUpdate);

    await application.save();

    // Populate the updated application for response
    const updatedApplication = await Application.findById(application._id)
      .populate('job', 'title company')
      .populate('jobSeeker', 'name email');

    // Emit status update to the job seeker
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          applicationId: application._id,
          jobId: application.job,
          jobTitle: updatedApplication.job?.title,
          status,
          previousStatus,
          jobSeekerId: application.jobSeeker.toString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          console.log('[emit] application status -> jobSeeker room', payload.jobSeekerId, payload);
        } catch {}
        // Event names supported by clients
        io.to(application.jobSeeker.toString()).emit('application-status-update', payload);
        io.to(application.jobSeeker.toString()).emit('application:status', payload);
        // Redundant legacy/notify channel supported by some clients
        io.to(application.jobSeeker.toString()).emit('notify:application-status', payload);
        try {
          emitApplicationEvent(io, 'status', payload);
        } catch (e) {
          console.warn('emitApplicationEvent failed:', e?.message || e);
        }
      }
    } catch (e) {
      console.warn('Failed to emit application status update:', e?.message || e);
    }

    res.status(200).json({
      message: 'Application status updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      message: 'Error updating application status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// @desc    Send a message for an application
// @route   POST /api/applications/:id/messages
// @access  Private
async function sendMessage(req, res) {
  const { id: applicationId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;
  const senderRole = req.user.role === 'employer' ? 'employer' : 'job_seeker';
  
  console.log(`Sending message to application ${applicationId} from user ${senderId} (${senderRole}): "${content}"`);
  
  // Validate the application ID
  if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
    console.log(`Invalid application ID: ${applicationId}`);
    return res.status(400).json({ message: 'Invalid application ID' });
  }

  try {
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the user is either the job seeker or the employer
    if (req.user.role === 'job_seeker' && application.jobSeeker.toString() !== senderId) {
      return res.status(403).json({ message: 'Not authorized to send messages for this application' });
    }
    
    if (req.user.role === 'employer') {
      const job = await Job.findById(application.job);
      if (job.employer.toString() !== senderId) {
        return res.status(403).json({ message: 'Not authorized to send messages for this application' });
      }
    }

    // Create new message
    const newMessage = {
      content,
      sender: senderId,
      role: senderRole,
      timestamp: new Date(),
      read: false
    };

    console.log("Creating new message:", newMessage);

    // Add message to application
    application.messages = application.messages || [];
    application.messages.push(newMessage);
    
    // Mark other user's messages as read
    application.messages.forEach(msg => {
      if (msg.role !== senderRole) {
        msg.read = true;
      }
    });

    // Save the application with the new message
    const savedApplication = await application.save();
    console.log("Application saved with new message. Messages count:", savedApplication.messages.length);

    // Populate sender info for response
    const populatedMessage = {
      ...newMessage,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    };

    // Notify the counterpart via socket
    try {
      const io = req.app.get('io');
      if (io) {
        // Determine receiver: if employer sent, notify job seeker; else notify employer
        let receiverId;
        let jobTitle;
        try {
          const job = await Job.findById(application.job);
          jobTitle = job?.title;
        } catch (e) {}
        if (senderRole === 'employer') {
          receiverId = application.jobSeeker.toString();
        } else {
          receiverId = (application.employer || (await Job.findById(application.job))?.employer || '').toString();
        }

        const payload = {
          applicationId: application._id,
          content,
          senderId,
          senderName: req.user.name,
          senderRole,
          jobId: application.job?.toString?.() || application.job,
          jobTitle,
          timestamp: newMessage.timestamp,
        };

        io.to(receiverId).emit('message:new', payload);
        // For compatibility if some clients listen to this
        io.to(receiverId).emit('new-message', payload);
      }
    } catch (e) {
      console.warn('Failed to emit message:new event:', e?.message || e);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// @desc    Get a specific application by ID
// @route   GET /api/applications/:id
// @access  Private
async function getApplicationById(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  
  console.log(`Fetching application with ID: ${id} for user: ${userId}`);

  try {
    // First check if the application exists
    const applicationExists = await Application.exists({ _id: id });
    if (!applicationExists) {
      console.log(`Application with ID ${id} not found`);
      return res.status(404).json({ message: 'Application not found' });
    }
    
    console.log(`Application with ID ${id} exists, fetching details...`);
    
    const application = await Application.findById(id)
      .populate({
        path: 'job',
        select: 'title company location type salary description requirements',
        populate: {
          path: 'company',
          select: 'name logo industry'
        }
      })
      .populate({
        path: 'jobSeeker',
        select: 'name email'
      })
      .populate({
        path: 'employer',
        select: 'name email companyName'
      });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the user is either the job seeker, the employer, or an admin
    const isJobSeeker = application.jobSeeker._id.toString() === userId;
    const isEmployer = application.employer._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isJobSeeker && !isEmployer && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    // Format messages with proper sender info
    const messages = Array.isArray(application.messages) ? application.messages : [];
    console.log("Raw application messages:", messages);
    
    const formattedMessages = messages.map(msg => {
      const isFromEmployer = msg.sender && 
        (msg.sender._id ? 
          msg.sender._id.toString() === application.employer?._id?.toString() : 
          msg.sender.toString() === application.employer?._id?.toString()
        );
      
      // For debugging
      console.log("Message sender:", msg.sender);
      console.log("Employer ID:", application.employer?._id);
      console.log("Is from employer:", isFromEmployer);
      
      return {
        _id: msg._id,
        content: msg.content,
        read: msg.read,
        role: isFromEmployer ? 'employer' : 'job_seeker',
        sender: isFromEmployer ? {
          _id: application.employer?._id || msg.sender,
          name: application.employer?.companyName || application.employer?.name || 'Employer',
          email: application.employer?.email
        } : {
          _id: application.jobSeeker?._id || userId,
          name: application.jobSeeker?.name || 'Job Seeker',
          email: application.jobSeeker?.email
        },
        timestamp: msg.timestamp || msg.sentAt || msg.createdAt,
        sentAt: msg.sentAt || msg.timestamp || msg.createdAt
      };
    });
    
    console.log("Formatted messages:", formattedMessages);

    // Sort messages by timestamp (newest first)
    formattedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Convert to object to allow modification
    const applicationObj = application.toObject();
    applicationObj.messages = formattedMessages;
    
    // If there are no messages, create a test message for debugging
    if (formattedMessages.length === 0 && process.env.NODE_ENV === 'development') {
      console.log("No messages found, creating a test message");
      
      // Create a test message directly in the application
      const testMessage = {
        content: "This is a test message from the employer.",
        sender: application.employer._id,
        role: 'employer',
        timestamp: new Date(),
        read: false
      };
      
      // Add to the application
      application.messages = application.messages || [];
      application.messages.push(testMessage);
      await application.save();
      
      // Add to the response
      const formattedTestMessage = {
        _id: testMessage._id,
        content: testMessage.content,
        read: testMessage.read,
        role: 'employer',
        sender: {
          _id: application.employer._id,
          name: application.employer.name || 'Employer',
          email: application.employer.email
        },
        timestamp: testMessage.timestamp,
        sentAt: testMessage.timestamp
      };
      
      applicationObj.messages = [formattedTestMessage];
      console.log("Added test message:", formattedTestMessage);
    }

    res.status(200).json({
      success: true,
      data: applicationObj
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      message: 'Error fetching application', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

// Export all the functions
export {
  applyForJob,
  getApplicationsForJob,
  getMyApplications,
  updateApplicationStatus,
  scheduleInterview,
  sendMessage,
  getApplicationById
};
