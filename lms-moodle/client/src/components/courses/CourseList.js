import React, { useState, useEffect } from 'react';
import CourseCard from './CourseCard';
import Loading from '../common/Loading';
import { courseService } from '../../services';
import './CourseList.css';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourses(filters);
      if (response.success) {
        setCourses(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'programming', label: 'Programming' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'language', label: 'Language' },
    { value: 'business', label: 'Business' },
    { value: 'arts', label: 'Arts' },
    { value: 'other', label: 'Other' }
  ];

  if (loading && courses.length === 0) {
    return <Loading size="large" text="Loading courses..." />;
  }

  return (
    <div className="course-list-page">
      <div className="course-list-header">
        <h1>Explore Courses</h1>
        <p>Discover courses from our platform and Moodle</p>
      </div>

      <div className="course-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search courses..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="category-filter"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="course-grid">
        {courses.map(course => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div className="no-courses">
          <p>No courses found. Try adjusting your filters.</p>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => handleFilterChange('page', pagination.page - 1)}
            className="btn btn-outline"
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => handleFilterChange('page', pagination.page + 1)}
            className="btn btn-outline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseList;
