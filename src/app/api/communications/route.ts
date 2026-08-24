import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

/**
 * GET /api/communications
 * Get all conversations (suppliers with message history)
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

    // Get all suppliers
    const { data: suppliers } = await getTable(supabase, 'suppliers')
      .select('id, name, whatsapp_number')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (!suppliers || suppliers.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Get latest message for each supplier
    const supplierIds = suppliers.map((s: { id: string }) => s.id);

    // Get message counts and last messages per supplier
    const { data: messages } = await getTable(supabase, 'whatsapp_messages')
      .select('id, supplier_id, message_content, direction, sent_at, created_at')
      .eq('user_id', user.id)
      .in('supplier_id', supplierIds)
      .order('created_at', { ascending: false });

    // Get pending orders per supplier
    const { data: pendingOrders } = await getTable(supabase, 'supplier_orders')
      .select('supplier_id')
      .eq('user_id', user.id)
      .in('supplier_id', supplierIds)
      .in('status', ['pending_send', 'sent']);

    // Build conversation list
    const messagesBySupplier = new Map<string, {
      last_message: string;
      last_message_at: string;
      direction: 'outgoing' | 'incoming';
      count: number;
    }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages?.forEach((msg: any) => {
      if (!messagesBySupplier.has(msg.supplier_id)) {
        messagesBySupplier.set(msg.supplier_id, {
          last_message: msg.message_content?.substring(0, 100) || '',
          last_message_at: msg.sent_at || msg.created_at,
          direction: msg.direction,
          count: 1,
        });
      } else {
        const existing = messagesBySupplier.get(msg.supplier_id)!;
        existing.count++;
      }
    });

    // Count pending orders per supplier
    const pendingCountBySupplier = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendingOrders?.forEach((order: any) => {
      const current = pendingCountBySupplier.get(order.supplier_id) || 0;
      pendingCountBySupplier.set(order.supplier_id, current + 1);
    });

    // Build final conversation list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations = suppliers.map((supplier: any) => {
      const msgData = messagesBySupplier.get(supplier.id);
      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        whatsapp_number: supplier.whatsapp_number,
        last_message: msgData?.last_message || '',
        last_message_at: msgData?.last_message_at || null,
        direction: msgData?.direction || 'outgoing',
        pending_orders: pendingCountBySupplier.get(supplier.id) || 0,
        message_count: msgData?.count || 0,
      };
    });

    // Sort by last message time (most recent first), then by pending orders
    conversations.sort((a: { last_message_at: string | null; pending_orders: number }, b: { last_message_at: string | null; pending_orders: number }) => {
      if (a.last_message_at && b.last_message_at) {
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      }
      if (a.last_message_at) return -1;
      if (b.last_message_at) return 1;
      return b.pending_orders - a.pending_orders;
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
