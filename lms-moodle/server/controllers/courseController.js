const { Course, User, Module, Assignment, Enrollment } = require('../models');
const moodleService = require('../services/moodleService');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search,
      instructor,
      isPublished = true 
    } = req.query;

    const query = {};
    
    if (isPublished === 'true' || isPublished === true) {
      query.isPublished = true;
    }
    if (category) query.category = category;
    if (instructor) query.instructor = instructor;
    if (search) {
      query.$text = { $search: search };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName avatar email')
      .populate('modules')
      .populate('assignments')
      .populate('enrolledStudents', 'firstName lastName avatar');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Instructor
const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor: req.user._id
    };

    const course = await Course.create(courseData);

    // Add course to instructor's created courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdCourses: course._id }
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Instructor
const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

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
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

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
        message: 'Not authorized to delete this course'
      });
    }

    // Remove course from instructor's created courses
    await User.findByIdAndUpdate(course.instructor, {
      $pull: { createdCourses: course._id }
    });

    // Remove course from all enrolled students
    await User.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    // Delete all enrollments for this course
    await Enrollment.deleteMany({ course: course._id });

    // Delete all modules for this course
    await Module.deleteMany({ course: course._id });

    // Delete the course
    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private
const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check enrollment limit
    if (course.enrollmentLimit > 0 && course.enrolledStudents.length >= course.enrollmentLimit) {
      return res.status(400).json({
        success: false,
        message: 'Course enrollment limit reached'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: course._id
    });

    // Add student to course
    await Course.findByIdAndUpdate(course._id, {
      $addToSet: { enrolledStudents: req.user._id }
    });

    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: course._id }
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
};

// @desc    Unenroll from course
// @route   DELETE /api/courses/:id/unenroll
// @access  Private
const unenrollFromCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete enrollment
    await Enrollment.findOneAndDelete({
      user: req.user._id,
      course: course._id
    });

    // Remove student from course
    await Course.findByIdAndUpdate(course._id, {
      $pull: { enrolledStudents: req.user._id }
    });

    // Remove course from user's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { enrolledCourses: course._id }
    });

    res.json({
      success: true,
      message: 'Unenrolled successfully'
    });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling from course',
      error: error.message
    });
  }
};

// @desc    Get my courses (enrolled or created)
// @route   GET /api/courses/my-courses
// @access  Private
const getMyCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses',
        populate: { path: 'instructor', select: 'firstName lastName' }
      })
      .populate({
        path: 'createdCourses',
        populate: { path: 'instructor', select: 'firstName lastName' }
      });

    res.json({
      success: true,
      data: {
        enrolled: user.enrolledCourses,
        created: user.createdCourses
      }
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// @desc    Sync course from Moodle
// @route   POST /api/courses/sync-from-moodle/:moodleCourseId
// @access  Private/Instructor
const syncFromMoodle = async (req, res) => {
  try {
    const { moodleCourseId } = req.params;

    // Get course from Moodle
    const moodleCourse = await moodleService.getCourseById(moodleCourseId);
    
    if (!moodleCourse) {
      return res.status(404).json({
        success: false,
        message: 'Moodle course not found'
      });
    }

    // Check if course already exists
    let course = await Course.findOne({ moodleCourseId: parseInt(moodleCourseId) });

    const courseData = {
      title: moodleCourse.fullname,
      shortName: moodleCourse.shortname,
      description: moodleCourse.summary || '',
      instructor: req.user._id,
      moodleCourseId: moodleCourse.id,
      moodleShortName: moodleCourse.shortname,
      syncedFromMoodle: true,
      lastMoodleSync: new Date(),
      startDate: moodleCourse.startdate ? new Date(moodleCourse.startdate * 1000) : null,
      endDate: moodleCourse.enddate ? new Date(moodleCourse.enddate * 1000) : null
    };

    if (course) {
      // Update existing course
      course = await Course.findByIdAndUpdate(course._id, courseData, { new: true });
    } else {
      // Create new course
      course = await Course.create(courseData);

      // Add to instructor's created courses
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { createdCourses: course._id }
      });
    }

    // Sync course contents (modules)
    const moodleContents = await moodleService.getCourseContents(moodleCourseId);
    
    for (const section of moodleContents) {
      let module = await Module.findOne({
        course: course._id,
        moodleSectionId: section.id
      });

      const moduleData = {
        title: section.name || `Section ${section.section}`,
        description: section.summary || '',
        course: course._id,
        order: section.section,
        moodleSectionId: section.id,
        isPublished: section.visible === 1,
        content: section.modules?.map((mod, index) => ({
          type: mapMoodleModuleType(mod.modname),
          title: mod.name,
          description: mod.description || '',
          url: mod.url || '',
          order: index
        })) || []
      };

      if (module) {
        await Module.findByIdAndUpdate(module._id, moduleData);
      } else {
        module = await Module.create(moduleData);
        await Course.findByIdAndUpdate(course._id, {
          $addToSet: { modules: module._id }
        });
      }
    }

    // Sync assignments
    const moodleAssignments = await moodleService.getCourseAssignments(moodleCourseId);
    
    for (const mAssignment of moodleAssignments) {
      let assignment = await Assignment.findOne({
        course: course._id,
        moodleAssignmentId: mAssignment.id
      });

      const assignmentData = {
        title: mAssignment.name,
        description: mAssignment.intro || '',
        course: course._id,
        dueDate: mAssignment.duedate ? new Date(mAssignment.duedate * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxPoints: mAssignment.grade || 100,
        moodleAssignmentId: mAssignment.id,
        syncedFromMoodle: true,
        isPublished: true
      };

      if (assignment) {
        await Assignment.findByIdAndUpdate(assignment._id, assignmentData);
      } else {
        assignment = await Assignment.create(assignmentData);
        await Course.findByIdAndUpdate(course._id, {
          $addToSet: { assignments: assignment._id }
        });
      }
    }

    // Fetch updated course with all relations
    course = await Course.findById(course._id)
      .populate('modules')
      .populate('assignments');

    res.json({
      success: true,
      message: 'Course synced from Moodle successfully',
      data: course
    });
  } catch (error) {
    console.error('Sync from Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing from Moodle',
      error: error.message
    });
  }
};

// @desc    Sync course to Moodle
// @route   POST /api/courses/:id/sync-to-moodle
// @access  Private/Instructor
const syncToMoodle = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('modules')
      .populate('assignments');

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

    let moodleCourseId = course.moodleCourseId;

    if (!moodleCourseId) {
      // Create course in Moodle
      const result = await moodleService.createCourse({
        title: course.title,
        shortName: course.shortName,
        description: course.description,
        startDate: course.startDate,
        endDate: course.endDate
      });

      moodleCourseId = result[0]?.id;

      if (!moodleCourseId) {
        throw new Error('Failed to create course in Moodle');
      }

      // Update course with Moodle ID
      await Course.findByIdAndUpdate(course._id, {
        moodleCourseId,
        moodleShortName: course.shortName,
        lastMoodleSync: new Date()
      });
    } else {
      // Update existing Moodle course
      await moodleService.updateCourse(moodleCourseId, {
        title: course.title,
        shortName: course.shortName,
        description: course.description
      });

      await Course.findByIdAndUpdate(course._id, {
        lastMoodleSync: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Course synced to Moodle successfully',
      data: {
        moodleCourseId
      }
    });
  } catch (error) {
    console.error('Sync to Moodle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing to Moodle',
      error: error.message
    });
  }
};

// @desc    Get Moodle courses
// @route   GET /api/courses/moodle
// @access  Private/Instructor
const getMoodleCourses = async (req, res) => {
  try {
    const moodleCourses = await moodleService.getCourses();
    
    // Filter out site-level courses
    const courses = moodleCourses.filter(c => c.id !== 1);

    res.json({
      success: true,
      data: courses
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

// Helper function to map Moodle module types
function mapMoodleModuleType(modname) {
  const typeMap = {
    'resource': 'document',
    'url': 'link',
    'page': 'text',
    'label': 'text',
    'quiz': 'quiz',
    'assign': 'document',
    'forum': 'text',
    'book': 'document',
    'folder': 'document',
    'video': 'video'
  };
  return typeMap[modname] || 'document';
}

module.exports = {
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
};
