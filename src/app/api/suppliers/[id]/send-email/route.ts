import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import {
  generateSupplierOrderEmail,
  sendEmail,
  logEmail,
  SupplierOrderEmailData,
} from '@/lib/email';

interface SendEmailRequest {
  supplier_order_ids: string[];
  custom_subject?: string;
  custom_body?: string;
}

// POST /api/suppliers/[id]/send-email - Send email to supplier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: supplierId } = await params;
    const body: SendEmailRequest = await request.json();
    const { supplier_order_ids, custom_subject, custom_body } = body;

    if (!supplier_order_ids || supplier_order_ids.length === 0) {
      return NextResponse.json(
        { error: 'supplier_order_ids required' },
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

    // Get supplier
    const { data: supplier, error: supplierError } = await getTable(supabase, 'suppliers')
      .select('id, name, email, secondary_email')
      .eq('id', supplierId)
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    if (!supplier.email) {
      return NextResponse.json(
        { error: 'Supplier does not have an email address' },
        { status: 400 }
      );
    }

    // Get supplier orders with order details
    const { data: supplierOrders, error: soError } = await getTable(supabase, 'supplier_orders')
      .select(`
        id,
        order_id,
        orders:order_id (
          id,
          marketplace_order_id,
          customer_name,
          shipping_city,
          order_items (product_name, quantity)
        )
      `)
      .in('id', supplier_order_ids)
      .eq('user_id', user.id);

    if (soError || !supplierOrders || supplierOrders.length === 0) {
      return NextResponse.json({ error: 'Supplier orders not found' }, { status: 404 });
    }

    // Get user profile for seller name
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, full_name')
      .eq('id', user.id)
      .single();

    // Build email data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = supplierOrders.map((so: any) => ({
      marketplace_order_id: so.orders?.marketplace_order_id || 'Unknown',
      items: so.orders?.order_items?.map((i: { product_name: string; quantity: number }) => ({
        product_name: i.product_name,
        quantity: i.quantity,
      })) || [],
      customer_city: so.orders?.shipping_city,
    }));

    const emailData: SupplierOrderEmailData = {
      supplier_name: supplier.name,
      supplier_email: supplier.email,
      orders,
      seller_name: profile?.full_name || undefined,
      seller_business: profile?.business_name || undefined,
    };

    // Generate or use custom email
    let emailTemplate;
    if (custom_subject && custom_body) {
      emailTemplate = { subject: custom_subject, body: custom_body };
    } else {
      emailTemplate = generateSupplierOrderEmail(emailData);
    }

    // Send email
    const result = await sendEmail(supplier.email, emailTemplate);

    // Log email
    await logEmail(supabase, user.id, {
      supplier_id: supplierId,
      to_email: supplier.email,
      subject: emailTemplate.subject,
      body: emailTemplate.body,
      status: result.success ? 'sent' : 'failed',
      method: result.method,
    });

    // Update supplier orders status
    await getTable(supabase, 'supplier_orders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_via: 'email',
      })
      .in('id', supplier_order_ids);

    return NextResponse.json({
      success: true,
      method: result.method,
      email_link: result.link, // For mailto fallback
      orders_sent: supplierOrders.length,
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
