import Profile from '../models/Profile.js';

export const updateProfile = async (req, res) => {
  try {
    const existing = await Profile.findOne({ email: req.body.email });
    if (existing) {
      // update if found
      Object.assign(existing, req.body);
      await existing.save();
      return res.json({ message: 'Profile updated', profile: existing });
    } else {
      // create new profile
      const profile = new Profile(req.body);
      await profile.save();
      return res.json({ message: 'Profile created', profile });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile', details: err });
  }
};
