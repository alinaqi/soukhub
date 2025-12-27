import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappService } from '@/lib/whatsapp-service';

/**
 * GET /api/whatsapp/status
 * Get current WhatsApp connection status
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = whatsappService.getState();

    return NextResponse.json({
      status: state.status,
      qrCode: state.qrCode,
      error: state.error,
      isReady: whatsappService.isReady(),
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}

/**
 * POST /api/whatsapp/status
 * Initialize or disconnect WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'connect') {
      const state = await whatsappService.initialize();

      return NextResponse.json({
        success: true,
        status: state.status,
        qrCode: state.qrCode,
        error: state.error,
      });
    } else if (action === 'disconnect') {
      await whatsappService.disconnect();

      return NextResponse.json({
        success: true,
        status: 'disconnected',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "connect" or "disconnect"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('WhatsApp status action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
