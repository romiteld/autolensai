import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';
import { withAuth, AuthContext, ValidationError, APIError } from '@/api/middleware';

interface AnalyticsSummary {
  overview: {
    totalVehicles: number;
    totalViews: number;
    totalInquiries: number;
    averagePrice: number;
    totalRevenue: number;
    conversionRate: number;
  };
  trends: {
    vehiclesChange: number;
    viewsChange: number;
    inquiriesChange: number;
    revenueChange: number;
  };
  topPerformers: Array<{
    id: string;
    vehicle: string;
    metric: string;
    value: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// GET /api/analytics/dashboard - Get dashboard analytics
async function getDashboardAnalyticsHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const supabase = createSupabaseClient();

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        previousStartDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Get user's vehicles with analytics
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        price,
        status,
        created_at,
        views_count,
        inquiries_count
      `)
      .eq('user_id', context.user!.id)
      .gte('created_at', startDate.toISOString());

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      throw new APIError('Failed to fetch vehicle data', 500);
    }

    // Get previous period vehicles for comparison
    const { data: previousVehicles, error: prevVehiclesError } = await supabase
      .from('vehicles')
      .select('id, price, status, views_count, inquiries_count')
      .eq('user_id', context.user!.id)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (prevVehiclesError) {
      console.error('Error fetching previous vehicles:', prevVehiclesError);
    }

    // Get inquiries for the user's vehicles
    const vehicleIds = vehicles?.map(v => v.id) || [];
    const { data: inquiries, error: inquiriesError } = await supabase
      .from('inquiries')
      .select('id, vehicle_id, created_at, status')
      .in('vehicle_id', vehicleIds)
      .gte('created_at', startDate.toISOString());

    if (inquiriesError) {
      console.error('Error fetching inquiries:', inquiriesError);
    }

    // Calculate overview metrics
    const totalVehicles = vehicles?.length || 0;
    const totalViews = vehicles?.reduce((sum, v) => sum + (v.views_count || 0), 0) || 0;
    const totalInquiries = inquiries?.length || 0;
    const averagePrice = totalVehicles > 0 
      ? Math.round((vehicles?.reduce((sum, v) => sum + (v.price || 0), 0) || 0) / totalVehicles)
      : 0;
    
    const soldVehicles = vehicles?.filter(v => v.status === 'sold') || [];
    const totalRevenue = soldVehicles.reduce((sum, v) => sum + (v.price || 0), 0);
    const conversionRate = totalViews > 0 ? Number(((totalInquiries / totalViews) * 100).toFixed(1)) : 0;

    // Calculate trends (comparison with previous period)
    const prevTotalVehicles = previousVehicles?.length || 0;
    const prevTotalViews = previousVehicles?.reduce((sum, v) => sum + (v.views_count || 0), 0) || 0;
    const prevSoldVehicles = previousVehicles?.filter(v => v.status === 'sold') || [];
    const prevTotalRevenue = prevSoldVehicles.reduce((sum, v) => sum + (v.price || 0), 0);

    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    // Find top performers
    const topPerformers = vehicles
      ?.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 3)
      .map((vehicle, index) => ({
        id: vehicle.id,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        metric: index === 0 ? 'Views' : index === 1 ? 'Inquiries' : 'Engagement',
        value: index === 0 ? (vehicle.views_count || 0) : 
               index === 1 ? (vehicle.inquiries_count || 0) :
               vehicle.views_count && vehicle.inquiries_count 
                 ? Number(((vehicle.inquiries_count / vehicle.views_count) * 100).toFixed(1))
                 : 0
      })) || [];

    // Get recent activity
    const recentActivity = [
      ...vehicles?.slice(0, 3).map(v => ({
        id: `vehicle-${v.id}`,
        type: 'vehicle_created',
        description: `Listed ${v.year} ${v.make} ${v.model}`,
        timestamp: v.created_at
      })) || [],
      ...inquiries?.slice(0, 3).map(i => ({
        id: `inquiry-${i.id}`,
        type: 'inquiry_received',
        description: 'New inquiry received',
        timestamp: i.created_at
      })) || []
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    const analytics: AnalyticsSummary = {
      overview: {
        totalVehicles,
        totalViews,
        totalInquiries,
        averagePrice,
        totalRevenue,
        conversionRate
      },
      trends: {
        vehiclesChange: calculateChange(totalVehicles, prevTotalVehicles),
        viewsChange: calculateChange(totalViews, prevTotalViews),
        inquiriesChange: calculateChange(totalInquiries, 0), // Previous inquiries calculation would be complex
        revenueChange: calculateChange(totalRevenue, prevTotalRevenue)
      },
      topPerformers,
      recentActivity
    };

    return NextResponse.json({
      analytics,
      timeframe,
      generatedAt: new Date().toISOString(),
      message: 'Analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getDashboardAnalyticsHandler:', error);
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to fetch analytics', 500);
  }
}

// GET /api/analytics/export - Export analytics data
async function exportAnalyticsHandler(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const timeframe = searchParams.get('timeframe') || '30d';
    
    if (!['json', 'csv'].includes(format)) {
      throw new ValidationError('Format must be json or csv');
    }

    const supabase = createSupabaseClient();

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get detailed vehicle analytics
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        price,
        status,
        condition,
        mileage,
        created_at,
        updated_at,
        views_count,
        inquiries_count
      `)
      .eq('user_id', context.user!.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles for export:', error);
      throw new APIError('Failed to fetch vehicle data', 500);
    }

    if (format === 'csv') {
      const csvHeaders = [
        'ID', 'Make', 'Model', 'Year', 'Price', 'Status', 'Condition', 
        'Mileage', 'Views', 'Inquiries', 'Conversion Rate', 'Created At'
      ];

      const csvRows = vehicles?.map(vehicle => [
        vehicle.id,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.price,
        vehicle.status,
        vehicle.condition,
        vehicle.mileage || 'N/A',
        vehicle.views_count || 0,
        vehicle.inquiries_count || 0,
        vehicle.views_count && vehicle.views_count > 0 
          ? `${((vehicle.inquiries_count || 0) / vehicle.views_count * 100).toFixed(1)}%`
          : '0%',
        new Date(vehicle.created_at).toLocaleDateString()
      ]) || [];

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="autolensai-analytics-${timeframe}.csv"`
        }
      });
    }

    // JSON format
    return NextResponse.json({
      data: vehicles,
      exportedAt: new Date().toISOString(),
      timeframe,
      totalRecords: vehicles?.length || 0
    });

  } catch (error) {
    console.error('Error in exportAnalyticsHandler:', error);
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to export analytics', 500);
  }
}

// Apply authentication middleware
export const GET = withAuth(getDashboardAnalyticsHandler);