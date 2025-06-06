import { env } from '@/core/config/env';
import type { SceneDescription } from './openai.service';

export interface MusicGenerationRequest {
  prompt: string;
  duration: number;
  style?: string;
  mood?: string;
  genre?: string;
  tempo?: 'slow' | 'medium' | 'fast';
  energy?: 'low' | 'medium' | 'high';
}

export interface MusicGenerationResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  audio_url?: string;
  progress?: number;
  error?: string;
  duration?: number;
}

export interface AutomotiveTheme {
  name: string;
  prompt: string;
  style: string;
  mood: string;
  tempo: 'slow' | 'medium' | 'fast';
  energy: 'low' | 'medium' | 'high';
}

export class SonautoService {
  private baseUrl = 'https://api.sonauto.ai/v1';
  private apiKey: string;

  // Predefined automotive themes
  private automotiveThemes: Record<string, AutomotiveTheme> = {
    luxury: {
      name: 'Luxury',
      prompt: 'Sophisticated, elegant instrumental music for luxury car commercial',
      style: 'orchestral, ambient',
      mood: 'sophisticated, premium',
      tempo: 'medium',
      energy: 'medium',
    },
    sporty: {
      name: 'Sporty',
      prompt: 'Energetic, driving music for sports car advertisement',
      style: 'electronic, rock',
      mood: 'exciting, powerful',
      tempo: 'fast',
      energy: 'high',
    },
    family: {
      name: 'Family',
      prompt: 'Warm, friendly music for family vehicle commercial',
      style: 'acoustic, pop',
      mood: 'warm, reliable',
      tempo: 'medium',
      energy: 'medium',
    },
    adventure: {
      name: 'Adventure',
      prompt: 'Epic, adventurous music for SUV or truck commercial',
      style: 'cinematic, orchestral',
      mood: 'adventurous, bold',
      tempo: 'medium',
      energy: 'high',
    },
    eco: {
      name: 'Eco-Friendly',
      prompt: 'Clean, modern music for electric or hybrid vehicle',
      style: 'ambient, electronic',
      mood: 'clean, futuristic',
      tempo: 'medium',
      energy: 'medium',
    },
  };

  constructor() {
    this.apiKey = env.get('SONAUTO_API_KEY');
    if (!this.apiKey) {
      throw new Error('SONAUTO_API_KEY is required');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'POST', data?: any) {
    const url = `${this.baseUrl}/${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sonauto API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async generateMusic(request: MusicGenerationRequest): Promise<MusicGenerationResponse> {
    try {
      const payload = {
        prompt: request.prompt,
        duration: request.duration,
        style: request.style,
        mood: request.mood,
        genre: request.genre || 'commercial',
        tempo: request.tempo || 'medium',
        energy_level: request.energy || 'medium',
        format: 'mp3',
        quality: 'high',
      };

      console.log('Generating music with Sonauto:', {
        prompt: request.prompt,
        duration: request.duration,
        style: request.style,
      });

      const response = await this.makeRequest('generate', 'POST', payload);
      
      return {
        id: response.id || response.generation_id,
        status: 'queued',
        duration: request.duration,
      };
    } catch (error) {
      console.error('Sonauto music generation error:', error);
      throw new Error('Failed to generate music with Sonauto');
    }
  }

  async getMusicStatus(musicId: string): Promise<MusicGenerationResponse> {
    try {
      const response = await this.makeRequest(`generations/${musicId}`, 'GET');
      
      return {
        id: musicId,
        status: this.mapSonautoStatus(response.status),
        audio_url: response.audio_url || response.download_url,
        progress: response.progress || 0,
        error: response.error?.message,
        duration: response.duration,
      };
    } catch (error) {
      console.error('Sonauto status check error:', error);
      return {
        id: musicId,
        status: 'failed',
        error: 'Failed to check music generation status',
      };
    }
  }

  private mapSonautoStatus(sonautoStatus: string): 'queued' | 'processing' | 'completed' | 'failed' {
    switch (sonautoStatus?.toLowerCase()) {
      case 'pending':
      case 'queued':
        return 'queued';
      case 'generating':
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

  async generateAutomotiveMusic(
    vehicleType: string,
    scenes: SceneDescription[],
    duration: number = 30
  ): Promise<MusicGenerationResponse> {
    // Determine theme based on vehicle type and scenes
    const theme = this.selectThemeForVehicle(vehicleType, scenes);
    
    const prompt = this.buildMusicPrompt(theme, scenes, vehicleType);
    
    const request: MusicGenerationRequest = {
      prompt,
      duration,
      style: theme.style,
      mood: theme.mood,
      tempo: theme.tempo,
      energy: theme.energy,
    };

    return this.generateMusic(request);
  }

  private selectThemeForVehicle(vehicleType: string, scenes: SceneDescription[]): AutomotiveTheme {
    const type = vehicleType.toLowerCase();
    
    // Check vehicle type keywords
    if (type.includes('luxury') || type.includes('mercedes') || type.includes('bmw') || type.includes('audi')) {
      return this.automotiveThemes.luxury;
    }
    
    if (type.includes('sport') || type.includes('ferrari') || type.includes('porsche') || type.includes('corvette')) {
      return this.automotiveThemes.sporty;
    }
    
    if (type.includes('suv') || type.includes('truck') || type.includes('jeep') || type.includes('4x4')) {
      return this.automotiveThemes.adventure;
    }
    
    if (type.includes('electric') || type.includes('hybrid') || type.includes('tesla') || type.includes('prius')) {
      return this.automotiveThemes.eco;
    }
    
    // Analyze scene moods
    const sceneMoods = scenes.map(s => s.mood.toLowerCase());
    if (sceneMoods.some(mood => mood.includes('exciting') || mood.includes('dynamic'))) {
      return this.automotiveThemes.sporty;
    }
    
    if (sceneMoods.some(mood => mood.includes('elegant') || mood.includes('sophisticated'))) {
      return this.automotiveThemes.luxury;
    }
    
    // Default to family theme
    return this.automotiveThemes.family;
  }

  private buildMusicPrompt(theme: AutomotiveTheme, scenes: SceneDescription[], vehicleType: string): string {
    const sceneDescriptions = scenes.map(scene => scene.mood).join(', ');
    
    return `${theme.prompt} for ${vehicleType}. Scene moods: ${sceneDescriptions}. 
    Create background music that enhances the visual storytelling without overwhelming the video. 
    The music should be suitable for social media and automotive marketing.`;
  }

  async downloadAudio(audioUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status}`);
      }
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Audio download error:', error);
      throw new Error('Failed to download generated audio');
    }
  }

  // Get available themes for frontend selection
  getAvailableThemes(): AutomotiveTheme[] {
    return Object.values(this.automotiveThemes);
  }

  // Custom music generation with user-specified theme
  async generateCustomMusic(
    themeName: string,
    duration: number,
    customizations?: Partial<AutomotiveTheme>
  ): Promise<MusicGenerationResponse> {
    const baseTheme = this.automotiveThemes[themeName] || this.automotiveThemes.family;
    const theme = { ...baseTheme, ...customizations };
    
    const request: MusicGenerationRequest = {
      prompt: theme.prompt,
      duration,
      style: theme.style,
      mood: theme.mood,
      tempo: theme.tempo,
      energy: theme.energy,
    };

    return this.generateMusic(request);
  }

  // Utility method to check service health
  async checkHealth(): Promise<boolean> {
    try {
      // Simple health check
      await this.makeRequest('health', 'GET');
      return true;
    } catch (error) {
      console.error('Sonauto health check failed:', error);
      return false;
    }
  }

  // Get pricing information
  getCostEstimate(duration: number): number {
    // Estimated cost based on Sonauto pricing (estimate)
    const baseCost = 0.02; // per second
    return baseCost * duration;
  }
}

export const sonautoService = new SonautoService();