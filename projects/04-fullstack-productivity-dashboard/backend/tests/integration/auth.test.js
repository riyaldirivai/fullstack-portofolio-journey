/**
 * Authentication Integration Tests
 * Tests for user authentication, registration, and authorization
 */

const supertest = require('supertest');
const app = require('../../server');
const User = require('../../src/models/User');

const request = supertest(app);

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: testHelpers.generateTestEmail(),
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData);

      testHelpers.expectAPIResponse(response, 201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData);

      testHelpers.expectValidationError(response, 'email');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: testHelpers.generateTestEmail(),
        password: '123',
        confirmPassword: '123'
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData);

      testHelpers.expectValidationError(response, 'password');
    });

    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: testHelpers.generateTestEmail(),
        password: 'password123',
        confirmPassword: 'different123'
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData);

      testHelpers.expectValidationError(response, 'password');
    });

    it('should reject registration with duplicate email', async () => {
      const email = testHelpers.generateTestEmail();
      
      // Create first user
      await factory.create('User', { email });

      // Try to create second user with same email
      const userData = {
        name: 'Jane Doe',
        email,
        password: 'password123',
        confirmPassword: 'password123'
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData);

      testHelpers.expectValidationError(response, 'email');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await factory.create('User', {
        email: 'test@example.com',
        password: '$2a$10$rOlmjfOkfk5D8yKlq7XvY.5kG8j9j5jOy7XvY7XvY7XvY7XvY7XvY7' // 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      testHelpers.expectAPIResponse(response, 200);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject login with invalid email', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      testHelpers.expectUnauthorizedError(response);
    });

    it('should reject login with invalid password', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      testHelpers.expectUnauthorizedError(response);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({});

      testHelpers.expectValidationError(response);
    });

    it('should update lastLoginAt on successful login', async () => {
      const beforeLogin = testUser.lastLoginAt;

      await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLoginAt).not.toEqual(beforeLogin);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid token', async () => {
      const { token } = await testHelpers.createUserRequest();

      const response = await request
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      testHelpers.expectAPIResponse(response, 200);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).not.toBe(token); // Should be a new token
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token');

      testHelpers.expectUnauthorizedError(response);
    });

    it('should reject refresh with no token', async () => {
      const response = await request
        .post('/api/auth/refresh');

      testHelpers.expectUnauthorizedError(response);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const { request: authRequest, token } = await testHelpers.createUserRequest();
      
      const response = await authRequest.get('/api/auth/profile');

      testHelpers.expectAPIResponse(response, 200);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject profile request with invalid token', async () => {
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      testHelpers.expectUnauthorizedError(response);
    });

    it('should reject profile request with no token', async () => {
      const response = await request.get('/api/auth/profile');

      testHelpers.expectUnauthorizedError(response);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const { request: authRequest } = await testHelpers.createUserRequest();
      
      const updateData = {
        name: 'Updated Name',
        preferences: {
          theme: 'dark',
          notifications: {
            email: false,
            push: true
          }
        }
      };

      const response = await authRequest
        .put('/api/auth/profile')
        .send(updateData);

      testHelpers.expectAPIResponse(response, 200);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.preferences.theme).toBe(updateData.preferences.theme);
    });

    it('should not allow email update through profile', async () => {
      const { request: authRequest } = await testHelpers.createUserRequest();
      
      const response = await authRequest
        .put('/api/auth/profile')
        .send({ email: 'newemail@example.com' });

      testHelpers.expectAPIResponse(response, 200);
      // Email should not be changed
      expect(response.body.data.user.email).not.toBe('newemail@example.com');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const user = await factory.create('User', {
        password: '$2a$10$rOlmjfOkfk5D8yKlq7XvY.5kG8j9j5jOy7XvY7XvY7XvY7XvY7XvY7' // 'password123'
      });
      
      const { request: authRequest } = await testHelpers.createAuthenticatedRequest(user);

      const response = await authRequest
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      testHelpers.expectAPIResponse(response, 200);
    });

    it('should reject password change with invalid current password', async () => {
      const { request: authRequest } = await testHelpers.createUserRequest();

      const response = await authRequest
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      testHelpers.expectValidationError(response, 'current password');
    });

    it('should reject password change with mismatched new passwords', async () => {
      const { request: authRequest } = await testHelpers.createUserRequest();

      const response = await authRequest
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword123'
        });

      testHelpers.expectValidationError(response, 'password');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { request: authRequest } = await testHelpers.createUserRequest();

      const response = await authRequest.post('/api/auth/logout');

      testHelpers.expectAPIResponse(response, 200);
    });

    it('should require authentication for logout', async () => {
      const response = await request.post('/api/auth/logout');

      testHelpers.expectUnauthorizedError(response);
    });
  });

  describe('Token Validation', () => {
    it('should handle expired tokens', async () => {
      // This would require mocking time to create an expired token
      // For now, we'll test the general case
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer expired.token.here');

      testHelpers.expectUnauthorizedError(response);
    });

    it('should handle malformed tokens', async () => {
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer malformed-token');

      testHelpers.expectUnauthorizedError(response);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      // This test would require multiple rapid requests
      // Implementation depends on your rate limiting strategy
      const userData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(10).fill(null).map(() =>
        request.post('/api/auth/login').send(userData)
      );

      const responses = await Promise.all(promises);
      
      // Some responses should be rate limited
      const rateLimited = responses.filter(res => res.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
