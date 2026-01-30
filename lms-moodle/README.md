# LMS with Moodle Integration

A full-featured Learning Management System (LMS) built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring seamless Moodle integration for course synchronization.

## Features

### Core LMS Features
- **User Authentication**: Secure registration, login, and JWT-based authentication
- **User Roles**: Support for Students, Instructors, and Administrators
- **Course Management**: Create, edit, delete, and publish courses
- **Module System**: Organize course content into modules with various content types
- **Assignment Management**: Create assignments, submit work, and grade submissions
- **Enrollment System**: Enroll/unenroll from courses with progress tracking
- **Grade Book**: Track student grades and calculate overall course performance

### Moodle Integration
- **Course Sync**: Import courses from Moodle including modules and content
- **User Linking**: Link LMS accounts with Moodle accounts
- **Assignment Sync**: Synchronize assignments between platforms
- **Grade Sync**: Bidirectional grade synchronization
- **Enrollment Sync**: Keep enrollments synchronized across platforms

### Technical Features
- **RESTful API**: Well-structured API endpoints
- **Responsive Design**: Mobile-friendly React frontend
- **Real-time Updates**: Dynamic content loading
- **Secure**: JWT authentication, password hashing, input validation

## Project Structure

```
lms-moodle/
├── server/                 # Backend (Node.js/Express)
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Custom middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── services/          # Business logic (Moodle service)
│   └── server.js          # Entry point
├── client/                 # Frontend (React)
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # React components
│       ├── context/       # Context providers
│       ├── hooks/         # Custom hooks
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── styles/        # Global styles
│       └── App.js         # Main App component
└── package.json           # Root package.json
```

## Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn
- Moodle instance (for integration features)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms-moodle
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   
   Server (.env in server directory):
   ```env
   MONGODB_URI=mongodb://localhost:27017/lms_moodle
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   PORT=5000
   MOODLE_URL=https://your-moodle-instance.com
   MOODLE_TOKEN=your_moodle_web_service_token
   CLIENT_URL=http://localhost:3000
   ```
   
   Client (.env in client directory):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend (port 5000) and frontend (port 3000).

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/password | Change password |
| POST | /api/auth/link-moodle | Link Moodle account |
| DELETE | /api/auth/unlink-moodle | Unlink Moodle account |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/courses | Get all courses |
| GET | /api/courses/:id | Get course by ID |
| POST | /api/courses | Create course |
| PUT | /api/courses/:id | Update course |
| DELETE | /api/courses/:id | Delete course |
| POST | /api/courses/:id/enroll | Enroll in course |
| DELETE | /api/courses/:id/unenroll | Unenroll from course |
| POST | /api/courses/sync-from-moodle/:id | Sync course from Moodle |

### Modules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/modules/course/:courseId | Get course modules |
| POST | /api/modules | Create module |
| PUT | /api/modules/:id | Update module |
| DELETE | /api/modules/:id | Delete module |
| POST | /api/modules/:id/content | Add content to module |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/assignments/course/:courseId | Get course assignments |
| POST | /api/assignments | Create assignment |
| POST | /api/assignments/:id/submit | Submit assignment |
| GET | /api/assignments/:id/submissions | Get submissions |
| PUT | /api/assignments/submissions/:id/grade | Grade submission |

### Moodle Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moodle/test-connection | Test Moodle connection |
| GET | /api/moodle/courses | Get Moodle courses |
| GET | /api/moodle/courses/:id/contents | Get course contents |
| GET | /api/moodle/courses/:id/assignments | Get Moodle assignments |
| POST | /api/moodle/courses/:id/enroll | Enroll user in Moodle |

## Moodle Setup

To enable Moodle integration:

1. **Enable Web Services** in your Moodle instance:
   - Site Administration > Advanced features > Enable Web Services

2. **Create a Web Service Token**:
   - Site Administration > Plugins > Web services > Manage tokens
   - Create a new token with appropriate capabilities

3. **Required Moodle Web Service Functions**:
   - core_course_get_courses
   - core_course_get_contents
   - core_user_get_users
   - core_enrol_get_enrolled_users
   - mod_assign_get_assignments
   - mod_assign_get_submissions
   - gradereport_user_get_grade_items

## User Roles

### Student
- Browse and enroll in courses
- View course content and modules
- Submit assignments
- Track progress and grades
- Link Moodle account

### Instructor
- All student permissions
- Create and manage courses
- Create modules and content
- Create assignments
- Grade student submissions
- Import courses from Moodle
- Sync grades with Moodle

### Admin
- All instructor permissions
- Manage all users
- Access admin dashboard
- Configure system settings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the repository or contact the maintainers.
