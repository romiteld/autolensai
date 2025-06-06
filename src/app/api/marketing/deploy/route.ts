import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MarketingCrew } from '@/marketing/crewai-agents/crews/marketing.crew';
import { VehicleService } from '@/vehicle/services/vehicle.service';
import { MarketingCampaignService } from '@/marketing/services/campaign.service';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';

const DeployRequestSchema = z.object({
  vehicleId: z.string().uuid(),
  platforms: z.array(z.enum(['facebook', 'instagram', 'craigslist', 'youtube', 'all'])).default(['all']),
  campaignId: z.string().uuid().optional(),
  immediate: z.boolean().default(false),
  template: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    price: z.number().optional(),
  }).optional(),
});

type DeployRequest = z.infer<typeof DeployRequestSchema>;

const marketingCrew = new MarketingCrew();
const vehicleService = new VehicleService();
const campaignService = new MarketingCampaignService();

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json();
    const validatedData = DeployRequestSchema.parse(body);

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

    if (validatedData.immediate) {
      // Deploy immediately using CrewAI agents
      try {
        const deploymentTask = await marketingCrew.deployVehicleCampaign(
          vehicle,
          validatedData.platforms
        );

        // Update campaign status if provided
        if (validatedData.campaignId) {
          await campaignService.updateCampaignDeployment(validatedData.campaignId, {
            status: 'deployed',
            deploymentResults: deploymentTask.result,
            deployedAt: new Date(),
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            taskId: deploymentTask.id,
            status: deploymentTask.status,
            platforms: validatedData.platforms,
            results: deploymentTask.result,
          },
        });
      } catch (error) {
        console.error('Immediate deployment failed:', error);
        return NextResponse.json(
          {
            success: false,
            error: 'Deployment failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    } else {
      // Queue deployment for background processing
      const jobId = `deploy_${validatedData.vehicleId}_${Date.now()}`;
      
      const job = await queueService.addJob(QUEUE_NAMES.MARKETING_AUTOMATION, {
        id: jobId,
        data: {
          type: 'DEPLOY_LISTING',
          vehicleId: validatedData.vehicleId,
          platforms: validatedData.platforms,
          campaignId: validatedData.campaignId,
          template: validatedData.template,
        },
        priority: 10,
      });

      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
          status: 'queued',
          platforms: validatedData.platforms,
          message: 'Deployment queued for background processing',
        },
      }, { status: 202 });
    }
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

    console.error('Failed to deploy campaign:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to deploy campaign',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const vehicleId = searchParams.get('vehicleId');

    if (taskId) {
      // Get specific deployment task status
      const task = await marketingCrew.getTaskStatus(taskId);
      
      if (!task) {
        return NextResponse.json(
          {
            success: false,
            error: 'Task not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: task,
      });
    } else if (vehicleId) {
      // Get all deployment tasks for a vehicle
      const allTasks = await marketingCrew.getAllTasks();
      const vehicleTasks = allTasks.filter(task => task.vehicleId === vehicleId);

      return NextResponse.json({
        success: true,
        data: vehicleTasks,
      });
    } else {
      // Get all deployment tasks
      const allTasks = await marketingCrew.getAllTasks();

      return NextResponse.json({
        success: true,
        data: allTasks,
      });
    }
  } catch (error) {
    console.error('Failed to get deployment status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get deployment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task ID is required',
        },
        { status: 400 }
      );
    }

    const cancelled = await marketingCrew.cancelTask(taskId);

    if (!cancelled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found or cannot be cancelled',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deployment task cancelled successfully',
    });
  } catch (error) {
    console.error('Failed to cancel deployment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel deployment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}