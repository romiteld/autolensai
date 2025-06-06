import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/payment/services/stripe.service';
import { createSupabaseClient, createSupabaseAdmin } from '@/core/database/supabase';
import { z } from 'zod';

const stripeService = new StripeService();

const CheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Valid success URL required'),
  cancelUrl: z.string().url('Valid cancel URL required'),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CheckoutSchema.parse(body);

    // Get or create user record in database
    const supabaseAdmin = createSupabaseAdmin();
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email, name')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    let customerId = userRecord.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      try {
        const customer = await stripeService.createCustomer(
          userRecord.email,
          userRecord.name,
          { userId: user.id }
        );
        customerId = customer.id;

        // Update user with Stripe customer ID
        await supabaseAdmin
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      } catch (error) {
        console.error('Customer creation error:', error);
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      userId: user.id,
      priceId: validatedData.priceId,
      successUrl: validatedData.successUrl,
      cancelUrl: validatedData.cancelUrl,
      customerId: customerId,
      metadata: validatedData.metadata,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}