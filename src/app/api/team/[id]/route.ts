import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import type { TeamRole } from '@/types/database';

// Simple PIN hashing
function hashPin(pin: string): string {
  return Buffer.from(pin).toString('base64');
}

// GET /api/team/[id] - Get a single team member
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member, error } = await getTable(supabase, 'team_members')
      .select('*')
      .eq('id', id)
      .eq('owner_user_id', user.id)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Get recent sessions
    const { data: sessions } = await getTable(supabase, 'team_sessions')
      .select('*')
      .eq('team_member_id', id)
      .order('started_at', { ascending: false })
      .limit(5);

    const { pin_code, ...safeMember } = member;

    return NextResponse.json({
      member: {
        ...safeMember,
        has_pin: !!pin_code,
      },
      sessions: sessions || [],
    });
  } catch (error) {
    console.error('Fetch team member error:', error);
    return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 });
  }
}

interface UpdateTeamMemberRequest {
  name?: string;
  role?: TeamRole;
  email?: string;
  phone?: string;
  pin?: string;
  is_active?: boolean;
  permissions?: Record<string, boolean>;
}

// PATCH /api/team/[id] - Update a team member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateTeamMemberRequest = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await getTable(supabase, 'team_members')
      .select('id, organization_id')
      .eq('id', id)
      .eq('owner_user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Validate PIN if provided
    if (body.pin !== undefined) {
      if (body.pin && !/^\d{4}$/.test(body.pin)) {
        return NextResponse.json(
          { error: 'PIN must be exactly 4 digits' },
          { status: 400 }
        );
      }

      // Check for duplicate PIN
      if (body.pin) {
        const { data: existingPin } = await getTable(supabase, 'team_members')
          .select('id')
          .eq('organization_id', existing.organization_id)
          .eq('pin_code', hashPin(body.pin))
          .neq('id', id)
          .maybeSingle();

        if (existingPin) {
          return NextResponse.json(
            { error: 'This PIN is already in use' },
            { status: 409 }
          );
        }
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.role !== undefined) updates.role = body.role;
    if (body.email !== undefined) updates.email = body.email || null;
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.pin !== undefined) updates.pin_code = body.pin ? hashPin(body.pin) : null;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.permissions !== undefined) updates.permissions = body.permissions;

    const { data: member, error } = await getTable(supabase, 'team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team member:', error);
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }

    const { pin_code, ...safeMember } = member;

    return NextResponse.json({
      success: true,
      member: {
        ...safeMember,
        has_pin: !!pin_code,
      },
    });
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

// DELETE /api/team/[id] - Remove a team member
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // End any active sessions first
    await getTable(supabase, 'team_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('team_member_id', id)
      .is('ended_at', null);

    // Delete team member
    const { error } = await getTable(supabase, 'team_members')
      .delete()
      .eq('id', id)
      .eq('owner_user_id', user.id);

    if (error) {
      console.error('Error deleting team member:', error);
      return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}
