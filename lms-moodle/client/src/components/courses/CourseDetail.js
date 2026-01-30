import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';
import { courseService, moduleService, assignmentService } from '../../services';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isInstructor } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes] = await Promise.all([
        courseService.getCourse(id),
        moduleService.getModules(id)
      ]);

      if (courseRes.success) {
        setCourse(courseRes.data);
      }
      if (modulesRes.success) {
        setModules(modulesRes.data);
      }

      // Fetch assignments if user is authenticated
      if (isAuthenticated) {
        try {
          const assignmentsRes = await assignmentService.getAssignments(id);
          if (assignmentsRes.success) {
            setAssignments(assignmentsRes.data);
          }
        } catch (err) {
          // Ignore assignment fetch errors
        }
      }
    } catch (err) {
      setError('Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      const response = await courseService.enrollInCourse(id);
      if (response.success) {
        // Refresh course data
        fetchCourse();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    try {
      setEnrolling(true);
      await courseService.unenrollFromCourse(id);
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unenroll');
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = course?.enrolledStudents?.some(
    student => student._id === user?._id
  );

  const isOwner = course?.instructor?._id === user?._id;

  if (loading) {
    return <Loading size="large" text="Loading course..." />;
  }

  if (error || !course) {
    return (
      <div className="error-page">
        <h2>Course not found</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/courses')} className="btn btn-primary">
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <div className="course-hero" style={{
        background: course.thumbnail 
          ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${course.thumbnail})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="hero-content">
          <div className="hero-badges">
            <span className="category-badge">{course.category}</span>
            {course.syncedFromMoodle && (
              <span className="moodle-badge">Moodle Course</span>
            )}
          </div>
          
          <h1>{course.title}</h1>
          <p className="course-shortname">{course.shortName}</p>
          
          <div className="hero-meta">
            <div className="instructor-info">
              <span className="avatar">
                {course.instructor?.firstName?.charAt(0)}
              </span>
              <span>
                {course.instructor?.firstName} {course.instructor?.lastName}
              </span>
            </div>
            <span className="meta-separator">•</span>
            <span>{course.enrollmentCount || 0} students</span>
            {course.rating?.average > 0 && (
              <>
                <span className="meta-separator">•</span>
                <span>⭐ {course.rating.average.toFixed(1)}</span>
              </>
            )}
          </div>

          <div className="hero-actions">
            {isOwner ? (
              <button 
                onClick={() => navigate(`/instructor/courses/${id}/edit`)}
                className="btn btn-primary"
              >
                Edit Course
              </button>
            ) : isEnrolled ? (
              <div className="enrolled-actions">
                <button 
                  onClick={() => navigate(`/learn/${id}`)}
                  className="btn btn-primary"
                >
                  Continue Learning
                </button>
                <button 
                  onClick={handleUnenroll}
                  className="btn btn-outline-light"
                  disabled={enrolling}
                >
                  Unenroll
                </button>
              </div>
            ) : (
              <button 
                onClick={handleEnroll}
                className="btn btn-primary btn-lg"
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : (course.isFree ? 'Enroll for Free' : `Enroll - $${course.price}`)}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="course-content-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Course Content
          </button>
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {(isEnrolled || isOwner) && (
            <button 
              className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              Assignments ({assignments.length})
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'content' && (
            <div className="modules-list">
              {modules.length > 0 ? (
                modules.map((module, index) => (
                  <div key={module._id} className="module-item">
                    <div className="module-header">
                      <span className="module-number">{index + 1}</span>
                      <div className="module-info">
                        <h3>{module.title}</h3>
                        {module.description && <p>{module.description}</p>}
                      </div>
                      <span className="content-count">
                        {module.content?.length || 0} items
                      </span>
                    </div>
                    
                    {(isEnrolled || isOwner) && module.content?.length > 0 && (
                      <div className="module-content">
                        {module.content.map((content, idx) => (
                          <div key={content._id || idx} className="content-item">
                            <span className="content-icon">
                              {content.type === 'video' && '🎬'}
                              {content.type === 'document' && '📄'}
                              {content.type === 'quiz' && '📝'}
                              {content.type === 'link' && '🔗'}
                              {content.type === 'text' && '📖'}
                            </span>
                            <span className="content-title">{content.title}</span>
                            {content.duration > 0 && (
                              <span className="content-duration">{content.duration} min</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-content">No content available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="course-overview">
              <h2>About This Course</h2>
              <div className="description" dangerouslySetInnerHTML={{ __html: course.description }} />
              
              {course.tags?.length > 0 && (
                <div className="tags">
                  <h3>Topics</h3>
                  <div className="tag-list">
                    {course.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="course-info-grid">
                <div className="info-item">
                  <strong>Start Date</strong>
                  <span>{course.startDate ? new Date(course.startDate).toLocaleDateString() : 'Flexible'}</span>
                </div>
                <div className="info-item">
                  <strong>End Date</strong>
                  <span>{course.endDate ? new Date(course.endDate).toLocaleDateString() : 'Self-paced'}</span>
                </div>
                <div className="info-item">
                  <strong>Modules</strong>
                  <span>{modules.length}</span>
                </div>
                <div className="info-item">
                  <strong>Assignments</strong>
                  <span>{assignments.length}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="assignments-list">
              {assignments.length > 0 ? (
                assignments.map(assignment => (
                  <div key={assignment._id} className="assignment-item">
                    <div className="assignment-info">
                      <h3>{assignment.title}</h3>
                      <p>{assignment.description?.substring(0, 150)}...</p>
                    </div>
                    <div className="assignment-meta">
                      <span className="due-date">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                      <span className="max-points">{assignment.maxPoints} pts</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/assignments/${assignment._id}`)}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-content">No assignments available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
