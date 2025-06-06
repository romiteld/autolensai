import { NextRequest, NextResponse } from 'next/server';
import { OpenAIService } from '@/ai/services/openai.service';
import { createSupabaseClient } from '@/core/database/supabase';
import { z } from 'zod';

const GenerateDescriptionSchema = z.object({
  vehicleId: z.string().uuid(),
});

const openAIService = new OpenAIService();

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleId } = GenerateDescriptionSchema.parse(body);

    // Fetch vehicle data
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .eq('user_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Generate description using OpenAI
    const description = await openAIService.generateVehicleDescription({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      condition: vehicle.condition,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuel_type,
      exteriorColor: vehicle.exterior_color,
      interiorColor: vehicle.interior_color,
    });

    // Update vehicle with generated description
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ description })
      .eq('id', vehicleId)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ description });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }
    
    console.error('Generate description error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}