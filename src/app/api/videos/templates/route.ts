import { NextRequest, NextResponse } from 'next/server';
import { sonautoService } from '@/ai/services/sonauto.service';

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'luxury' | 'sporty' | 'family' | 'adventure' | 'eco' | 'classic';
  style: {
    visual: string;
    music: string;
    transitions: string[];
    mood: string;
  };
  preview: {
    thumbnailUrl: string;
    previewVideoUrl?: string;
  };
  prompts: {
    scene1: string;
    scene2: string;
    scene3: string;
  };
  cameraMovements: {
    scene1: string;
    scene2: string;
    scene3: string;
  };
  pricing: {
    tier: 'free' | 'premium' | 'pro';
    cost?: number;
  };
}

// Predefined video templates
const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'luxury_showcase',
    name: 'Luxury Showcase',
    description: 'Elegant presentation highlighting premium features and sophistication',
    category: 'luxury',
    style: {
      visual: 'Cinematic with smooth camera movements, golden hour lighting',
      music: 'Sophisticated orchestral ambient',
      transitions: ['fade', 'slide'],
      mood: 'Premium, sophisticated, aspirational',
    },
    preview: {
      thumbnailUrl: '/templates/luxury_thumbnail.jpg',
      previewVideoUrl: '/templates/luxury_preview.mp4',
    },
    prompts: {
      scene1: 'Elegant exterior shot with premium lighting showcasing the vehicle\'s sophisticated design lines',
      scene2: 'Luxurious interior focus on premium materials, leather seats, and high-end technology',
      scene3: 'Dynamic driving shot on scenic road emphasizing smooth performance and prestige',
    },
    cameraMovements: {
      scene1: 'Slow 360-degree orbital movement',
      scene2: 'Smooth tracking shot across interior details',
      scene3: 'Following tracking shot with subtle zoom',
    },
    pricing: {
      tier: 'premium',
      cost: 5.99,
    },
  },
  {
    id: 'sporty_performance',
    name: 'Sporty Performance',
    description: 'High-energy showcase emphasizing speed, power, and excitement',
    category: 'sporty',
    style: {
      visual: 'Dynamic angles, fast cuts, aggressive lighting',
      music: 'Electronic rock with driving beat',
      transitions: ['zoom', 'slide'],
      mood: 'Exciting, powerful, adrenaline-fueled',
    },
    preview: {
      thumbnailUrl: '/templates/sporty_thumbnail.jpg',
      previewVideoUrl: '/templates/sporty_preview.mp4',
    },
    prompts: {
      scene1: 'Dynamic low-angle shot emphasizing aggressive styling and sporty design elements',
      scene2: 'Close-up of performance features: wheels, exhaust, sport interior with racing elements',
      scene3: 'High-speed action shot with motion blur showing the vehicle\'s performance capabilities',
    },
    cameraMovements: {
      scene1: 'Fast upward sweep with dramatic angle',
      scene2: 'Quick cuts with zoom-in details',
      scene3: 'High-speed tracking with motion effects',
    },
    pricing: {
      tier: 'premium',
      cost: 5.99,
    },
  },
  {
    id: 'family_friendly',
    name: 'Family Friendly',
    description: 'Warm, welcoming presentation focusing on safety, comfort, and reliability',
    category: 'family',
    style: {
      visual: 'Warm lighting, comfortable angles, lifestyle focus',
      music: 'Acoustic pop with warm tones',
      transitions: ['fade', 'fade'],
      mood: 'Warm, reliable, trustworthy',
    },
    preview: {
      thumbnailUrl: '/templates/family_thumbnail.jpg',
      previewVideoUrl: '/templates/family_preview.mp4',
    },
    prompts: {
      scene1: 'Welcoming exterior view in family-friendly setting emphasizing spaciousness and approachability',
      scene2: 'Spacious interior highlighting family comfort, safety features, and practical storage',
      scene3: 'Gentle driving scene in suburban setting showing smooth, comfortable ride quality',
    },
    cameraMovements: {
      scene1: 'Gentle wide-to-medium approach',
      scene2: 'Smooth pan across family-focused features',
      scene3: 'Steady following shot with natural movement',
    },
    pricing: {
      tier: 'free',
    },
  },
  {
    id: 'adventure_ready',
    name: 'Adventure Ready',
    description: 'Bold presentation showcasing capability, ruggedness, and outdoor lifestyle',
    category: 'adventure',
    style: {
      visual: 'Epic landscapes, bold angles, natural lighting',
      music: 'Cinematic orchestral with adventure themes',
      transitions: ['slide', 'zoom'],
      mood: 'Adventurous, bold, capable',
    },
    preview: {
      thumbnailUrl: '/templates/adventure_thumbnail.jpg',
      previewVideoUrl: '/templates/adventure_preview.mp4',
    },
    prompts: {
      scene1: 'Epic landscape shot showcasing the vehicle\'s commanding presence and rugged capability',
      scene2: 'Detail shots of adventure features: 4WD, cargo space, protective elements, high ground clearance',
      scene3: 'Action shot navigating challenging terrain demonstrating off-road capability and confidence',
    },
    cameraMovements: {
      scene1: 'Wide cinematic sweep with dramatic reveal',
      scene2: 'Strong angular movements highlighting features',
      scene3: 'Dynamic following with terrain interaction',
    },
    pricing: {
      tier: 'premium',
      cost: 5.99,
    },
  },
  {
    id: 'eco_efficient',
    name: 'Eco Efficient',
    description: 'Clean, modern presentation highlighting environmental benefits and innovation',
    category: 'eco',
    style: {
      visual: 'Clean lines, modern aesthetics, natural settings',
      music: 'Ambient electronic with clean tones',
      transitions: ['fade', 'slide'],
      mood: 'Clean, futuristic, responsible',
    },
    preview: {
      thumbnailUrl: '/templates/eco_thumbnail.jpg',
      previewVideoUrl: '/templates/eco_preview.mp4',
    },
    prompts: {
      scene1: 'Clean, modern exterior shot in natural setting emphasizing environmental harmony',
      scene2: 'Technology-focused interior showcasing eco-friendly features and efficient design',
      scene3: 'Silent, smooth driving scene highlighting electric/hybrid efficiency and zero emissions',
    },
    cameraMovements: {
      scene1: 'Smooth, clean circular movement',
      scene2: 'Precise technical movements showcasing innovation',
      scene3: 'Fluid, effortless tracking emphasizing smooth operation',
    },
    pricing: {
      tier: 'premium',
      cost: 5.99,
    },
  },
  {
    id: 'classic_timeless',
    name: 'Classic Timeless',
    description: 'Timeless presentation honoring heritage, craftsmanship, and enduring value',
    category: 'classic',
    style: {
      visual: 'Classic cinematography, heritage settings, golden light',
      music: 'Orchestral with nostalgic elements',
      transitions: ['fade', 'fade'],
      mood: 'Timeless, prestigious, heritage',
    },
    preview: {
      thumbnailUrl: '/templates/classic_thumbnail.jpg',
      previewVideoUrl: '/templates/classic_preview.mp4',
    },
    prompts: {
      scene1: 'Timeless exterior shot with classic lighting emphasizing enduring design and craftsmanship',
      scene2: 'Heritage-focused interior highlighting quality materials and traditional attention to detail',
      scene3: 'Elegant driving scene on classic scenic route showcasing timeless appeal and refined performance',
    },
    cameraMovements: {
      scene1: 'Classic slow orbital with respectful distance',
      scene2: 'Reverent pan across craftsmanship details',
      scene3: 'Elegant following shot with smooth, refined movement',
    },
    pricing: {
      tier: 'premium',
      cost: 5.99,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tier = searchParams.get('tier');
    const includeMusic = searchParams.get('includeMusic') === 'true';

    let filteredTemplates = VIDEO_TEMPLATES;

    // Filter by category
    if (category) {
      filteredTemplates = filteredTemplates.filter(
        template => template.category === category
      );
    }

    // Filter by pricing tier
    if (tier) {
      filteredTemplates = filteredTemplates.filter(
        template => template.pricing.tier === tier
      );
    }

    // Include music themes if requested
    let musicThemes = [];
    if (includeMusic) {
      musicThemes = sonautoService.getAvailableThemes();
    }

    const response = {
      success: true,
      templates: filteredTemplates,
      musicThemes: includeMusic ? musicThemes : undefined,
      categories: ['luxury', 'sporty', 'family', 'adventure', 'eco', 'classic'],
      tiers: ['free', 'premium', 'pro'],
      count: filteredTemplates.length,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Templates API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch video templates',
        code: 'TEMPLATES_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      templateId,
      vehicleData,
      customizations = {},
    } = body;

    if (!templateId) {
      return NextResponse.json(
        { 
          error: 'Template ID is required',
          code: 'MISSING_TEMPLATE_ID'
        },
        { status: 400 }
      );
    }

    // Find the template
    const template = VIDEO_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { 
          error: 'Template not found',
          code: 'TEMPLATE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Apply customizations to template
    const customizedTemplate = {
      ...template,
      ...customizations,
      style: {
        ...template.style,
        ...customizations.style,
      },
      prompts: {
        ...template.prompts,
        ...customizations.prompts,
      },
    };

    // Generate vehicle-specific prompts
    if (vehicleData) {
      const { make, model, year, type } = vehicleData;
      const vehicleInfo = `${year} ${make} ${model}`;
      
      // Customize prompts with vehicle information
      Object.keys(customizedTemplate.prompts).forEach(sceneKey => {
        customizedTemplate.prompts[sceneKey] = customizedTemplate.prompts[sceneKey]
          .replace('the vehicle', `the ${vehicleInfo}`)
          .replace('vehicle\'s', `${vehicleInfo}'s`);
      });
    }

    return NextResponse.json({
      success: true,
      template: customizedTemplate,
      estimatedCost: template.pricing.cost || 0,
      estimatedTime: 400, // 6-7 minutes
      message: 'Template customized successfully',
    });

  } catch (error) {
    console.error('Template customization API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to customize template',
        code: 'CUSTOMIZATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}