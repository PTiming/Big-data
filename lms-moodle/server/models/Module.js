const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  content: [{
    type: {
      type: String,
      enum: ['video', 'document', 'quiz', 'link', 'text'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 0 // in minutes
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  // Moodle Integration
  moodleSectionId: {
    type: Number,
    default: null
  },
  moodleActivityIds: [{
    type: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Module', moduleSchema);
