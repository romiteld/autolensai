import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/core/database/supabase';

const InquirySchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  inquiryType: z.enum(['general', 'test_drive', 'financing', 'inspection']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = InquirySchema.parse(body);

    const supabase = createClient();

    // Check if vehicle exists and is active
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, user_id, make, model, year, status')
      .eq('id', validatedData.vehicleId)
      .eq('status', 'active')
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or not available' },
        { status: 404 }
      );
    }

    // Create inquiry record
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        vehicle_id: validatedData.vehicleId,
        seller_id: vehicle.user_id,
        inquirer_name: validatedData.name,
        inquirer_email: validatedData.email,
        inquirer_phone: validatedData.phone,
        message: validatedData.message,
        inquiry_type: validatedData.inquiryType,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (inquiryError) {
      console.error('Failed to create inquiry:', inquiryError);
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      );
    }

    // Send email notification to seller (in a real app, this would be handled by a queue)
    try {
      await sendSellerNotification({
        sellerEmail: vehicle.user_id, // In real app, fetch user email
        vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        inquirerName: validatedData.name,
        inquirerEmail: validatedData.email,
        inquirerPhone: validatedData.phone,
        message: validatedData.message,
        inquiryType: validatedData.inquiryType,
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the API call if email fails
    }

    // Send confirmation email to inquirer
    try {
      await sendInquirerConfirmation({
        inquirerEmail: validatedData.email,
        inquirerName: validatedData.name,
        vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        inquiryType: validatedData.inquiryType,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the API call if email fails
    }

    return NextResponse.json(
      {
        message: 'Inquiry submitted successfully',
        inquiryId: inquiry.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Inquiry submission error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = (page - 1) * limit;

    const supabase = createClient();

    let query = supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Failed to fetch inquiries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inquiries' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true });

    if (vehicleId) {
      countQuery = countQuery.eq('vehicle_id', vehicleId);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch inquiries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Email notification functions (would be moved to a service in a real app)
async function sendSellerNotification(data: {
  sellerEmail: string;
  vehicleInfo: string;
  inquirerName: string;
  inquirerEmail: string;
  inquirerPhone?: string;
  message: string;
  inquiryType: string;
}) {
  // In a real application, this would integrate with an email service like SendGrid, AWS SES, etc.
  console.log('Sending seller notification:', data);
  
  // Example email content
  const emailContent = `
    New inquiry for your ${data.vehicleInfo}
    
    From: ${data.inquirerName} (${data.inquirerEmail})
    ${data.inquirerPhone ? `Phone: ${data.inquirerPhone}` : ''}
    
    Inquiry Type: ${data.inquiryType.replace('_', ' ')}
    
    Message:
    ${data.message}
    
    You can respond directly to this email or contact the interested buyer at ${data.inquirerEmail}.
  `;
  
  // TODO: Implement actual email sending
  return Promise.resolve();
}

async function sendInquirerConfirmation(data: {
  inquirerEmail: string;
  inquirerName: string;
  vehicleInfo: string;
  inquiryType: string;
}) {
  // In a real application, this would integrate with an email service
  console.log('Sending inquirer confirmation:', data);
  
  const emailContent = `
    Hello ${data.inquirerName},
    
    Thank you for your interest in the ${data.vehicleInfo}.
    
    Your inquiry has been sent to the seller and they will contact you soon.
    
    Inquiry details:
    - Type: ${data.inquiryType.replace('_', ' ')}
    - Vehicle: ${data.vehicleInfo}
    
    Best regards,
    AutoLensAI Team
  `;
  
  // TODO: Implement actual email sending
  return Promise.resolve();
}