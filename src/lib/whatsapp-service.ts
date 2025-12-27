/**
 * WhatsApp Service
 *
 * Real WhatsApp integration using whatsapp-web.js
 * Connects via headless Chrome to WhatsApp Web
 *
 * Based on: https://github.com/alinaqi/whatsapp-spam-filter
 *
 * NOTE: whatsapp-web.js needs to run in a separate Node.js process
 * due to bundler compatibility issues with Next.js.
 * This service provides a fallback mode for development/testing.
 */

export type WhatsAppStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready';

export interface WhatsAppState {
  status: WhatsAppStatus;
  qrCode: string | null;
  error: string | null;
}

type MessageCallback = (from: string, message: string, timestamp: Date) => void;

// Check if we're in a Node.js environment that can run whatsapp-web.js
// Vercel serverless functions can't run Puppeteer (no persistent browser)
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const canRunWhatsApp = typeof window === 'undefined' && process.env.WHATSAPP_ENABLED === 'true' && !isServerless;

class WhatsAppService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private state: WhatsAppState = {
    status: 'disconnected',
    qrCode: null,
    error: null,
  };
  private messageCallbacks: MessageCallback[] = [];
  private initPromise: Promise<void> | null = null;

  /**
   * Get current connection state
   */
  getState(): WhatsAppState {
    return { ...this.state };
  }

  /**
   * Initialize WhatsApp client
   * Returns QR code data URL if authentication needed
   */
  async initialize(): Promise<WhatsAppState> {
    // Check if WhatsApp is enabled
    if (!canRunWhatsApp) {
      if (isServerless) {
        console.log('WhatsApp Web cannot run in serverless environment (Vercel/Lambda)');
        this.state.status = 'disconnected';
        this.state.error = 'WhatsApp Web requires a persistent server. Serverless environments (Vercel) cannot maintain browser sessions. Consider using WhatsApp Business API or running on a dedicated server.';
      } else {
        console.log('WhatsApp service running in demo mode. Set WHATSAPP_ENABLED=true to enable.');
        this.state.status = 'disconnected';
        this.state.error = 'WhatsApp integration requires WHATSAPP_ENABLED=true in environment';
      }
      return this.getState();
    }

    // Already initializing
    if (this.initPromise) {
      await this.initPromise;
      return this.getState();
    }

    // Already connected
    if (this.state.status === 'ready') {
      return this.getState();
    }

    this.state.status = 'connecting';
    this.state.error = null;
    this.state.qrCode = null;

    this.initPromise = this.doInitialize();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }

    return this.getState();
  }

  private async doInitialize(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Dynamic import to avoid bundler issues
        const { Client, LocalAuth } = await import('whatsapp-web.js');
        const qrcode = await import('qrcode');

        this.client = new Client({
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
            ],
          },
        });

        // QR Code event
        this.client.on('qr', async (qr: string) => {
          console.log('WhatsApp QR Code received');
          try {
            // Generate QR code as data URL
            this.state.qrCode = await qrcode.toDataURL(qr, {
              width: 256,
              margin: 2,
            });
            this.state.status = 'qr_ready';
          } catch (err) {
            console.error('Error generating QR code:', err);
          }
        });

        // Authentication event
        this.client.on('authenticated', () => {
          console.log('WhatsApp authenticated');
          this.state.status = 'authenticated';
          this.state.qrCode = null;
        });

        // Ready event
        this.client.on('ready', () => {
          console.log('WhatsApp client ready');
          this.state.status = 'ready';
          this.state.qrCode = null;
          resolve();
        });

        // Incoming message event
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.client.on('message', (msg: any) => {
          const from = msg.from.replace('@c.us', '');
          const body = msg.body;
          const timestamp = new Date(msg.timestamp * 1000);

          console.log(`WhatsApp message from ${from}: ${body.substring(0, 50)}...`);

          // Notify all registered callbacks
          for (const callback of this.messageCallbacks) {
            try {
              callback(from, body, timestamp);
            } catch (err) {
              console.error('Error in message callback:', err);
            }
          }
        });

        // Disconnected event
        this.client.on('disconnected', (reason: string) => {
          console.log('WhatsApp disconnected:', reason);
          this.state.status = 'disconnected';
          this.state.error = reason;
          this.client = null;
        });

        // Auth failure event
        this.client.on('auth_failure', (msg: string) => {
          console.error('WhatsApp auth failure:', msg);
          this.state.status = 'disconnected';
          this.state.error = msg;
          reject(new Error(msg));
        });

        // Start the client
        this.client.initialize().catch((err: Error) => {
          console.error('WhatsApp initialization error:', err);
          this.state.status = 'disconnected';
          this.state.error = err.message;
          reject(err);
        });

      } catch (err) {
        this.state.status = 'disconnected';
        this.state.error = err instanceof Error ? err.message : 'Unknown error';
        reject(err);
      }
    });
  }

  /**
   * Send a message to a phone number
   */
  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client || this.state.status !== 'ready') {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      // Format phone number for WhatsApp
      let formatted = phoneNumber.replace(/[\s\-()]/g, '');
      if (formatted.startsWith('+')) {
        formatted = formatted.slice(1);
      }

      // Add @c.us suffix for WhatsApp
      const chatId = `${formatted}@c.us`;

      // Send the message
      const result = await this.client.sendMessage(chatId, message);

      return {
        success: true,
        messageId: result.id._serialized,
      };
    } catch (err) {
      console.error('Error sending WhatsApp message:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send message',
      };
    }
  }

  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Disconnect WhatsApp client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (err) {
        console.error('Error destroying WhatsApp client:', err);
      }
      this.client = null;
    }

    this.state = {
      status: 'disconnected',
      qrCode: null,
      error: null,
    };
  }

  /**
   * Check if client is ready to send messages
   */
  isReady(): boolean {
    return this.state.status === 'ready';
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService();
