const moodleService = require('../services/moodleService');
const { User } = require('../models');

// @desc    Test Moodle connection
// @route   GET /api/moodle/test-connection
// @access  Private/Admin
const testConnection = async (req, res) => {
  try {
    const result = await moodleService.testConnection();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Test Moodle connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing Moodle connection',
      error: error.message
    });
  }
};

// @desc    Get Moodle site info
// @route   GET /api/moodle/site-info
// @access  Private/Admin
const getSiteInfo = async (req, res) => {
  try {
    const siteInfo = await moodleService.getSiteInfo();
    res.json({
      success: true,
      data: siteInfo
    });
  } catch (error) {
    console.error('Get Moodle site info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle site info',
      error: error.message
    });
  }
};

// @desc    Get all Moodle courses
// @route   GET /api/moodle/courses
// @access  Private/Instructor
const getMoodleCourses = async (req, res) => {
  try {
    const courses = await moodleService.getCourses();
    // Filter out site-level course (id=1)
    const filteredCourses = courses.filter(c => c.id !== 1);
    res.json({
      success: true,
      data: filteredCourses
    });
  } catch (error) {
    console.error('Get Moodle courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle courses',
      error: error.message
    });
  }
};

// @desc    Get Moodle course details
// @route   GET /api/moodle/courses/:courseId
// @access  Private/Instructor
const getMoodleCourse = async (req, res) => {
  try {
    const course = await moodleService.getCourseById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Moodle course not found'
      });
    }
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get Moodle course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle course',
      error: error.message
    });
  }
};

// @desc    Get Moodle course contents
// @route   GET /api/moodle/courses/:courseId/contents
// @access  Private/Instructor
const getMoodleCourseContents = async (req, res) => {
  try {
    const contents = await moodleService.getCourseContents(req.params.courseId);
    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('Get Moodle course contents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle course contents',
      error: error.message
    });
  }
};

// @desc    Get Moodle users
// @route   GET /api/moodle/users
// @access  Private/Admin
const getMoodleUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const criteria = search ? { email: search } : {};
    const result = await moodleService.getUsers(criteria);
    res.json({
      success: true,
      data: result.users || []
    });
  } catch (error) {
    console.error('Get Moodle users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle users',
      error: error.message
    });
  }
};

// @desc    Get Moodle user by ID
// @route   GET /api/moodle/users/:userId
// @access  Private
const getMoodleUser = async (req, res) => {
  try {
    const user = await moodleService.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Moodle user not found'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get Moodle user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle user',
      error: error.message
    });
  }
};

// @desc    Get enrolled users in Moodle course
// @route   GET /api/moodle/courses/:courseId/users
// @access  Private/Instructor
const getMoodleCourseUsers = async (req, res) => {
  try {
    const users = await moodleService.getEnrolledUsers(req.params.courseId);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get Moodle course users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle course users',
      error: error.message
    });
  }
};

// @desc    Get Moodle assignments for a course
// @route   GET /api/moodle/courses/:courseId/assignments
// @access  Private/Instructor
const getMoodleAssignments = async (req, res) => {
  try {
    const assignments = await moodleService.getCourseAssignments(req.params.courseId);
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get Moodle assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle assignments',
      error: error.message
    });
  }
};

// @desc    Get Moodle grades for a course
// @route   GET /api/moodle/courses/:courseId/grades
// @access  Private
const getMoodleGrades = async (req, res) => {
  try {
    const { userId } = req.query;
    const moodleUserId = userId || req.user.moodleUserId;

    if (!moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'Moodle user ID required'
      });
    }

    const grades = await moodleService.getCourseGrades(req.params.courseId, moodleUserId);
    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Get Moodle grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle grades',
      error: error.message
    });
  }
};

// @desc    Get user's Moodle courses
// @route   GET /api/moodle/my-courses
// @access  Private
const getMyMoodleCourses = async (req, res) => {
  try {
    if (!req.user.moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const courses = await moodleService.getUserCourses(req.user.moodleUserId);
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Get my Moodle courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle courses',
      error: error.message
    });
  }
};

// @desc    Get Moodle categories
// @route   GET /api/moodle/categories
// @access  Private/Instructor
const getMoodleCategories = async (req, res) => {
  try {
    const categories = await moodleService.getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get Moodle categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle categories',
      error: error.message
    });
  }
};

// @desc    Enroll user in Moodle course
// @route   POST /api/moodle/courses/:courseId/enroll
// @access  Private/Instructor
const enrollUserInMoodle = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    // Get user's Moodle ID
    const user = await User.findById(userId);
    if (!user || !user.moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a linked Moodle account'
      });
    }

    await moodleService.enrollUser(
      user.moodleUserId,
      req.params.courseId,
      roleId || 5 // Default to student role
    );

    res.json({
      success: true,
      message: 'User enrolled in Moodle course successfully'
    });
  } catch (error) {
    console.error('Enroll user in Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling user in Moodle',
      error: error.message
    });
  }
};

// @desc    Unenroll user from Moodle course
// @route   DELETE /api/moodle/courses/:courseId/unenroll
// @access  Private/Instructor
const unenrollUserFromMoodle = async (req, res) => {
  try {
    const { userId } = req.body;

    // Get user's Moodle ID
    const user = await User.findById(userId);
    if (!user || !user.moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'User does not have a linked Moodle account'
      });
    }

    await moodleService.unenrollUser(user.moodleUserId, req.params.courseId);

    res.json({
      success: true,
      message: 'User unenrolled from Moodle course successfully'
    });
  } catch (error) {
    console.error('Unenroll user from Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling user from Moodle',
      error: error.message
    });
  }
};

// @desc    Get Moodle calendar events
// @route   GET /api/moodle/calendar
// @access  Private
const getMoodleCalendarEvents = async (req, res) => {
  try {
    const { courseIds, timeStart, timeEnd } = req.query;
    const events = await moodleService.getCalendarEvents({
      courseIds: courseIds ? courseIds.split(',').map(Number) : [],
      timeStart,
      timeEnd
    });
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get Moodle calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle calendar events',
      error: error.message
    });
  }
};

// @desc    Get user's Moodle notifications
// @route   GET /api/moodle/notifications
// @access  Private
const getMoodleNotifications = async (req, res) => {
  try {
    if (!req.user.moodleUserId) {
      return res.status(400).json({
        success: false,
        message: 'Moodle account not linked'
      });
    }

    const notifications = await moodleService.getUserNotifications(req.user.moodleUserId);
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get Moodle notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Moodle notifications',
      error: error.message
    });
  }
};

module.exports = {
  testConnection,
  getSiteInfo,
  getMoodleCourses,
  getMoodleCourse,
  getMoodleCourseContents,
  getMoodleUsers,
  getMoodleUser,
  getMoodleCourseUsers,
  getMoodleAssignments,
  getMoodleGrades,
  getMyMoodleCourses,
  getMoodleCategories,
  enrollUserInMoodle,
  unenrollUserFromMoodle,
  getMoodleCalendarEvents,
  getMoodleNotifications
};
