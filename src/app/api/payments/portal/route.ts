import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/payment/services/stripe.service';
import { createSupabaseClient, createSupabaseAdmin } from '@/core/database/supabase';
import { z } from 'zod';

const stripeService = new StripeService();

const PortalSchema = z.object({
  returnUrl: z.string().url('Valid return URL required'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = PortalSchema.parse(body);

    // Get user's Stripe customer ID
    const supabaseAdmin = createSupabaseAdmin();
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userRecord.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const session = await stripeService.createPortalSession({
      customerId: userRecord.stripe_customer_id,
      returnUrl: validatedData.returnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}