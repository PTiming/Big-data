import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loading from './components/common/Loading';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Pages
import Home from './pages/Home';

// Course Components
import CourseList from './components/courses/CourseList';
import CourseDetail from './components/courses/CourseDetail';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Moodle
import MoodleSync from './components/moodle/MoodleSync';

// Styles
import './styles/global.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loading size="large" text="Loading..." />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Instructor Route Component
const InstructorRoute = ({ children }) => {
  const { isInstructor, loading } = useAuth();
  
  if (loading) {
    return <Loading size="large" text="Loading..." />;
  }
  
  return isInstructor ? children : <Navigate to="/dashboard" />;
};

function AppContent() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/moodle" 
            element={
              <ProtectedRoute>
                <MoodleSync />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/my-courses" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Instructor Routes */}
          <Route 
            path="/instructor" 
            element={
              <InstructorRoute>
                <Dashboard />
              </InstructorRoute>
            } 
          />
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
