import { Job } from 'bull';
import { openaiService } from '@/ai/services/openai.service';
import { supabase } from '@/core/database/supabase';
import type { VehicleWithImages } from '@/vehicle/models/vehicle.model';
import type { SceneDescription } from '@/ai/services/openai.service';

export interface SceneGenerationJobData {
  vehicleId: string;
  userId: string;
  marketingIdea: string;
  style?: string;
  customPrompts?: {
    scene1?: string;
    scene2?: string;
    scene3?: string;
  };
}

export interface SceneGenerationResult {
  scenes: SceneDescription[];
  vehicleId: string;
  marketingIdea: string;
  generatedAt: Date;
}

export class SceneGenerationJob {
  static async process(job: Job<SceneGenerationJobData>): Promise<SceneGenerationResult> {
    const { vehicleId, userId, marketingIdea, style, customPrompts } = job.data;
    
    console.log(`Generating scenes for vehicle ${vehicleId} with idea: "${marketingIdea}"`);
    
    try {
      // Update progress
      await job.progress(10);

      // Get vehicle data
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Vehicle not found');
      }

      await job.progress(30);

      // Generate scenes with OpenAI
      const scenes = await openaiService.generateVideoScenes(vehicle, marketingIdea);
      
      await job.progress(60);

      // Apply custom prompts if provided
      if (customPrompts) {
        scenes.forEach((scene, index) => {
          const sceneKey = `scene${index + 1}` as keyof typeof customPrompts;
          if (customPrompts[sceneKey]) {
            scene.description = customPrompts[sceneKey]!;
          }
        });
      }

      // Apply style modifications
      if (style) {
        scenes.forEach(scene => {
          scene.description = this.applyStyleToScene(scene.description, style);
        });
      }

      await job.progress(80);

      // Save scenes to database
      const { error: saveError } = await supabase
        .from('video_scenes')
        .insert({
          vehicle_id: vehicleId,
          user_id: userId,
          marketing_idea: marketingIdea,
          scenes: scenes,
          style: style,
          created_at: new Date().toISOString(),
        });

      if (saveError) {
        console.error('Failed to save scenes to database:', saveError);
        // Continue anyway as scenes are generated
      }

      await job.progress(100);

      const result: SceneGenerationResult = {
        scenes,
        vehicleId,
        marketingIdea,
        generatedAt: new Date(),
      };

      console.log(`Generated ${scenes.length} scenes for vehicle ${vehicleId}`);
      return result;

    } catch (error) {
      console.error('Scene generation job failed:', error);
      throw error;
    }
  }

  private static applyStyleToScene(description: string, style: string): string {
    const styleModifiers = {
      cinematic: 'with cinematic lighting and epic camera movements',
      documentary: 'with realistic, documentary-style presentation',
      artistic: 'with artistic composition and creative visual elements',
      commercial: 'with professional commercial photography style',
      lifestyle: 'with lifestyle-focused, relatable presentation',
      luxury: 'with premium, sophisticated visual treatment',
      sporty: 'with dynamic, high-energy visual style',
      minimalist: 'with clean, minimalist aesthetic',
    };

    const modifier = styleModifiers[style as keyof typeof styleModifiers];
    if (modifier) {
      return `${description} ${modifier}`;
    }

    return description;
  }

  // Regenerate specific scene
  static async regenerateScene(
    vehicleId: string,
    sceneNumber: number,
    newPrompt: string,
    marketingIdea: string
  ): Promise<SceneDescription> {
    try {
      // Get vehicle data
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Generate single scene
      const scenes = await openaiService.generateVideoScenes(vehicle, newPrompt);
      
      // Return the first scene with updated scene number
      const scene = scenes[0];
      scene.sceneNumber = sceneNumber;
      
      return scene;

    } catch (error) {
      console.error('Scene regeneration failed:', error);
      throw error;
    }
  }

  // Validate scene descriptions
  static validateScenes(scenes: SceneDescription[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!scenes || scenes.length !== 3) {
      errors.push('Exactly 3 scenes are required');
      return { isValid: false, errors };
    }

    scenes.forEach((scene, index) => {
      if (!scene.description || scene.description.trim().length < 20) {
        errors.push(`Scene ${index + 1} description is too short (minimum 20 characters)`);
      }

      if (scene.description && scene.description.length > 200) {
        errors.push(`Scene ${index + 1} description is too long (maximum 200 characters)`);
      }

      if (!scene.cameraMovement) {
        errors.push(`Scene ${index + 1} is missing camera movement`);
      }

      if (!scene.mood) {
        errors.push(`Scene ${index + 1} is missing mood description`);
      }

      if (!scene.duration || scene.duration < 5 || scene.duration > 15) {
        errors.push(`Scene ${index + 1} duration must be between 5-15 seconds`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get scene suggestions based on vehicle type
  static getSceneSuggestions(vehicleType: string): string[] {
    const suggestions = {
      sedan: [
        'Elegant city driving showcasing smooth performance',
        'Professional parking scene highlighting sophisticated design',
        'Highway cruising emphasizing comfort and efficiency',
      ],
      suv: [
        'Adventure-ready exterior in natural setting',
        'Spacious interior perfect for family adventures',
        'Confident off-road capability demonstration',
      ],
      truck: [
        'Rugged work capability in construction setting',
        'Powerful towing demonstration with heavy load',
        'Adventure-ready for outdoor lifestyle',
      ],
      sports: [
        'Dynamic performance on winding mountain roads',
        'Sleek design details and aerodynamic features',
        'High-speed track performance showcase',
      ],
      luxury: [
        'Sophisticated arrival at premium destination',
        'Handcrafted interior details and premium materials',
        'Smooth, whisper-quiet highway cruising',
      ],
      electric: [
        'Silent, efficient city driving experience',
        'Clean technology and sustainable innovation',
        'Seamless charging and modern connectivity',
      ],
    };

    const type = vehicleType.toLowerCase();
    for (const [key, scenes] of Object.entries(suggestions)) {
      if (type.includes(key)) {
        return scenes;
      }
    }

    return suggestions.sedan; // Default fallback
  }
}

export default SceneGenerationJob;