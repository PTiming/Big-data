const { Module, Course } = require('../models');

// @desc    Get modules for a course
// @route   GET /api/modules/course/:courseId
// @access  Public
const getModules = async (req, res) => {
  try {
    const modules = await Module.find({ course: req.params.courseId })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching modules',
      error: error.message
    });
  }
};

// @desc    Get single module
// @route   GET /api/modules/:id
// @access  Public
const getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate('course', 'title shortName instructor');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching module',
      error: error.message
    });
  }
};

// @desc    Create module
// @route   POST /api/modules
// @access  Private/Instructor
const createModule = async (req, res) => {
  try {
    const { courseId, ...moduleData } = req.body;

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

    // Get max order
    const maxOrder = await Module.findOne({ course: courseId }).sort({ order: -1 });
    const order = maxOrder ? maxOrder.order + 1 : 0;

    const module = await Module.create({
      ...moduleData,
      course: courseId,
      order
    });

    // Add module to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { modules: module._id }
    });

    res.status(201).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating module',
      error: error.message
    });
  }
};

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private/Instructor
const updateModule = async (req, res) => {
  try {
    let module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    module = await Module.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating module',
      error: error.message
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private/Instructor
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Remove module from course
    await Course.findByIdAndUpdate(module.course._id, {
      $pull: { modules: module._id }
    });

    await module.deleteOne();

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting module',
      error: error.message
    });
  }
};

// @desc    Add content to module
// @route   POST /api/modules/:id/content
// @access  Private/Instructor
const addContent = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const maxOrder = module.content.length > 0 
      ? Math.max(...module.content.map(c => c.order)) + 1 
      : 0;

    const content = {
      ...req.body,
      order: req.body.order ?? maxOrder
    };

    module.content.push(content);
    await module.save();

    res.status(201).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Add content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding content',
      error: error.message
    });
  }
};

// @desc    Update content in module
// @route   PUT /api/modules/:id/content/:contentId
// @access  Private/Instructor
const updateContent = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const contentIndex = module.content.findIndex(
      c => c._id.toString() === req.params.contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    module.content[contentIndex] = {
      ...module.content[contentIndex].toObject(),
      ...req.body
    };

    await module.save();

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
      error: error.message
    });
  }
};

// @desc    Delete content from module
// @route   DELETE /api/modules/:id/content/:contentId
// @access  Private/Instructor
const deleteContent = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check ownership
    if (module.course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    module.content = module.content.filter(
      c => c._id.toString() !== req.params.contentId
    );

    await module.save();

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
};

// @desc    Reorder modules
// @route   PUT /api/modules/reorder
// @access  Private/Instructor
const reorderModules = async (req, res) => {
  try {
    const { courseId, moduleOrders } = req.body;

    // Check course ownership
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

    // Update each module's order
    for (const item of moduleOrders) {
      await Module.findByIdAndUpdate(item.moduleId, { order: item.order });
    }

    res.json({
      success: true,
      message: 'Modules reordered successfully'
    });
  } catch (error) {
    console.error('Reorder modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering modules',
      error: error.message
    });
  }
};

module.exports = {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  addContent,
  updateContent,
  deleteContent,
  reorderModules
};
