export interface VideoEffect {
  id: string;
  name: string;
  description: string;
  category: 'transition' | 'filter' | 'enhancement' | 'motion';
  ffmpegFilter: string;
  parameters?: Record<string, any>;
  duration?: number;
  applicableScenes: 'all' | 'exterior' | 'interior' | 'driving';
}

export const VIDEO_EFFECTS: VideoEffect[] = [
  // Transition Effects
  {
    id: 'fade_in_out',
    name: 'Fade In/Out',
    description: 'Smooth fade transition between scenes',
    category: 'transition',
    ffmpegFilter: 'fade=t=in:st=0:d=1,fade=t=out:st=9:d=1',
    duration: 1,
    applicableScenes: 'all',
  },
  {
    id: 'crossfade',
    name: 'Crossfade',
    description: 'Blend transition between two video clips',
    category: 'transition',
    ffmpegFilter: 'xfade=transition=fade:duration=1:offset=9',
    duration: 1,
    applicableScenes: 'all',
  },
  {
    id: 'slide_left',
    name: 'Slide Left',
    description: 'Slide transition moving left',
    category: 'transition',
    ffmpegFilter: 'xfade=transition=slideleft:duration=0.8:offset=9.2',
    duration: 0.8,
    applicableScenes: 'all',
  },
  {
    id: 'slide_right',
    name: 'Slide Right',
    description: 'Slide transition moving right',
    category: 'transition',
    ffmpegFilter: 'xfade=transition=slideright:duration=0.8:offset=9.2',
    duration: 0.8,
    applicableScenes: 'all',
  },
  {
    id: 'zoom_in',
    name: 'Zoom In',
    description: 'Zoom in transition effect',
    category: 'transition',
    ffmpegFilter: 'xfade=transition=smoothleft:duration=1:offset=9',
    duration: 1,
    applicableScenes: 'exterior',
  },

  // Filter Effects
  {
    id: 'color_enhance',
    name: 'Color Enhancement',
    description: 'Enhance colors and saturation',
    category: 'filter',
    ffmpegFilter: 'eq=contrast=1.2:brightness=0.05:saturation=1.3',
    applicableScenes: 'all',
  },
  {
    id: 'cinematic_color',
    name: 'Cinematic Color',
    description: 'Professional cinematic color grading',
    category: 'filter',
    ffmpegFilter: 'curves=vintage',
    applicableScenes: 'all',
  },
  {
    id: 'warm_tone',
    name: 'Warm Tone',
    description: 'Add warm, golden tones',
    category: 'filter',
    ffmpegFilter: 'colorbalance=rs=0.3:gs=0.1:bs=-0.2',
    applicableScenes: 'exterior',
  },
  {
    id: 'cool_tone',
    name: 'Cool Tone',
    description: 'Add cool, modern tones',
    category: 'filter',
    ffmpegFilter: 'colorbalance=rs=-0.2:gs=0.1:bs=0.3',
    applicableScenes: 'interior',
  },
  {
    id: 'high_contrast',
    name: 'High Contrast',
    description: 'Increase contrast for dramatic effect',
    category: 'filter',
    ffmpegFilter: 'eq=contrast=1.5:brightness=0.1',
    applicableScenes: 'all',
  },

  // Enhancement Effects
  {
    id: 'sharpen',
    name: 'Sharpen',
    description: 'Enhance image sharpness',
    category: 'enhancement',
    ffmpegFilter: 'unsharp=5:5:1.0:5:5:0.0',
    applicableScenes: 'all',
  },
  {
    id: 'stabilize',
    name: 'Stabilization',
    description: 'Reduce camera shake',
    category: 'enhancement',
    ffmpegFilter: 'vidstabdetect=stepsize=6:shakiness=8:accuracy=15:result=transforms.trf',
    applicableScenes: 'driving',
  },
  {
    id: 'noise_reduce',
    name: 'Noise Reduction',
    description: 'Reduce video noise',
    category: 'enhancement',
    ffmpegFilter: 'hqdn3d=4:3:6:4.5',
    applicableScenes: 'all',
  },

  // Motion Effects
  {
    id: 'slow_motion',
    name: 'Slow Motion',
    description: 'Slow down video for dramatic effect',
    category: 'motion',
    ffmpegFilter: 'setpts=2.0*PTS',
    parameters: { speed: 0.5 },
    applicableScenes: 'exterior',
  },
  {
    id: 'speed_ramp',
    name: 'Speed Ramp',
    description: 'Variable speed effect',
    category: 'motion',
    ffmpegFilter: 'setpts=if(lt(T,2),2*PTS,if(lt(T,8),PTS,0.5*PTS))',
    applicableScenes: 'driving',
  },
  {
    id: 'motion_blur',
    name: 'Motion Blur',
    description: 'Add motion blur for speed effect',
    category: 'motion',
    ffmpegFilter: 'minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc',
    applicableScenes: 'driving',
  },
];

export class VideoEffectsProcessor {
  static getEffectsByCategory(category: string): VideoEffect[] {
    return VIDEO_EFFECTS.filter(effect => effect.category === category);
  }

  static getEffectById(id: string): VideoEffect | undefined {
    return VIDEO_EFFECTS.find(effect => effect.id === id);
  }

  static getApplicableEffects(sceneType: string): VideoEffect[] {
    return VIDEO_EFFECTS.filter(effect => 
      effect.applicableScenes === 'all' || effect.applicableScenes === sceneType
    );
  }

  static buildFilterChain(effects: string[]): string {
    const filters = effects
      .map(effectId => this.getEffectById(effectId))
      .filter(Boolean)
      .map(effect => effect!.ffmpegFilter);

    return filters.join(',');
  }

  static getRecommendedEffects(vehicleType: string, sceneType: string): VideoEffect[] {
    const type = vehicleType.toLowerCase();
    const scene = sceneType.toLowerCase();
    
    const recommended: VideoEffect[] = [];

    // Base effects for all videos
    recommended.push(this.getEffectById('color_enhance')!);
    recommended.push(this.getEffectById('sharpen')!);

    // Vehicle type specific effects
    if (type.includes('luxury')) {
      recommended.push(this.getEffectById('warm_tone')!);
      recommended.push(this.getEffectById('cinematic_color')!);
    } else if (type.includes('sport')) {
      recommended.push(this.getEffectById('high_contrast')!);
      recommended.push(this.getEffectById('cool_tone')!);
    } else if (type.includes('electric') || type.includes('hybrid')) {
      recommended.push(this.getEffectById('cool_tone')!);
    }

    // Scene type specific effects
    if (scene.includes('driving')) {
      recommended.push(this.getEffectById('stabilize')!);
      recommended.push(this.getEffectById('motion_blur')!);
    }

    return recommended.filter(Boolean);
  }

  static applyEffectsToVideo(
    inputPath: string,
    outputPath: string,
    effects: string[]
  ): string {
    const filterChain = this.buildFilterChain(effects);
    
    if (!filterChain) {
      return `ffmpeg -i "${inputPath}" -c copy "${outputPath}"`;
    }

    return `ffmpeg -i "${inputPath}" -vf "${filterChain}" -c:a copy "${outputPath}"`;
  }

  static getEffectPresets() {
    return {
      luxury: ['color_enhance', 'warm_tone', 'cinematic_color', 'sharpen'],
      sporty: ['color_enhance', 'high_contrast', 'cool_tone', 'sharpen'],
      family: ['color_enhance', 'warm_tone', 'sharpen'],
      adventure: ['color_enhance', 'high_contrast', 'stabilize', 'sharpen'],
      eco: ['color_enhance', 'cool_tone', 'sharpen'],
      classic: ['color_enhance', 'warm_tone', 'cinematic_color'],
    };
  }
}

export default VideoEffectsProcessor;