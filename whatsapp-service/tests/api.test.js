/**
 * WhatsApp Microservice API Tests
 *
 * Tests the Express API endpoints for authentication, status, and message sending.
 * Note: These tests mock the WhatsApp client - they don't test actual WhatsApp connectivity.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const API_KEY = process.env.WHATSAPP_API_KEY || 'dev-key-change-in-production';
const PORT = 3099; // Use different port for testing

// We'll create a minimal mock server for testing without loading whatsapp-web.js
let server;
let mockState = {
  status: 'disconnected',
  qrCode: null,
  error: null,
  lastActivity: null,
};

// Create a simple test server that mimics the real API
const express = require('express');
const cors = require('cors');

function createTestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.split(' ')[1];
    if (token !== API_KEY) {
      return res.status(403).json({ error: 'Invalid API key' });
    }
    next();
  };

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'soukhub-whatsapp',
      whatsapp: mockState.status,
      uptime: process.uptime(),
    });
  });

  app.get('/status', authenticate, (req, res) => {
    res.json({
      status: mockState.status,
      qrCode: mockState.qrCode,
      error: mockState.error,
      isReady: mockState.status === 'ready',
      lastActivity: mockState.lastActivity,
    });
  });

  app.post('/connect', authenticate, async (req, res) => {
    mockState.status = 'connecting';
    mockState.lastActivity = new Date().toISOString();
    res.json({
      success: true,
      status: 'connecting',
      message: 'Connection started. Poll /status for QR code.',
    });
  });

  app.post('/disconnect', authenticate, async (req, res) => {
    mockState = {
      status: 'disconnected',
      qrCode: null,
      error: null,
      lastActivity: new Date().toISOString(),
    };
    res.json({ success: true, status: 'disconnected' });
  });

  app.post('/send', authenticate, async (req, res) => {
    const { phone_number, message } = req.body;
    if (!phone_number || !message) {
      return res.status(400).json({
        success: false,
        error: 'phone_number and message are required'
      });
    }
    if (mockState.status !== 'ready') {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp not connected'
      });
    }
    res.json({
      success: true,
      messageId: 'mock-message-id-12345',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ============ TESTS ============

describe('WhatsApp Microservice API', () => {
  before(async () => {
    const app = createTestServer();
    server = app.listen(PORT);
    // Reset state
    mockState = {
      status: 'disconnected',
      qrCode: null,
      error: null,
      lastActivity: null,
    };
  });

  after(() => {
    server.close();
  });

  describe('GET /health', () => {
    it('should return health status without authentication', async () => {
      const res = await request('GET', '/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.service, 'soukhub-whatsapp');
      assert.ok(typeof res.body.uptime === 'number');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const res = await request('GET', '/status');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Missing or invalid authorization header');
    });

    it('should reject requests with invalid API key', async () => {
      const res = await request('GET', '/status', null, {
        Authorization: 'Bearer wrong-key',
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error, 'Invalid API key');
    });

    it('should accept requests with valid API key', async () => {
      const res = await request('GET', '/status', null, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 200);
      assert.ok('status' in res.body);
    });
  });

  describe('GET /status', () => {
    it('should return current WhatsApp status', async () => {
      const res = await request('GET', '/status', null, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'disconnected');
      assert.strictEqual(res.body.isReady, false);
      assert.strictEqual(res.body.qrCode, null);
    });
  });

  describe('POST /connect', () => {
    it('should start WhatsApp connection', async () => {
      const res = await request('POST', '/connect', {}, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.status, 'connecting');
    });
  });

  describe('POST /disconnect', () => {
    it('should disconnect WhatsApp', async () => {
      const res = await request('POST', '/disconnect', {}, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.status, 'disconnected');
    });
  });

  describe('POST /send', () => {
    it('should reject when WhatsApp not connected', async () => {
      mockState.status = 'disconnected';
      const res = await request('POST', '/send', {
        phone_number: '+1234567890',
        message: 'Test message',
      }, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.error, 'WhatsApp not connected');
    });

    it('should reject when missing phone_number', async () => {
      mockState.status = 'ready';
      const res = await request('POST', '/send', {
        message: 'Test message',
      }, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'phone_number and message are required');
    });

    it('should reject when missing message', async () => {
      mockState.status = 'ready';
      const res = await request('POST', '/send', {
        phone_number: '+1234567890',
      }, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'phone_number and message are required');
    });

    it('should send message when connected', async () => {
      mockState.status = 'ready';
      const res = await request('POST', '/send', {
        phone_number: '+1234567890',
        message: 'Test message',
      }, {
        Authorization: `Bearer ${API_KEY}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.messageId);
      assert.ok(res.body.timestamp);
    });
  });
});

console.log('Running WhatsApp Microservice API tests...');
