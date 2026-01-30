import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Transform Your Learning Experience</h1>
          <p>
            A modern Learning Management System with seamless Moodle integration. 
            Access courses, track progress, and achieve your goals.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-illustration">
            <span className="illustration-icon">📚</span>
            <span className="illustration-icon">🎓</span>
            <span className="illustration-icon">💻</span>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Our LMS?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Moodle Integration</h3>
            <p>Seamlessly sync courses, assignments, and grades with your Moodle instance.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>Monitor your learning journey with detailed analytics and progress reports.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Assignments & Grading</h3>
            <p>Submit assignments and receive feedback with our intuitive grading system.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Collaborative Learning</h3>
            <p>Engage with instructors and peers through discussions and group activities.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Learn anywhere, anytime with our responsive design that works on all devices.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Platform</h3>
            <p>Your data is protected with industry-standard security measures.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Start Learning?</h2>
          <p>Join thousands of learners and instructors on our platform.</p>
          <Link to="/courses" className="btn btn-primary btn-lg">
            Explore Courses
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
