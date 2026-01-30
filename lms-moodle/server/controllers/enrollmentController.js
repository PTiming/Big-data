const { Enrollment, Course, User, Submission, Assignment } = require('../models');
const moodleService = require('../services/moodleService');

// @desc    Get enrollment details
// @route   GET /api/enrollments/:id
// @access  Private
const getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user', 'firstName lastName email avatar')
      .populate('course', 'title shortName instructor');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment',
      error: error.message
    });
  }
};

// @desc    Get enrollments for a course
// @route   GET /api/enrollments/course/:courseId
// @access  Private/Instructor
const getCourseEnrollments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check ownership
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('user', 'firstName lastName email avatar')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// @desc    Get my enrollments
// @route   GET /api/enrollments/my-enrollments
// @access  Private
const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({
        path: 'course',
        select: 'title shortName thumbnail instructor category',
        populate: { path: 'instructor', select: 'firstName lastName' }
      })
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Get my enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// @desc    Update enrollment status
// @route   PUT /api/enrollments/:id/status
// @access  Private/Instructor
const updateEnrollmentStatus = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check ownership
    if (enrollment.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const { status } = req.body;
    enrollment.status = status;

    if (status === 'completed') {
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating enrollment status',
      error: error.message
    });
  }
};

// @desc    Update progress
// @route   PUT /api/enrollments/:id/progress
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const { moduleId, contentId } = req.body;

    // Add completed module
    if (moduleId && !enrollment.progress.completedModules.includes(moduleId)) {
      enrollment.progress.completedModules.push(moduleId);
    }

    // Add completed content
    if (contentId && moduleId) {
      const existingContent = enrollment.progress.completedContent.find(
        c => c.moduleId.toString() === moduleId && c.contentId.toString() === contentId
      );
      if (!existingContent) {
        enrollment.progress.completedContent.push({
          moduleId,
          contentId,
          completedAt: new Date()
        });
      }
    }

    // Calculate overall progress
    const course = await Course.findById(enrollment.course).populate('modules');
    if (course) {
      const totalContent = course.modules.reduce((sum, mod) => sum + (mod.content?.length || 0), 0);
      if (totalContent > 0) {
        enrollment.progress.overallProgress = Math.round(
          (enrollment.progress.completedContent.length / totalContent) * 100
        );
      }
    }

    await enrollment.save();

    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
};

// @desc    Get student grades for a course
// @route   GET /api/enrollments/:id/grades
// @access  Private
const getGrades = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id).populate('course');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check access
    if (enrollment.user.toString() !== req.user._id.toString() && 
        enrollment.course.instructor.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get all assignments for the course
    const assignments = await Assignment.find({ course: enrollment.course._id });
    
    // Get all submissions for this student
    const submissions = await Submission.find({
      student: enrollment.user,
      assignment: { $in: assignments.map(a => a._id) }
    });

    // Calculate grades
    const grades = assignments.map(assignment => {
      const submission = submissions.find(
        s => s.assignment.toString() === assignment._id.toString()
      );
      return {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          maxPoints: assignment.maxPoints,
          dueDate: assignment.dueDate
        },
        submission: submission ? {
          _id: submission._id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          isLate: submission.isLate,
          grade: submission.grade
        } : null
      };
    });

    // Calculate overall grade
    const gradedSubmissions = submissions.filter(s => s.grade?.points !== null);
    let overallGrade = null;
    if (gradedSubmissions.length > 0) {
      const totalPoints = gradedSubmissions.reduce((sum, s) => sum + s.grade.points, 0);
      const totalMaxPoints = gradedSubmissions.reduce((sum, s) => {
        const assignment = assignments.find(a => a._id.toString() === s.assignment.toString());
        return sum + (assignment?.maxPoints || 0);
      }, 0);
      if (totalMaxPoints > 0) {
        overallGrade = Math.round((totalPoints / totalMaxPoints) * 100);
      }
    }

    res.json({
      success: true,
      data: {
        grades,
        overallGrade
      }
    });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching grades',
      error: error.message
    });
  }
};

// @desc    Sync enrollments from Moodle
// @route   POST /api/enrollments/sync-from-moodle/:courseId
// @access  Private/Instructor
const syncEnrollmentsFromMoodle = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.moodleCourseId) {
      return res.status(400).json({
        success: false,
        message: 'Course is not linked to Moodle'
      });
    }

    // Get enrolled users from Moodle
    const moodleUsers = await moodleService.getEnrolledUsers(course.moodleCourseId);

    let syncedCount = 0;

    for (const moodleUser of moodleUsers) {
      // Find or create user in our system
      let user = await User.findOne({ moodleUserId: moodleUser.id });
      
      if (!user) {
        // Try to find by email
        user = await User.findOne({ email: moodleUser.email });
        if (user) {
          // Link Moodle account
          user.moodleUserId = moodleUser.id;
          user.moodleUsername = moodleUser.username;
          await user.save();
        }
      }

      if (user) {
        // Check if enrollment exists
        const existingEnrollment = await Enrollment.findOne({
          user: user._id,
          course: course._id
        });

        if (!existingEnrollment) {
          // Create enrollment
          await Enrollment.create({
            user: user._id,
            course: course._id,
            syncedFromMoodle: true
          });

          // Update course enrolled students
          await Course.findByIdAndUpdate(course._id, {
            $addToSet: { enrolledStudents: user._id }
          });

          // Update user enrolled courses
          await User.findByIdAndUpdate(user._id, {
            $addToSet: { enrolledCourses: course._id }
          });

          syncedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} enrollments from Moodle`,
      data: {
        syncedCount,
        totalMoodleUsers: moodleUsers.length
      }
    });
  } catch (error) {
    console.error('Sync enrollments from Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing enrollments from Moodle',
      error: error.message
    });
  }
};

module.exports = {
  getEnrollment,
  getCourseEnrollments,
  getMyEnrollments,
  updateEnrollmentStatus,
  updateProgress,
  getGrades,
  syncEnrollmentsFromMoodle
};
