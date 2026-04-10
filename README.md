# Backend Setup Guide

## Environment Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/viswas

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration (optional)
CORS_ORIGIN=http://localhost:8081

# Redis Configuration (optional, for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 Configuration (optional, for file uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Email Configuration (required for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=vishwas@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@vishwas.com
FRONTEND_URL=http://localhost:8081
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running on your system

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset (sends email)
- `GET /api/auth/me` - Get current user (requires authentication)

### Videos
- `GET /api/videos` - Get all videos (public)
- `GET /api/videos/:id` - Get video by ID (public)
- `POST /api/videos` - Create video (admin only)
- `PUT /api/videos/:id` - Update video (admin only)
- `DELETE /api/videos/:id` - Delete video (admin only)

### FlipBooks
- `GET /api/flipbooks` - Get all flipbooks (public)
- `GET /api/flipbooks/:id` - Get flipbook by ID (public)
- `POST /api/flipbooks` - Create flipbook (admin only)
- `PUT /api/flipbooks/:id` - Update flipbook (admin only)
- `DELETE /api/flipbooks/:id` - Delete flipbook (admin only)

### Exam Results
- `GET /api/exam-results` - Get all exam results (authenticated)
- `GET /api/exam-results/:id` - Get exam result by ID (authenticated)
- `GET /api/exam-results/student/:studentId` - Get results by student (authenticated)
- `POST /api/exam-results` - Create exam result (authenticated)

## Database Models

- **Student**: User model for students with email, password, studentId, etc.
- **Admin**: User model for admins with email, password, etc.
- **Video**: Model for YouTube video links
- **FlipBook**: Model for PDF flipbooks
- **ExamResult**: Model for storing exam results

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

