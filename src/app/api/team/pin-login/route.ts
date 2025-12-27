import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

// Simple PIN verification
function hashPin(pin: string): string {
  return Buffer.from(pin).toString('base64');
}

// POST /api/team/pin-login - Authenticate team member via PIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, organization_id } = body;

    if (!pin || !organization_id) {
      return NextResponse.json(
        { error: 'PIN and organization ID are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find team member by PIN
    const { data: member, error } = await getTable(supabase, 'team_members')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('pin_code', hashPin(pin))
      .eq('is_active', true)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Create session
    const deviceId = request.headers.get('x-device-id') || 'unknown';

    const { data: session, error: sessionError } = await getTable(supabase, 'team_sessions')
      .insert({
        team_member_id: member.id,
        device_id: deviceId,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
    }

    // Update last active
    await getTable(supabase, 'team_members')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', member.id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin_code, ...safeMember } = member;

    return NextResponse.json({
      success: true,
      member: {
        ...safeMember,
        has_pin: true,
      },
      session_id: session?.id,
    });
  } catch (error) {
    console.error('PIN login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// DELETE /api/team/pin-login - End PIN session (logout)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    await getTable(supabase, 'team_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', session_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
