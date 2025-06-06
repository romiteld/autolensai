import { Job } from 'bull';
import { falaiService } from '@/ai/services/falai.service';
import { sonautoService } from '@/ai/services/sonauto.service';
import { videoProcessorService } from '@/ai/video-generation/video-processor.service';
import { openaiService } from '@/ai/services/openai.service';
import { supabase } from '@/core/database/supabase';
import SceneGenerationJob from './scene-generation.job';
import MusicGenerationJob from './music-generation.job';
import VideoCompilationJob from './video-compilation.job';
import type { VehicleWithImages } from '@/vehicle/models/vehicle.model';
import type { SceneDescription } from '@/ai/services/openai.service';

export interface VideoGenerationJobData {
  vehicleId: string;
  userId: string;
  marketingIdea: string;
  imageUrls: string[];
  style?: string;
  theme?: string;
  platform?: 'youtube' | 'instagram' | 'tiktok';
}

export interface VideoGenerationStatus {
  id: string;
  status: 'queued' | 'generating_scenes' | 'generating_videos' | 'generating_music' | 'compiling' | 'uploading' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  scenes?: SceneDescription[];
  videoClips?: string[];
  musicUrl?: string;
  finalVideoUrl?: string;
  error?: string;
  estimatedTime?: number;
  createdAt: Date;
  completedAt?: Date;
}

export class VideoGenerationJob {
  static async process(job: Job<VideoGenerationJobData>): Promise<VideoGenerationStatus> {
    const { vehicleId, userId, marketingIdea, imageUrls, style, theme, platform = 'youtube' } = job.data;
    
    console.log(`Starting video generation for vehicle ${vehicleId}`);
    
    try {
      // Update status: Starting
      await VideoGenerationJob.updateStatus(job, {
        status: 'generating_scenes',
        progress: 10,
        currentStep: 'Generating video scenes with AI',
        estimatedTime: 400, // 6-7 minutes estimated
      });

      // Step 1: Get vehicle data
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Step 2: Generate scenes with OpenAI
      const scenes = await openaiService.generateVideoScenes(vehicle, marketingIdea);
      
      await VideoGenerationJob.updateStatus(job, {
        status: 'generating_videos',
        progress: 20,
        currentStep: 'Generating video clips from images',
        scenes,
      });

      // Step 3: Generate videos with FalAI (parallel)
      const videoResponses = await falaiService.generateMultipleVideos(scenes, imageUrls);
      
      // Monitor video generation progress
      const videoClips = await VideoGenerationJob.monitorVideoGeneration(
        job,
        videoResponses,
        20, // Start progress
        70  // End progress
      );

      await VideoGenerationJob.updateStatus(job, {
        status: 'generating_music',
        progress: 75,
        currentStep: 'Generating background music',
        videoClips: videoClips.map(clip => clip.url),
      });

      // Step 4: Generate music with Sonauto
      const vehicleType = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      const musicResponse = await sonautoService.generateAutomotiveMusic(vehicleType, scenes, 30);
      
      // Monitor music generation
      const audioTrack = await VideoGenerationJob.monitorMusicGeneration(job, musicResponse, 75, 85);

      await VideoGenerationJob.updateStatus(job, {
        status: 'compiling',
        progress: 85,
        currentStep: 'Compiling final video',
        musicUrl: audioTrack.filePath,
      });

      // Step 5: Download and compile video
      const finalVideo = await VideoGenerationJob.compileVideo(
        job,
        videoClips,
        audioTrack,
        platform
      );

      await VideoGenerationJob.updateStatus(job, {
        status: 'uploading',
        progress: 95,
        currentStep: 'Uploading final video',
      });

      // Step 6: Upload to storage
      const finalVideoUrl = await VideoGenerationJob.uploadToStorage(finalVideo, vehicleId);

      // Step 7: Save to database
      await VideoGenerationJob.saveVideoRecord(vehicleId, userId, finalVideoUrl, scenes);

      // Final status
      const completedStatus: VideoGenerationStatus = {
        id: job.id?.toString() || '',
        status: 'completed',
        progress: 100,
        currentStep: 'Video generation completed',
        finalVideoUrl,
        scenes,
        videoClips: videoClips.map(clip => clip.url),
        musicUrl: audioTrack.filePath,
        createdAt: new Date(job.timestamp),
        completedAt: new Date(),
      };

      await VideoGenerationJob.updateStatus(job, completedStatus);

      // Cleanup temporary files
      await VideoGenerationJob.cleanup([
        ...videoClips.map(clip => clip.filePath || ''),
        audioTrack.filePath,
        finalVideo,
      ]);

      return completedStatus;

    } catch (error) {
      console.error('Video generation job failed:', error);
      
      const failedStatus: VideoGenerationStatus = {
        id: job.id?.toString() || '',
        status: 'failed',
        progress: 0,
        currentStep: 'Video generation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(job.timestamp),
      };

      await VideoGenerationJob.updateStatus(job, failedStatus);
      throw error;
    }
  }

  private static async monitorVideoGeneration(
    job: Job<VideoGenerationJobData>,
    videoResponses: any[],
    startProgress: number,
    endProgress: number
  ): Promise<any[]> {
    const videoClips: any[] = [];
    const progressStep = (endProgress - startProgress) / videoResponses.length;
    
    for (let i = 0; i < videoResponses.length; i++) {
      const response = videoResponses[i];
      let completed = false;
      
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
        
        const status = await falaiService.getVideoStatus(response.id);
        
        if (status.status === 'completed' && status.video_url) {
          // Download video
          const tempPath = videoProcessorService.getTempFilePath('mp4');
          await videoProcessorService.downloadFile(status.video_url, tempPath);
          
          videoClips.push({
            id: response.id,
            url: status.video_url,
            filePath: tempPath,
            duration: 10,
            sceneNumber: i + 1,
          });
          
          completed = true;
        } else if (status.status === 'failed') {
          throw new Error(`Video generation failed for scene ${i + 1}: ${status.error}`);
        }
        
        // Update progress
        const currentProgress = startProgress + (i * progressStep) + (status.progress || 0) * progressStep / 100;
        await VideoGenerationJob.updateStatus(job, {
          progress: Math.round(currentProgress),
          currentStep: `Generating video clip ${i + 1} of ${videoResponses.length}`,
        });
      }
    }
    
    return videoClips;
  }

  private static async monitorMusicGeneration(
    job: Job<VideoGenerationJobData>,
    musicResponse: any,
    startProgress: number,
    endProgress: number
  ): Promise<{ filePath: string; duration: number }> {
    let completed = false;
    
    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
      
      const status = await sonautoService.getMusicStatus(musicResponse.id);
      
      if (status.status === 'completed' && status.audio_url) {
        // Download audio
        const tempPath = videoProcessorService.getTempFilePath('mp3');
        await videoProcessorService.downloadFile(status.audio_url, tempPath);
        
        completed = true;
        return {
          filePath: tempPath,
          duration: status.duration || 30,
        };
      } else if (status.status === 'failed') {
        throw new Error(`Music generation failed: ${status.error}`);
      }
      
      // Update progress
      const currentProgress = startProgress + (status.progress || 0) * (endProgress - startProgress) / 100;
      await VideoGenerationJob.updateStatus(job, {
        progress: Math.round(currentProgress),
        currentStep: 'Generating background music',
      });
    }
    
    throw new Error('Music generation timeout');
  }

  private static async compileVideo(
    job: Job<VideoGenerationJobData>,
    videoClips: any[],
    audioTrack: { filePath: string; duration: number },
    platform: string
  ): Promise<string> {
    const outputPath = videoProcessorService.getTempFilePath('mp4');
    
    await videoProcessorService.compileVideo({
      clips: videoClips,
      audio: {
        id: 'background',
        filePath: audioTrack.filePath,
        duration: audioTrack.duration,
      },
      outputPath,
      transitions: ['fade', 'fade'],
      aspectRatio: '9:16',
      resolution: '1080x1920',
      quality: 'high',
    });

    // Optimize for platform
    if (platform !== 'youtube') {
      return await videoProcessorService.optimizeForPlatform(outputPath, platform as any);
    }

    return outputPath;
  }

  private static async uploadToStorage(filePath: string, vehicleId: string): Promise<string> {
    const fileName = `videos/${vehicleId}/${Date.now()}_marketing_video.mp4`;
    
    // Read file
    const fileBuffer = await require('fs').promises.readFile(filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload video: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  private static async saveVideoRecord(
    vehicleId: string,
    userId: string,
    videoUrl: string,
    scenes: SceneDescription[]
  ): Promise<void> {
    const { error } = await supabase
      .from('vehicle_videos')
      .insert({
        vehicle_id: vehicleId,
        user_id: userId,
        video_url: videoUrl,
        scenes: scenes,
        platform: 'youtube',
        status: 'completed',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to save video record:', error);
      // Don't throw here as the video is already generated
    }
  }

  private static async updateStatus(job: Job<VideoGenerationJobData>, update: Partial<VideoGenerationStatus>): Promise<void> {
    try {
      // Update job progress
      if (update.progress !== undefined) {
        await job.progress(update.progress);
      }

      // Store detailed status in Redis or database
      const statusKey = `video_generation:${job.id}`;
      const currentStatus = await job.queue.client.get(statusKey);
      const status = currentStatus ? JSON.parse(currentStatus) : {
        id: job.id?.toString() || '',
        status: 'queued',
        progress: 0,
        currentStep: 'Starting video generation',
        createdAt: new Date(job.timestamp),
      };

      const updatedStatus = { ...status, ...update };
      await job.queue.client.setex(statusKey, 3600, JSON.stringify(updatedStatus)); // 1 hour TTL
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  }

  private static async cleanup(filePaths: string[]): Promise<void> {
    try {
      await videoProcessorService.cleanup(filePaths.filter(Boolean));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Static method to get job status
  static async getStatus(jobId: string): Promise<VideoGenerationStatus | null> {
    try {
      // This would need access to the queue client
      // For now, we'll implement this in the API endpoints
      return null;
    } catch (error) {
      console.error('Failed to get job status:', error);
      return null;
    }
  }
}

export default VideoGenerationJob;