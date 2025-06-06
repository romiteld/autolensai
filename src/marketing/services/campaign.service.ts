import { VehicleWithImages } from '@/vehicle/models/vehicle.model';

export interface MarketingCampaign {
  id: string;
  vehicleId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'draft';
  platforms: ('facebook' | 'instagram' | 'craigslist' | 'youtube')[];
  templateId?: string;
  budget?: {
    total: number;
    spent: number;
    dailyLimit?: number;
  };
  targeting?: {
    location?: string;
    radius?: number;
    demographics?: {
      ageMin?: number;
      ageMax?: number;
      interests?: string[];
    };
  };
  scheduledAt?: Date;
  deployedAt?: Date;
  completedAt?: Date;
  autoOptimization: boolean;
  metrics: {
    views: number;
    clicks: number;
    inquiries: number;
    reach: number;
    impressions: number;
    ctr: number;
    conversionRate: number;
  };
  deploymentResults?: {
    facebook?: any;
    instagram?: any;
    craigslist?: any;
    youtube?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignData {
  vehicleId: string;
  platforms: string[];
  templateId?: string;
  scheduledAt?: string;
  autoOptimization: boolean;
  budget?: {
    total: number;
    dailyLimit?: number;
  };
  targeting?: {
    location?: string;
    radius?: number;
    demographics?: {
      ageMin?: number;
      ageMax?: number;
      interests?: string[];
    };
  };
  vehicle: VehicleWithImages;
}

export interface UpdateCampaignData {
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
  budget?: {
    total: number;
    dailyLimit?: number;
  };
  targeting?: {
    location?: string;
    radius?: number;
    demographics?: {
      ageMin?: number;
      ageMax?: number;
      interests?: string[];
    };
  };
  autoOptimization?: boolean;
}

export interface CampaignFilters {
  status?: string;
  vehicleId?: string;
}

export interface GetCampaignsOptions {
  page: number;
  limit: number;
  filters: CampaignFilters;
}

export class MarketingCampaignService {
  private campaigns: Map<string, MarketingCampaign> = new Map();

  async createCampaign(data: CreateCampaignData): Promise<MarketingCampaign> {
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const campaign: MarketingCampaign = {
      id: campaignId,
      vehicleId: data.vehicleId,
      name: `Campaign for ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
      status: 'draft',
      platforms: data.platforms.filter(p => p !== 'all') as any,
      templateId: data.templateId,
      budget: data.budget ? {
        total: data.budget.total,
        spent: 0,
        dailyLimit: data.budget.dailyLimit,
      } : undefined,
      targeting: data.targeting,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      autoOptimization: data.autoOptimization,
      metrics: {
        views: 0,
        clicks: 0,
        inquiries: 0,
        reach: 0,
        impressions: 0,
        ctr: 0,
        conversionRate: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If platforms includes 'all', add all available platforms
    if (data.platforms.includes('all')) {
      campaign.platforms = ['facebook', 'instagram', 'craigslist', 'youtube'];
    }

    this.campaigns.set(campaignId, campaign);
    
    console.log(`Created campaign ${campaignId} for vehicle ${data.vehicleId}`);
    return campaign;
  }

  async getCampaigns(options: GetCampaignsOptions): Promise<{
    campaigns: MarketingCampaign[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let filteredCampaigns = Array.from(this.campaigns.values());

    // Apply filters
    if (options.filters.status) {
      filteredCampaigns = filteredCampaigns.filter(c => c.status === options.filters.status);
    }
    if (options.filters.vehicleId) {
      filteredCampaigns = filteredCampaigns.filter(c => c.vehicleId === options.filters.vehicleId);
    }

    // Sort by creation date (newest first)
    filteredCampaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filteredCampaigns.length;
    const totalPages = Math.ceil(total / options.limit);
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;

    const campaigns = filteredCampaigns.slice(start, end);

    return {
      campaigns,
      total,
      page: options.page,
      totalPages,
    };
  }

  async getCampaignById(campaignId: string): Promise<MarketingCampaign | null> {
    return this.campaigns.get(campaignId) || null;
  }

  async updateCampaign(campaignId: string, data: UpdateCampaignData): Promise<MarketingCampaign | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return null;
    }

    const updatedCampaign: MarketingCampaign = {
      ...campaign,
      ...data,
      // Preserve budget.spent if updating budget
      budget: data.budget ? {
        ...data.budget,
        spent: campaign.budget?.spent || 0,
      } : campaign.budget,
      updatedAt: new Date(),
    };

    // Handle status changes
    if (data.status === 'completed') {
      updatedCampaign.completedAt = new Date();
    }

    this.campaigns.set(campaignId, updatedCampaign);
    
    console.log(`Updated campaign ${campaignId}:`, data);
    return updatedCampaign;
  }

  async updateCampaignDeployment(campaignId: string, deployment: {
    status: string;
    deploymentResults: any;
    deployedAt: Date;
  }): Promise<MarketingCampaign | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return null;
    }

    const updatedCampaign: MarketingCampaign = {
      ...campaign,
      status: deployment.status as any,
      deploymentResults: deployment.deploymentResults,
      deployedAt: deployment.deployedAt,
      updatedAt: new Date(),
    };

    this.campaigns.set(campaignId, updatedCampaign);
    
    console.log(`Updated campaign deployment ${campaignId}`);
    return updatedCampaign;
  }

  async updateCampaignMetrics(campaignId: string, metrics: Partial<MarketingCampaign['metrics']>): Promise<MarketingCampaign | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      return null;
    }

    const updatedCampaign: MarketingCampaign = {
      ...campaign,
      metrics: {
        ...campaign.metrics,
        ...metrics,
      },
      updatedAt: new Date(),
    };

    // Calculate derived metrics
    if (updatedCampaign.metrics.clicks > 0 && updatedCampaign.metrics.impressions > 0) {
      updatedCampaign.metrics.ctr = (updatedCampaign.metrics.clicks / updatedCampaign.metrics.impressions) * 100;
    }
    if (updatedCampaign.metrics.inquiries > 0 && updatedCampaign.metrics.views > 0) {
      updatedCampaign.metrics.conversionRate = (updatedCampaign.metrics.inquiries / updatedCampaign.metrics.views) * 100;
    }

    this.campaigns.set(campaignId, updatedCampaign);
    
    console.log(`Updated campaign metrics ${campaignId}:`, metrics);
    return updatedCampaign;
  }

  async deleteCampaign(campaignId: string): Promise<boolean> {
    const success = this.campaigns.delete(campaignId);
    if (success) {
      console.log(`Deleted campaign ${campaignId}`);
    }
    return success;
  }

  async getCampaignsByVehicleId(vehicleId: string): Promise<MarketingCampaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.vehicleId === vehicleId);
  }

  async getActiveCampaigns(): Promise<MarketingCampaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.status === 'active');
  }

  async pauseCampaign(campaignId: string): Promise<MarketingCampaign | null> {
    return this.updateCampaign(campaignId, { status: 'paused' });
  }

  async resumeCampaign(campaignId: string): Promise<MarketingCampaign | null> {
    return this.updateCampaign(campaignId, { status: 'active' });
  }

  async calculateCampaignROI(campaignId: string): Promise<{
    spent: number;
    revenue: number;
    roi: number;
    inquiries: number;
    costPerInquiry: number;
  } | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign || !campaign.budget) {
      return null;
    }

    // In a real implementation, this would calculate actual revenue
    const estimatedRevenue = campaign.metrics.inquiries * 2500; // Assume $2500 per inquiry conversion
    const roi = campaign.budget.spent > 0 ? 
      ((estimatedRevenue - campaign.budget.spent) / campaign.budget.spent) * 100 : 0;
    const costPerInquiry = campaign.metrics.inquiries > 0 ? 
      campaign.budget.spent / campaign.metrics.inquiries : 0;

    return {
      spent: campaign.budget.spent,
      revenue: estimatedRevenue,
      roi,
      inquiries: campaign.metrics.inquiries,
      costPerInquiry,
    };
  }
}