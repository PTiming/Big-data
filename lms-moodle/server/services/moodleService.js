const axios = require('axios');

class MoodleService {
  constructor() {
    this.baseUrl = process.env.MOODLE_URL;
    this.token = process.env.MOODLE_TOKEN;
    this.wsPath = '/webservice/rest/server.php';
    
    // Validate configuration - warn if not set but allow service to be created
    if (!this.baseUrl || !this.token) {
      console.warn('Moodle configuration incomplete. MOODLE_URL and MOODLE_TOKEN must be set for Moodle integration to work.');
    }
  }
  
  // Check if Moodle is configured
  isConfigured() {
    return !!(this.baseUrl && this.token);
  }

  // Make API request to Moodle
  async makeRequest(wsfunction, params = {}) {
    try {
      const url = `${this.baseUrl}${this.wsPath}`;
      const requestParams = {
        wstoken: this.token,
        wsfunction,
        moodlewsrestformat: 'json',
        ...params
      };

      const response = await axios.get(url, { params: requestParams });

      // Check for Moodle error response
      if (response.data && response.data.exception) {
        throw new Error(`Moodle Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Moodle API Error (${wsfunction}):`, error.message);
      throw error;
    }
  }

  // ==================== USER FUNCTIONS ====================

  // Get all users from Moodle
  async getUsers(criteria = {}) {
    const params = {};
    let index = 0;
    
    for (const [key, value] of Object.entries(criteria)) {
      params[`criteria[${index}][key]`] = key;
      params[`criteria[${index}][value]`] = value;
      index++;
    }

    return await this.makeRequest('core_user_get_users', params);
  }

  // Get user by ID
  async getUserById(userId) {
    const result = await this.makeRequest('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': userId
    });
    return result[0] || null;
  }

  // Get user by username
  async getUserByUsername(username) {
    const result = await this.makeRequest('core_user_get_users_by_field', {
      field: 'username',
      'values[0]': username
    });
    return result[0] || null;
  }

  // Get user by email
  async getUserByEmail(email) {
    const result = await this.makeRequest('core_user_get_users_by_field', {
      field: 'email',
      'values[0]': email
    });
    return result[0] || null;
  }

  // Create user in Moodle
  async createUser(userData) {
    const params = {
      'users[0][username]': userData.username,
      'users[0][password]': userData.password,
      'users[0][firstname]': userData.firstName,
      'users[0][lastname]': userData.lastName,
      'users[0][email]': userData.email,
      'users[0][auth]': 'manual'
    };
    return await this.makeRequest('core_user_create_users', params);
  }

  // Update user in Moodle
  async updateUser(userId, userData) {
    const params = {
      'users[0][id]': userId
    };
    if (userData.firstName) params['users[0][firstname]'] = userData.firstName;
    if (userData.lastName) params['users[0][lastname]'] = userData.lastName;
    if (userData.email) params['users[0][email]'] = userData.email;

    return await this.makeRequest('core_user_update_users', params);
  }

  // ==================== COURSE FUNCTIONS ====================

  // Get all courses
  async getCourses() {
    return await this.makeRequest('core_course_get_courses');
  }

  // Get course by ID
  async getCourseById(courseId) {
    const params = {
      'options[ids][0]': courseId
    };
    const result = await this.makeRequest('core_course_get_courses', params);
    return result[0] || null;
  }

  // Get courses by field
  async getCoursesByField(field, value) {
    return await this.makeRequest('core_course_get_courses_by_field', {
      field,
      value
    });
  }

  // Get course contents (modules/sections)
  async getCourseContents(courseId) {
    return await this.makeRequest('core_course_get_contents', {
      courseid: courseId
    });
  }

  // Get course categories
  async getCategories() {
    return await this.makeRequest('core_course_get_categories');
  }

  // Create course in Moodle
  async createCourse(courseData) {
    const params = {
      'courses[0][fullname]': courseData.title,
      'courses[0][shortname]': courseData.shortName,
      'courses[0][categoryid]': courseData.categoryId || 1,
      'courses[0][summary]': courseData.description || ''
    };

    if (courseData.startDate) {
      params['courses[0][startdate]'] = Math.floor(new Date(courseData.startDate).getTime() / 1000);
    }
    if (courseData.endDate) {
      params['courses[0][enddate]'] = Math.floor(new Date(courseData.endDate).getTime() / 1000);
    }

    return await this.makeRequest('core_course_create_courses', params);
  }

  // Update course in Moodle
  async updateCourse(courseId, courseData) {
    const params = {
      'courses[0][id]': courseId
    };
    if (courseData.title) params['courses[0][fullname]'] = courseData.title;
    if (courseData.shortName) params['courses[0][shortname]'] = courseData.shortName;
    if (courseData.description) params['courses[0][summary]'] = courseData.description;

    return await this.makeRequest('core_course_update_courses', params);
  }

  // ==================== ENROLLMENT FUNCTIONS ====================

  // Get enrolled users in a course
  async getEnrolledUsers(courseId) {
    return await this.makeRequest('core_enrol_get_enrolled_users', {
      courseid: courseId
    });
  }

  // Get user's enrolled courses
  async getUserCourses(userId) {
    return await this.makeRequest('core_enrol_get_users_courses', {
      userid: userId
    });
  }

  // Enroll user in course
  async enrollUser(userId, courseId, roleId = 5) {
    // roleId 5 = student by default
    const params = {
      'enrolments[0][roleid]': roleId,
      'enrolments[0][userid]': userId,
      'enrolments[0][courseid]': courseId
    };
    return await this.makeRequest('enrol_manual_enrol_users', params);
  }

  // Unenroll user from course
  async unenrollUser(userId, courseId) {
    const params = {
      'enrolments[0][userid]': userId,
      'enrolments[0][courseid]': courseId
    };
    return await this.makeRequest('enrol_manual_unenrol_users', params);
  }

  // ==================== ASSIGNMENT FUNCTIONS ====================

  // Get assignments in a course
  async getCourseAssignments(courseId) {
    const params = {
      'courseids[0]': courseId
    };
    const result = await this.makeRequest('mod_assign_get_assignments', params);
    return result.courses?.[0]?.assignments || [];
  }

  // Get all assignments for multiple courses
  async getAssignments(courseIds = []) {
    const params = {};
    courseIds.forEach((id, index) => {
      params[`courseids[${index}]`] = id;
    });
    return await this.makeRequest('mod_assign_get_assignments', params);
  }

  // Get assignment submissions
  async getAssignmentSubmissions(assignmentId, status = '') {
    const params = {
      'assignmentids[0]': assignmentId
    };
    if (status) {
      params.status = status;
    }
    return await this.makeRequest('mod_assign_get_submissions', params);
  }

  // Get user's submission for an assignment
  async getUserSubmission(assignmentId, userId) {
    return await this.makeRequest('mod_assign_get_submission_status', {
      assignid: assignmentId,
      userid: userId
    });
  }

  // Save submission for assignment
  async saveSubmission(assignmentId, pluginData) {
    const params = {
      assignmentid: assignmentId,
      ...pluginData
    };
    return await this.makeRequest('mod_assign_save_submission', params);
  }

  // Submit assignment for grading
  async submitForGrading(assignmentId, acceptSubmissionStatement = true) {
    return await this.makeRequest('mod_assign_submit_for_grading', {
      assignmentid: assignmentId,
      acceptsubmissionstatement: acceptSubmissionStatement ? 1 : 0
    });
  }

  // ==================== GRADE FUNCTIONS ====================

  // Get grades for a course
  async getCourseGrades(courseId, userId = null) {
    const params = {
      courseid: courseId
    };
    if (userId) {
      params.userid = userId;
    }
    return await this.makeRequest('gradereport_user_get_grade_items', params);
  }

  // Get user grades across all courses
  async getUserGrades(userId) {
    return await this.makeRequest('gradereport_overview_get_course_grades', {
      userid: userId
    });
  }

  // Save grade for assignment
  async saveGrade(assignmentId, userId, grade, feedbackText = '') {
    return await this.makeRequest('mod_assign_save_grade', {
      assignmentid: assignmentId,
      userid: userId,
      grade,
      attemptnumber: -1,
      addattempt: 0,
      workflowstate: 'graded',
      applytoall: 0,
      'plugindata[assignfeedbackcomments_editor][text]': feedbackText,
      'plugindata[assignfeedbackcomments_editor][format]': 1
    });
  }

  // ==================== QUIZ FUNCTIONS ====================

  // Get quizzes in a course
  async getCourseQuizzes(courseId) {
    return await this.makeRequest('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': courseId
    });
  }

  // Get quiz attempt data
  async getQuizAttempt(attemptId) {
    return await this.makeRequest('mod_quiz_get_attempt_data', {
      attemptid: attemptId,
      page: 0
    });
  }

  // Get user's quiz attempts
  async getUserQuizAttempts(quizId, userId) {
    return await this.makeRequest('mod_quiz_get_user_attempts', {
      quizid: quizId,
      userid: userId,
      status: 'all'
    });
  }

  // ==================== SITE INFO ====================

  // Get site info
  async getSiteInfo() {
    return await this.makeRequest('core_webservice_get_site_info');
  }

  // Check if connection is valid
  async testConnection() {
    try {
      const siteInfo = await this.getSiteInfo();
      return {
        connected: true,
        sitename: siteInfo.sitename,
        username: siteInfo.username,
        version: siteInfo.release
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // ==================== CALENDAR/EVENTS ====================

  // Get calendar events
  async getCalendarEvents(options = {}) {
    const params = {};
    if (options.courseIds) {
      options.courseIds.forEach((id, index) => {
        params[`events[courseids][${index}]`] = id;
      });
    }
    if (options.timeStart) {
      params['options[timestart]'] = Math.floor(new Date(options.timeStart).getTime() / 1000);
    }
    if (options.timeEnd) {
      params['options[timeend]'] = Math.floor(new Date(options.timeEnd).getTime() / 1000);
    }
    return await this.makeRequest('core_calendar_get_calendar_events', params);
  }

  // ==================== NOTIFICATIONS ====================

  // Get user notifications
  async getUserNotifications(userId) {
    return await this.makeRequest('core_message_get_messages', {
      useridfrom: 0,
      useridto: userId,
      type: 'notifications',
      read: 0,
      newestfirst: 1
    });
  }

  // ==================== FORUM FUNCTIONS ====================

  // Get forums in a course
  async getCourseForums(courseId) {
    return await this.makeRequest('mod_forum_get_forums_by_courses', {
      'courseids[0]': courseId
    });
  }

  // Get forum discussions
  async getForumDiscussions(forumId, sortBy = 'timemodified', sortDirection = 'DESC') {
    return await this.makeRequest('mod_forum_get_forum_discussions', {
      forumid: forumId,
      sortby: sortBy,
      sortdirection: sortDirection
    });
  }

  // Add forum discussion
  async addForumDiscussion(forumId, subject, message) {
    return await this.makeRequest('mod_forum_add_discussion', {
      forumid: forumId,
      subject,
      message,
      'options[discussionsubscribe]': 1
    });
  }

  // Add forum post (reply)
  async addForumPost(postId, subject, message) {
    return await this.makeRequest('mod_forum_add_discussion_post', {
      postid: postId,
      subject,
      message
    });
  }
}

module.exports = new MoodleService();
