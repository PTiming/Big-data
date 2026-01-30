const jwt = require('jsonwebtoken');
const { User } = require('../models');
const moodleService = require('../services/moodleService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'student'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        moodleUserId: user.moodleUserId,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('enrolledCourses', 'title shortName thumbnail')
      .populate('createdCourses', 'title shortName thumbnail');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Link Moodle account
// @route   POST /api/auth/link-moodle
// @access  Private
const linkMoodleAccount = async (req, res) => {
  try {
    const { moodleUsername } = req.body;

    // Get user from Moodle
    const moodleUser = await moodleService.getUserByUsername(moodleUsername);
    
    if (!moodleUser) {
      return res.status(404).json({
        success: false,
        message: 'Moodle user not found'
      });
    }

    // Update user with Moodle info
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        moodleUserId: moodleUser.id,
        moodleUsername: moodleUser.username
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Moodle account linked successfully',
      data: {
        moodleUserId: user.moodleUserId,
        moodleUsername: user.moodleUsername
      }
    });
  } catch (error) {
    console.error('Link Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error linking Moodle account',
      error: error.message
    });
  }
};

// @desc    Unlink Moodle account
// @route   DELETE /api/auth/unlink-moodle
// @access  Private
const unlinkMoodleAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      moodleUserId: null,
      moodleUsername: null
    });

    res.json({
      success: true,
      message: 'Moodle account unlinked successfully'
    });
  } catch (error) {
    console.error('Unlink Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlinking Moodle account',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  linkMoodleAccount,
  unlinkMoodleAccount
};
