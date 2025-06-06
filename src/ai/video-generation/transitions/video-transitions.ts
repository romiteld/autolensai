export interface VideoTransition {
  id: string;
  name: string;
  description: string;
  type: 'cut' | 'fade' | 'slide' | 'zoom' | 'rotate' | 'wipe' | 'dissolve';
  ffmpegFilter: string;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  suitableFor: 'any' | 'luxury' | 'sporty' | 'family' | 'adventure' | 'eco';
}

export const VIDEO_TRANSITIONS: VideoTransition[] = [
  // Cut Transitions
  {
    id: 'hard_cut',
    name: 'Hard Cut',
    description: 'Instant cut between clips',
    type: 'cut',
    ffmpegFilter: 'concat=n=2:v=1:a=0',
    duration: 0,
    easing: 'linear',
    suitableFor: 'sporty',
  },

  // Fade Transitions
  {
    id: 'fade_black',
    name: 'Fade to Black',
    description: 'Fade out to black, then fade in',
    type: 'fade',
    ffmpegFilter: 'xfade=transition=fade:duration=1:offset=9',
    duration: 1,
    easing: 'ease-in-out',
    suitableFor: 'luxury',
  },
  {
    id: 'crossfade',
    name: 'Crossfade',
    description: 'Smooth blend between clips',
    type: 'fade',
    ffmpegFilter: 'xfade=transition=fadeblack:duration=0.8:offset=9.2',
    duration: 0.8,
    easing: 'ease-in-out',
    suitableFor: 'any',
  },
  {
    id: 'fade_white',
    name: 'Fade to White',
    description: 'Fade out to white, then fade in',
    type: 'fade',
    ffmpegFilter: 'xfade=transition=fadewhite:duration=1:offset=9',
    duration: 1,
    easing: 'ease-in-out',
    suitableFor: 'eco',
  },

  // Slide Transitions
  {
    id: 'slide_left',
    name: 'Slide Left',
    description: 'Slide new clip in from right',
    type: 'slide',
    ffmpegFilter: 'xfade=transition=slideleft:duration=0.8:offset=9.2',
    duration: 0.8,
    easing: 'ease-out',
    suitableFor: 'sporty',
  },
  {
    id: 'slide_right',
    name: 'Slide Right',
    description: 'Slide new clip in from left',
    type: 'slide',
    ffmpegFilter: 'xfade=transition=slideright:duration=0.8:offset=9.2',
    duration: 0.8,
    easing: 'ease-out',
    suitableFor: 'sporty',
  },
  {
    id: 'slide_up',
    name: 'Slide Up',
    description: 'Slide new clip up from bottom',
    type: 'slide',
    ffmpegFilter: 'xfade=transition=slideup:duration=0.8:offset=9.2',
    duration: 0.8,
    easing: 'ease-out',
    suitableFor: 'adventure',
  },
  {
    id: 'slide_down',
    name: 'Slide Down',
    description: 'Slide new clip down from top',
    type: 'slide',
    ffmpegFilter: 'xfade=transition=slidedown:duration=0.8:offset=9.2',
    duration: 0.8,
    easing: 'ease-out',
    suitableFor: 'adventure',
  },

  // Zoom Transitions
  {
    id: 'zoom_in',
    name: 'Zoom In',
    description: 'Zoom into the next clip',
    type: 'zoom',
    ffmpegFilter: 'xfade=transition=smoothleft:duration=1:offset=9',
    duration: 1,
    easing: 'ease-in',
    suitableFor: 'sporty',
  },
  {
    id: 'zoom_out',
    name: 'Zoom Out',
    description: 'Zoom out to reveal next clip',
    type: 'zoom',
    ffmpegFilter: 'xfade=transition=smoothright:duration=1:offset=9',
    duration: 1,
    easing: 'ease-out',
    suitableFor: 'luxury',
  },

  // Wipe Transitions
  {
    id: 'wipe_left',
    name: 'Wipe Left',
    description: 'Wipe from right to left',
    type: 'wipe',
    ffmpegFilter: 'xfade=transition=wipeleft:duration=0.6:offset=9.4',
    duration: 0.6,
    easing: 'linear',
    suitableFor: 'sporty',
  },
  {
    id: 'wipe_right',
    name: 'Wipe Right',
    description: 'Wipe from left to right',
    type: 'wipe',
    ffmpegFilter: 'xfade=transition=wiperight:duration=0.6:offset=9.4',
    duration: 0.6,
    easing: 'linear',
    suitableFor: 'sporty',
  },
  {
    id: 'wipe_up',
    name: 'Wipe Up',
    description: 'Wipe from bottom to top',
    type: 'wipe',
    ffmpegFilter: 'xfade=transition=wipeup:duration=0.6:offset=9.4',
    duration: 0.6,
    easing: 'linear',
    suitableFor: 'adventure',
  },
  {
    id: 'wipe_down',
    name: 'Wipe Down',
    description: 'Wipe from top to bottom',
    type: 'wipe',
    ffmpegFilter: 'xfade=transition=wipedown:duration=0.6:offset=9.4',
    duration: 0.6,
    easing: 'linear',
    suitableFor: 'adventure',
  },

  // Dissolve Transitions
  {
    id: 'dissolve',
    name: 'Dissolve',
    description: 'Pixelated dissolve transition',
    type: 'dissolve',
    ffmpegFilter: 'xfade=transition=pixelize:duration=1:offset=9',
    duration: 1,
    easing: 'ease-in-out',
    suitableFor: 'eco',
  },
  {
    id: 'radial_wipe',
    name: 'Radial Wipe',
    description: 'Circular wipe transition',
    type: 'dissolve',
    ffmpegFilter: 'xfade=transition=radial:duration=1:offset=9',
    duration: 1,
    easing: 'ease-in-out',
    suitableFor: 'luxury',
  },
];

export class VideoTransitionProcessor {
  static getTransitionsByType(type: string): VideoTransition[] {
    return VIDEO_TRANSITIONS.filter(transition => transition.type === type);
  }

  static getTransitionById(id: string): VideoTransition | undefined {
    return VIDEO_TRANSITIONS.find(transition => transition.id === id);
  }

  static getSuitableTransitions(vehicleStyle: string): VideoTransition[] {
    return VIDEO_TRANSITIONS.filter(transition => 
      transition.suitableFor === 'any' || transition.suitableFor === vehicleStyle
    );
  }

  static getRecommendedTransitionSequence(vehicleStyle: string): VideoTransition[] {
    const sequences = {
      luxury: [
        this.getTransitionById('fade_black')!,
        this.getTransitionById('crossfade')!,
      ],
      sporty: [
        this.getTransitionById('slide_left')!,
        this.getTransitionById('zoom_in')!,
      ],
      family: [
        this.getTransitionById('crossfade')!,
        this.getTransitionById('fade_black')!,
      ],
      adventure: [
        this.getTransitionById('slide_up')!,
        this.getTransitionById('wipe_right')!,
      ],
      eco: [
        this.getTransitionById('fade_white')!,
        this.getTransitionById('dissolve')!,
      ],
    };

    return sequences[vehicleStyle as keyof typeof sequences] || sequences.family;
  }

  static buildTransitionFilterChain(transitions: string[], clipCount: number): string {
    if (clipCount < 2) return '';
    
    const transitionObjects = transitions
      .map(id => this.getTransitionById(id))
      .filter(Boolean) as VideoTransition[];

    if (transitionObjects.length === 0) {
      // Default to simple concatenation
      return `concat=n=${clipCount}:v=1:a=0`;
    }

    // Build complex filter chain for multiple transitions
    const filters: string[] = [];
    let currentInput = '[0:v]';
    
    for (let i = 0; i < Math.min(transitionObjects.length, clipCount - 1); i++) {
      const transition = transitionObjects[i];
      const nextInput = `[${i + 1}:v]`;
      const outputLabel = i === transitionObjects.length - 1 ? '[v]' : `[t${i}]`;
      
      filters.push(`${currentInput}${nextInput}${transition.ffmpegFilter}${outputLabel}`);
      currentInput = `[t${i}]`;
    }

    return filters.join(';');
  }

  static calculateTotalTransitionTime(transitionIds: string[]): number {
    return transitionIds
      .map(id => this.getTransitionById(id))
      .filter(Boolean)
      .reduce((total, transition) => total + transition!.duration, 0);
  }

  static getTransitionPresets() {
    return {
      smooth: ['crossfade', 'fade_black'],
      dynamic: ['slide_left', 'zoom_in'],
      elegant: ['fade_black', 'radial_wipe'],
      energetic: ['wipe_left', 'slide_right'],
      modern: ['fade_white', 'dissolve'],
      classic: ['crossfade', 'fade_black'],
    };
  }

  static validateTransitionSequence(
    transitions: string[],
    clipDurations: number[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (transitions.length !== clipDurations.length - 1) {
      errors.push('Number of transitions must be one less than number of clips');
    }

    transitions.forEach((transitionId, index) => {
      const transition = this.getTransitionById(transitionId);
      if (!transition) {
        errors.push(`Invalid transition ID: ${transitionId}`);
        return;
      }

      const clipDuration = clipDurations[index];
      if (clipDuration < transition.duration + 1) {
        errors.push(`Clip ${index + 1} is too short for transition ${transition.name}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static optimizeTransitionsForPacing(
    vehicleStyle: string,
    sceneMoods: string[]
  ): string[] {
    const style = vehicleStyle.toLowerCase();
    const moods = sceneMoods.map(m => m.toLowerCase());

    // Fast-paced scenes need quick transitions
    if (moods.some(mood => mood.includes('exciting') || mood.includes('dynamic'))) {
      if (style.includes('sport')) {
        return ['slide_left', 'zoom_in'];
      }
      return ['wipe_left', 'slide_right'];
    }

    // Elegant scenes need smooth transitions
    if (moods.some(mood => mood.includes('elegant') || mood.includes('sophisticated'))) {
      return ['fade_black', 'crossfade'];
    }

    // Default based on vehicle style
    return this.getRecommendedTransitionSequence(style).map(t => t.id);
  }
}

export default VideoTransitionProcessor;