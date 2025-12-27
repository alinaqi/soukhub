import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import type { TeamRole } from '@/types/database';

// Simple PIN hashing (in production, use bcrypt)
function hashPin(pin: string): string {
  // Simple hash for demo - use bcrypt in production
  return Buffer.from(pin).toString('base64');
}

// GET /api/team - List all team members
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: members, error } = await getTable(supabase, 'team_members')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    // Remove PIN from response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeMembers = members?.map((member: any) => {
      const { pin_code, ...rest } = member;
      return {
        ...rest,
        has_pin: !!pin_code,
      };
    });

    return NextResponse.json({ members: safeMembers });
  } catch (error) {
    console.error('Fetch team error:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

interface CreateTeamMemberRequest {
  name: string;
  role: TeamRole;
  email?: string;
  phone?: string;
  pin?: string; // 4-digit PIN for quick login
}

// POST /api/team - Add a team member
export async function POST(request: NextRequest) {
  try {
    const body: CreateTeamMemberRequest = await request.json();
    const { name, role, email, phone, pin } = body;

    if (!name || !role) {
      return NextResponse.json(
        { error: 'Name and role are required' },
        { status: 400 }
      );
    }

    if (!['manager', 'packer', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be manager, packer, or viewer' },
        { status: 400 }
      );
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if organization exists, create if not
    let { data: org } = await getTable(supabase, 'organizations')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (!org) {
      // Get user profile for business name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single();

      const { data: newOrg, error: orgError } = await getTable(supabase, 'organizations')
        .insert({
          owner_user_id: user.id,
          name: profile?.business_name || 'My Business',
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
      }

      org = newOrg;

      // Update user profile with organization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', user.id);
    }

    // Check for duplicate PIN
    if (pin) {
      const { data: existingPin } = await getTable(supabase, 'team_members')
        .select('id')
        .eq('organization_id', org.id)
        .eq('pin_code', hashPin(pin))
        .maybeSingle();

      if (existingPin) {
        return NextResponse.json(
          { error: 'This PIN is already in use by another team member' },
          { status: 409 }
        );
      }
    }

    // Create team member
    const { data: member, error } = await getTable(supabase, 'team_members')
      .insert({
        organization_id: org.id,
        owner_user_id: user.id,
        name,
        role,
        email: email || null,
        phone: phone || null,
        pin_code: pin ? hashPin(pin) : null,
        is_active: true,
        permissions: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team member:', error);
      return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
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
    console.error('Create team member error:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
