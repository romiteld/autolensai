import { exec } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';

const execAsync = promisify(exec);

export interface VideoClip {
  id: string;
  filePath: string;
  duration: number;
  sceneNumber: number;
}

export interface AudioTrack {
  id: string;
  filePath: string;
  duration: number;
}

export interface VideoCompilationOptions {
  clips: VideoClip[];
  audio: AudioTrack;
  outputPath: string;
  transitions?: TransitionType[];
  aspectRatio?: '16:9' | '9:16' | '1:1';
  resolution?: '1080x1920' | '1920x1080' | '1080x1080';
  quality?: 'high' | 'medium' | 'low';
}

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'none';

export interface ProcessingProgress {
  stage: 'downloading' | 'processing' | 'uploading' | 'completed';
  progress: number;
  currentStep: string;
  estimatedTime?: number;
}

export class VideoProcessorService {
  private tempDir = '/tmp/autolensai-videos';
  
  constructor() {
    this.ensureTempDirectory();
  }

  private async ensureTempDirectory() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async downloadFile(url: string, filePath: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body available');
      }

      const fileStream = createWriteStream(filePath);
      // @ts-ignore - Response body is a web stream, we need to handle it differently
      const nodeStream = response.body as any;
      await pipeline(nodeStream, fileStream);
    } catch (error) {
      console.error('File download error:', error);
      throw new Error('Failed to download file');
    }
  }

  async compileVideo(options: VideoCompilationOptions): Promise<string> {
    const {
      clips,
      audio,
      outputPath,
      transitions = ['fade', 'fade'],
      aspectRatio = '9:16',
      resolution = '1080x1920',
      quality = 'high',
    } = options;

    try {
      // Sort clips by scene number
      const sortedClips = clips.sort((a, b) => a.sceneNumber - b.sceneNumber);

      // Create FFmpeg command for video compilation
      const ffmpegCommand = this.buildFFmpegCommand(
        sortedClips,
        audio,
        outputPath,
        transitions,
        resolution,
        quality
      );

      console.log('Executing FFmpeg command:', ffmpegCommand);

      // Execute FFmpeg
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      
      if (stderr && !stderr.includes('Press [q] to stop')) {
        console.warn('FFmpeg warnings:', stderr);
      }

      console.log('Video compilation completed:', outputPath);
      return outputPath;
    } catch (error) {
      console.error('Video compilation error:', error);
      throw new Error('Failed to compile video');
    }
  }

  private buildFFmpegCommand(
    clips: VideoClip[],
    audio: AudioTrack,
    outputPath: string,
    transitions: TransitionType[],
    resolution: string,
    quality: string
  ): string {
    const qualitySettings = this.getQualitySettings(quality);
    
    // Input files
    const inputs = [
      ...clips.map(clip => `-i "${clip.filePath}"`),
      `-i "${audio.filePath}"`,
    ].join(' ');

    // Filter complex for transitions and concatenation
    const filterComplex = this.buildFilterComplex(clips, transitions, resolution);

    // Output settings
    const outputSettings = [
      '-map "[final_video]"',
      `-map ${clips.length}:a`, // Audio from last input (audio file)
      '-c:v libx264',
      '-c:a aac',
      qualitySettings,
      '-shortest', // Match shortest stream (video or audio)
      '-avoid_negative_ts make_zero',
      '-fflags +genpts',
      '-movflags +faststart', // Optimize for web playback
    ].join(' ');

    return `ffmpeg ${inputs} -filter_complex "${filterComplex}" ${outputSettings} "${outputPath}" -y`;
  }

  private buildFilterComplex(
    clips: VideoClip[],
    transitions: TransitionType[],
    resolution: string
  ): string {
    const filters: string[] = [];
    
    // Normalize and scale all clips
    clips.forEach((clip, index) => {
      filters.push(`[${index}:v]scale=${resolution},setsar=1[v${index}]`);
    });

    // Create transitions between clips
    let currentLabel = 'v0';
    
    for (let i = 1; i < clips.length; i++) {
      const transition = transitions[i - 1] || 'fade';
      const nextLabel = i === clips.length - 1 ? 'final_video' : `t${i}`;
      
      const transitionFilter = this.getTransitionFilter(
        currentLabel,
        `v${i}`,
        nextLabel,
        transition,
        1.0 // 1 second transition
      );
      
      filters.push(transitionFilter);
      currentLabel = nextLabel;
    }

    // If only one clip, just rename it
    if (clips.length === 1) {
      filters.push(`[v0]copy[final_video]`);
    }

    return filters.join(';');
  }

  private getTransitionFilter(
    input1: string,
    input2: string,
    output: string,
    type: TransitionType,
    duration: number
  ): string {
    switch (type) {
      case 'fade':
        return `[${input1}][${input2}]xfade=transition=fade:duration=${duration}:offset=9[${output}]`;
      
      case 'slide':
        return `[${input1}][${input2}]xfade=transition=slideleft:duration=${duration}:offset=9[${output}]`;
      
      case 'zoom':
        return `[${input1}][${input2}]xfade=transition=smoothleft:duration=${duration}:offset=9[${output}]`;
      
      case 'none':
      default:
        return `[${input1}][${input2}]concat=n=2:v=1:a=0[${output}]`;
    }
  }

  private getQualitySettings(quality: string): string {
    switch (quality) {
      case 'high':
        return '-crf 18 -preset medium -profile:v high -level 4.0';
      case 'medium':
        return '-crf 23 -preset fast -profile:v main -level 3.1';
      case 'low':
        return '-crf 28 -preset faster -profile:v baseline -level 3.0';
      default:
        return '-crf 23 -preset fast -profile:v main -level 3.1';
    }
  }

  async optimizeForPlatform(inputPath: string, platform: 'youtube' | 'instagram' | 'tiktok'): Promise<string> {
    const outputPath = inputPath.replace('.mp4', `_${platform}.mp4`);
    
    const platformSettings = {
      youtube: {
        resolution: '1080x1920',
        bitrate: '8000k',
        maxDuration: 60,
      },
      instagram: {
        resolution: '1080x1920',
        bitrate: '6000k',
        maxDuration: 60,
      },
      tiktok: {
        resolution: '1080x1920',
        bitrate: '4000k',
        maxDuration: 60,
      },
    };

    const settings = platformSettings[platform];
    
    const command = `ffmpeg -i "${inputPath}" -vf scale=${settings.resolution} -b:v ${settings.bitrate} -c:v libx264 -c:a aac -t ${settings.maxDuration} "${outputPath}" -y`;
    
    try {
      await execAsync(command);
      return outputPath;
    } catch (error) {
      console.error(`Platform optimization error for ${platform}:`, error);
      throw new Error(`Failed to optimize video for ${platform}`);
    }
  }

  async extractVideoInfo(filePath: string): Promise<{ duration: number; resolution: string; format: string }> {
    try {
      const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
      const { stdout } = await execAsync(command);
      const info = JSON.parse(stdout);
      
      const videoStream = info.streams.find((stream: any) => stream.codec_type === 'video');
      
      return {
        duration: parseFloat(info.format.duration),
        resolution: `${videoStream.width}x${videoStream.height}`,
        format: info.format.format_name,
      };
    } catch (error) {
      console.error('Video info extraction error:', error);
      throw new Error('Failed to extract video information');
    }
  }

  async addWatermark(inputPath: string, watermarkPath: string, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right'): Promise<string> {
    const outputPath = inputPath.replace('.mp4', '_watermarked.mp4');
    
    const positions = {
      'top-left': '10:10',
      'top-right': 'W-w-10:10',
      'bottom-left': '10:H-h-10',
      'bottom-right': 'W-w-10:H-h-10',
    };

    const command = `ffmpeg -i "${inputPath}" -i "${watermarkPath}" -filter_complex "[1:v]scale=100:50[watermark];[0:v][watermark]overlay=${positions[position]}" -c:a copy "${outputPath}" -y`;
    
    try {
      await execAsync(command);
      return outputPath;
    } catch (error) {
      console.error('Watermark addition error:', error);
      throw new Error('Failed to add watermark');
    }
  }

  async cleanup(filePaths: string[]): Promise<void> {
    try {
      await Promise.all(filePaths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn(`Failed to delete file ${filePath}:`, error);
        }
      }));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async generateThumbnail(videoPath: string, timeOffset: number = 5): Promise<string> {
    const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');
    
    const command = `ffmpeg -i "${videoPath}" -ss ${timeOffset} -vframes 1 -q:v 2 "${thumbnailPath}" -y`;
    
    try {
      await execAsync(command);
      return thumbnailPath;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  // Check if FFmpeg is available
  async checkFFmpegAvailability(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch (error) {
      console.error('FFmpeg not available:', error);
      return false;
    }
  }

  // Get temporary file path
  getTempFilePath(extension: string = 'mp4'): string {
    const filename = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
    return path.join(this.tempDir, filename);
  }
}

export const videoProcessorService = new VideoProcessorService();