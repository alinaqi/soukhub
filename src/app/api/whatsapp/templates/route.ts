import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import { getMessageTemplates, createDefaultTemplates, DEFAULT_TEMPLATES } from '@/lib/whatsapp';

// GET /api/whatsapp/templates - Get all message templates
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let templates = await getMessageTemplates(supabase, user.id);

    // If no templates exist, create defaults
    if (templates.length === 0) {
      await createDefaultTemplates(supabase, user.id);
      templates = await getMessageTemplates(supabase, user.id);
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({ error: 'Failed to get templates' }, { status: 500 });
  }
}

interface CreateTemplateRequest {
  name: string;
  template_type: 'supplier_order' | 'supplier_batch' | 'customer_update' | 'thank_you' | 'referral';
  content: string;
}

// POST /api/whatsapp/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body: CreateTemplateRequest = await request.json();
    const { name, template_type, content } = body;

    if (!name || !template_type || !content) {
      return NextResponse.json(
        { error: 'name, template_type, and content are required' },
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

    const { data: template, error } = await getTable(supabase, 'message_templates')
      .insert({
        user_id: user.id,
        name,
        template_type,
        content,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// GET default template variables info
export function getTemplateVariables() {
  return {
    supplier_order: [
      '{{supplier_name}}',
      '{{marketplace_order_id}}',
      '{{marketplace}}',
      '{{customer_name}}',
      '{{shipping_city}}',
      '{{items_list}}',
    ],
    supplier_batch: [
      '{{supplier_name}}',
      '{{order_count}}',
      '{{items_summary}}',
    ],
    thank_you: [
      '{{customer_name}}',
      '{{product_name}}',
      '{{marketplace_order_id}}',
      '{{tracking_number}}',
    ],
  };
}
