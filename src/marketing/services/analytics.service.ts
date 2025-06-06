export interface AnalyticsMetric {
  id: string;
  vehicleId: string;
  campaignId?: string;
  platform: 'facebook' | 'instagram' | 'craigslist' | 'youtube';
  timestamp: Date;
  metrics: {
    views: number;
    clicks: number;
    inquiries: number;
    favorites: number;
    shares: number;
    reach: number;
    impressions: number;
    spend: number;
  };
}

export interface AnalyticsQuery {
  vehicleId?: string;
  campaignId?: string;
  platform?: 'facebook' | 'instagram' | 'craigslist' | 'youtube' | 'all';
  dateFrom?: string;
  dateTo?: string;
  metrics?: string[];
  groupBy?: 'day' | 'week' | 'month' | 'platform' | 'campaign';
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  totalInquiries: number;
  totalSpend: number;
  avgCTR: number;
  avgConversionRate: number;
  costPerClick: number;
  costPerInquiry: number;
  topPerformingPlatform: string;
  trendsAnalysis: {
    viewsTrend: 'up' | 'down' | 'stable';
    clicksTrend: 'up' | 'down' | 'stable';
    inquiriesTrend: 'up' | 'down' | 'stable';
    performanceChange: number;
  };
}

export interface OptimizationInsight {
  type: 'budget' | 'targeting' | 'content' | 'timing' | 'platform';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  expectedImpact: string;
  data: any;
}

export class MarketingAnalyticsService {
  private metrics: Map<string, AnalyticsMetric> = new Map();

  async updateMetrics(data: {
    vehicleId: string;
    campaignId?: string;
    platform: 'facebook' | 'instagram' | 'craigslist' | 'youtube';
    metrics: Partial<AnalyticsMetric['metrics']>;
    timestamp: Date;
  }): Promise<AnalyticsMetric> {
    const metricId = `${data.vehicleId}_${data.platform}_${data.timestamp.getTime()}`;
    
    const existingMetric = this.metrics.get(metricId);
    const metric: AnalyticsMetric = {
      id: metricId,
      vehicleId: data.vehicleId,
      campaignId: data.campaignId,
      platform: data.platform,
      timestamp: data.timestamp,
      metrics: {
        views: 0,
        clicks: 0,
        inquiries: 0,
        favorites: 0,
        shares: 0,
        reach: 0,
        impressions: 0,
        spend: 0,
        ...existingMetric?.metrics,
        ...data.metrics,
      },
    };

    this.metrics.set(metricId, metric);
    console.log(`Updated metrics for ${data.vehicleId} on ${data.platform}:`, data.metrics);
    
    return metric;
  }

  async getAnalytics(query: AnalyticsQuery): Promise<AnalyticsMetric[]> {
    let filteredMetrics = Array.from(this.metrics.values());

    // Apply filters
    if (query.vehicleId) {
      filteredMetrics = filteredMetrics.filter(m => m.vehicleId === query.vehicleId);
    }
    if (query.campaignId) {
      filteredMetrics = filteredMetrics.filter(m => m.campaignId === query.campaignId);
    }
    if (query.platform && query.platform !== 'all') {
      filteredMetrics = filteredMetrics.filter(m => m.platform === query.platform);
    }
    if (query.dateFrom) {
      const fromDate = new Date(query.dateFrom);
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= fromDate);
    }
    if (query.dateTo) {
      const toDate = new Date(query.dateTo);
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= toDate);
    }

    // Sort by timestamp
    filteredMetrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Group data if requested
    if (query.groupBy) {
      return this.groupMetrics(filteredMetrics, query.groupBy);
    }

    return filteredMetrics;
  }

  async calculateSummary(query: AnalyticsQuery): Promise<AnalyticsSummary> {
    const metrics = await this.getAnalytics(query);
    
    if (metrics.length === 0) {
      return {
        totalViews: 0,
        totalClicks: 0,
        totalInquiries: 0,
        totalSpend: 0,
        avgCTR: 0,
        avgConversionRate: 0,
        costPerClick: 0,
        costPerInquiry: 0,
        topPerformingPlatform: 'none',
        trendsAnalysis: {
          viewsTrend: 'stable',
          clicksTrend: 'stable',
          inquiriesTrend: 'stable',
          performanceChange: 0,
        },
      };
    }

    const totals = metrics.reduce((acc, metric) => ({
      views: acc.views + metric.metrics.views,
      clicks: acc.clicks + metric.metrics.clicks,
      inquiries: acc.inquiries + metric.metrics.inquiries,
      spend: acc.spend + metric.metrics.spend,
      impressions: acc.impressions + metric.metrics.impressions,
    }), { views: 0, clicks: 0, inquiries: 0, spend: 0, impressions: 0 });

    // Calculate averages
    const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const avgConversionRate = totals.views > 0 ? (totals.inquiries / totals.views) * 100 : 0;
    const costPerClick = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    const costPerInquiry = totals.inquiries > 0 ? totals.spend / totals.inquiries : 0;

    // Find top performing platform
    const platformPerformance = new Map<string, number>();
    metrics.forEach(metric => {
      const current = platformPerformance.get(metric.platform) || 0;
      platformPerformance.set(metric.platform, current + metric.metrics.inquiries);
    });
    
    const topPerformingPlatform = Array.from(platformPerformance.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    // Calculate trends (simplified)
    const trendsAnalysis = this.calculateTrends(metrics);

    return {
      totalViews: totals.views,
      totalClicks: totals.clicks,
      totalInquiries: totals.inquiries,
      totalSpend: totals.spend,
      avgCTR,
      avgConversionRate,
      costPerClick,
      costPerInquiry,
      topPerformingPlatform,
      trendsAnalysis,
    };
  }

  async generateInsights(params: {
    vehicleId?: string;
    campaignId?: string;
    timeframe: string;
  }): Promise<OptimizationInsight[]> {
    const insights: OptimizationInsight[] = [];
    
    const query: AnalyticsQuery = {
      vehicleId: params.vehicleId,
      campaignId: params.campaignId,
      dateFrom: this.getDateFromTimeframe(params.timeframe),
    };

    const metrics = await this.getAnalytics(query);
    const summary = await this.calculateSummary(query);

    // Budget optimization insights
    if (summary.costPerInquiry > 100) {
      insights.push({
        type: 'budget',
        priority: 'high',
        title: 'High Cost Per Inquiry',
        description: `Your cost per inquiry is $${summary.costPerInquiry.toFixed(2)}, which is above the optimal range.`,
        recommendation: 'Consider optimizing targeting parameters or adjusting bid strategies to reduce costs.',
        expectedImpact: '20-30% reduction in cost per inquiry',
        data: { currentCPI: summary.costPerInquiry, targetCPI: 75 },
      });
    }

    // CTR optimization insights
    if (summary.avgCTR < 2) {
      insights.push({
        type: 'content',
        priority: 'medium',
        title: 'Low Click-Through Rate',
        description: `Your average CTR is ${summary.avgCTR.toFixed(2)}%, which could be improved.`,
        recommendation: 'Update listing titles and descriptions to be more compelling and include key vehicle features.',
        expectedImpact: '15-25% increase in click-through rate',
        data: { currentCTR: summary.avgCTR, targetCTR: 3.5 },
      });
    }

    // Platform performance insights
    if (summary.topPerformingPlatform !== 'none') {
      const platformMetrics = metrics.filter(m => m.platform === summary.topPerformingPlatform);
      const platformInquiries = platformMetrics.reduce((sum, m) => sum + m.metrics.inquiries, 0);
      
      if (platformInquiries > summary.totalInquiries * 0.5) {
        insights.push({
          type: 'platform',
          priority: 'medium',
          title: 'Platform Performance Imbalance',
          description: `${summary.topPerformingPlatform} is generating most of your inquiries.`,
          recommendation: 'Consider increasing budget allocation to this platform or improving performance on others.',
          expectedImpact: '10-20% increase in total inquiries',
          data: { topPlatform: summary.topPerformingPlatform, percentage: (platformInquiries / summary.totalInquiries) * 100 },
        });
      }
    }

    // Timing optimization insights
    const hourlyPerformance = this.analyzeHourlyPerformance(metrics);
    if (hourlyPerformance.peakHours.length > 0) {
      insights.push({
        type: 'timing',
        priority: 'low',
        title: 'Optimal Posting Times Identified',
        description: `Peak engagement occurs during ${hourlyPerformance.peakHours.join(', ')}.`,
        recommendation: 'Schedule future posts during these peak hours for better engagement.',
        expectedImpact: '5-15% increase in engagement rate',
        data: { peakHours: hourlyPerformance.peakHours },
      });
    }

    return insights;
  }

  private groupMetrics(metrics: AnalyticsMetric[], groupBy: string): AnalyticsMetric[] {
    // Simplified grouping implementation
    const grouped = new Map<string, AnalyticsMetric[]>();
    
    metrics.forEach(metric => {
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = metric.timestamp.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(metric.timestamp);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${metric.timestamp.getFullYear()}-${String(metric.timestamp.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'platform':
          key = metric.platform;
          break;
        case 'campaign':
          key = metric.campaignId || 'no-campaign';
          break;
        default:
          key = metric.id;
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    });

    // Aggregate grouped metrics
    const aggregated: AnalyticsMetric[] = [];
    grouped.forEach((groupMetrics, key) => {
      const firstMetric = groupMetrics[0];
      const aggregatedMetric: AnalyticsMetric = {
        id: `${groupBy}_${key}`,
        vehicleId: firstMetric.vehicleId,
        campaignId: firstMetric.campaignId,
        platform: firstMetric.platform,
        timestamp: firstMetric.timestamp,
        metrics: groupMetrics.reduce((acc, m) => ({
          views: acc.views + m.metrics.views,
          clicks: acc.clicks + m.metrics.clicks,
          inquiries: acc.inquiries + m.metrics.inquiries,
          favorites: acc.favorites + m.metrics.favorites,
          shares: acc.shares + m.metrics.shares,
          reach: acc.reach + m.metrics.reach,
          impressions: acc.impressions + m.metrics.impressions,
          spend: acc.spend + m.metrics.spend,
        }), { views: 0, clicks: 0, inquiries: 0, favorites: 0, shares: 0, reach: 0, impressions: 0, spend: 0 }),
      };
      aggregated.push(aggregatedMetric);
    });

    return aggregated;
  }

  private calculateTrends(metrics: AnalyticsMetric[]): AnalyticsSummary['trendsAnalysis'] {
    if (metrics.length < 2) {
      return {
        viewsTrend: 'stable',
        clicksTrend: 'stable',
        inquiriesTrend: 'stable',
        performanceChange: 0,
      };
    }

    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    const firstHalfTotals = firstHalf.reduce((acc, m) => ({
      views: acc.views + m.metrics.views,
      clicks: acc.clicks + m.metrics.clicks,
      inquiries: acc.inquiries + m.metrics.inquiries,
    }), { views: 0, clicks: 0, inquiries: 0 });

    const secondHalfTotals = secondHalf.reduce((acc, m) => ({
      views: acc.views + m.metrics.views,
      clicks: acc.clicks + m.metrics.clicks,
      inquiries: acc.inquiries + m.metrics.inquiries,
    }), { views: 0, clicks: 0, inquiries: 0 });

    const getTrend = (first: number, second: number): 'up' | 'down' | 'stable' => {
      const change = ((second - first) / (first || 1)) * 100;
      if (change > 10) return 'up';
      if (change < -10) return 'down';
      return 'stable';
    };

    const performanceChange = firstHalfTotals.inquiries > 0 ?
      ((secondHalfTotals.inquiries - firstHalfTotals.inquiries) / firstHalfTotals.inquiries) * 100 : 0;

    return {
      viewsTrend: getTrend(firstHalfTotals.views, secondHalfTotals.views),
      clicksTrend: getTrend(firstHalfTotals.clicks, secondHalfTotals.clicks),
      inquiriesTrend: getTrend(firstHalfTotals.inquiries, secondHalfTotals.inquiries),
      performanceChange,
    };
  }

  private analyzeHourlyPerformance(metrics: AnalyticsMetric[]): { peakHours: string[] } {
    const hourlyStats = new Map<number, number>();
    
    metrics.forEach(metric => {
      const hour = metric.timestamp.getHours();
      const current = hourlyStats.get(hour) || 0;
      hourlyStats.set(hour, current + metric.metrics.clicks);
    });

    const sortedHours = Array.from(hourlyStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return { peakHours: sortedHours };
  }

  private getDateFromTimeframe(timeframe: string): string {
    const now = new Date();
    const days = parseInt(timeframe.replace('d', '')) || 7;
    const fromDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return fromDate.toISOString();
  }
}