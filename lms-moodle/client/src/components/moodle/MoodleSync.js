import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';
import { moodleService, courseService, authService } from '../../services';
import './MoodleSync.css';

const MoodleSync = () => {
  const { user, isInstructor, updateUser } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [moodleCourses, setMoodleCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [linkUsername, setLinkUsername] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const response = await moodleService.testConnection();
      if (response.success) {
        setConnectionStatus(response.data);
        if (response.data.connected && isInstructor) {
          fetchMoodleCourses();
        }
      }
    } catch (err) {
      setConnectionStatus({ connected: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodleCourses = async () => {
    try {
      const response = await moodleService.getMoodleCourses();
      if (response.success) {
        setMoodleCourses(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch Moodle courses:', err);
    }
  };

  const handleSyncCourse = async (moodleCourseId) => {
    try {
      setSyncing(prev => ({ ...prev, [moodleCourseId]: true }));
      setError('');
      setSuccess('');

      const response = await courseService.syncFromMoodle(moodleCourseId);
      if (response.success) {
        setSuccess(`Course "${response.data.title}" synced successfully!`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync course');
    } finally {
      setSyncing(prev => ({ ...prev, [moodleCourseId]: false }));
    }
  };

  const handleLinkMoodle = async (e) => {
    e.preventDefault();
    try {
      setLinking(true);
      setError('');
      
      const response = await authService.linkMoodle(linkUsername);
      if (response.success) {
        updateUser({
          moodleUserId: response.data.moodleUserId,
          moodleUsername: response.data.moodleUsername
        });
        setSuccess('Moodle account linked successfully!');
        setLinkUsername('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link Moodle account');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkMoodle = async () => {
    try {
      setLinking(true);
      const response = await authService.unlinkMoodle();
      if (response.success) {
        updateUser({
          moodleUserId: null,
          moodleUsername: null
        });
        setSuccess('Moodle account unlinked successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlink Moodle account');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return <Loading size="large" text="Checking Moodle connection..." />;
  }

  return (
    <div className="moodle-sync-page">
      <div className="page-header">
        <h1>Moodle Integration</h1>
        <p>Sync courses, assignments, and grades with your Moodle instance</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="sync-grid">
        {/* Connection Status */}
        <div className="sync-card">
          <div className="card-header">
            <h2>Connection Status</h2>
          </div>
          <div className="card-body">
            <div className={`status-badge ${connectionStatus?.connected ? 'connected' : 'disconnected'}`}>
              {connectionStatus?.connected ? '✓ Connected' : '✗ Not Connected'}
            </div>
            
            {connectionStatus?.connected && (
              <div className="connection-info">
                <div className="info-row">
                  <span className="label">Site:</span>
                  <span className="value">{connectionStatus.sitename}</span>
                </div>
                <div className="info-row">
                  <span className="label">Version:</span>
                  <span className="value">{connectionStatus.version}</span>
                </div>
                <div className="info-row">
                  <span className="label">User:</span>
                  <span className="value">{connectionStatus.username}</span>
                </div>
              </div>
            )}

            {!connectionStatus?.connected && (
              <div className="connection-error">
                <p>Unable to connect to Moodle. Please check your configuration.</p>
                <p className="error-detail">{connectionStatus?.error}</p>
              </div>
            )}

            <button onClick={checkConnection} className="btn btn-outline btn-block">
              Refresh Connection
            </button>
          </div>
        </div>

        {/* Account Linking */}
        <div className="sync-card">
          <div className="card-header">
            <h2>Account Linking</h2>
          </div>
          <div className="card-body">
            {user?.moodleUserId ? (
              <div className="linked-account">
                <div className="linked-badge">✓ Account Linked</div>
                <div className="info-row">
                  <span className="label">Moodle Username:</span>
                  <span className="value">{user.moodleUsername}</span>
                </div>
                <div className="info-row">
                  <span className="label">Moodle User ID:</span>
                  <span className="value">{user.moodleUserId}</span>
                </div>
                <button 
                  onClick={handleUnlinkMoodle}
                  className="btn btn-danger btn-block"
                  disabled={linking}
                >
                  {linking ? 'Unlinking...' : 'Unlink Account'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleLinkMoodle} className="link-form">
                <p>Link your LMS account with your Moodle account to sync grades and enrollments.</p>
                <div className="form-group">
                  <label>Moodle Username</label>
                  <input
                    type="text"
                    value={linkUsername}
                    onChange={(e) => setLinkUsername(e.target.value)}
                    placeholder="Enter your Moodle username"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={linking}>
                  {linking ? 'Linking...' : 'Link Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Course Sync - Instructors Only */}
      {isInstructor && connectionStatus?.connected && (
        <div className="sync-card courses-card">
          <div className="card-header">
            <h2>Moodle Courses</h2>
            <span className="course-count">{moodleCourses.length} courses available</span>
          </div>
          <div className="card-body">
            {moodleCourses.length > 0 ? (
              <div className="courses-list">
                {moodleCourses.map(course => (
                  <div key={course.id} className="moodle-course-item">
                    <div className="course-info">
                      <h3>{course.fullname}</h3>
                      <p className="shortname">{course.shortname}</p>
                      {course.summary && (
                        <p className="summary" dangerouslySetInnerHTML={{ 
                          __html: course.summary.substring(0, 100) + '...' 
                        }} />
                      )}
                    </div>
                    <button
                      onClick={() => handleSyncCourse(course.id)}
                      className="btn btn-primary"
                      disabled={syncing[course.id]}
                    >
                      {syncing[course.id] ? 'Syncing...' : 'Import Course'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-courses">
                <p>No courses available in Moodle.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Features Info */}
      <div className="features-section">
        <h2>What can be synced?</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">📚</span>
            <h3>Courses</h3>
            <p>Import course structure, modules, and content from Moodle</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📝</span>
            <h3>Assignments</h3>
            <p>Sync assignments with due dates and grading criteria</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👥</span>
            <h3>Enrollments</h3>
            <p>Keep student enrollments synchronized across platforms</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <h3>Grades</h3>
            <p>Sync grades bidirectionally between LMS and Moodle</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodleSync;
