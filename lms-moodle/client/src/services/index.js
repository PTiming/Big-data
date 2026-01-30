import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/auth/password', data);
    return response.data;
  },

  linkMoodle: async (moodleUsername) => {
    const response = await api.post('/auth/link-moodle', { moodleUsername });
    return response.data;
  },

  unlinkMoodle: async () => {
    const response = await api.delete('/auth/unlink-moodle');
    return response.data;
  }
};

export const courseService = {
  getCourses: async (params) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (data) => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  updateCourse: async (id, data) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  getMyCourses: async () => {
    const response = await api.get('/courses/my-courses');
    return response.data;
  },

  enrollInCourse: async (id) => {
    const response = await api.post(`/courses/${id}/enroll`);
    return response.data;
  },

  unenrollFromCourse: async (id) => {
    const response = await api.delete(`/courses/${id}/unenroll`);
    return response.data;
  },

  getMoodleCourses: async () => {
    const response = await api.get('/courses/moodle');
    return response.data;
  },

  syncFromMoodle: async (moodleCourseId) => {
    const response = await api.post(`/courses/sync-from-moodle/${moodleCourseId}`);
    return response.data;
  },

  syncToMoodle: async (id) => {
    const response = await api.post(`/courses/${id}/sync-to-moodle`);
    return response.data;
  }
};

export const moduleService = {
  getModules: async (courseId) => {
    const response = await api.get(`/modules/course/${courseId}`);
    return response.data;
  },

  getModule: async (id) => {
    const response = await api.get(`/modules/${id}`);
    return response.data;
  },

  createModule: async (data) => {
    const response = await api.post('/modules', data);
    return response.data;
  },

  updateModule: async (id, data) => {
    const response = await api.put(`/modules/${id}`, data);
    return response.data;
  },

  deleteModule: async (id) => {
    const response = await api.delete(`/modules/${id}`);
    return response.data;
  },

  addContent: async (id, data) => {
    const response = await api.post(`/modules/${id}/content`, data);
    return response.data;
  },

  updateContent: async (moduleId, contentId, data) => {
    const response = await api.put(`/modules/${moduleId}/content/${contentId}`, data);
    return response.data;
  },

  deleteContent: async (moduleId, contentId) => {
    const response = await api.delete(`/modules/${moduleId}/content/${contentId}`);
    return response.data;
  }
};

export const assignmentService = {
  getAssignments: async (courseId) => {
    const response = await api.get(`/assignments/course/${courseId}`);
    return response.data;
  },

  getAssignment: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (data) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  updateAssignment: async (id, data) => {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  submitAssignment: async (id, data) => {
    const response = await api.post(`/assignments/${id}/submit`, data);
    return response.data;
  },

  getMySubmission: async (id) => {
    const response = await api.get(`/assignments/${id}/my-submission`);
    return response.data;
  },

  getSubmissions: async (id) => {
    const response = await api.get(`/assignments/${id}/submissions`);
    return response.data;
  },

  gradeSubmission: async (submissionId, data) => {
    const response = await api.put(`/assignments/submissions/${submissionId}/grade`, data);
    return response.data;
  }
};

export const enrollmentService = {
  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my-enrollments');
    return response.data;
  },

  getCourseEnrollments: async (courseId) => {
    const response = await api.get(`/enrollments/course/${courseId}`);
    return response.data;
  },

  getEnrollment: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  updateProgress: async (id, data) => {
    const response = await api.put(`/enrollments/${id}/progress`, data);
    return response.data;
  },

  getGrades: async (id) => {
    const response = await api.get(`/enrollments/${id}/grades`);
    return response.data;
  },

  syncFromMoodle: async (courseId) => {
    const response = await api.post(`/enrollments/sync-from-moodle/${courseId}`);
    return response.data;
  }
};

export const moodleService = {
  testConnection: async () => {
    const response = await api.get('/moodle/test-connection');
    return response.data;
  },

  getSiteInfo: async () => {
    const response = await api.get('/moodle/site-info');
    return response.data;
  },

  getMoodleCourses: async () => {
    const response = await api.get('/moodle/courses');
    return response.data;
  },

  getMoodleCourse: async (id) => {
    const response = await api.get(`/moodle/courses/${id}`);
    return response.data;
  },

  getMoodleCourseContents: async (id) => {
    const response = await api.get(`/moodle/courses/${id}/contents`);
    return response.data;
  },

  getMoodleUsers: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/users`);
    return response.data;
  },

  getMyMoodleCourses: async () => {
    const response = await api.get('/moodle/my-courses');
    return response.data;
  },

  getMoodleAssignments: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/assignments`);
    return response.data;
  },

  getMoodleGrades: async (courseId) => {
    const response = await api.get(`/moodle/courses/${courseId}/grades`);
    return response.data;
  },

  getMoodleCategories: async () => {
    const response = await api.get('/moodle/categories');
    return response.data;
  }
};
