/**
 * Test setup for Handstand API
 * Sets up the test server and provides helper functions
 */

const request = require('supertest');
const { Pool } = require('pg');

// Use a separate test database or same DB with test prefix
const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Create a test pool
const testPool = new Pool({
  connectionString: TEST_DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test user credentials
const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'testpassword123',
  display_name: 'Test User'
};

const testUser2 = {
  email: `test2_${Date.now()}@example.com`,
  password: 'testpassword456',
  display_name: 'Test User 2'
};

let app;
let server;

/**
 * Get the Express app instance
 */
function getApp() {
  if (!app) {
    // Clear require cache and re-require
    delete require.cache[require.resolve('../server.js')];
    const serverModule = require('../server.js');
    app = serverModule;
  }
  return app;
}

/**
 * Start the server and return the base URL
 */
async function startServer() {
  if (server) return server;
  
  const express = require('express');
  app = express();
  
  // Import routes
  const authRoutes = require('../routes/auth')(testPool);
  const progressRoutes = require('../routes/progress')(testPool);
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Mock session middleware for tests
  app.use((req, res, next) => {
    req.session = {};
    next();
  });
  
  // Use routes
  app.use('/api', authRoutes);
  app.use('/api', progressRoutes);
  
  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  
  server = app.listen(0); // Random port
  return server;
}

/**
 * Clean up test database
 */
async function cleanup() {
  try {
    // Delete test users and their data
    if (testUser.email) {
      await testPool.query(
        `DELETE FROM users WHERE email = $1 OR email LIKE 'test_%'`,
        [testUser.email]
      );
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

/**
 * Create a test user and return auth cookie
 */
async function createTestUser(userData = testUser) {
  const app = getApp();
  const res = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  return res;
}

/**
 * Login as test user and return cookie
 */
async function loginAsUser(userData = testUser) {
  const app = getApp();
  const agent = request.agent(app);
  
  const res = await agent
    .post('/api/auth/login')
    .send({
      email: userData.email,
      password: userData.password
    });
  
  return agent;
}

module.exports = {
  testPool,
  testUser,
  testUser2,
  getApp,
  startServer,
  cleanup,
  createTestUser,
  loginAsUser
};
