import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/customers/communication
 * Log a customer communication (email or WhatsApp)
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

    const { customerId, type, templateId, message, subject } = await request.json();

    if (!customerId || !type) {
      return NextResponse.json(
        { error: 'Customer ID and type are required' },
        { status: 400 }
      );
    }

    // Log the communication to activity_log
    // Using 'as never' since activity_type enum may not include these new types yet
    const { error } = await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: type === 'whatsapp' ? 'whatsapp_sent' : 'email_sent',
      title: `${type === 'whatsapp' ? 'WhatsApp' : 'Email'} sent to customer`,
      description: templateId
        ? `Template: ${templateId}`
        : `Custom message${subject ? `: ${subject}` : ''}`,
      metadata: {
        customer_id: customerId,
        communication_type: type,
        template_id: templateId || 'custom',
        message_preview: message?.substring(0, 100),
      },
    } as never);

    if (error) {
      console.error('Failed to log communication:', error);
      return NextResponse.json(
        { error: 'Failed to log communication' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Communication logging error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/customers/communication?customerId=xxx
 * Get communication history for a customer
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get communication history from activity_log
    // Using type assertions since activity types may not include these new types yet
    const { data: communications, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .in('activity_type', ['whatsapp_sent', 'email_sent'] as never)
      .contains('metadata', { customer_id: customerId })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch communications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch communications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      communications: communications || [],
      count: communications?.length || 0,
    });
  } catch (error) {
    console.error('Communication fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
