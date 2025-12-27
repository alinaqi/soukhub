/**
 * WhatsApp External Service Client
 *
 * Calls the standalone WhatsApp microservice running on Render.
 * This replaces the local whatsapp-service.ts for production use.
 */

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'https://soukhub-whatsapp.onrender.com';
const WHATSAPP_API_KEY = process.env.WHATSAPP_SERVICE_API_KEY || '';

interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready';
  qrCode: string | null;
  error: string | null;
  isReady: boolean;
  lastActivity?: string;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: string;
}

async function callWhatsAppService<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${WHATSAPP_SERVICE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data as T;
}

export const whatsappClient = {
  /**
   * Check if WhatsApp service is configured
   */
  isConfigured(): boolean {
    return !!WHATSAPP_API_KEY && !!WHATSAPP_SERVICE_URL;
  },

  /**
   * Get current WhatsApp connection status
   */
  async getStatus(): Promise<WhatsAppStatus> {
    if (!this.isConfigured()) {
      return {
        status: 'disconnected',
        qrCode: null,
        error: 'WhatsApp service not configured. Set WHATSAPP_SERVICE_URL and WHATSAPP_SERVICE_API_KEY.',
        isReady: false,
      };
    }

    try {
      return await callWhatsAppService<WhatsAppStatus>('/status');
    } catch (error) {
      return {
        status: 'disconnected',
        qrCode: null,
        error: error instanceof Error ? error.message : 'Failed to connect to WhatsApp service',
        isReady: false,
      };
    }
  },

  /**
   * Initialize WhatsApp connection
   */
  async connect(): Promise<WhatsAppStatus> {
    if (!this.isConfigured()) {
      return {
        status: 'disconnected',
        qrCode: null,
        error: 'WhatsApp service not configured. Set WHATSAPP_SERVICE_URL and WHATSAPP_SERVICE_API_KEY.',
        isReady: false,
      };
    }

    try {
      const result = await callWhatsAppService<{ status: string; qrCode?: string; message?: string }>('/connect', 'POST');
      return {
        status: result.status as WhatsAppStatus['status'],
        qrCode: result.qrCode || null,
        error: null,
        isReady: result.status === 'ready',
      };
    } catch (error) {
      return {
        status: 'disconnected',
        qrCode: null,
        error: error instanceof Error ? error.message : 'Failed to connect',
        isReady: false,
      };
    }
  },

  /**
   * Disconnect WhatsApp
   */
  async disconnect(): Promise<void> {
    if (!this.isConfigured()) return;

    try {
      await callWhatsAppService('/disconnect', 'POST');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
    }
  },

  /**
   * Send a WhatsApp message
   */
  async sendMessage(phoneNumber: string, message: string): Promise<SendMessageResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'WhatsApp service not configured',
      };
    }

    try {
      const result = await callWhatsAppService<SendMessageResult>('/send', 'POST', {
        phone_number: phoneNumber,
        message,
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  },

  /**
   * Check if WhatsApp is ready to send messages
   */
  async isReady(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isReady;
  },
};
