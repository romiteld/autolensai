export interface MarketingTemplate {
  id: string;
  name: string;
  platform: 'facebook' | 'instagram' | 'craigslist' | 'youtube' | 'universal';
  category: 'sedan' | 'suv' | 'truck' | 'luxury' | 'sports' | 'electric' | 'universal';
  template: {
    title: string;
    description: string;
    hashtags?: string[];
    priceFormat?: string;
    features?: string[];
    callToAction?: string;
  };
  variables?: {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    required: boolean;
    defaultValue?: any;
    options?: string[];
  }[];
  isActive: boolean;
  metadata?: {
    author?: string;
    version?: string;
    tags?: string[];
    lastUpdated?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateData {
  name: string;
  platform: 'facebook' | 'instagram' | 'craigslist' | 'youtube' | 'universal';
  category: 'sedan' | 'suv' | 'truck' | 'luxury' | 'sports' | 'electric' | 'universal';
  template: {
    title: string;
    description: string;
    hashtags?: string[];
    priceFormat?: string;
    features?: string[];
    callToAction?: string;
  };
  variables?: {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    required: boolean;
    defaultValue?: any;
    options?: string[];
  }[];
  isActive: boolean;
  metadata?: {
    author?: string;
    version?: string;
    tags?: string[];
    lastUpdated?: string;
  };
}

export interface TemplateFilters {
  platform?: string;
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface GetTemplatesOptions {
  filters: TemplateFilters;
  page: number;
  limit: number;
}

export class MarketingTemplateService {
  private templates: Map<string, MarketingTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Facebook Marketplace Templates
    this.createTemplate({
      name: 'Facebook Sedan Standard',
      platform: 'facebook',
      category: 'sedan',
      template: {
        title: '{{year}} {{make}} {{model}} - {{mileage}} miles - $\{{price}}',
        description: `🚗 {{year}} {{make}} {{model}} for sale!

📍 Located in {{location}}
🛣️ {{mileage}} miles
💰 Asking $\{{price}}

✅ Features:
{{#each features}}
• {{this}}
{{/each}}

🔧 Maintenance:
• Well maintained
• Clean title
• No accidents

📞 Serious inquiries only. Contact me for more details or to schedule a viewing!

#{{make}} #{{model}} #CarsForSale #FacebookMarketplace`,
        features: ['Air Conditioning', 'Power Windows', 'Bluetooth', 'Backup Camera'],
        callToAction: 'Message me for more details!',
      },
      isActive: true,
      metadata: {
        author: 'AutoLensAI',
        version: '1.0',
        tags: ['facebook', 'sedan', 'standard'],
      },
    });

    this.createTemplate({
      name: 'Instagram Car Showcase',
      platform: 'instagram',
      category: 'universal',
      template: {
        title: '{{year}} {{make}} {{model}} 🚗',
        description: `✨ {{year}} {{make}} {{model}} ✨

🔥 Only {{mileage}} miles!
💎 Pristine condition
📍 {{location}}
💰 $\{{price}}

Ready for its next adventure! 🌟

DM for details 📩`,
        hashtags: ['#carsofinstagram', '#{{make}}', '#{{model}}', '#forsale', '#automotive', '#carlovers', '#dreamcar'],
        callToAction: 'DM for details! 📩',
      },
      isActive: true,
      metadata: {
        author: 'AutoLensAI',
        version: '1.0',
        tags: ['instagram', 'universal', 'social'],
      },
    });

    this.createTemplate({
      name: 'Craigslist Detailed Listing',
      platform: 'craigslist',
      category: 'universal',
      template: {
        title: '{{year}} {{make}} {{model}} - {{mileage}}mi - $\{{price}} ({{location}})',
        description: `{{year}} {{make}} {{model}}
Mileage: {{mileage}}
Price: $\{{price}}
Location: {{location}}

VEHICLE DETAILS:
- Exterior Color: {{exteriorColor}}
- Interior Color: {{interiorColor}}
- Transmission: {{transmission}}
- Fuel Type: {{fuelType}}
- Condition: {{condition}}

FEATURES:
{{#each features}}
- {{this}}
{{/each}}

DESCRIPTION:
{{description}}

This vehicle is in excellent condition and ready for immediate sale. Clean title, no accidents, well-maintained with all service records available.

CONTACT:
Cash only, serious buyers please. Available for inspection by appointment.

Price is firm. No trades, no financing.`,
        features: ['Air Conditioning', 'Power Steering', 'ABS Brakes', 'Airbags'],
        callToAction: 'Contact for viewing appointment',
      },
      isActive: true,
      metadata: {
        author: 'AutoLensAI',
        version: '1.0',
        tags: ['craigslist', 'detailed', 'comprehensive'],
      },
    });

    this.createTemplate({
      name: 'YouTube Shorts Script',
      platform: 'youtube',
      category: 'universal',
      template: {
        title: '{{year}} {{make}} {{model}} - Perfect Condition! #shorts',
        description: `🚗 {{year}} {{make}} {{model}} for sale!

📍 {{location}}
🛣️ {{mileage}} miles
💰 $\{{price}}

This beauty is in perfect condition and ready for a new owner!

✨ Key Features:
{{#each features}}
• {{this}}
{{/each}}

Don't miss out on this amazing deal! 

📱 Contact info in bio
#carsale #{{make}} #{{model}} #automotive #deals`,
        hashtags: ['#shorts', '#carsale', '#automotive', '#{{make}}', '#{{model}}', '#deals'],
        callToAction: 'Link in bio for more details!',
      },
      isActive: true,
      metadata: {
        author: 'AutoLensAI',
        version: '1.0',
        tags: ['youtube', 'shorts', 'video'],
      },
    });

    this.createTemplate({
      name: 'Luxury Vehicle Premium',
      platform: 'universal',
      category: 'luxury',
      template: {
        title: 'Pristine {{year}} {{make}} {{model}} - Exceptional Quality',
        description: `Exceptional {{year}} {{make}} {{model}} available for discerning buyers.

🏆 VEHICLE HIGHLIGHTS:
• {{mileage}} carefully driven miles
• Immaculate condition throughout
• Complete service history
• Garage kept and meticulously maintained

💎 PREMIUM FEATURES:
{{#each features}}
• {{this}}
{{/each}}

📍 Located in {{location}}
💰 Investment: $\{{price}}

This exceptional vehicle represents the pinnacle of automotive excellence. Every detail has been maintained to the highest standards.

Schedule your private viewing today.`,
        features: ['Premium Leather Interior', 'Advanced Safety Package', 'Premium Sound System', 'Navigation System'],
        priceFormat: 'Investment: $\{{price}}',
        callToAction: 'Schedule your private viewing today',
      },
      isActive: true,
      metadata: {
        author: 'AutoLensAI',
        version: '1.0',
        tags: ['luxury', 'premium', 'high-end'],
      },
    });
  }

  async createTemplate(data: CreateTemplateData): Promise<MarketingTemplate> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const template: MarketingTemplate = {
      id: templateId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(templateId, template);
    console.log(`Created template ${templateId}: ${data.name}`);
    
    return template;
  }

  async getTemplates(options: GetTemplatesOptions): Promise<{
    templates: MarketingTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let filteredTemplates = Array.from(this.templates.values());

    // Apply filters
    if (options.filters.platform) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.platform === options.filters.platform || t.platform === 'universal'
      );
    }
    if (options.filters.category) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.category === options.filters.category || t.category === 'universal'
      );
    }
    if (options.filters.isActive !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isActive === options.filters.isActive);
    }
    if (options.filters.search) {
      const searchLower = options.filters.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.template.title.toLowerCase().includes(searchLower) ||
        t.template.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredTemplates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filteredTemplates.length;
    const totalPages = Math.ceil(total / options.limit);
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;

    const templates = filteredTemplates.slice(start, end);

    return {
      templates,
      total,
      page: options.page,
      totalPages,
    };
  }

  async getTemplateById(templateId: string): Promise<MarketingTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async updateTemplate(templateId: string, data: Partial<CreateTemplateData>): Promise<MarketingTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const updatedTemplate: MarketingTemplate = {
      ...template,
      ...data,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updatedTemplate);
    console.log(`Updated template ${templateId}`);
    
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    const success = this.templates.delete(templateId);
    if (success) {
      console.log(`Deleted template ${templateId}`);
    }
    return success;
  }

  async getTemplatesByPlatform(platform: string): Promise<MarketingTemplate[]> {
    return Array.from(this.templates.values()).filter(t => 
      t.platform === platform || t.platform === 'universal'
    );
  }

  async getTemplatesByCategory(category: string): Promise<MarketingTemplate[]> {
    return Array.from(this.templates.values()).filter(t => 
      t.category === category || t.category === 'universal'
    );
  }

  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<{
    title: string;
    description: string;
    hashtags?: string[];
    callToAction?: string;
  } | null> {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    // Simple template rendering (in production, use a proper template engine like Handlebars)
    const renderString = (str: string, vars: Record<string, any>): string => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key] || match;
      });
    };

    const renderArray = (arr: string[] | undefined, vars: Record<string, any>): string[] | undefined => {
      if (!arr) return undefined;
      return arr.map(item => renderString(item, vars));
    };

    return {
      title: renderString(template.template.title, variables),
      description: renderString(template.template.description, variables),
      hashtags: renderArray(template.template.hashtags, variables),
      callToAction: template.template.callToAction ? 
        renderString(template.template.callToAction, variables) : undefined,
    };
  }

  async duplicateTemplate(templateId: string, newName: string): Promise<MarketingTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const duplicateData: CreateTemplateData = {
      ...template,
      name: newName,
    };

    return this.createTemplate(duplicateData);
  }

  async getTemplateVariables(templateId: string): Promise<string[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      return [];
    }

    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    
    const extractVariables = (str: string) => {
      let match;
      while ((match = variableRegex.exec(str)) !== null) {
        variables.add(match[1]);
      }
    };

    extractVariables(template.template.title);
    extractVariables(template.template.description);
    
    if (template.template.hashtags) {
      template.template.hashtags.forEach(extractVariables);
    }

    return Array.from(variables);
  }
}