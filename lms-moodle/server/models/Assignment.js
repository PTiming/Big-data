const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    default: null
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxPoints: {
    type: Number,
    required: true,
    default: 100,
    min: 0
  },
  passingPoints: {
    type: Number,
    default: 60,
    min: 0
  },
  submissionType: {
    type: String,
    enum: ['file', 'text', 'link', 'multiple'],
    default: 'file'
  },
  allowedFileTypes: [{
    type: String
  }],
  maxFileSize: {
    type: Number,
    default: 10485760 // 10MB in bytes
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  latePenaltyPercent: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  instructions: {
    type: String,
    default: ''
  },
  rubric: [{
    criterion: String,
    description: String,
    maxPoints: Number
  }],
  // Moodle Integration
  moodleAssignmentId: {
    type: Number,
    default: null
  },
  syncedFromMoodle: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
