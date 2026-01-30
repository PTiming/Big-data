const express = require('express');
const router = express.Router();
const { protect, instructor, admin } = require('../middleware/auth');
const {
  getEnrollment,
  getCourseEnrollments,
  getMyEnrollments,
  updateEnrollmentStatus,
  updateProgress,
  getGrades,
  syncEnrollmentsFromMoodle
} = require('../controllers/enrollmentController');

// Routes
router.get('/my-enrollments', protect, getMyEnrollments);
router.get('/course/:courseId', protect, instructor, getCourseEnrollments);
router.get('/:id', protect, getEnrollment);
router.put('/:id/status', protect, instructor, updateEnrollmentStatus);
router.put('/:id/progress', protect, updateProgress);
router.get('/:id/grades', protect, getGrades);

// Moodle sync routes
router.post('/sync-from-moodle/:courseId', protect, instructor, syncEnrollmentsFromMoodle);

module.exports = router;
