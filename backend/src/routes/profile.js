import express from 'express';
import ProfileModel from '../models/Profile.js'; // Adjust path to your model
import { authRequired } from '../middleware/auth.js'; // Use named import
import Application from '../models/Application.js';

const router = express.Router();

// Basic validation for profile
const validateProfile = (data) => {
  const errors = [];
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push({ message: 'Name is required', path: ['name'] });
  }
  if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ message: 'Valid email is required', path: ['email'] });
  }
  // Skills can be string or array
  if (data.skills && typeof data.skills !== 'string' && !Array.isArray(data.skills)) {
    errors.push({ message: 'Skills must be a string or array', path: ['skills'] });
  }
  // Experiences can be string or array
  if (data.experiences && typeof data.experiences !== 'string' && !Array.isArray(data.experiences)) {
    errors.push({ message: 'Experiences must be a string or array', path: ['experiences'] });
  }
  // Educations should be array
  if (data.educations && Array.isArray(data.educations)) {
    data.educations.forEach((edu, index) => {
      if (edu.degree && !edu.institution) {
        errors.push({ message: `Education ${index + 1}: Degree and institution are required`, path: [`educations[${index}]`] });
      }
    });
  }
  // Certifications can be string or array
  if (data.certifications && typeof data.certifications !== 'string' && !Array.isArray(data.certifications)) {
    errors.push({ message: 'Certifications must be a string or array', path: ['certifications'] });
  }
  return errors.length > 0 ? errors : null;
};

// Basic validation for resume
const validateResume = (data) => {
  const errors = [];
  if (!data.fileName || typeof data.fileName !== 'string') {
    errors.push({ message: 'File name is required', path: ['fileName'] });
  }
  if (!data.base64 || typeof data.base64 !== 'string') {
    errors.push({ message: 'Base64 data is required', path: ['base64'] });
  }
  if (!data.uploadedAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(data.uploadedAt)) {
    errors.push({ message: 'Valid ISO date for uploadedAt is required', path: ['uploadedAt'] });
  }
  return errors.length > 0 ? errors : null;
};

// Update profile
router.put('/', authRequired, async (req, res, next) => {
  try {
    console.log('PUT /api/profile payload:', JSON.stringify(req.body, null, 2));
    const errors = validateProfile(req.body);
    if (errors) {
      return res.status(400).json({ message: 'Validation error', errors });
    }

    // Clean up optional fields and ensure proper data types
    const updateData = {};

    // Basic info
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone || null;
    if (req.body.location !== undefined) updateData.location = req.body.location || null;
    if (req.body.linkedin !== undefined) updateData.linkedin = req.body.linkedin || null;
    if (req.body.bio !== undefined) updateData.bio = req.body.bio || null;

    // Skills - can be string (comma-separated) or array
    if (req.body.skills) {
      if (typeof req.body.skills === 'string') {
        // Store as string if it's already a string
        updateData.skills = req.body.skills.trim();
      } else if (Array.isArray(req.body.skills)) {
        // Convert array to comma-separated string
        const skillsArray = req.body.skills
          .filter(s => s && (typeof s === 'string' || (typeof s === 'object' && s.name)))
          .map(s => typeof s === 'string' ? s : s.name);
        updateData.skills = skillsArray.join(', ');
      }
    }

    // Experiences - can be string (comma-separated) or array
    if (req.body.experiences) {
      if (typeof req.body.experiences === 'string') {
        // Store as string if it's already a string
        updateData.experiences = req.body.experiences.trim();
      } else if (Array.isArray(req.body.experiences)) {
        // Convert array to comma-separated string
        const expArray = req.body.experiences
          .filter(e => e && e.title && e.company && e.startDate)
          .map(e => `${String(e.title).trim()} at ${String(e.company).trim()} (${String(e.startDate).trim()}${e.endDate ? ' - ' + String(e.endDate).trim() : ''})`);
        updateData.experiences = expArray.join(', ');
      }
    }

    // Educations - array format remains the same
    if (Array.isArray(req.body.educations)) {
      updateData.educations = req.body.educations
        .filter(e => e && e.degree && e.institution)
        .map(e => ({
          degree: String(e.degree).trim(),
          institution: String(e.institution).trim(),
          startDate: e.startDate ? String(e.startDate).trim() : undefined,
          endDate: e.endDate ? String(e.endDate).trim() : undefined,
          description: e.description ? String(e.description).trim() : undefined,
        }));
    }

    // Certifications - can be string (comma-separated) or array
    if (req.body.certifications) {
      if (typeof req.body.certifications === 'string') {
        // Store as string if it's already a string
        updateData.certifications = req.body.certifications.trim();
      } else if (Array.isArray(req.body.certifications)) {
        // Convert array to comma-separated string
        const certArray = req.body.certifications
          .filter(c => c && c.name && c.issuer && c.date)
          .map(c => `${String(c.name).trim()} from ${String(c.issuer).trim()}`);
        updateData.certifications = certArray.join(', ');
      }
    }

    console.log('Validated and formatted data:', JSON.stringify(updateData, null, 2));

    // Update profile in database
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    console.log('Profile updated successfully:', updatedProfile);

    // Notify counterpart users via Socket.IO
    try {
      const io = req.app.get('io');
      if (io) {
        const actorId = req.user.id.toString();
        const actorRole = req.user.role; // 'employer' or 'jobseeker' (or 'job_seeker' depending on auth)
        const normalizedRole = actorRole === 'job_seeker' ? 'jobseeker' : actorRole;

        // Find counterpart user IDs based on applications linkage
        let counterpartIds = [];
        if (normalizedRole === 'employer') {
          // Notify all distinct jobseekers who have applied to this employer's jobs
          const apps = await Application.find({ employer: actorId }).select('jobSeeker').lean();
          counterpartIds = [...new Set(apps.map(a => a.jobSeeker?.toString()).filter(Boolean))];
        } else if (normalizedRole === 'jobseeker') {
          // Notify all distinct employers where this jobseeker has applications
          const apps = await Application.find({ jobSeeker: actorId }).select('employer job').lean();
          counterpartIds = [...new Set(apps.map(a => a.employer?.toString()).filter(Boolean))];
        }

        const payload = {
          actorId,
          actorRole: normalizedRole,
          name: updateData.name || undefined,
          email: updateData.email || undefined,
          timestamp: new Date().toISOString(),
        };

        counterpartIds.forEach(cid => {
          io.to(cid).emit('profile:updated', payload);
        });
      }
    } catch (e) {
      console.warn('Failed to emit profile:updated event:', e?.message || e);
    }

    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error in PUT /api/profile:', error);
    const errorMessage = error.message || 'Error updating profile';
    res.status(400).json({ message: 'Error updating profile', error: errorMessage });
  }
});

// Upload resume
router.post('/resume', authRequired, async (req, res, next) => {
  try {
    console.log('POST /api/profile/resume payload:', JSON.stringify(req.body, null, 2));
    const errors = validateResume(req.body);
    if (errors) {
      return res.status(400).json({ message: 'Validation error', details: errors });
    }

    // Update profile with resume
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { resume: req.body } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Resume uploaded successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error in POST /api/profile/resume:', error);
    next(error);
  }
});

// Get profile of logged-in user
router.get('/', authRequired, async (req, res, next) => {
  try {
    const profile = await ProfileModel.findOne({ userId: req.user.id });
    if (!profile) {
      // Return empty profile structure instead of 404
      return res.json({
        name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        bio: '',
        skills: '', // String instead of array
        experiences: '', // String instead of array
        educations: [],
        certifications: '' // String instead of array
      });
    }
    // Return profile directly (backend will extract .profile from response.data.profile)
    res.json(profile);
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    next(error);
  }
});

// Public (or employer-visible) profile by userId
router.get('/public/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profile = await ProfileModel.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json({ profile });
  } catch (error) {
    console.error('Error in GET /api/profile/public/:userId:', error);
    next(error);
  }
});

// Upload video resume
router.post('/video-resume', authRequired, async (req, res, next) => {
  try {
    const { fileName, base64, duration, title, description } = req.body;
    
    if (!fileName || !base64) {
      return res.status(400).json({ message: 'File name and base64 data are required' });
    }

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $set: { 
          videoResume: {
            fileName,
            base64,
            duration: duration || 0,
            title: title || fileName,
            description: description || '',
            uploadedAt: new Date()
          }
        }
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Video resume uploaded successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error uploading video resume:', error);
    next(error);
  }
});

// Get video resume
router.get('/video-resume', authRequired, async (req, res, next) => {
  try {
    const profile = await ProfileModel.findOne({ userId: req.user.id });
    if (!profile || !profile.videoResume) {
      return res.status(404).json({ message: 'No video resume found' });
    }
    res.json({ videoResume: profile.videoResume });
  } catch (error) {
    console.error('Error fetching video resume:', error);
    next(error);
  }
});

// Delete video resume
router.delete('/video-resume', authRequired, async (req, res, next) => {
  try {
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $unset: { videoResume: 1 } },
      { new: true }
    );

    res.json({ message: 'Video resume deleted successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error deleting video resume:', error);
    next(error);
  }
});

// Add skill badge
router.post('/skill-badges', authRequired, async (req, res, next) => {
  try {
    const { skill, assessmentScore, badge } = req.body;
    
    if (!skill) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const skillBadge = {
      skill,
      badge: badge || 'bronze',
      assessmentScore: assessmentScore || 0,
      verified: assessmentScore ? (assessmentScore >= 70) : false,
      endorsements: 0,
      endorsedBy: [],
      addedDate: new Date()
    };

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $push: { skillBadges: skillBadge } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Skill badge added successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error adding skill badge:', error);
    next(error);
  }
});

// Update skill badge assessment score and verification
router.put('/skill-badges/:skillId', authRequired, async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const { assessmentScore, badge } = req.body;

    const updateData = {};
    if (assessmentScore !== undefined) {
      updateData['skillBadges.$.assessmentScore'] = assessmentScore;
      updateData['skillBadges.$.verified'] = assessmentScore >= 70;
      if (assessmentScore >= 90) updateData['skillBadges.$.badge'] = 'platinum';
      else if (assessmentScore >= 80) updateData['skillBadges.$.badge'] = 'gold';
      else if (assessmentScore >= 70) updateData['skillBadges.$.badge'] = 'silver';
      else updateData['skillBadges.$.badge'] = 'bronze';
    }
    if (badge) updateData['skillBadges.$.badge'] = badge;

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id, 'skillBadges._id': skillId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Skill badge not found' });
    }

    res.json({ message: 'Skill badge updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating skill badge:', error);
    next(error);
  }
});

// Endorse a skill
router.post('/skill-badges/:skillId/endorse', authRequired, async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const endorserId = req.user.id;

    const profile = await ProfileModel.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const skillBadge = profile.skillBadges.id(skillId);
    if (!skillBadge) {
      return res.status(404).json({ message: 'Skill badge not found' });
    }

    if (!skillBadge.endorsedBy.includes(endorserId)) {
      skillBadge.endorsedBy.push(endorserId);
      skillBadge.endorsements = skillBadge.endorsedBy.length;
    }

    await profile.save();

    res.json({ message: 'Skill endorsed successfully', profile });
  } catch (error) {
    console.error('Error endorsing skill:', error);
    next(error);
  }
});

// Delete skill badge
router.delete('/skill-badges/:skillId', authRequired, async (req, res, next) => {
  try {
    const { skillId } = req.params;

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { skillBadges: { _id: skillId } } },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Skill badge not found' });
    }

    res.json({ message: 'Skill badge deleted successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error deleting skill badge:', error);
    next(error);
  }
});

// Add portfolio item
router.post('/portfolio', authRequired, async (req, res, next) => {
  try {
    const { title, description, url, type, githubUrl, projectUrl, writingUrl, image, technologies, startDate, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Portfolio title is required' });
    }

    const portfolioItem = {
      title,
      description: description || '',
      url: url || '',
      type: type || 'project',
      githubUrl: githubUrl || '',
      projectUrl: projectUrl || '',
      writingUrl: writingUrl || '',
      image: image || '',
      technologies: technologies || [],
      startDate: startDate || '',
      endDate: endDate || '',
      addedDate: new Date()
    };

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $push: { portfolio: portfolioItem } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Portfolio item added successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error adding portfolio item:', error);
    next(error);
  }
});

// Update portfolio item
router.put('/portfolio/:portfolioId', authRequired, async (req, res, next) => {
  try {
    const { portfolioId } = req.params;
    const { title, description, url, type, githubUrl, projectUrl, writingUrl, image, technologies, startDate, endDate } = req.body;

    const updateData = {};
    if (title) updateData['portfolio.$.title'] = title;
    if (description !== undefined) updateData['portfolio.$.description'] = description;
    if (url) updateData['portfolio.$.url'] = url;
    if (type) updateData['portfolio.$.type'] = type;
    if (githubUrl) updateData['portfolio.$.githubUrl'] = githubUrl;
    if (projectUrl) updateData['portfolio.$.projectUrl'] = projectUrl;
    if (writingUrl) updateData['portfolio.$.writingUrl'] = writingUrl;
    if (image) updateData['portfolio.$.image'] = image;
    if (technologies) updateData['portfolio.$.technologies'] = technologies;
    if (startDate) updateData['portfolio.$.startDate'] = startDate;
    if (endDate) updateData['portfolio.$.endDate'] = endDate;

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id, 'portfolio._id': portfolioId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json({ message: 'Portfolio item updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    next(error);
  }
});

// Delete portfolio item
router.delete('/portfolio/:portfolioId', authRequired, async (req, res, next) => {
  try {
    const { portfolioId } = req.params;

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { portfolio: { _id: portfolioId } } },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json({ message: 'Portfolio item deleted successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    next(error);
  }
});

// Update video resume (Firebase URL)
router.put('/video-resume', authRequired, async (req, res, next) => {
  try {
    const { url, title, duration } = req.body;
    
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { 
        $set: { 
          videoResume: {
            url,
            title: title || 'Video Resume',
            duration: duration || 0,
            uploadedAt: new Date(),
            views: 0
          }
        }
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Video resume updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating video resume:', error);
    next(error);
  }
});

// Update portfolio (GitHub, website, projects)
router.put('/portfolio', authRequired, async (req, res, next) => {
  try {
    const { github, website, projects } = req.body;
    
    const updateData = {};
    if (github !== undefined) updateData['portfolio.github'] = github;
    if (website !== undefined) updateData['portfolio.website'] = website;
    if (projects !== undefined) updateData['portfolio.projects'] = projects;

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ message: 'Portfolio updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    next(error);
  }
});

// Update skills with new structure
router.put('/skills', authRequired, async (req, res, next) => {
  try {
    const { skills } = req.body;
    
    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: 'Skills must be an array' });
    }

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { skills } },
      { new: true, upsert: true }
    );

    res.json({ message: 'Skills updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating skills:', error);
    next(error);
  }
});

// Endorse a skill
router.post('/skills/:skillName/endorse', authRequired, async (req, res, next) => {
  try {
    const { skillName } = req.params;
    const endorserId = req.user.id;

    const profile = await ProfileModel.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Find skill in skills array
    const skill = profile.skills.find(s => s.name === skillName);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Add endorsement if not already endorsed by this user
    if (!skill.skillEndorsements) {
      skill.skillEndorsements = [];
    }
    
    const hasEndorsed = profile.skillEndorsements?.some(
      e => e.skillId === skillName && e.endorsedBy.toString() === endorserId
    );

    if (!hasEndorsed) {
      skill.endorsements = (skill.endorsements || 0) + 1;
      if (!profile.skillEndorsements) {
        profile.skillEndorsements = [];
      }
      profile.skillEndorsements.push({
        skillId: skillName,
        endorsedBy: endorserId,
        createdAt: new Date()
      });
    }

    await profile.save();

    res.json({ message: 'Skill endorsed successfully', profile });
  } catch (error) {
    console.error('Error endorsing skill:', error);
    next(error);
  }
});

// Verify a skill (through assessment)
router.post('/skills/:skillName/verify', authRequired, async (req, res, next) => {
  try {
    const { skillName } = req.params;
    const { assessmentScore } = req.body;

    const profile = await ProfileModel.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const skill = profile.skills.find(s => s.name === skillName);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Update skill with verification
    skill.verifiedByAssessment = true;
    skill.assessmentScore = assessmentScore || 100;
    skill.badge = 'verified';

    await profile.save();

    res.json({ message: 'Skill verified successfully', profile });
  } catch (error) {
    console.error('Error verifying skill:', error);
    next(error);
  }
});

export default router;