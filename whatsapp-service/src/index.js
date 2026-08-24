/**
 * SoukHub WhatsApp Microservice
 *
 * A standalone Express server that manages WhatsApp Web connections
 * using whatsapp-web.js with Puppeteer. Designed to run on a persistent
 * server (Render, Railway, VPS) and be called by the main Vercel app.
 */

const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.WHATSAPP_API_KEY || 'dev-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// API Key authentication middleware
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

// WhatsApp state
let client = null;
let state = {
  status: 'disconnected', // disconnected | connecting | qr_ready | authenticated | ready
  qrCode: null,
  error: null,
  lastActivity: null,
};

/**
 * Initialize WhatsApp client
 */
async function initializeClient() {
  if (client) {
    console.log('Client already exists, destroying first...');
    await client.destroy().catch(() => {});
  }

  state.status = 'connecting';
  state.error = null;
  state.qrCode = null;

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './whatsapp-session',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--single-process',
      ],
    },
  });

  // QR Code event
  client.on('qr', async (qr) => {
    console.log('QR Code received');
    try {
      state.qrCode = await qrcode.toDataURL(qr, { width: 256, margin: 2 });
      state.status = 'qr_ready';
      state.lastActivity = new Date().toISOString();
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  });

  // Authentication event
  client.on('authenticated', () => {
    console.log('WhatsApp authenticated');
    state.status = 'authenticated';
    state.qrCode = null;
    state.lastActivity = new Date().toISOString();
  });

  // Ready event
  client.on('ready', () => {
    console.log('WhatsApp client ready');
    state.status = 'ready';
    state.qrCode = null;
    state.lastActivity = new Date().toISOString();
  });

  // Disconnected event
  client.on('disconnected', (reason) => {
    console.log('WhatsApp disconnected:', reason);
    state.status = 'disconnected';
    state.error = reason;
    state.lastActivity = new Date().toISOString();
    client = null;
  });

  // Auth failure event
  client.on('auth_failure', (msg) => {
    console.error('WhatsApp auth failure:', msg);
    state.status = 'disconnected';
    state.error = msg;
    state.lastActivity = new Date().toISOString();
  });

  // Start the client
  try {
    await client.initialize();
  } catch (err) {
    console.error('WhatsApp initialization error:', err);
    state.status = 'disconnected';
    state.error = err.message;
    throw err;
  }
}

// ============ API ROUTES ============

/**
 * Health check - no auth required
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'soukhub-whatsapp',
    whatsapp: state.status,
    uptime: process.uptime(),
  });
});

/**
 * GET /status - Get current WhatsApp connection status
 */
app.get('/status', authenticate, (req, res) => {
  res.json({
    status: state.status,
    qrCode: state.qrCode,
    error: state.error,
    isReady: state.status === 'ready',
    lastActivity: state.lastActivity,
  });
});

/**
 * POST /connect - Initialize WhatsApp connection
 */
app.post('/connect', authenticate, async (req, res) => {
  try {
    if (state.status === 'ready') {
      return res.json({
        success: true,
        status: state.status,
        message: 'Already connected',
      });
    }

    if (state.status === 'connecting' || state.status === 'qr_ready') {
      return res.json({
        success: true,
        status: state.status,
        qrCode: state.qrCode,
        message: 'Connection in progress',
      });
    }

    // Start initialization (don't await - it takes time)
    initializeClient().catch(err => {
      console.error('Background initialization error:', err);
    });

    // Return immediately with connecting status
    res.json({
      success: true,
      status: 'connecting',
      message: 'Connection started. Poll /status for QR code.',
    });
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /disconnect - Disconnect WhatsApp
 */
app.post('/disconnect', authenticate, async (req, res) => {
  try {
    if (client) {
      await client.destroy();
      client = null;
    }

    state = {
      status: 'disconnected',
      qrCode: null,
      error: null,
      lastActivity: new Date().toISOString(),
    };

    res.json({
      success: true,
      status: 'disconnected',
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /send - Send a WhatsApp message
 */
app.post('/send', authenticate, async (req, res) => {
  const { phone_number, message } = req.body;

  if (!phone_number || !message) {
    return res.status(400).json({
      success: false,
      error: 'phone_number and message are required'
    });
  }

  if (!client || state.status !== 'ready') {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp not connected'
    });
  }

  try {
    // Format phone number for WhatsApp
    let formatted = phone_number.replace(/[\s\-()]/g, '');
    if (formatted.startsWith('+')) {
      formatted = formatted.slice(1);
    }

    const chatId = `${formatted}@c.us`;
    const result = await client.sendMessage(chatId, message);

    state.lastActivity = new Date().toISOString();

    res.json({
      success: true,
      messageId: result.id._serialized,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /logout - Logout from WhatsApp (clears session)
 */
app.post('/logout', authenticate, async (req, res) => {
  try {
    if (client) {
      await client.logout();
      await client.destroy();
      client = null;
    }

    state = {
      status: 'disconnected',
      qrCode: null,
      error: null,
      lastActivity: new Date().toISOString(),
    };

    res.json({
      success: true,
      message: 'Logged out and session cleared',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app; // Export for testing
