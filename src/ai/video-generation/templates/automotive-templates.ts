export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'luxury' | 'sporty' | 'family' | 'adventure' | 'eco' | 'classic';
  scenePrompts: {
    scene1: string;
    scene2: string;
    scene3: string;
  };
  cameraMovements: {
    scene1: string;
    scene2: string;
    scene3: string;
  };
  transitions: string[];
  musicTheme: string;
  style: {
    lighting: string;
    mood: string;
    energy: 'low' | 'medium' | 'high';
    pace: 'slow' | 'medium' | 'fast';
  };
}

export const AUTOMOTIVE_TEMPLATES: VideoTemplate[] = [
  {
    id: 'luxury_elegance',
    name: 'Luxury Elegance',
    description: 'Sophisticated showcase for premium vehicles',
    category: 'luxury',
    scenePrompts: {
      scene1: 'Elegant exterior reveal with premium lighting showcasing sophisticated design lines and luxury appointments',
      scene2: 'Interior luxury focus on handcrafted materials, premium leather, and advanced technology features',
      scene3: 'Smooth highway driving emphasizing whisper-quiet performance and refined handling',
    },
    cameraMovements: {
      scene1: 'Slow 360-degree orbital movement with respectful distance',
      scene2: 'Smooth tracking shot across premium interior details',
      scene3: 'Elegant following shot with subtle zoom and smooth panning',
    },
    transitions: ['fade', 'fade'],
    musicTheme: 'luxury',
    style: {
      lighting: 'Golden hour, soft premium lighting',
      mood: 'Sophisticated, aspirational, premium',
      energy: 'medium',
      pace: 'slow',
    },
  },
  {
    id: 'sporty_performance',
    name: 'Sporty Performance',
    description: 'Dynamic showcase for sports and performance vehicles',
    category: 'sporty',
    scenePrompts: {
      scene1: 'Dynamic low-angle exterior shot emphasizing aggressive styling, aerodynamic features, and sporty design',
      scene2: 'Performance interior with sport seats, racing-inspired dashboard, and advanced performance technology',
      scene3: 'High-speed action sequence showcasing acceleration, handling, and performance capabilities',
    },
    cameraMovements: {
      scene1: 'Fast upward sweep with dramatic low angle approach',
      scene2: 'Quick cuts with dynamic zoom-in on performance details',
      scene3: 'High-speed tracking with motion blur and dynamic angles',
    },
    transitions: ['zoom', 'slide'],
    musicTheme: 'sporty',
    style: {
      lighting: 'High contrast, dramatic shadows',
      mood: 'Exciting, powerful, adrenaline-fueled',
      energy: 'high',
      pace: 'fast',
    },
  },
  {
    id: 'family_comfort',
    name: 'Family Comfort',
    description: 'Warm, welcoming presentation for family vehicles',
    category: 'family',
    scenePrompts: {
      scene1: 'Welcoming exterior view in family setting emphasizing spaciousness, safety, and approachability',
      scene2: 'Spacious interior highlighting family comfort, child safety features, and practical storage solutions',
      scene3: 'Gentle suburban driving showcasing smooth ride quality, safety features, and family convenience',
    },
    cameraMovements: {
      scene1: 'Gentle wide-to-medium approach with welcoming angle',
      scene2: 'Smooth pan across family-focused features and space',
      scene3: 'Steady following shot with natural, comfortable movement',
    },
    transitions: ['fade', 'fade'],
    musicTheme: 'family',
    style: {
      lighting: 'Warm, natural daylight',
      mood: 'Warm, reliable, trustworthy',
      energy: 'medium',
      pace: 'medium',
    },
  },
  {
    id: 'adventure_ready',
    name: 'Adventure Ready',
    description: 'Bold presentation for SUVs and adventure vehicles',
    category: 'adventure',
    scenePrompts: {
      scene1: 'Epic landscape exterior shot showcasing commanding presence, rugged capability, and outdoor readiness',
      scene2: 'Adventure-focused interior with 4WD controls, cargo space, protective features, and outdoor gear storage',
      scene3: 'Off-road action demonstrating capability on challenging terrain with confidence and control',
    },
    cameraMovements: {
      scene1: 'Wide cinematic sweep with dramatic reveal against landscape',
      scene2: 'Strong angular movements highlighting capability features',
      scene3: 'Dynamic following through varied terrain with impact shots',
    },
    transitions: ['slide', 'zoom'],
    musicTheme: 'adventure',
    style: {
      lighting: 'Natural outdoor lighting, epic golden hour',
      mood: 'Adventurous, bold, capable',
      energy: 'high',
      pace: 'medium',
    },
  },
  {
    id: 'eco_innovation',
    name: 'Eco Innovation',
    description: 'Clean, modern presentation for electric and hybrid vehicles',
    category: 'eco',
    scenePrompts: {
      scene1: 'Clean, modern exterior in natural setting emphasizing environmental harmony and innovative design',
      scene2: 'Technology-focused interior showcasing eco-friendly materials, energy displays, and sustainable innovation',
      scene3: 'Silent, efficient driving demonstrating zero emissions, smooth operation, and environmental responsibility',
    },
    cameraMovements: {
      scene1: 'Smooth, clean circular movement in harmony with environment',
      scene2: 'Precise technical movements showcasing innovation and efficiency',
      scene3: 'Fluid, effortless tracking emphasizing silent, smooth operation',
    },
    transitions: ['fade', 'slide'],
    musicTheme: 'eco',
    style: {
      lighting: 'Clean, bright natural lighting',
      mood: 'Clean, futuristic, responsible',
      energy: 'medium',
      pace: 'medium',
    },
  },
  {
    id: 'classic_heritage',
    name: 'Classic Heritage',
    description: 'Timeless presentation honoring automotive heritage',
    category: 'classic',
    scenePrompts: {
      scene1: 'Timeless exterior shot with heritage lighting emphasizing enduring design and classic proportions',
      scene2: 'Craftsmanship-focused interior highlighting quality materials, traditional details, and timeless elegance',
      scene3: 'Elegant scenic driving on classic routes showcasing refined performance and enduring appeal',
    },
    cameraMovements: {
      scene1: 'Classic slow orbital with respectful, reverent distance',
      scene2: 'Reverent pan across craftsmanship and heritage details',
      scene3: 'Elegant following shot with smooth, refined movement',
    },
    transitions: ['fade', 'fade'],
    musicTheme: 'classic',
    style: {
      lighting: 'Warm, classic golden hour lighting',
      mood: 'Timeless, prestigious, heritage',
      energy: 'low',
      pace: 'slow',
    },
  },
];

export function getTemplateByCategory(category: string): VideoTemplate[] {
  return AUTOMOTIVE_TEMPLATES.filter(template => template.category === category);
}

export function getTemplateById(id: string): VideoTemplate | undefined {
  return AUTOMOTIVE_TEMPLATES.find(template => template.id === id);
}

export function getTemplateRecommendation(vehicleType: string): VideoTemplate {
  const type = vehicleType.toLowerCase();
  
  // Match vehicle type to appropriate template
  if (type.includes('luxury') || type.includes('mercedes') || type.includes('bmw') || type.includes('audi')) {
    return getTemplateById('luxury_elegance')!;
  }
  
  if (type.includes('sport') || type.includes('ferrari') || type.includes('porsche') || type.includes('corvette')) {
    return getTemplateById('sporty_performance')!;
  }
  
  if (type.includes('suv') || type.includes('truck') || type.includes('jeep') || type.includes('4x4')) {
    return getTemplateById('adventure_ready')!;
  }
  
  if (type.includes('electric') || type.includes('hybrid') || type.includes('tesla') || type.includes('prius')) {
    return getTemplateById('eco_innovation')!;
  }
  
  if (type.includes('classic') || type.includes('vintage') || type.includes('heritage')) {
    return getTemplateById('classic_heritage')!;
  }
  
  // Default to family template
  return getTemplateById('family_comfort')!;
}

export function customizeTemplate(template: VideoTemplate, customizations: Partial<VideoTemplate>): VideoTemplate {
  return {
    ...template,
    ...customizations,
    scenePrompts: {
      ...template.scenePrompts,
      ...customizations.scenePrompts,
    },
    cameraMovements: {
      ...template.cameraMovements,
      ...customizations.cameraMovements,
    },
    style: {
      ...template.style,
      ...customizations.style,
    },
  };
}