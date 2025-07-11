# Productivity Dashboard API

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green.svg)](https://mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sebuah RESTful API backend yang lengkap dan production-ready untuk aplikasi productivity dashboard, dengan fitur manajemen goals, timer sessions (Pomodoro), analytics, dan sistem autentikasi yang robust.

## 📁 Struktur Proyek

```
03-backend-api-server/
├── 📁 src/                    # Source code
│   ├── 📄 app.js              # Express application setup
│   ├── 📄 server.js           # Server startup & configuration
│   ├── 📁 config/            # Configuration files
│   │   ├── database.js       # MongoDB connection
│   │   ├── cors.js           # CORS configuration
│   │   └── logger.js         # Logging setup
│   ├── 📁 controllers/       # Business logic controllers
│   │   ├── authController.js
│   │   ├── goalController.js
│   │   ├── timerController.js
│   │   └── dashboardController.js
│   ├── 📁 middleware/        # Custom middleware
│   │   ├── auth.js           # Authentication middleware
│   │   ├── validation.js     # Request validation
│   │   └── errorHandler.js   # Error handling
│   ├── 📁 models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Goal.js
│   │   └── TimerSession.js
│   ├── 📁 routes/           # API route definitions
│   │   ├── auth.js
│   │   ├── goals.js
│   │   ├── timer.js
│   │   └── dashboard.js
│   └── 📁 utils/            # Helper utilities
│       └── helpers.js
├── 📁 tests/                # Test suite
│   └── 📄 api.test.js       # Comprehensive API tests
├── 📁 scripts/              # Development utilities
│   ├── 📄 seed.js           # Database seeding
│   └── 📄 dev.js            # Development tools
├── 📁 docs/                 # Documentation
│   └── 📄 API_ENDPOINTS.md  # API documentation
├── 📁 logs/                 # Application logs
├── 📄 .env.example          # Environment template
├── 📄 Dockerfile            # Container configuration
├── 📄 docker-compose.yml    # Development environment
├── 📄 CHANGELOG.md          # Version history
└── 📄 README.md             # This file
```

## 🚀 Fitur Utama

### 🔐 Sistem Autentikasi
- User registration dan login dengan JWT
- Protected routes dengan middleware authorization
- Profile management dan session handling

### 🎯 Manajemen Goals
- CRUD operations untuk goals/target
- Progress tracking dengan metrics
- Kategorisasi dan prioritas goals
- Statistics dan analytics goals

### ⏱️ Timer Sessions (Pomodoro)
- Multiple timer types: Pomodoro, Short Break, Long Break, Custom
- Pause/Resume functionality dengan accurate time tracking
- Goal association untuk productivity tracking
- Real-time duration calculations dan efficiency metrics
- Comprehensive session history dan statistics

### 📊 Dashboard Analytics
- Real-time productivity metrics
- Recent activities tracking
- Weekly/monthly progress reports
- Goal completion analytics

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB dengan Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Custom logger dengan file rotation
- **Testing**: Comprehensive test suite dengan Axios
- **Environment**: dotenv untuk configuration management
- **Containerization**: Docker & Docker Compose ready

## ⚡ Quick Start

### 🐳 Using Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd 03-backend-api-server

# Start with Docker Compose
docker-compose up -d

# The API will be available at http://localhost:3000
# MongoDB Express UI at http://localhost:8081
```

### 🔧 Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start MongoDB (make sure MongoDB is running)
# MongoDB URI: mongodb://localhost:27017

# 4. Seed database with sample data
npm run seed

# 5. Start development server
npm run dev

# 6. Run tests (optional)
npm run test:quick
```

### 🚀 Development Utilities

```bash
# Use built-in development tools
node scripts/dev.js setup    # Complete project setup
node scripts/dev.js clean    # Clean logs and temp files
node scripts/dev.js reset    # Reset database with fresh data
node scripts/dev.js health   # Run health check
```

## 📁 Struktur Project

```
03-backend-api-server/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup dan MongoDB connection
│   ├── config/
│   │   ├── database.js        # Database configuration
│   │   ├── logger.js          # Logging configuration
│   │   └── cors.js            # CORS configuration
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   ├── goalController.js      # Goals management
│   │   ├── timerController.js     # Basic timer functionality
│   │   ├── timerSessionController.js  # Advanced timer sessions
│   │   └── dashboardController.js # Analytics dan dashboard
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   ├── validation.js      # Input validation
│   │   └── errorHandler.js    # Global error handling
│   ├── models/
│   │   ├── User.js            # User data model
│   │   ├── Goal.js            # Goals data model
│   │   ├── Timer.js           # Basic timer model
│   │   └── TimerSession.js    # Advanced timer sessions model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── goals.js           # Goals management routes
│   │   ├── timers.js          # Basic timer routes
│   │   ├── timerSession.js    # Timer sessions routes
│   │   └── dashboard.js       # Analytics routes
│   └── utils/
│       └── helpers.js         # Utility functions
├── logs/                      # Application logs
├── test.js                    # Comprehensive test suite
├── package.json               # Dependencies dan scripts
├── .env                       # Environment variables
└── README.md                  # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 atau lebih tinggi)
- MongoDB (v4.4 atau lebih tinggi)
- npm atau yarn package manager

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd projects/03-backend-api-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Buat file `.env` atau edit yang sudah ada:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   HOST=localhost
   API_VERSION=v1
   API_PREFIX=/api

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=productivity_dashboard

   # JWT Configuration
   JWT_SECRET=your_super_secure_secret_key_here
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d

   # Security Configuration
   ENABLE_RATE_LIMITING=true
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start MongoDB**
   ```bash
   # Windows
   mongod

   # Linux/macOS dengan systemd
   sudo systemctl start mongod

   # Docker
   docker run -d -p 27017:27017 mongo:latest
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm start

   # Production mode
   npm run start:prod

   # Development dengan auto-reload
   npm run dev
   ```

6. **Verify installation**
   ```bash
   # Test server health
   curl http://localhost:3000/health

   # Run comprehensive tests
   npm test
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <jwt_token>
```

### Goals Management

#### Create Goal
```http
POST /goals
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Complete React Project",
  "description": "Build a full-stack React application",
  "category": "development",
  "priority": "high",
  "targetValue": 40,
  "unit": "hours",
  "deadline": "2025-07-25T00:00:00.000Z"
}
```

#### Get Goals
```http
GET /goals
Authorization: Bearer <jwt_token>
```

#### Update Goal Progress
```http
POST /goals/:goalId/progress
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "progressValue": 5,
  "notes": "Made good progress on authentication"
}
```

#### Get Goal Statistics
```http
GET /goals/statistics
Authorization: Bearer <jwt_token>
```

### Timer Sessions

#### Start Timer Session
```http
POST /timer-sessions/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "goalId": "goal_id_here",
  "type": "pomodoro",
  "plannedDuration": 1500000,
  "title": "Focus Session",
  "description": "Working on API development"
}
```

#### Get Active Timer
```http
GET /timer-sessions/active
Authorization: Bearer <jwt_token>
```

#### Pause Timer
```http
PUT /timer-sessions/:sessionId/pause
Authorization: Bearer <jwt_token>
```

#### Resume Timer
```http
PUT /timer-sessions/:sessionId/resume
Authorization: Bearer <jwt_token>
```

#### Stop Timer
```http
PUT /timer-sessions/:sessionId/stop
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "reason": "Session completed"
}
```

#### Get Timer History
```http
GET /timer-sessions/history?limit=10&page=1
Authorization: Bearer <jwt_token>
```

#### Get Timer Statistics
```http
GET /timer-sessions/stats
Authorization: Bearer <jwt_token>
```

### Dashboard Analytics

#### Get Dashboard Analytics
```http
GET /dashboard/analytics
Authorization: Bearer <jwt_token>
```

#### Get Recent Activities
```http
GET /dashboard/recent?limit=10
Authorization: Bearer <jwt_token>
```

## 🧪 Testing

### Menjalankan Test Suite

```bash
# Full comprehensive test
npm test

# Quick test (essential features only)
npm run test:quick

# Test dengan verbose output
node test.js

# Quick test mode
node test.js --quick
```

### Test Coverage

Test suite mencakup:
- ✅ System health check
- ✅ Authentication (register, login, protected routes)
- ✅ Goals management (CRUD, progress, statistics)
- ✅ Timer sessions (start, pause, resume, stop, history, stats)
- ✅ Dashboard analytics
- ✅ Error handling dan edge cases

### Expected Test Results

Ketika semua tests berhasil, Anda akan melihat:
```
🎉 ALL TESTS PASSED! SYSTEM IS PRODUCTION READY! 🎉
✅ Authentication system working
✅ Goals management functional
✅ Timer sessions operational
✅ Dashboard analytics active
✅ Error handling robust

🚀 Ready for GitHub portfolio deployment! 🚀
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017 |
| `DB_NAME` | Database name | productivity_dashboard |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | true |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

### Timer Types

| Type | Default Duration | Description |
|------|------------------|-------------|
| `pomodoro` | 25 minutes | Work sessions |
| `short_break` | 5 minutes | Short breaks |
| `long_break` | 15 minutes | Long breaks |
| `custom` | User-defined | Custom durations |

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse dan DDoS attacks
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers untuk production
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses tanpa sensitive data

## 📊 Performance Features

- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections
- **Request Compression**: Gzip compression untuk responses
- **Logging**: Structured logging dengan rotation
- **Caching Headers**: Appropriate cache control

## 🚀 Production Deployment

### Environment Setup

1. **Set production environment variables**
   ```env
   NODE_ENV=production
   PORT=80
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-super-secure-production-secret
   ```

2. **Database optimization**
   - Enable MongoDB authentication
   - Configure replica sets untuk high availability
   - Set up regular backups
   - Monitor database performance

3. **Security hardening**
   - Use HTTPS/SSL certificates
   - Configure firewall rules
   - Enable MongoDB authentication
   - Regular security updates

### Deployment Options

#### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### PM2 Process Manager
```bash
npm install -g pm2
pm2 start src/server.js --name "productivity-api"
pm2 startup
pm2 save
```

## 🎯 API Features

### Advanced Timer Session Features

- **Real-time Calculations**: Elapsed time, remaining time, efficiency metrics
- **Pause/Resume**: Accurate time tracking dengan pause duration
- **Goal Integration**: Associate timers dengan specific goals
- **Session History**: Complete session history dengan filtering
- **Statistics**: Comprehensive productivity analytics
- **Multiple Types**: Support untuk berbagai timer types

### Goals Management Features

- **CRUD Operations**: Complete create, read, update, delete
- **Progress Tracking**: Real-time progress updates
- **Categories**: Organize goals by categories
- **Priorities**: Set goal priorities (high, medium, low)
- **Deadlines**: Track goal deadlines dan overdue status
- **Statistics**: Goal completion analytics

### Dashboard Analytics

- **Real-time Metrics**: Live productivity data
- **Time Tracking**: Total time spent on activities
- **Progress Reports**: Weekly dan monthly progress
- **Activity Feed**: Recent user activities
- **Goal Analytics**: Goal completion rates dan trends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**riyaldirivai** - Full Stack Developer

- GitHub: [@riyaldirivai](https://github.com/riyaldirivai)
- Portfolio: [Your Portfolio URL]

## 🙏 Acknowledgments

- Express.js community untuk excellent framework
- MongoDB untuk robust database solution
- JWT community untuk secure authentication standards
- All developers yang contribute ke open source ecosystem

---

**🚀 Ready for production deployment dan portfolio showcase!**

## 🚀 Features

- **Authentication & Authorization** - JWT-based user authentication
- **Goal Management** - Create, track, and manage productivity goals
- **Timer Tracking** - Pomodoro timer and time tracking functionality
- **Dashboard Analytics** - User statistics and productivity metrics
- **Security** - Rate limiting, CORS, helmet security headers
- **Logging** - Winston logger with file rotation
- **Validation** - Input validation with Joi and express-validator
- **Error Handling** - Centralized error handling middleware

## 📁 Project Structure

```
03-backend-api-server/
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   ├── logger.js        # Winston logger setup
│   │   └── cors.js          # CORS configuration
│   ├── controllers/
│   │   ├── authController.js       # Authentication logic
│   │   ├── goalController.js       # Goal management
│   │   ├── timerController.js      # Timer functionality
│   │   └── dashboardController.js  # Dashboard analytics
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   ├── validation.js    # Input validation
│   │   └── errorHandler.js  # Error handling
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── Goal.js          # Goal schema
│   │   └── TimerSession.js  # Timer session schema
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── goals.js         # Goal routes
│   │   ├── timer.js         # Timer routes
│   │   └── dashboard.js     # Dashboard routes
│   ├── utils/
│   │   └── helpers.js       # Utility functions
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
├── tests/                   # Test files
├── docs/                    # Documentation
├── logs/                    # Log files
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
└── README.md               # Project documentation
```

## 🛠 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd 03-backend-api-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB:**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Run the application:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 🔧 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/productivity_dashboard

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile

### Goals
- `GET /api/v1/goals` - Get all goals
- `POST /api/v1/goals` - Create new goal
- `GET /api/v1/goals/:id` - Get specific goal
- `PUT /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal

### Timer
- `POST /api/v1/timers/start` - Start timer session
- `POST /api/v1/timers/stop` - Stop timer session
- `GET /api/v1/timers/sessions` - Get timer sessions
- `GET /api/v1/timers/stats` - Get timer statistics

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/recent` - Get recent activities

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run seed       # Seed database with sample data
npm run db:reset   # Reset database
npm run logs:clear # Clear log files
```

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request rate limiting
- **JWT Authentication** - JSON Web Token authentication
- **Input Validation** - Request validation with Joi
- **Password Hashing** - bcryptjs password hashing

## 🗃 Database Schema

### User
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Goal
```javascript
{
  user: ObjectId,
  title: String,
  description: String,
  targetValue: Number,
  currentValue: Number,
  unit: String,
  category: String,
  priority: String,
  status: String,
  deadline: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Timer Session
```javascript
{
  user: ObjectId,
  goal: ObjectId,
  startTime: Date,
  endTime: Date,
  duration: Number,
  type: String,
  status: String,
  createdAt: Date
}
```

## 📊 Logging

The application uses Winston for logging with the following levels:
- **error** - Error messages
- **warn** - Warning messages
- **info** - Informational messages
- **debug** - Debug messages

Logs are stored in the `logs/` directory with daily rotation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**riyaldirivai**
- Day 4 - Fullstack Portfolio Journey
- Backend API Implementation with MongoDB v8.0.11

## 🔗 Related Projects

- [01-personal-brand-landing](../01-personal-brand-landing/) - Personal branding landing page
- [02-productivity-dashboard](../02-productivity-dashboard/) - Frontend dashboard application
