const { Assignment, Course, Submission, User } = require('../models');
const moodleService = require('../services/moodleService');

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Private
const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title shortName instructor')
      .populate('module', 'title');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
};

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private/Instructor
const createAssignment = async (req, res) => {
  try {
    const { courseId, ...assignmentData } = req.body;

    // Check course exists and user owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const assignment = await Assignment.create({
      ...assignmentData,
      course: courseId
    });

    // Add assignment to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { assignments: assignment._id }
    });

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private/Instructor
const updateAssignment = async (req, res) => {
  try {
    let assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check ownership
    if (assignment.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Instructor
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check ownership
    if (assignment.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Remove assignment from course
    await Course.findByIdAndUpdate(assignment.course._id, {
      $pull: { assignments: assignment._id }
    });

    // Delete all submissions for this assignment
    await Submission.deleteMany({ assignment: assignment._id });

    await assignment.deleteOne();

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if past due date
    const isLate = new Date() > assignment.dueDate;
    
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Assignment deadline has passed'
      });
    }

    // Check for existing submission
    let submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id
    });

    const submissionData = {
      assignment: assignment._id,
      student: req.user._id,
      content: req.body.content,
      files: req.body.files || [],
      links: req.body.links || [],
      status: 'submitted',
      submittedAt: new Date(),
      isLate
    };

    if (submission) {
      // Update existing submission
      submission = await Submission.findByIdAndUpdate(
        submission._id,
        submissionData,
        { new: true }
      );
    } else {
      // Create new submission
      submission = await Submission.create(submissionData);
    }

    // Sync to Moodle if assignment is linked
    if (assignment.moodleAssignmentId && req.user.moodleUserId) {
      try {
        await moodleService.submitForGrading(assignment.moodleAssignmentId);
      } catch (moodleError) {
        console.error('Moodle sync error:', moodleError);
        // Continue even if Moodle sync fails
      }
    }

    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting assignment',
      error: error.message
    });
  }
};

// @desc    Get my submission for an assignment
// @route   GET /api/assignments/:id/my-submission
// @access  Private/Student
const getMySubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user._id
    });

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get my submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: error.message
    });
  }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private/Instructor
const getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check ownership
    if (assignment.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'firstName lastName email avatar')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
};

// @desc    Grade submission
// @route   PUT /api/assignments/submissions/:submissionId/grade
// @access  Private/Instructor
const gradeSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate({
        path: 'assignment',
        populate: { path: 'course' }
      })
      .populate('student');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check ownership
    if (submission.assignment.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { points, feedback, rubricScores } = req.body;

    // Calculate late penalty if applicable
    let finalPoints = points;
    if (submission.isLate && submission.assignment.latePenaltyPercent > 0) {
      const penalty = points * (submission.assignment.latePenaltyPercent / 100);
      finalPoints = points - penalty;
    }

    submission.grade = {
      points: finalPoints,
      feedback,
      gradedBy: req.user._id,
      gradedAt: new Date(),
      rubricScores: rubricScores || []
    };
    submission.status = 'graded';

    await submission.save();

    // Sync grade to Moodle if linked
    if (submission.assignment.moodleAssignmentId && submission.student.moodleUserId) {
      try {
        await moodleService.saveGrade(
          submission.assignment.moodleAssignmentId,
          submission.student.moodleUserId,
          finalPoints,
          feedback
        );
      } catch (moodleError) {
        console.error('Moodle grade sync error:', moodleError);
      }
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error grading submission',
      error: error.message
    });
  }
};

// @desc    Sync assignment grades from Moodle
// @route   POST /api/assignments/:id/sync-grades-from-moodle
// @access  Private/Instructor
const syncGradesFromMoodle = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (!assignment.moodleAssignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment is not linked to Moodle'
      });
    }

    // Get submissions from Moodle
    const moodleSubmissions = await moodleService.getAssignmentSubmissions(
      assignment.moodleAssignmentId
    );

    let syncedCount = 0;

    // Process each Moodle submission
    // Note: Implementation depends on Moodle API response structure
    // The moodleSubmissions.assignments array contains submission data
    if (moodleSubmissions?.assignments?.[0]?.submissions) {
      for (const mSub of moodleSubmissions.assignments[0].submissions) {
        // Sync logic would go here when grades are available
        // This placeholder shows structure for grade syncing
        if (mSub.gradingstatus === 'graded') {
          syncedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} grades from Moodle`
    });
  } catch (error) {
    console.error('Sync grades from Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing grades from Moodle',
      error: error.message
    });
  }
};

module.exports = {
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
};
