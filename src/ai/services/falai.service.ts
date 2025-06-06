import { env } from '@/core/config/env';
import type { SceneDescription } from './openai.service';

export interface VideoGenerationRequest {
  imageUrl: string;
  prompt: string;
  duration: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  mode?: 'std' | 'pro';
}

export interface VideoGenerationResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  progress?: number;
  error?: string;
  estimated_time?: number;
}

export interface FalAIVideoClip {
  id: string;
  url: string;
  duration: number;
  sceneNumber: number;
  status: 'completed' | 'failed';
}

export class FalAIService {
  private baseUrl = 'https://fal.run/fal-ai';
  private apiKey: string;

  constructor() {
    this.apiKey = env.get('FAL_AI_API_KEY');
    if (!this.apiKey) {
      throw new Error('FAL_AI_API_KEY is required');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'POST', data?: any) {
    const url = `${this.baseUrl}/${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FalAI API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async generateVideoFromImage(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const payload = {
        image_url: request.imageUrl,
        prompt: request.prompt,
        duration: request.duration,
        aspect_ratio: request.aspectRatio || '9:16',
        mode: request.mode || 'std',
        // Automotive-specific optimizations
        cfg_scale: 7.5,
        num_inference_steps: 25,
        seed: Math.floor(Math.random() * 1000000),
      };

      console.log('Generating video with FalAI:', {
        prompt: request.prompt,
        duration: request.duration,
        imageUrl: request.imageUrl.substring(0, 50) + '...',
      });

      const response = await this.makeRequest('kling-video/v1/standard/image-to-video', 'POST', payload);
      
      return {
        id: response.request_id || response.id,
        status: 'queued',
        estimated_time: request.duration === 10 ? 360 : 600, // 6-10 minutes based on duration
      };
    } catch (error) {
      console.error('FalAI video generation error:', error);
      throw new Error('Failed to generate video with FalAI');
    }
  }

  async getVideoStatus(videoId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await this.makeRequest(`requests/${videoId}`, 'GET');
      
      return {
        id: videoId,
        status: this.mapFalAIStatus(response.status),
        video_url: response.data?.video?.url,
        progress: response.progress || 0,
        error: response.error?.message,
      };
    } catch (error) {
      console.error('FalAI status check error:', error);
      return {
        id: videoId,
        status: 'failed',
        error: 'Failed to check video status',
      };
    }
  }

  private mapFalAIStatus(falaiStatus: string): 'queued' | 'processing' | 'completed' | 'failed' {
    switch (falaiStatus?.toLowerCase()) {
      case 'pending':
      case 'queued':
        return 'queued';
      case 'in_progress':
      case 'processing':
        return 'processing';
      case 'completed':
      case 'success':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'queued';
    }
  }

  async generateMultipleVideos(
    scenes: SceneDescription[],
    imageUrls: string[]
  ): Promise<VideoGenerationResponse[]> {
    if (scenes.length !== imageUrls.length) {
      throw new Error('Number of scenes must match number of images');
    }

    const requests = scenes.map((scene, index) => ({
      imageUrl: imageUrls[index],
      prompt: this.optimizePromptForVideo(scene.description, scene.cameraMovement, scene.mood),
      duration: scene.duration || 10,
      aspectRatio: '9:16' as const, // Optimized for YouTube Shorts/Instagram Reels
    }));

    // Process in parallel for faster generation
    const promises = requests.map(request => this.generateVideoFromImage(request));
    
    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Bulk video generation error:', error);
      throw new Error('Failed to generate multiple videos');
    }
  }

  private optimizePromptForVideo(description: string, cameraMovement: string, mood: string): string {
    // Enhance the prompt for better video generation
    const enhancedPrompt = `${description}. Camera movement: ${cameraMovement}. Mood: ${mood}. High quality automotive commercial style, professional lighting, cinematic composition, smooth motion, 4K quality.`;
    
    // Ensure prompt isn't too long (FalAI has limits)
    return enhancedPrompt.length > 500 ? enhancedPrompt.substring(0, 497) + '...' : enhancedPrompt;
  }

  async downloadVideo(videoUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Video download error:', error);
      throw new Error('Failed to download generated video');
    }
  }

  // Utility method to check service health
  async checkHealth(): Promise<boolean> {
    try {
      // Simple health check - this might need adjustment based on FalAI's actual health endpoint
      await this.makeRequest('health', 'GET');
      return true;
    } catch (error) {
      console.error('FalAI health check failed:', error);
      return false;
    }
  }

  // Get pricing information for cost estimation
  getCostEstimate(duration: number, mode: 'std' | 'pro' = 'std'): number {
    // Estimated costs based on FalAI pricing (these are estimates)
    const baseCost = mode === 'std' ? 0.05 : 0.15; // per 10-second clip
    const durationMultiplier = duration / 10;
    return baseCost * durationMultiplier;
  }
}

export const falaiService = new FalAIService();