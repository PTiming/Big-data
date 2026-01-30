const express = require('express');
const router = express.Router();
const { protect, instructor, admin } = require('../middleware/auth');
const {
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
} = require('../controllers/moodleController');

// Test connection
router.get('/test-connection', protect, admin, testConnection);
router.get('/site-info', protect, admin, getSiteInfo);

// User routes
router.get('/my-courses', protect, getMyMoodleCourses);
router.get('/notifications', protect, getMoodleNotifications);
router.get('/calendar', protect, getMoodleCalendarEvents);

// Course routes
router.get('/courses', protect, instructor, getMoodleCourses);
router.get('/courses/:courseId', protect, instructor, getMoodleCourse);
router.get('/courses/:courseId/contents', protect, instructor, getMoodleCourseContents);
router.get('/courses/:courseId/users', protect, instructor, getMoodleCourseUsers);
router.get('/courses/:courseId/assignments', protect, instructor, getMoodleAssignments);
router.get('/courses/:courseId/grades', protect, getMoodleGrades);

// Enrollment management
router.post('/courses/:courseId/enroll', protect, instructor, enrollUserInMoodle);
router.delete('/courses/:courseId/unenroll', protect, instructor, unenrollUserFromMoodle);

// Admin routes
router.get('/users', protect, admin, getMoodleUsers);
router.get('/users/:userId', protect, getMoodleUser);
router.get('/categories', protect, instructor, getMoodleCategories);

module.exports = router;
