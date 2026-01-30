import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';
import CourseCard from '../courses/CourseCard';
import { courseService, enrollmentService } from '../../services';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isInstructor } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    inProgress: 0,
    completed: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollmentsRes] = await Promise.all([
        courseService.getMyCourses(),
        enrollmentService.getMyEnrollments()
      ]);

      if (coursesRes.success) {
        setEnrolledCourses(coursesRes.data.enrolled || []);
        setCreatedCourses(coursesRes.data.created || []);
      }

      if (enrollmentsRes.success) {
        const enrollments = enrollmentsRes.data;
        setStats({
          totalEnrolled: enrollments.length,
          inProgress: enrollments.filter(e => e.status === 'active').length,
          completed: enrollments.filter(e => e.status === 'completed').length
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading size="large" text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.firstName}! 👋</h1>
          <p>Continue your learning journey where you left off.</p>
        </div>
        
        <div className="quick-actions">
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
          {isInstructor && (
            <Link to="/instructor/courses/new" className="btn btn-outline">
              Create Course
            </Link>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon enrolled">📚</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalEnrolled}</span>
            <span className="stat-label">Enrolled Courses</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon progress">📖</div>
          <div className="stat-info">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">🎉</div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        
        {isInstructor && (
          <div className="stat-card">
            <div className="stat-icon instructor">🎓</div>
            <div className="stat-info">
              <span className="stat-value">{createdCourses.length}</span>
              <span className="stat-label">Courses Created</span>
            </div>
          </div>
        )}
      </div>

      {enrolledCourses.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Continue Learning</h2>
            <Link to="/my-courses" className="view-all">View all</Link>
          </div>
          
          <div className="course-grid">
            {enrolledCourses.slice(0, 3).map(course => (
              <CourseCard 
                key={course._id} 
                course={course} 
                showEnrollButton={false}
              />
            ))}
          </div>
        </section>
      )}

      {isInstructor && createdCourses.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Your Courses</h2>
            <Link to="/instructor" className="view-all">Manage courses</Link>
          </div>
          
          <div className="course-grid">
            {createdCourses.slice(0, 3).map(course => (
              <CourseCard 
                key={course._id} 
                course={course}
                showEnrollButton={false}
              />
            ))}
          </div>
        </section>
      )}

      {enrolledCourses.length === 0 && createdCourses.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No courses yet</h3>
          <p>Start your learning journey by enrolling in a course.</p>
          <Link to="/courses" className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      )}

      <section className="dashboard-section moodle-section">
        <div className="section-header">
          <h2>Moodle Integration</h2>
          <Link to="/moodle" className="view-all">Manage sync</Link>
        </div>
        
        <div className="moodle-card">
          <div className="moodle-icon">🔗</div>
          <div className="moodle-info">
            <h3>Sync with Moodle</h3>
            <p>Import courses, assignments, and grades from your Moodle instance.</p>
          </div>
          <Link to="/moodle" className="btn btn-outline">
            Go to Moodle Sync
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
