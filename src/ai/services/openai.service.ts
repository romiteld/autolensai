import OpenAI from 'openai';
import { env } from '@/core/config/env';
import type { VehicleWithImages } from '@/vehicle/models/vehicle.model';

export interface SceneDescription {
  sceneNumber: number;
  description: string;
  duration: number;
  cameraMovement: string;
  mood: string;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.get('OPENAI_API_KEY'),
    });
  }

  async generateVehicleDescription(vehicle: Partial<VehicleWithImages>): Promise<string> {
    const prompt = `Generate a compelling, SEO-optimized description for a vehicle listing with these details:
    - Make: ${vehicle.make}
    - Model: ${vehicle.model}
    - Year: ${vehicle.year}
    - Mileage: ${vehicle.mileage || 'Not specified'}
    - Condition: ${vehicle.condition || 'Not specified'}
    - Transmission: ${vehicle.transmission || 'Not specified'}
    - Fuel Type: ${vehicle.fuelType || 'Not specified'}
    - Exterior Color: ${vehicle.exteriorColor || 'Not specified'}
    - Interior Color: ${vehicle.interiorColor || 'Not specified'}
    
    Create a description that:
    1. Highlights key selling points
    2. Uses automotive keywords for SEO
    3. Creates emotional appeal
    4. Is between 150-250 words
    5. Includes a call-to-action`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert automotive copywriter specializing in creating compelling vehicle listings.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI description generation error:', error);
      throw new Error('Failed to generate vehicle description');
    }
  }

  async generateVideoScenes(
    vehicle: Partial<VehicleWithImages>,
    marketingIdea: string
  ): Promise<SceneDescription[]> {
    const prompt = `Create 3 video scenes (10 seconds each) for a ${vehicle.year} ${vehicle.make} ${vehicle.model} based on this marketing idea: "${marketingIdea}"
    
    For each scene provide:
    1. Scene number (1-3)
    2. Detailed visual description (50-75 words)
    3. Camera movement description
    4. Mood/atmosphere
    5. Key elements to highlight
    
    Make it cinematic and engaging for a 30-second social media video.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a creative director specializing in automotive video marketing.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content generated');

      const parsed = JSON.parse(content);
      return parsed.scenes || [];
    } catch (error) {
      console.error('OpenAI scene generation error:', error);
      throw new Error('Failed to generate video scenes');
    }
  }

  async generateSEOContent(vehicle: Partial<VehicleWithImages>) {
    const prompt = `Generate SEO-optimized content for a ${vehicle.year} ${vehicle.make} ${vehicle.model} listing page:
    
    Provide:
    1. SEO title (50-60 characters)
    2. Meta description (150-160 characters)
    3. 5-7 relevant keywords
    4. H1 heading
    5. 3-4 H2 subheadings with brief content`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert specializing in automotive listings.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content generated');

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI SEO generation error:', error);
      throw new Error('Failed to generate SEO content');
    }
  }

  async generateMarketingCopy(
    vehicle: Partial<VehicleWithImages>,
    platform: 'facebook' | 'instagram' | 'craigslist' | 'youtube'
  ): Promise<string> {
    const platformRequirements = {
      facebook: 'engaging, conversational, with emojis, max 300 characters',
      instagram: 'hashtag-rich, lifestyle-focused, max 2200 characters',
      craigslist: 'detailed, factual, structured with sections',
      youtube: 'video description with timestamps, keywords, and links',
    };

    const prompt = `Create ${platform} marketing copy for a ${vehicle.year} ${vehicle.make} ${vehicle.model}.
    Requirements: ${platformRequirements[platform]}
    Price: $${vehicle.price}
    Location: ${vehicle.location || 'Contact for details'}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a social media marketing expert specializing in ${platform} automotive listings.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI marketing copy error:', error);
      throw new Error('Failed to generate marketing copy');
    }
  }
}