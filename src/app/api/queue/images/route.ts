import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';
import { queueService } from '@/queue/services/queue.service';
import { QUEUE_NAMES } from '@/queue/config/queue.config';
import { imageProcessingProcessor } from '@/queue/processors/image-processing.processor';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['pause', 'resume', 'clean', 'stats']),
  olderThan: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get queue statistics
    const stats = await queueService.getJobCounts(QUEUE_NAMES.IMAGE_PROCESSING);
    const processorStats = await imageProcessingProcessor.getStats();

    return NextResponse.json({
      queueName: QUEUE_NAMES.IMAGE_PROCESSING,
      stats,
      processorStats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Get queue stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions (you might want to add a role check here)
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    // For now, allow all authenticated users to manage queues
    // In production, you'd want proper role-based access control

    const body = await request.json();
    const validatedData = actionSchema.parse(body);

    let result;
    switch (validatedData.action) {
      case 'pause':
        await imageProcessingProcessor.pauseProcessing();
        result = { message: 'Image processing paused' };
        break;

      case 'resume':
        await imageProcessingProcessor.resumeProcessing();
        result = { message: 'Image processing resumed' };
        break;

      case 'clean':
        if (validatedData.olderThan) {
          await imageProcessingProcessor.cleanCompletedJobs(validatedData.olderThan);
          await imageProcessingProcessor.cleanFailedJobs(validatedData.olderThan);
          result = { message: `Cleaned jobs older than ${validatedData.olderThan}ms` };
        } else {
          await imageProcessingProcessor.cleanCompletedJobs();
          await imageProcessingProcessor.cleanFailedJobs();
          result = { message: 'Cleaned old jobs with default timeouts' };
        }
        break;

      case 'stats':
        const stats = await imageProcessingProcessor.getStats();
        result = { stats };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action: validatedData.action,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Queue management error:', error);
    return NextResponse.json(
      { error: 'Failed to execute queue action' },
      { status: 500 }
    );
  }
}