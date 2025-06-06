import { Job } from 'bull';
import { sonautoService } from '@/ai/services/sonauto.service';
import { supabase } from '@/core/database/supabase';
import type { SceneDescription } from '@/ai/services/openai.service';
import type { MusicGenerationResponse } from '@/ai/services/sonauto.service';

export interface MusicGenerationJobData {
  vehicleId: string;
  userId: string;
  scenes: SceneDescription[];
  theme?: string;
  duration?: number;
  customizations?: {
    tempo?: 'slow' | 'medium' | 'fast';
    energy?: 'low' | 'medium' | 'high';
    mood?: string;
    style?: string;
  };
}

export interface MusicGenerationResult {
  musicId: string;
  audioUrl: string;
  localFilePath?: string;
  duration: number;
  theme: string;
  vehicleId: string;
  generatedAt: Date;
}

export class MusicGenerationJob {
  static async process(job: Job<MusicGenerationJobData>): Promise<MusicGenerationResult> {
    const { vehicleId, userId, scenes, theme, duration = 30, customizations } = job.data;
    
    console.log(`Generating music for vehicle ${vehicleId} with theme: ${theme || 'auto'}`);
    
    try {
      // Update progress
      await job.progress(10);

      // Get vehicle data for context
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('make, model, year, vehicle_type')
        .eq('id', vehicleId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Vehicle not found');
      }

      await job.progress(20);

      // Determine vehicle type for music selection
      const vehicleType = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      
      let musicResponse: MusicGenerationResponse;

      if (theme && customizations) {
        // Use custom theme with user customizations
        musicResponse = await sonautoService.generateCustomMusic(
          theme,
          duration,
          customizations
        );
      } else {
        // Auto-generate based on vehicle type and scenes
        musicResponse = await sonautoService.generateAutomotiveMusic(
          vehicleType,
          scenes,
          duration
        );
      }

      await job.progress(40);

      // Monitor music generation progress
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max wait time
      
      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        
        const status = await sonautoService.getMusicStatus(musicResponse.id);
        
        // Update job progress based on music generation progress
        const musicProgress = status.progress || 0;
        const jobProgress = 40 + (musicProgress * 0.5); // 40% to 90%
        await job.progress(Math.round(jobProgress));

        if (status.status === 'completed' && status.audio_url) {
          completed = true;
          musicResponse = status;
        } else if (status.status === 'failed') {
          throw new Error(`Music generation failed: ${status.error}`);
        }
        
        attempts++;
      }

      if (!completed) {
        throw new Error('Music generation timeout');
      }

      await job.progress(95);

      // Save music record to database
      const { error: saveError } = await supabase
        .from('vehicle_music')
        .insert({
          vehicle_id: vehicleId,
          user_id: userId,
          music_id: musicResponse.id,
          audio_url: musicResponse.audio_url,
          theme: theme || 'auto',
          duration: musicResponse.duration || duration,
          scenes: scenes,
          customizations: customizations,
          created_at: new Date().toISOString(),
        });

      if (saveError) {
        console.error('Failed to save music to database:', saveError);
        // Continue anyway as music is generated
      }

      await job.progress(100);

      const result: MusicGenerationResult = {
        musicId: musicResponse.id,
        audioUrl: musicResponse.audio_url!,
        duration: musicResponse.duration || duration,
        theme: theme || 'auto',
        vehicleId,
        generatedAt: new Date(),
      };

      console.log(`Generated music for vehicle ${vehicleId}, ID: ${musicResponse.id}`);
      return result;

    } catch (error) {
      console.error('Music generation job failed:', error);
      throw error;
    }
  }

  // Regenerate music with different theme
  static async regenerateMusic(
    vehicleId: string,
    scenes: SceneDescription[],
    newTheme: string,
    duration: number = 30
  ): Promise<MusicGenerationResult> {
    try {
      // Get vehicle data
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('make, model, year')
        .eq('id', vehicleId)
        .single();

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Generate new music
      const musicResponse = await sonautoService.generateCustomMusic(newTheme, duration);
      
      // Monitor completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60;
      
      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const status = await sonautoService.getMusicStatus(musicResponse.id);
        
        if (status.status === 'completed' && status.audio_url) {
          return {
            musicId: status.id,
            audioUrl: status.audio_url,
            duration: status.duration || duration,
            theme: newTheme,
            vehicleId,
            generatedAt: new Date(),
          };
        } else if (status.status === 'failed') {
          throw new Error(`Music regeneration failed: ${status.error}`);
        }
        
        attempts++;
      }

      throw new Error('Music regeneration timeout');

    } catch (error) {
      console.error('Music regeneration failed:', error);
      throw error;
    }
  }

  // Get music suggestions based on vehicle and scenes
  static getMusicSuggestions(vehicleType: string, scenes: SceneDescription[]): string[] {
    const sceneMoods = scenes.map(s => s.mood.toLowerCase());
    const type = vehicleType.toLowerCase();
    
    const suggestions: string[] = [];

    // Vehicle type based suggestions
    if (type.includes('luxury') || type.includes('mercedes') || type.includes('bmw')) {
      suggestions.push('luxury', 'sophisticated orchestral');
    }
    
    if (type.includes('sport') || type.includes('ferrari') || type.includes('corvette')) {
      suggestions.push('sporty', 'high-energy electronic');
    }
    
    if (type.includes('truck') || type.includes('suv') || type.includes('jeep')) {
      suggestions.push('adventure', 'epic cinematic');
    }
    
    if (type.includes('electric') || type.includes('hybrid') || type.includes('tesla')) {
      suggestions.push('eco', 'modern ambient');
    }

    // Scene mood based suggestions
    if (sceneMoods.some(mood => mood.includes('exciting') || mood.includes('dynamic'))) {
      suggestions.push('energetic rock', 'upbeat electronic');
    }
    
    if (sceneMoods.some(mood => mood.includes('elegant') || mood.includes('sophisticated'))) {
      suggestions.push('classical elegance', 'jazz sophistication');
    }
    
    if (sceneMoods.some(mood => mood.includes('adventurous') || mood.includes('bold'))) {
      suggestions.push('adventure epic', 'outdoor lifestyle');
    }

    // Remove duplicates and return
    return [...new Set(suggestions)];
  }

  // Validate music parameters
  static validateMusicParams(data: MusicGenerationJobData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.vehicleId) {
      errors.push('Vehicle ID is required');
    }

    if (!data.scenes || data.scenes.length !== 3) {
      errors.push('Exactly 3 scenes are required');
    }

    if (data.duration && (data.duration < 15 || data.duration > 60)) {
      errors.push('Duration must be between 15-60 seconds');
    }

    if (data.customizations) {
      const { tempo, energy } = data.customizations;
      
      if (tempo && !['slow', 'medium', 'fast'].includes(tempo)) {
        errors.push('Invalid tempo value');
      }
      
      if (energy && !['low', 'medium', 'high'].includes(energy)) {
        errors.push('Invalid energy value');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get available themes
  static getAvailableThemes() {
    return sonautoService.getAvailableThemes();
  }

  // Estimate cost for music generation
  static estimateCost(duration: number): number {
    return sonautoService.getCostEstimate(duration);
  }
}

export default MusicGenerationJob;