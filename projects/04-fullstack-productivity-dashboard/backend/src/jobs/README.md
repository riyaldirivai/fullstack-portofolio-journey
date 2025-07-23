# Background Jobs System

This directory contains the background jobs system for the Productivity Dashboard. The system handles automated tasks like reminders, analytics processing, and data maintenance.

## Overview

The background jobs system consists of:

- **Job Manager**: Central coordinator for all background jobs
- **Reminder Job**: Handles user notifications and reminders
- **Analytics Job**: Processes user data and generates insights

## Architecture

```
jobs/
├── jobManager.js      # Central job coordinator
├── reminderJob.js     # User reminder system
├── analyticsJob.js    # Analytics processing
└── README.md         # This file
```

## Job Types

### 1. Reminder Jobs (`reminderJob.js`)

Handles all user-facing notifications and reminders:

**Scheduled Tasks:**
- `goalDeadlines` - Daily at 9 AM - Check upcoming goal deadlines
- `dailyCheck` - Daily at 6 PM - Send productivity check-ins
- `weeklyReview` - Sunday at 7 PM - Weekly goal reviews
- `inactiveUsers` - Daily at 10 AM - Nudge inactive users
- `breakReminders` - Every 25 minutes (9-6 PM) - Break reminders
- `monthlyReport` - 1st of month at 9 AM - Monthly progress reports

**Features:**
- Goal deadline alerts (tomorrow & next week)
- Daily productivity nudges for inactive users
- Weekly goal review summaries
- Inactive user re-engagement
- Break reminders for long sessions
- Monthly comprehensive reports
- Email integration with HTML templates
- User preference respect

### 2. Analytics Jobs (`analyticsJob.js`)

Processes data and generates insights:

**Scheduled Tasks:**
- `dailyAnalytics` - Daily at 1 AM - Process daily metrics
- `weeklyAggregation` - Sunday at 2 AM - Weekly data aggregation
- `monthlyInsights` - 1st of month at 3 AM - Monthly insights
- `userBehavior` - Every 6 hours - Behavior pattern analysis
- `performanceMetrics` - Every hour - System performance tracking
- `dataCleanup` - Daily at 4 AM - Clean old data

**Features:**
- User activity tracking
- Session analytics and trends
- Goal completion metrics
- User retention analysis
- Feature usage statistics
- Performance monitoring
- Anomaly detection
- Data archiving and cleanup

## Usage

### Starting the Job System

```javascript
const jobManager = require('./jobs/jobManager');

// Initialize and start all jobs
await jobManager.initialize();
```

### Manual Job Execution (for testing)

```javascript
// Run specific jobs manually
await jobManager.runJob('reminder', 'goalDeadlines');
await jobManager.runJob('analytics', 'dailyAnalytics');
```

### Job Status Monitoring

```javascript
// Get overall status
const status = jobManager.getStatus();
console.log(status);

// Health check
const health = await jobManager.healthCheck();
console.log(health);

// Detailed statistics
const stats = await jobManager.getJobStatistics();
console.log(stats);
```

### Graceful Shutdown

```javascript
// Shutdown all jobs
await jobManager.shutdown();
```

## Integration

### Server Integration

Add to your main server file (`server.js`):

```javascript
const jobManager = require('./jobs/jobManager');

// Start jobs after server starts
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize background jobs
  await jobManager.initialize();
});
```

### API Endpoints

The job system can be controlled via API endpoints:

```javascript
// GET /api/admin/jobs/status
app.get('/api/admin/jobs/status', (req, res) => {
  const status = jobManager.getStatus();
  res.json(status);
});

// POST /api/admin/jobs/run
app.post('/api/admin/jobs/run', async (req, res) => {
  const { jobType, jobName } = req.body;
  await jobManager.runJob(jobType, jobName);
  res.json({ success: true });
});

// GET /api/admin/jobs/health
app.get('/api/admin/jobs/health', async (req, res) => {
  const health = await jobManager.healthCheck();
  res.json(health);
});
```

## Dependencies

Required npm packages:

```bash
npm install node-cron
```

The system also depends on:
- Logger utility (`../utils/logger`)
- Database models (User, Goal, TimerSession)
- Service layers (emailService, analyticsService, notificationService)

## Environment Variables

Required environment variables:

```env
# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# Email configuration (if using email service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Analytics settings
ANALYTICS_RETENTION_DAYS=365
CLEANUP_INTERVAL_DAYS=180
```

## Job Schedules

All schedules use cron syntax:

| Schedule | Description | Example Jobs |
|----------|-------------|--------------|
| `0 9 * * *` | Daily at 9 AM | Goal deadline checks |
| `0 18 * * *` | Daily at 6 PM | Productivity check-ins |
| `0 19 * * 0` | Sunday at 7 PM | Weekly reviews |
| `*/25 9-17 * * 1-5` | Every 25 min (work hours) | Break reminders |
| `0 1 * * *` | Daily at 1 AM | Analytics processing |
| `0 3 1 * *` | 1st of month at 3 AM | Monthly insights |

## Error Handling

The job system includes comprehensive error handling:

- **Individual Job Errors**: Logged but don't stop other jobs
- **System Errors**: Graceful shutdown with cleanup
- **Recovery**: Automatic restart capabilities
- **Monitoring**: Health checks and status reporting

## Testing

### Manual Testing

```javascript
// Test specific jobs
await jobManager.runJob('reminder', 'goalDeadlines');
await jobManager.runJob('analytics', 'userBehavior');

// Test job status
const status = jobManager.getStatus();
console.log('Job Status:', status);
```

### Unit Testing

```javascript
// Example test structure
describe('JobManager', () => {
  beforeEach(async () => {
    await jobManager.initialize();
  });

  afterEach(async () => {
    await jobManager.shutdown();
  });

  it('should start all jobs', () => {
    const status = jobManager.getStatus();
    expect(status.isInitialized).toBe(true);
  });

  it('should run manual jobs', async () => {
    await expect(jobManager.runJob('reminder', 'goalDeadlines'))
      .resolves.not.toThrow();
  });
});
```

## Performance Considerations

- **Memory Usage**: Jobs clean up after execution
- **Database Load**: Staggered execution times prevent conflicts  
- **Error Recovery**: Failed jobs don't affect other jobs
- **Scalability**: Jobs can be distributed across multiple instances

## Monitoring

Monitor job execution through:

1. **Logs**: All job activities are logged
2. **Status API**: Real-time job status
3. **Health Checks**: System health monitoring
4. **Metrics**: Performance and execution statistics

## Troubleshooting

### Common Issues

1. **Jobs Not Starting**
   - Check if jobManager.initialize() was called
   - Verify required dependencies are installed
   - Check for database connection issues

2. **High Memory Usage**
   - Enable data cleanup job
   - Check for memory leaks in job logic
   - Monitor job execution frequency

3. **Email Not Sending**
   - Verify SMTP configuration
   - Check email service credentials
   - Ensure user preferences allow emails

4. **Database Errors**
   - Check MongoDB connection
   - Verify model schemas are correct
   - Monitor database performance

### Debug Mode

Enable debug logging:

```javascript
process.env.LOG_LEVEL = 'debug';
await jobManager.initialize();
```

## Contributing

When adding new jobs:

1. Create job class following existing patterns
2. Implement required methods (start, stop, getStatus, runJob)
3. Add to jobManager.js
4. Update this documentation
5. Add appropriate tests

## License

This job system is part of the Fullstack Productivity Dashboard project.
