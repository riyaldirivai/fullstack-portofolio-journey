/**
 * API ENDPOINTS DOCUMENTATION
 * Complete Backend API - 03-backend-api-server
 * Generated: 2025-07-11
 */

// Base URL: http://localhost:5001/api/v1

## 1. AUTHENTICATION ENDPOINTS ✅

### Register User
POST /api/v1/auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

### Login User  
POST /api/v1/auth/login
Content-Type: application/json
{
  "email": "user@example.com", 
  "password": "password123"
}

### Get User Profile
GET /api/v1/auth/profile
Authorization: Bearer <token>

### Update User Profile
PUT /api/v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated"
}

### Logout User
POST /api/v1/auth/logout
Authorization: Bearer <token>

### Refresh Token
POST /api/v1/auth/refresh
Content-Type: application/json
{
  "refreshToken": "<refresh_token>"
}

## 2. GOALS MANAGEMENT ENDPOINTS ✅

### Get All Goals
GET /api/v1/goals?page=1&limit=10&status=active&category=work
Authorization: Bearer <token>

### Create New Goal
POST /api/v1/goals
Authorization: Bearer <token>
Content-Type: application/json
{
  "title": "Complete Project",
  "description": "Finish the backend API project",
  "category": "work",
  "priority": "high",
  "targetValue": 100,
  "unit": "percent",
  "deadline": "2025-12-31"
}

### Get Goal by ID
GET /api/v1/goals/:id
Authorization: Bearer <token>

### Update Goal
PUT /api/v1/goals/:id
Authorization: Bearer <token>
Content-Type: application/json
{
  "title": "Updated Goal Title",
  "status": "in-progress",
  "currentValue": 50
}

### Delete Goal
DELETE /api/v1/goals/:id
Authorization: Bearer <token>

### Get Goal Statistics
GET /api/v1/goals/stats
Authorization: Bearer <token>

## 3. TIMER SESSION ENDPOINTS ✅

### Get All Timer Sessions
GET /api/v1/timers?page=1&limit=10&type=pomodoro&status=completed
Authorization: Bearer <token>

### Start Timer Session
POST /api/v1/timers/start
Authorization: Bearer <token>
Content-Type: application/json
{
  "type": "pomodoro",
  "name": "Focus Session",
  "plannedDuration": 25,
  "goalId": "goal_id_here"
}

### Stop Timer Session
POST /api/v1/timers/stop
Authorization: Bearer <token>
Content-Type: application/json
{
  "timerId": "timer_id_here"
}

### Pause Timer Session
POST /api/v1/timers/pause
Authorization: Bearer <token>
Content-Type: application/json
{
  "timerId": "timer_id_here"
}

### Resume Timer Session
POST /api/v1/timers/resume
Authorization: Bearer <token>
Content-Type: application/json
{
  "timerId": "timer_id_here"
}

### Get Timer Statistics
GET /api/v1/timers/stats
Authorization: Bearer <token>

### Get Timer by ID
GET /api/v1/timers/:id
Authorization: Bearer <token>

### Delete Timer Session
DELETE /api/v1/timers/:id
Authorization: Bearer <token>

## 4. DASHBOARD ANALYTICS ENDPOINTS ✅

### Get Dashboard Statistics
GET /api/v1/dashboard/stats
Authorization: Bearer <token>

### Get Recent Activities
GET /api/v1/dashboard/recent?limit=10
Authorization: Bearer <token>

### Get Productivity Metrics
GET /api/v1/dashboard/metrics?days=7
Authorization: Bearer <token>

### Get Goals Summary
GET /api/v1/dashboard/goals-summary
Authorization: Bearer <token>

### Get Timer Statistics
GET /api/v1/dashboard/timer-stats
Authorization: Bearer <token>

### Get Weekly Report
GET /api/v1/dashboard/reports/weekly
Authorization: Bearer <token>

### Get Monthly Report
GET /api/v1/dashboard/reports/monthly
Authorization: Bearer <token>

## ADDITIONAL ENDPOINTS

### Health Check
GET /health

### API Welcome
GET /

### 404 Handler
* /* (any unmatched route)

## RESPONSE FORMATS

### Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { 
    "pagination": { ... },
    "timestamp": "2025-07-11T01:00:00.000Z"
  }
}

### Error Response
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [ ... ],
  "timestamp": "2025-07-11T01:00:00.000Z"
}

## AUTHENTICATION

All protected endpoints require JWT token in:
- Authorization header: `Bearer <token>`
- Or Cookie: `token=<token>`

## RATE LIMITING

- Auth endpoints: 10 requests / 15 minutes
- Goals endpoints: 30 requests / minute  
- Timer endpoints: 60 requests / minute
- Dashboard endpoints: 100 requests / 15 minutes

## VALIDATION

All endpoints include comprehensive input validation using:
- Joi schemas for complex validation
- express-validator for request validation
- Mongoose schema validation
