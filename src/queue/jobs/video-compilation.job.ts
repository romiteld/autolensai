import { Job } from 'bull';
import { videoProcessorService } from '@/ai/video-generation/video-processor.service';
import { supabase } from '@/core/database/supabase';
import type { VideoClip, AudioTrack, TransitionType } from '@/ai/video-generation/video-processor.service';

export interface VideoCompilationJobData {
  vehicleId: string;
  userId: string;
  videoClips: {
    id: string;
    url: string;
    sceneNumber: number;
    duration: number;
  }[];
  audioTrack: {
    id: string;
    url: string;
    duration: number;
  };
  options: {
    transitions?: TransitionType[];
    aspectRatio?: '16:9' | '9:16' | '1:1';
    resolution?: '1080x1920' | '1920x1080' | '1080x1080';
    quality?: 'high' | 'medium' | 'low';
    platform?: 'youtube' | 'instagram' | 'tiktok';
    addWatermark?: boolean;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

export interface VideoCompilationResult {
  finalVideoUrl: string;
  thumbnailUrl: string;
  duration: number;
  fileSize: number;
  resolution: string;
  platform: string;
  vehicleId: string;
  compiledAt: Date;
}

export class VideoCompilationJob {
  static async process(job: Job<VideoCompilationJobData>): Promise<VideoCompilationResult> {
    const { vehicleId, userId, videoClips, audioTrack, options } = job.data;
    
    console.log(`Compiling video for vehicle ${vehicleId} with ${videoClips.length} clips`);
    
    try {
      // Update progress
      await job.progress(5);

      // Validate inputs
      this.validateInputs(videoClips, audioTrack);

      await job.progress(10);

      // Download video clips
      const downloadedClips: VideoClip[] = [];
      for (let i = 0; i < videoClips.length; i++) {
        const clip = videoClips[i];
        const tempPath = videoProcessorService.getTempFilePath('mp4');
        
        await videoProcessorService.downloadFile(clip.url, tempPath);
        
        downloadedClips.push({
          id: clip.id,
          filePath: tempPath,
          duration: clip.duration,
          sceneNumber: clip.sceneNumber,
        });

        const downloadProgress = 10 + (i + 1) * 20 / videoClips.length;
        await job.progress(Math.round(downloadProgress));
      }

      await job.progress(30);

      // Download audio track
      const audioPath = videoProcessorService.getTempFilePath('mp3');
      await videoProcessorService.downloadFile(audioTrack.url, audioPath);

      const downloadedAudio: AudioTrack = {
        id: audioTrack.id,
        filePath: audioPath,
        duration: audioTrack.duration,
      };

      await job.progress(40);

      // Sort clips by scene number
      downloadedClips.sort((a, b) => a.sceneNumber - b.sceneNumber);

      // Prepare compilation options
      const compilationOptions = {
        clips: downloadedClips,
        audio: downloadedAudio,
        outputPath: videoProcessorService.getTempFilePath('mp4'),
        transitions: options.transitions || ['fade', 'fade'],
        aspectRatio: options.aspectRatio || '9:16',
        resolution: options.resolution || '1080x1920',
        quality: options.quality || 'high',
      };

      await job.progress(50);

      // Compile video
      const compiledVideoPath = await videoProcessorService.compileVideo(compilationOptions);

      await job.progress(70);

      // Add watermark if requested
      let finalVideoPath = compiledVideoPath;
      if (options.addWatermark) {
        // For now, we'll skip watermark as we don't have a watermark file
        // In production, you'd have a company logo/watermark file
        console.log('Watermark requested but not implemented yet');
      }

      await job.progress(75);

      // Optimize for platform if specified
      if (options.platform && options.platform !== 'youtube') {
        finalVideoPath = await videoProcessorService.optimizeForPlatform(
          finalVideoPath,
          options.platform
        );
      }

      await job.progress(80);

      // Generate thumbnail
      const thumbnailPath = await videoProcessorService.generateThumbnail(finalVideoPath, 5);

      await job.progress(85);

      // Get video info
      const videoInfo = await videoProcessorService.extractVideoInfo(finalVideoPath);

      await job.progress(90);

      // Upload to storage
      const { finalVideoUrl, thumbnailUrl } = await this.uploadToStorage(
        finalVideoPath,
        thumbnailPath,
        vehicleId
      );

      await job.progress(95);

      // Save compilation record to database
      await this.saveCompilationRecord(
        vehicleId,
        userId,
        finalVideoUrl,
        thumbnailUrl,
        videoInfo,
        options.platform || 'youtube'
      );

      await job.progress(98);

      // Cleanup temporary files
      await this.cleanup([
        ...downloadedClips.map(clip => clip.filePath),
        downloadedAudio.filePath,
        compiledVideoPath,
        finalVideoPath !== compiledVideoPath ? finalVideoPath : '',
        thumbnailPath,
      ]);

      await job.progress(100);

      const result: VideoCompilationResult = {
        finalVideoUrl,
        thumbnailUrl,
        duration: videoInfo.duration,
        fileSize: 0, // Would need to be calculated from actual file
        resolution: videoInfo.resolution,
        platform: options.platform || 'youtube',
        vehicleId,
        compiledAt: new Date(),
      };

      console.log(`Video compilation completed for vehicle ${vehicleId}: ${finalVideoUrl}`);
      return result;

    } catch (error) {
      console.error('Video compilation job failed:', error);
      
      // Cleanup on error
      try {
        await this.cleanup([
          videoProcessorService.getTempFilePath('mp4'),
          videoProcessorService.getTempFilePath('mp3'),
        ]);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      throw error;
    }
  }

  private static validateInputs(videoClips: any[], audioTrack: any): void {
    if (!videoClips || videoClips.length === 0) {
      throw new Error('No video clips provided');
    }

    if (videoClips.length !== 3) {
      throw new Error('Exactly 3 video clips are required');
    }

    videoClips.forEach((clip, index) => {
      if (!clip.url) {
        throw new Error(`Video clip ${index + 1} is missing URL`);
      }
      if (!clip.sceneNumber) {
        throw new Error(`Video clip ${index + 1} is missing scene number`);
      }
    });

    if (!audioTrack || !audioTrack.url) {
      throw new Error('Audio track is missing or has no URL');
    }
  }

  private static async uploadToStorage(
    videoPath: string,
    thumbnailPath: string,
    vehicleId: string
  ): Promise<{ finalVideoUrl: string; thumbnailUrl: string }> {
    try {
      const timestamp = Date.now();
      
      // Upload video
      const videoFileName = `videos/${vehicleId}/${timestamp}_compiled.mp4`;
      const videoBuffer = await require('fs').promises.readFile(videoPath);
      
      const { data: videoData, error: videoError } = await supabase.storage
        .from('vehicles')
        .upload(videoFileName, videoBuffer, {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (videoError) {
        throw new Error(`Failed to upload video: ${videoError.message}`);
      }

      // Upload thumbnail
      const thumbnailFileName = `videos/${vehicleId}/${timestamp}_thumbnail.jpg`;
      const thumbnailBuffer = await require('fs').promises.readFile(thumbnailPath);
      
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('vehicles')
        .upload(thumbnailFileName, thumbnailBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (thumbnailError) {
        throw new Error(`Failed to upload thumbnail: ${thumbnailError.message}`);
      }

      // Get public URLs
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(videoFileName);

      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(thumbnailFileName);

      return {
        finalVideoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
      };

    } catch (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
  }

  private static async saveCompilationRecord(
    vehicleId: string,
    userId: string,
    videoUrl: string,
    thumbnailUrl: string,
    videoInfo: any,
    platform: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicle_videos')
        .insert({
          vehicle_id: vehicleId,
          user_id: userId,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          duration: videoInfo.duration,
          resolution: videoInfo.resolution,
          file_format: videoInfo.format,
          platform: platform,
          status: 'completed',
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to save compilation record:', error);
        // Don't throw here as the video is successfully compiled
      }
    } catch (error) {
      console.error('Database save error:', error);
    }
  }

  private static async cleanup(filePaths: string[]): Promise<void> {
    try {
      await videoProcessorService.cleanup(filePaths.filter(Boolean));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Get compilation presets for different platforms
  static getCompilationPresets() {
    return {
      youtube: {
        aspectRatio: '9:16' as const,
        resolution: '1080x1920' as const,
        quality: 'high' as const,
        maxDuration: 60,
        transitions: ['fade', 'fade'] as TransitionType[],
      },
      instagram: {
        aspectRatio: '9:16' as const,
        resolution: '1080x1920' as const,
        quality: 'high' as const,
        maxDuration: 60,
        transitions: ['slide', 'zoom'] as TransitionType[],
      },
      tiktok: {
        aspectRatio: '9:16' as const,
        resolution: '1080x1920' as const,
        quality: 'medium' as const,
        maxDuration: 60,
        transitions: ['zoom', 'slide'] as TransitionType[],
      },
      facebook: {
        aspectRatio: '16:9' as const,
        resolution: '1920x1080' as const,
        quality: 'high' as const,
        maxDuration: 90,
        transitions: ['fade', 'fade'] as TransitionType[],
      },
    };
  }

  // Estimate compilation time
  static estimateCompilationTime(videoClips: any[], options: any): number {
    const baseTime = 30; // 30 seconds base compilation time
    const clipProcessingTime = videoClips.length * 10; // 10 seconds per clip
    const qualityMultiplier = options.quality === 'high' ? 1.5 : options.quality === 'low' ? 0.7 : 1;
    
    return Math.round((baseTime + clipProcessingTime) * qualityMultiplier);
  }

  // Validate compilation options
  static validateOptions(options: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.aspectRatio && !['16:9', '9:16', '1:1'].includes(options.aspectRatio)) {
      errors.push('Invalid aspect ratio');
    }

    if (options.quality && !['high', 'medium', 'low'].includes(options.quality)) {
      errors.push('Invalid quality setting');
    }

    if (options.platform && !['youtube', 'instagram', 'tiktok', 'facebook'].includes(options.platform)) {
      errors.push('Invalid platform');
    }

    if (options.transitions && options.transitions.length > 0) {
      const validTransitions = ['fade', 'slide', 'zoom', 'none'];
      const invalidTransitions = options.transitions.filter((t: string) => !validTransitions.includes(t));
      if (invalidTransitions.length > 0) {
        errors.push(`Invalid transitions: ${invalidTransitions.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default VideoCompilationJob;