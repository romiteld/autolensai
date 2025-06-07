import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/core/database/supabase';
import { withAuth, AuthContext, ValidationError, APIError } from '@/api/middleware';

// GET /api/analytics/export - Export analytics data
export const GET = withAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
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
        location,
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
        'Mileage', 'Location', 'Views', 'Inquiries', 'Conversion Rate', 
        'Created At', 'Updated At'
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
        vehicle.location || 'N/A',
        vehicle.views_count || 0,
        vehicle.inquiries_count || 0,
        vehicle.views_count && vehicle.views_count > 0 
          ? `${((vehicle.inquiries_count || 0) / vehicle.views_count * 100).toFixed(1)}%`
          : '0%',
        new Date(vehicle.created_at).toLocaleDateString(),
        new Date(vehicle.updated_at || vehicle.created_at).toLocaleDateString()
      ]) || [];

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="autolensai-analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // JSON format
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        timeframe,
        totalRecords: vehicles?.length || 0,
        userId: context.user!.id,
        exportFormat: 'json'
      },
      summary: {
        totalVehicles: vehicles?.length || 0,
        totalViews: vehicles?.reduce((sum, v) => sum + (v.views_count || 0), 0) || 0,
        totalInquiries: vehicles?.reduce((sum, v) => sum + (v.inquiries_count || 0), 0) || 0,
        averagePrice: vehicles?.length ? 
          Math.round((vehicles.reduce((sum, v) => sum + (v.price || 0), 0)) / vehicles.length) : 0,
        soldVehicles: vehicles?.filter(v => v.status === 'sold').length || 0,
        activeVehicles: vehicles?.filter(v => v.status === 'active').length || 0
      },
      vehicles: vehicles?.map(vehicle => ({
        ...vehicle,
        conversionRate: vehicle.views_count && vehicle.views_count > 0 
          ? Number(((vehicle.inquiries_count || 0) / vehicle.views_count * 100).toFixed(2))
          : 0
      })) || []
    };

    return NextResponse.json(exportData);

  } catch (error) {
    console.error('Error in exportAnalyticsHandler:', error);
    if (error instanceof ValidationError || error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to export analytics', 500);
  }
});