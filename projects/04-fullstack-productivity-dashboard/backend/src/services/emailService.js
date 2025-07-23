/**
 * Email Service
 * Handles email notifications, reports, and communication
 */

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize email service with configuration
   */
  async initialize() {
    try {
      logger.info('📧 Initializing Email Service...');

      // Create transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        this.transporter = nodemailer.createTransporter({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } else {
        // Development - use Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      // Verify transporter configuration
      await this.transporter.verify();
      
      // Load email templates
      await this.loadTemplates();
      
      this.isInitialized = true;
      logger.info('✅ Email Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Email Service:', error);
      throw error;
    }
  }

  /**
   * Load email templates from file system
   */
  async loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    
    try {
      // Ensure templates directory exists
      await fs.mkdir(templatesDir, { recursive: true });
      
      const templateFiles = [
        'welcome.hbs',
        'goal-reminder.hbs',
        'weekly-report.hbs',
        'achievement.hbs',
        'password-reset.hbs',
        'timer-summary.hbs'
      ];

      for (const templateFile of templateFiles) {
        const templatePath = path.join(templatesDir, templateFile);
        
        try {
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const templateName = path.basename(templateFile, '.hbs');
          this.templates.set(templateName, handlebars.compile(templateContent));
        } catch (error) {
          // Template file doesn't exist, create default
          await this.createDefaultTemplate(templatePath, templateFile);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const templateName = path.basename(templateFile, '.hbs');
          this.templates.set(templateName, handlebars.compile(templateContent));
        }
      }

      logger.info(`📄 Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('❌ Failed to load email templates:', error);
    }
  }

  /**
   * Create default email template if it doesn't exist
   */
  async createDefaultTemplate(templatePath, templateFile) {
    const templateName = path.basename(templateFile, '.hbs');
    let defaultContent = '';

    switch (templateName) {
      case 'welcome':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Productivity Dashboard</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">Welcome to Productivity Dashboard! 🎯</h1>
        <p>Hi {{userName}},</p>
        <p>Welcome to your productivity journey! We're excited to help you achieve your goals.</p>
        <div style="background: #f8faff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Getting Started:</h3>
            <ul>
                <li>Set your first productivity goal</li>
                <li>Try the Pomodoro timer</li>
                <li>Track your daily progress</li>
            </ul>
        </div>
        <p>Ready to boost your productivity? <a href="{{dashboardUrl}}" style="color: #667eea;">Get started now!</a></p>
        <p>Best regards,<br>The Productivity Dashboard Team</p>
    </div>
</body>
</html>`;
        break;

      case 'goal-reminder':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Goal Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">Goal Reminder 📋</h1>
        <p>Hi {{userName}},</p>
        <p>Just a friendly reminder about your goal: <strong>{{goalTitle}}</strong></p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            <p><strong>Progress:</strong> {{progress}}% complete</p>
            {{#if description}}<p><strong>Description:</strong> {{description}}</p>{{/if}}
        </div>
        <p>Keep up the great work! <a href="{{goalUrl}}" style="color: #667eea;">View your goal</a></p>
        <p>Best regards,<br>The Productivity Dashboard Team</p>
    </div>
</body>
</html>`;
        break;

      case 'weekly-report':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Weekly Productivity Report</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">Your Weekly Report 📊</h1>
        <p>Hi {{userName}},</p>
        <p>Here's your productivity summary for this week:</p>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
            <div style="background: #e6fffa; padding: 15px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0; color: #00a86b;">{{totalFocusTime}}</h3>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Focus Time</p>
            </div>
            <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0; color: #667eea;">{{completedGoals}}</h3>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Goals Completed</p>
            </div>
            <div style="background: #fff5f5; padding: 15px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0; color: #e53e3e;">{{timerSessions}}</h3>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Timer Sessions</p>
            </div>
            <div style="background: #fffaf0; padding: 15px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0; color: #ff8c00;">{{currentStreak}} days</h3>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Current Streak</p>
            </div>
        </div>
        
        <p>Keep up the excellent work! <a href="{{dashboardUrl}}" style="color: #667eea;">View your dashboard</a></p>
        <p>Best regards,<br>The Productivity Dashboard Team</p>
    </div>
</body>
</html>`;
        break;

      case 'achievement':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Achievement Unlocked!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">Achievement Unlocked! 🏆</h1>
        <p>Hi {{userName}},</p>
        <p>Congratulations! You've unlocked a new achievement:</p>
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 10px;">{{achievementIcon}}</div>
            <h2 style="margin: 0 0 10px 0;">{{achievementTitle}}</h2>
            <p style="margin: 0; opacity: 0.9;">{{achievementDescription}}</p>
        </div>
        <p>Keep up the amazing progress! <a href="{{dashboardUrl}}" style="color: #667eea;">View your achievements</a></p>
        <p>Best regards,<br>The Productivity Dashboard Team</p>
    </div>
</body>
</html>`;
        break;

      case 'password-reset':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">Password Reset Request 🔐</h1>
        <p>Hi {{userName}},</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <div style="background: #f8faff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p>Click the button below to reset your password:</p>
            <a href="{{resetUrl}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Reset Password</a>
            <p style="font-size: 14px; color: #718096; margin-top: 15px;">This link will expire in 1 hour.</p>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">{{resetUrl}}</p>
        <p>Best regards,<br>The Productivity Dashboard Team</p>
    </div>
</body>
</html>`;
        break;

      case 'timer-summary':
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daily Timer Summary</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">Daily Timer Summary ⏰</h1>
        <p>Hi {{userName}},</p>
        <p>Here's your timer session summary for {{date}}:</p>
        <div style="background: #f8faff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                <div>
                    <h3 style="margin: 0; color: #667eea;">{{totalSessions}}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Sessions</p>
                </div>
                <div>
                    <h3 style="margin: 0; color: #00a86b;">{{totalFocusTime}}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Focus Time</p>
                </div>
                <div>
                    <h3 style="margin: 0; color: #ff8c00;">{{longestSession}}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Longest Session</p>
                </div>
            </div>
        </div>
        {{#if topTasks}}
        <div style="margin: 20px 0;">
            <h3>Top Tasks:</h3>
            <ul>
            {{#each topTasks}}
                <li>{{this.name}} - {{this.time}}</li>
            {{/each}}
            </ul>
        </div>
        {{/if}}
        <p>Great work today! <a href="{{dashboardUrl}}" style="color: #667eea;">View your full statistics</a></p>
        <p>Best regards,<br>The Productivity Dashboard Team</p>
    </div>
</body>
</html>`;
        break;

      default:
        defaultContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">{{title}}</h1>
        <p>Hi {{userName}},</p>
        <p>{{message}}</p>
        <p>Best regards,<br>The Productivity Dashboard Team</p>
    </div>
</body>
</html>`;
    }

    await fs.writeFile(templatePath, defaultContent, 'utf8');
    logger.info(`📄 Created default template: ${templateFile}`);
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(templateName, to, subject, data = {}) {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    try {
      const template = this.templates.get(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const html = template(data);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Productivity Dashboard <noreply@productivitydashboard.com>',
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      logger.info(`📧 Email sent successfully to ${to}: ${subject}`);
      return info;

    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send plain text email
   */
  async sendEmail(to, subject, text, html = null) {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Productivity Dashboard <noreply@productivitydashboard.com>',
        to,
        subject,
        text,
        html: html || text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      logger.info(`📧 Email sent successfully to ${to}: ${subject}`);
      return info;

    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user) {
    return this.sendTemplateEmail(
      'welcome',
      user.email,
      'Welcome to Productivity Dashboard! 🎯',
      {
        userName: user.name,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      }
    );
  }

  /**
   * Send goal reminder email
   */
  async sendGoalReminder(user, goal) {
    return this.sendTemplateEmail(
      'goal-reminder',
      user.email,
      `Reminder: ${goal.title} 📋`,
      {
        userName: user.name,
        goalTitle: goal.title,
        dueDate: new Date(goal.dueDate).toLocaleDateString(),
        progress: goal.progress || 0,
        description: goal.description,
        goalUrl: `${process.env.FRONTEND_URL}/goals/${goal.id}`
      }
    );
  }

  /**
   * Send weekly report email
   */
  async sendWeeklyReport(user, reportData) {
    return this.sendTemplateEmail(
      'weekly-report',
      user.email,
      'Your Weekly Productivity Report 📊',
      {
        userName: user.name,
        totalFocusTime: this.formatDuration(reportData.totalFocusTime),
        completedGoals: reportData.completedGoals,
        timerSessions: reportData.timerSessions,
        currentStreak: reportData.currentStreak,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      }
    );
  }

  /**
   * Send achievement notification email
   */
  async sendAchievementEmail(user, achievement) {
    return this.sendTemplateEmail(
      'achievement',
      user.email,
      'Achievement Unlocked! 🏆',
      {
        userName: user.name,
        achievementTitle: achievement.title,
        achievementDescription: achievement.description,
        achievementIcon: achievement.icon || '🏆',
        dashboardUrl: `${process.env.FRONTEND_URL}/achievements`
      }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    return this.sendTemplateEmail(
      'password-reset',
      user.email,
      'Password Reset Request 🔐',
      {
        userName: user.name,
        resetUrl
      }
    );
  }

  /**
   * Send daily timer summary email
   */
  async sendTimerSummary(user, summaryData) {
    return this.sendTemplateEmail(
      'timer-summary',
      user.email,
      'Daily Timer Summary ⏰',
      {
        userName: user.name,
        date: new Date().toLocaleDateString(),
        totalSessions: summaryData.totalSessions,
        totalFocusTime: this.formatDuration(summaryData.totalFocusTime),
        longestSession: this.formatDuration(summaryData.longestSession),
        topTasks: summaryData.topTasks,
        dashboardUrl: `${process.env.FRONTEND_URL}/analytics`
      }
    );
  }

  /**
   * Format duration in minutes to readable format
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info('✅ Email service connection test successful');
      return true;
    } catch (error) {
      logger.error('❌ Email service connection test failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
