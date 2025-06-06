export interface VideoOutputFormat {
  id: string;
  name: string;
  platform: string;
  aspectRatio: string;
  resolution: string;
  frameRate: number;
  bitrate: string;
  maxDuration: number;
  audioCodec: string;
  videoCodec: string;
  container: string;
  optimizations: string[];
}

export interface VideoQualityPreset {
  id: string;
  name: string;
  description: string;
  crf: number;
  preset: string;
  profile: string;
  level: string;
  estimatedFileSize: string;
  targetAudience: string;
}

export const VIDEO_OUTPUT_FORMATS: VideoOutputFormat[] = [
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    platform: 'YouTube',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    frameRate: 30,
    bitrate: '8000k',
    maxDuration: 60,
    audioCodec: 'aac',
    videoCodec: 'h264',
    container: 'mp4',
    optimizations: [
      'faststart',
      'web_optimized',
      'mobile_friendly',
    ],
  },
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    platform: 'Instagram',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    frameRate: 30,
    bitrate: '6000k',
    maxDuration: 90,
    audioCodec: 'aac',
    videoCodec: 'h264',
    container: 'mp4',
    optimizations: [
      'faststart',
      'mobile_optimized',
      'story_format',
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    platform: 'TikTok',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    frameRate: 30,
    bitrate: '4000k',
    maxDuration: 60,
    audioCodec: 'aac',
    videoCodec: 'h264',
    container: 'mp4',
    optimizations: [
      'faststart',
      'mobile_first',
      'quick_load',
    ],
  },
  {
    id: 'facebook_video',
    name: 'Facebook Video',
    platform: 'Facebook',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: '8000k',
    maxDuration: 240,
    audioCodec: 'aac',
    videoCodec: 'h264',
    container: 'mp4',
    optimizations: [
      'faststart',
      'social_optimized',
      'auto_play',
    ],
  },
  {
    id: 'linkedin_video',
    name: 'LinkedIn Video',
    platform: 'LinkedIn',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: '10000k',
    maxDuration: 600,
    audioCodec: 'aac',
    videoCodec: 'h264',
    container: 'mp4',
    optimizations: [
      'professional_quality',
      'business_optimized',
      'desktop_friendly',
    ],
  },
  {
    id: 'twitter_video',
    name: 'Twitter Video',
    platform: 'Twitter',
    aspectRatio: '16:9',
    resolution: '1280x720',
    frameRate: 30,
    bitrate: '5000k',
    maxDuration: 140,
    audioCodec: 'aac',
    videoCodec: 'h264',
    container: 'mp4',
    optimizations: [
      'faststart',
      'quick_preview',
      'bandwidth_efficient',
    ],
  },
  {
    id: 'website_embed',
    name: 'Website Embed',
    platform: 'Website',
    aspectRatio: '16:9',
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: '6000k',
    maxDuration: 120,
    audioCodec: 'aac',
    videoCodec: 'h264',
    container: 'mp4',
    optimizations: [
      'faststart',
      'progressive_download',
      'cross_browser',
    ],
  },
];

export const VIDEO_QUALITY_PRESETS: VideoQualityPreset[] = [
  {
    id: 'ultra_high',
    name: 'Ultra High Quality',
    description: 'Maximum quality for premium content',
    crf: 15,
    preset: 'slow',
    profile: 'high',
    level: '4.2',
    estimatedFileSize: '50-80MB',
    targetAudience: 'Professional/Premium',
  },
  {
    id: 'high',
    name: 'High Quality',
    description: 'High quality for professional use',
    crf: 18,
    preset: 'medium',
    profile: 'high',
    level: '4.0',
    estimatedFileSize: '25-40MB',
    targetAudience: 'Professional',
  },
  {
    id: 'standard',
    name: 'Standard Quality',
    description: 'Good balance of quality and file size',
    crf: 23,
    preset: 'fast',
    profile: 'main',
    level: '3.1',
    estimatedFileSize: '15-25MB',
    targetAudience: 'General/Social Media',
  },
  {
    id: 'optimized',
    name: 'Optimized',
    description: 'Optimized for fast loading and mobile',
    crf: 28,
    preset: 'faster',
    profile: 'main',
    level: '3.1',
    estimatedFileSize: '8-15MB',
    targetAudience: 'Mobile/Quick Loading',
  },
  {
    id: 'compressed',
    name: 'Compressed',
    description: 'Highly compressed for bandwidth-limited scenarios',
    crf: 32,
    preset: 'veryfast',
    profile: 'baseline',
    level: '3.0',
    estimatedFileSize: '5-10MB',
    targetAudience: 'Limited Bandwidth',
  },
];

export class VideoOutputProcessor {
  static getFormatByPlatform(platform: string): VideoOutputFormat | undefined {
    return VIDEO_OUTPUT_FORMATS.find(format => 
      format.platform.toLowerCase() === platform.toLowerCase()
    );
  }

  static getFormatById(id: string): VideoOutputFormat | undefined {
    return VIDEO_OUTPUT_FORMATS.find(format => format.id === id);
  }

  static getQualityPresetById(id: string): VideoQualityPreset | undefined {
    return VIDEO_QUALITY_PRESETS.find(preset => preset.id === id);
  }

  static buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    format: VideoOutputFormat,
    quality: VideoQualityPreset,
    additionalOptions?: string[]
  ): string {
    const baseCommand = [
      `ffmpeg -i "${inputPath}"`,
      `-c:v ${format.videoCodec}`,
      `-c:a ${format.audioCodec}`,
      `-crf ${quality.crf}`,
      `-preset ${quality.preset}`,
      `-profile:v ${quality.profile}`,
      `-level ${quality.level}`,
      `-r ${format.frameRate}`,
      `-b:v ${format.bitrate}`,
      `-vf scale=${format.resolution.replace('x', ':')}`,
      `-t ${format.maxDuration}`,
    ];

    // Add format-specific optimizations
    if (format.optimizations.includes('faststart')) {
      baseCommand.push('-movflags +faststart');
    }

    if (format.optimizations.includes('mobile_optimized')) {
      baseCommand.push('-tune film');
    }

    if (format.optimizations.includes('web_optimized')) {
      baseCommand.push('-pix_fmt yuv420p');
    }

    // Add additional options
    if (additionalOptions) {
      baseCommand.push(...additionalOptions);
    }

    baseCommand.push(`"${outputPath}"`);
    baseCommand.push('-y'); // Overwrite output file

    return baseCommand.join(' ');
  }

  static getRecommendedQuality(platform: string, fileSize?: 'small' | 'medium' | 'large'): VideoQualityPreset {
    const platformQuality = {
      youtube: fileSize === 'large' ? 'high' : 'standard',
      instagram: 'optimized',
      tiktok: 'optimized',
      facebook: 'standard',
      linkedin: 'high',
      twitter: 'optimized',
      website: 'standard',
    };

    const qualityId = platformQuality[platform.toLowerCase() as keyof typeof platformQuality] || 'standard';
    return this.getQualityPresetById(qualityId) || VIDEO_QUALITY_PRESETS[2];
  }

  static validateOutputSettings(
    format: VideoOutputFormat,
    quality: VideoQualityPreset,
    duration: number
  ): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (duration > format.maxDuration) {
      warnings.push(`Video duration (${duration}s) exceeds platform limit (${format.maxDuration}s)`);
    }

    if (quality.crf < 15) {
      warnings.push('Very high quality setting may result in large file sizes');
    }

    if (quality.crf > 30) {
      warnings.push('Low quality setting may result in visible compression artifacts');
    }

    if (format.platform.toLowerCase().includes('mobile') && quality.preset === 'slow') {
      warnings.push('Slow encoding preset may not be optimal for mobile platforms');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  static estimateProcessingTime(
    videoDuration: number,
    quality: VideoQualityPreset,
    resolution: string
  ): number {
    const [width, height] = resolution.split('x').map(Number);
    const pixels = width * height;

    // Base processing time (seconds of processing per second of video)
    let baseMultiplier = 1;

    // Adjust for quality preset
    const presetMultipliers = {
      ultrafast: 0.5,
      superfast: 0.7,
      veryfast: 1,
      faster: 1.5,
      fast: 2,
      medium: 3,
      slow: 5,
      slower: 8,
      veryslow: 12,
    };

    baseMultiplier *= presetMultipliers[quality.preset as keyof typeof presetMultipliers] || 2;

    // Adjust for resolution
    if (pixels > 2000000) { // 1080p+
      baseMultiplier *= 1.5;
    } else if (pixels > 900000) { // 720p
      baseMultiplier *= 1.2;
    }

    // Adjust for CRF (lower CRF = higher quality = more processing time)
    if (quality.crf < 20) {
      baseMultiplier *= 1.3;
    }

    return Math.ceil(videoDuration * baseMultiplier);
  }

  static getOptimalSettings(
    platform: string,
    contentType: 'commercial' | 'social' | 'professional',
    bandwidth: 'high' | 'medium' | 'low'
  ) {
    const format = this.getFormatByPlatform(platform) || VIDEO_OUTPUT_FORMATS[0];
    
    let qualityId = 'standard';
    
    if (contentType === 'professional' && bandwidth === 'high') {
      qualityId = 'high';
    } else if (contentType === 'commercial') {
      qualityId = bandwidth === 'high' ? 'high' : 'standard';
    } else if (bandwidth === 'low') {
      qualityId = 'optimized';
    }

    const quality = this.getQualityPresetById(qualityId) || VIDEO_QUALITY_PRESETS[2];

    return { format, quality };
  }

  static getSupportedFormats(): string[] {
    return VIDEO_OUTPUT_FORMATS.map(format => format.platform);
  }

  static getFormatRequirements(platform: string) {
    const format = this.getFormatByPlatform(platform);
    if (!format) return null;

    return {
      aspectRatio: format.aspectRatio,
      maxDuration: format.maxDuration,
      recommendedResolution: format.resolution,
      requiredCodecs: {
        video: format.videoCodec,
        audio: format.audioCodec,
      },
      optimizations: format.optimizations,
    };
  }
}

export default VideoOutputProcessor;