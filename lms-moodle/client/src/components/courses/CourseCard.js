import React from 'react';
import { Link } from 'react-router-dom';
import './CourseCard.css';

const CourseCard = ({ course, showEnrollButton = true, onEnroll }) => {
  const {
    _id,
    title,
    shortName,
    description,
    instructor,
    category,
    thumbnail,
    enrollmentCount,
    rating,
    isFree,
    price,
    syncedFromMoodle
  } = course;

  return (
    <div className="course-card">
      <div className="course-thumbnail">
        {thumbnail ? (
          <img src={thumbnail} alt={title} />
        ) : (
          <div className="thumbnail-placeholder">
            <span>📚</span>
          </div>
        )}
        {syncedFromMoodle && (
          <span className="moodle-badge">Moodle</span>
        )}
        <span className="category-badge">{category}</span>
      </div>

      <div className="course-content">
        <h3 className="course-title">
          <Link to={`/courses/${_id}`}>{title}</Link>
        </h3>
        <p className="course-shortname">{shortName}</p>
        
        <p className="course-description">
          {description?.length > 100 
            ? `${description.substring(0, 100)}...` 
            : description}
        </p>

        <div className="course-instructor">
          <span className="instructor-avatar">
            {instructor?.avatar || instructor?.firstName?.charAt(0) || 'I'}
          </span>
          <span className="instructor-name">
            {instructor?.firstName} {instructor?.lastName}
          </span>
        </div>

        <div className="course-meta">
          <div className="meta-item">
            <span className="meta-icon">👥</span>
            <span>{enrollmentCount || 0} students</span>
          </div>
          {rating?.average > 0 && (
            <div className="meta-item">
              <span className="meta-icon">⭐</span>
              <span>{rating.average.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="course-footer">
          <div className="course-price">
            {isFree ? (
              <span className="price-free">Free</span>
            ) : (
              <span className="price-paid">${price}</span>
            )}
          </div>
          
          {showEnrollButton && (
            <Link to={`/courses/${_id}`} className="btn btn-primary btn-sm">
              View Course
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
