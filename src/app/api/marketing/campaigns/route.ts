import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MarketingCampaignService } from '@/marketing/services/campaign.service';
import { VehicleService } from '@/vehicle/services/vehicle.service';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';

const CreateCampaignSchema = z.object({
  vehicleId: z.string().uuid(),
  platforms: z.array(z.enum(['facebook', 'instagram', 'craigslist', 'youtube', 'all'])).default(['all']),
  templateId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  autoOptimization: z.boolean().default(false),
  budget: z.object({
    total: z.number().min(0),
    dailyLimit: z.number().min(0).optional(),
  }).optional(),
  targeting: z.object({
    location: z.string().optional(),
    radius: z.number().min(1).max(500).optional(),
    demographics: z.object({
      ageMin: z.number().min(18).max(100).optional(),
      ageMax: z.number().min(18).max(100).optional(),
      interests: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
});

type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>;

const UpdateCampaignSchema = z.object({
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  budget: z.object({
    total: z.number().min(0),
    dailyLimit: z.number().min(0).optional(),
  }).optional(),
  targeting: z.object({
    location: z.string().optional(),
    radius: z.number().min(1).max(500).optional(),
    demographics: z.object({
      ageMin: z.number().min(18).max(100).optional(),
      ageMax: z.number().min(18).max(100).optional(),
      interests: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  autoOptimization: z.boolean().optional(),
});

type UpdateCampaignRequest = z.infer<typeof UpdateCampaignSchema>;

const campaignService = new MarketingCampaignService();
const vehicleService = new VehicleService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const vehicleId = searchParams.get('vehicleId');

    const filters = {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
    };

    const campaigns = await campaignService.getCampaigns({
      page,
      limit,
      filters,
    });

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch campaigns',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCampaignRequest = await request.json();
    const validatedData = CreateCampaignSchema.parse(body);

    // Verify vehicle exists
    const vehicle = await vehicleService.getVehicleById(validatedData.vehicleId);
    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vehicle not found',
        },
        { status: 404 }
      );
    }

    // Create campaign
    const campaign = await campaignService.createCampaign({
      ...validatedData,
      vehicle,
    });

    // Queue campaign deployment job
    const jobId = `campaign_deploy_${campaign.id}_${Date.now()}`;
    await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
      id: jobId,
      data: {
        type: 'DEPLOY_CAMPAIGN',
        campaignId: campaign.id,
        vehicleId: validatedData.vehicleId,
        platforms: validatedData.platforms,
        scheduledAt: validatedData.scheduledAt,
      },
      priority: validatedData.scheduledAt ? 5 : 10,
      delay: validatedData.scheduledAt ? 
        new Date(validatedData.scheduledAt).getTime() - Date.now() : 0,
    });

    return NextResponse.json({
      success: true,
      data: campaign,
      jobId,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create campaign',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign ID is required',
        },
        { status: 400 }
      );
    }

    const body: UpdateCampaignRequest = await request.json();
    const validatedData = UpdateCampaignSchema.parse(body);

    const updatedCampaign = await campaignService.updateCampaign(campaignId, validatedData);

    if (!updatedCampaign) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign not found',
        },
        { status: 404 }
      );
    }

    // Queue optimization job if auto-optimization is enabled
    if (validatedData.autoOptimization) {
      const jobId = `campaign_optimize_${campaignId}_${Date.now()}`;
      await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
        id: jobId,
        data: {
          type: 'OPTIMIZE_CAMPAIGN',
          campaignId,
        },
        priority: 5,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to update campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update campaign',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('id');

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign ID is required',
        },
        { status: 400 }
      );
    }

    const success = await campaignService.deleteCampaign(campaignId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campaign not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete campaign',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}