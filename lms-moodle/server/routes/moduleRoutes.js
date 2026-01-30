const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, instructor } = require('../middleware/auth');
const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  addContent,
  updateContent,
  deleteContent,
  reorderModules
} = require('../controllers/moduleController');

// Validation rules
const moduleValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('courseId').isMongoId().withMessage('Valid course ID is required')
];

const contentValidation = [
  body('type').isIn(['video', 'document', 'quiz', 'link', 'text']).withMessage('Invalid content type'),
  body('title').trim().notEmpty().withMessage('Title is required')
];

// Routes
router.get('/course/:courseId', getModules);
router.get('/:id', getModule);
router.post('/', protect, instructor, moduleValidation, validate, createModule);
router.put('/reorder', protect, instructor, reorderModules);
router.put('/:id', protect, instructor, updateModule);
router.delete('/:id', protect, instructor, deleteModule);

// Content routes
router.post('/:id/content', protect, instructor, contentValidation, validate, addContent);
router.put('/:id/content/:contentId', protect, instructor, updateContent);
router.delete('/:id/content/:contentId', protect, instructor, deleteContent);

module.exports = router;
