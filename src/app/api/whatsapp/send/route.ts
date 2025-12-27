import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappService } from '@/lib/whatsapp-service';
import { logWhatsAppMessage } from '@/lib/whatsapp';
import { getTable } from '@/lib/supabase/tables';

interface SendMessageRequest {
  phone_number: string;
  message: string;
  supplier_id?: string;
  supplier_order_id?: string;
}

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message directly via whatsapp-web.js
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

    const body: SendMessageRequest = await request.json();
    const { phone_number, message, supplier_id, supplier_order_id } = body;

    if (!phone_number || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Check if WhatsApp is connected
    if (!whatsappService.isReady()) {
      return NextResponse.json(
        { error: 'WhatsApp is not connected. Please connect first.' },
        { status: 400 }
      );
    }

    // Send the message
    const result = await whatsappService.sendMessage(phone_number, message);

    if (!result.success) {
      // Log failed message
      await logWhatsAppMessage(supabase, user.id, {
        supplier_order_id,
        supplier_id,
        phone_number,
        message_content: message,
        direction: 'outgoing',
        status: 'failed',
      });

      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }

    // Log successful message
    const loggedMessage = await logWhatsAppMessage(supabase, user.id, {
      supplier_order_id,
      supplier_id,
      phone_number,
      message_content: message,
      direction: 'outgoing',
      status: 'sent',
    });

    // Update whatsapp_message_id if we have it
    if (loggedMessage && result.messageId) {
      await getTable(supabase, 'whatsapp_messages')
        .update({ whatsapp_message_id: result.messageId })
        .eq('id', loggedMessage.id);
    }

    // If this is linked to a supplier order, update its status
    if (supplier_order_id) {
      await getTable(supabase, 'supplier_orders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_via: 'whatsapp',
        })
        .eq('id', supplier_order_id);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      logId: loggedMessage?.id,
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
