const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register (or /signup)
 * @desc    Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      savedTracks: [],
      playlists: [
        { id: 'fav_' + Date.now(), name: 'My Favorites', tracks: [] },
      ],
      recentTracks: [],
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      library: {
        savedTracks: user.savedTracks,
        playlists: user.playlists,
        recentTracks: user.recentTracks,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      library: {
        savedTracks: user.savedTracks || [],
        playlists: user.playlists || [],
        recentTracks: user.recentTracks || [],
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user profile and library data
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      library: {
        savedTracks: req.user.savedTracks || [],
        playlists: req.user.playlists || [],
        recentTracks: req.user.recentTracks || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

/**
 * @route   POST /api/auth/sync
 * @desc    Sync user's library (savedTracks, playlists, recentTracks) to MongoDB
 */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { savedTracks, playlists, recentTracks } = req.body;
    const update = {};

    if (Array.isArray(savedTracks)) update.savedTracks = savedTracks;
    if (Array.isArray(playlists)) update.playlists = playlists;
    if (Array.isArray(recentTracks)) update.recentTracks = recentTracks;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Library synced successfully',
      library: {
        savedTracks: user.savedTracks,
        playlists: user.playlists,
        recentTracks: user.recentTracks,
      },
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ success: false, message: 'Failed to sync library', error: err.message });
  }
});

module.exports = router;

