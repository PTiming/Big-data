const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, instructor } = require('../middleware/auth');
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getMySubmission,
  getSubmissions,
  gradeSubmission,
  syncGradesFromMoodle
} = require('../controllers/assignmentController');

// Validation rules
const assignmentValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('courseId').isMongoId().withMessage('Valid course ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('maxPoints').isInt({ min: 0 }).withMessage('Max points must be a positive number')
];

const gradeValidation = [
  body('points').isFloat({ min: 0 }).withMessage('Points must be a positive number'),
  body('feedback').optional().isString()
];

// Routes
router.get('/course/:courseId', protect, getAssignments);
router.get('/:id', protect, getAssignment);
router.post('/', protect, instructor, assignmentValidation, validate, createAssignment);
router.put('/:id', protect, instructor, updateAssignment);
router.delete('/:id', protect, instructor, deleteAssignment);

// Submission routes
router.post('/:id/submit', protect, submitAssignment);
router.get('/:id/my-submission', protect, getMySubmission);
router.get('/:id/submissions', protect, instructor, getSubmissions);
router.put('/submissions/:submissionId/grade', protect, instructor, gradeValidation, validate, gradeSubmission);

// Moodle sync routes
router.post('/:id/sync-grades-from-moodle', protect, instructor, syncGradesFromMoodle);

module.exports = router;
