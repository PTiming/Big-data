const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, instructor } = require('../middleware/auth');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  unenrollFromCourse,
  getMyCourses,
  syncFromMoodle,
  syncToMoodle,
  getMoodleCourses
} = require('../controllers/courseController');

// Validation rules
const courseValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('shortName').trim().isLength({ min: 1, max: 50 }).withMessage('Short name is required (max 50 chars)'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['programming', 'mathematics', 'science', 'language', 'business', 'arts', 'other']).withMessage('Invalid category')
];

// Public routes
router.get('/', getCourses);
router.get('/moodle', protect, instructor, getMoodleCourses);
router.get('/my-courses', protect, getMyCourses);
router.get('/:id', getCourse);

// Protected routes
router.post('/', protect, instructor, courseValidation, validate, createCourse);
router.put('/:id', protect, instructor, updateCourse);
router.delete('/:id', protect, instructor, deleteCourse);

// Enrollment routes
router.post('/:id/enroll', protect, enrollInCourse);
router.delete('/:id/unenroll', protect, unenrollFromCourse);

// Moodle sync routes
router.post('/sync-from-moodle/:moodleCourseId', protect, instructor, syncFromMoodle);
router.post('/:id/sync-to-moodle', protect, instructor, syncToMoodle);

module.exports = router;
