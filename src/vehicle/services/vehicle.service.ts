import { createSupabaseAdmin, createSupabaseClient } from '@/core/database/supabase';
import type { VehicleInput, VehicleWithImages } from '../models/vehicle.model';
import type { Database } from '@/common/types/database.types';
import { OpenAIService } from '@/ai/services/openai.service';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];
type VehicleImageRow = Database['public']['Tables']['vehicle_images']['Row'];

export interface VehicleFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  fuelType?: string;
  transmission?: string;
  location?: string;
  status?: 'active' | 'pending' | 'sold' | 'archived';
}

export interface VehicleSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'price' | 'year' | 'mileage';
  sortOrder?: 'asc' | 'desc';
  filters?: VehicleFilters;
}

export class VehicleService {
  private supabase = createSupabaseClient();
  private supabaseAdmin = createSupabaseAdmin();
  private openaiService = new OpenAIService();

  /**
   * Create a new vehicle listing with AI-generated description
   */
  async createVehicle(userId: string, data: VehicleInput): Promise<VehicleWithImages> {
    try {
      // Generate AI description if not provided
      let description = data.description;
      if (!description) {
        try {
          description = await this.openaiService.generateVehicleDescription(data);
        } catch (error) {
          console.warn('Failed to generate AI description:', error);
          description = `${data.year} ${data.make} ${data.model}`;
        }
      }

      // Create cloudinary folder name
      const cloudinaryFolder = `vehicles/${userId}/${data.make}-${data.model}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');

      const vehicleData: VehicleInsert = {
        user_id: userId,
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage || null,
        price: data.price || null,
        description,
        condition: data.condition || null,
        location: data.location || null,
        zip_code: data.zipCode || null,
        vin: data.vin || null,
        transmission: data.transmission || null,
        fuel_type: data.fuelType || null,
        exterior_color: data.exteriorColor || null,
        interior_color: data.interiorColor || null,
        cloudinary_folder: cloudinaryFolder,
        status: 'pending',
        featured: false,
      };

      const { data: vehicle, error } = await this.supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create vehicle: ${error.message}`);
      }

      return this.mapToVehicleWithImages(vehicle, []);
    } catch (error) {
      console.error('Vehicle creation error:', error);
      throw error;
    }
  }

  async getVehicle(id: string): Promise<VehicleWithImages | null> {
    const { data: vehicle, error: vehicleError } = await this.supabase
      .from('vehicles')
      .select()
      .eq('id', id)
      .single();

    if (vehicleError) return null;

    const { data: images, error: imagesError } = await this.supabase
      .from('vehicle_images')
      .select()
      .eq('vehicle_id', id)
      .order('order_index', { ascending: true });

    if (imagesError) throw imagesError;

    return this.mapToVehicleWithImages(vehicle, images || []);
  }

  async getVehicleById(id: string): Promise<VehicleWithImages | null> {
    return this.getVehicle(id);
  }

  /**
   * Get vehicles for a user with pagination and filtering
   */
  async getUserVehicles(
    userId: string, 
    options: VehicleSearchOptions = {}
  ): Promise<{ vehicles: VehicleWithImages[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        filters = {}
      } = options;

      let query = this.supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_images(*)
        `, { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters.make) query = query.eq('make', filters.make);
      if (filters.model) query = query.eq('model', filters.model);
      if (filters.yearMin) query = query.gte('year', filters.yearMin);
      if (filters.yearMax) query = query.lte('year', filters.yearMax);
      if (filters.priceMin) query = query.gte('price', filters.priceMin);
      if (filters.priceMax) query = query.lte('price', filters.priceMax);
      if (filters.condition) query = query.eq('condition', filters.condition);
      if (filters.fuelType) query = query.eq('fuel_type', filters.fuelType);
      if (filters.transmission) query = query.eq('transmission', filters.transmission);
      if (filters.location) query = query.ilike('location', `%${filters.location}%`);
      if (filters.status) query = query.eq('status', filters.status);

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch vehicles: ${error.message}`);
      }

      const vehicles = (data || []).map(row => 
        this.mapToVehicleWithImages(row, row.vehicle_images || [])
      );

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        vehicles,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('User vehicles fetch error:', error);
      throw error;
    }
  }

  /**
   * Search public vehicles (for marketplace)
   */
  async searchVehicles(
    options: VehicleSearchOptions = {}
  ): Promise<{ vehicles: VehicleWithImages[]; total: number; page: number; totalPages: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        filters = {}
      } = options;

      let query = this.supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_images(*)
        `, { count: 'exact' })
        .eq('status', 'active');

      // Apply filters (same as getUserVehicles but without user_id filter)
      if (filters.make) query = query.eq('make', filters.make);
      if (filters.model) query = query.eq('model', filters.model);
      if (filters.yearMin) query = query.gte('year', filters.yearMin);
      if (filters.yearMax) query = query.lte('year', filters.yearMax);
      if (filters.priceMin) query = query.gte('price', filters.priceMin);
      if (filters.priceMax) query = query.lte('price', filters.priceMax);
      if (filters.condition) query = query.eq('condition', filters.condition);
      if (filters.fuelType) query = query.eq('fuel_type', filters.fuelType);
      if (filters.transmission) query = query.eq('transmission', filters.transmission);
      if (filters.location) query = query.ilike('location', `%${filters.location}%`);

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to search vehicles: ${error.message}`);
      }

      const vehicles = (data || []).map(row => 
        this.mapToVehicleWithImages(row, row.vehicle_images || [])
      );

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        vehicles,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error('Vehicle search error:', error);
      throw error;
    }
  }

  async updateVehicle(id: string, userId: string, data: Partial<VehicleInput>): Promise<VehicleWithImages> {
    const updateData: Partial<VehicleInsert> = {};
    
    if (data.make !== undefined) updateData.make = data.make;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.mileage !== undefined) updateData.mileage = data.mileage;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.zipCode !== undefined) updateData.zip_code = data.zipCode;
    if (data.vin !== undefined) updateData.vin = data.vin;
    if (data.transmission !== undefined) updateData.transmission = data.transmission;
    if (data.fuelType !== undefined) updateData.fuel_type = data.fuelType;
    if (data.exteriorColor !== undefined) updateData.exterior_color = data.exteriorColor;
    if (data.interiorColor !== undefined) updateData.interior_color = data.interiorColor;

    const { data: vehicle, error } = await this.supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    const { data: images } = await this.supabase
      .from('vehicle_images')
      .select()
      .eq('vehicle_id', id);

    return this.mapToVehicleWithImages(vehicle, images || []);
  }

  /**
   * Delete a vehicle and its associated images
   */
  async deleteVehicle(id: string, userId: string): Promise<void> {
    try {
      // First, get the vehicle to verify ownership
      const vehicle = await this.getVehicle(id);
      if (!vehicle || vehicle.userId !== userId) {
        throw new Error('Vehicle not found or access denied');
      }
      
      // Delete vehicle images from database (Cloudinary cleanup should be handled separately)
      const { error: imagesError } = await this.supabase
        .from('vehicle_images')
        .delete()
        .eq('vehicle_id', id);

      if (imagesError) {
        console.warn('Failed to delete vehicle images:', imagesError);
      }

      // Delete the vehicle
      const { error } = await this.supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete vehicle: ${error.message}`);
      }
    } catch (error) {
      console.error('Vehicle deletion error:', error);
      throw error;
    }
  }

  /**
   * Update vehicle status
   */
  async updateVehicleStatus(
    vehicleId: string, 
    userId: string, 
    status: 'active' | 'pending' | 'sold' | 'archived'
  ): Promise<VehicleWithImages> {
    try {
      const { data, error } = await this.supabase
        .from('vehicles')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update vehicle status: ${error.message}`);
      }

      if (!data) {
        throw new Error('Vehicle not found or access denied');
      }

      return this.getVehicle(vehicleId)!;
    } catch (error) {
      console.error('Vehicle status update error:', error);
      throw error;
    }
  }

  /**
   * Toggle vehicle featured status
   */
  async toggleFeatured(vehicleId: string, userId: string): Promise<VehicleWithImages> {
    try {
      // Get current status
      const vehicle = await this.getVehicle(vehicleId);
      if (!vehicle || vehicle.userId !== userId) {
        throw new Error('Vehicle not found or access denied');
      }
      
      const { data, error } = await this.supabase
        .from('vehicles')
        .update({ 
          featured: !vehicle.featured,
          updated_at: new Date().toISOString() 
        })
        .eq('id', vehicleId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to toggle featured status: ${error.message}`);
      }

      return this.getVehicle(vehicleId)!;
    } catch (error) {
      console.error('Vehicle featured toggle error:', error);
      throw error;
    }
  }

  /**
   * Get vehicle statistics for a user
   */
  async getUserVehicleStats(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('vehicles')
        .select('status, featured')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch vehicle stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        active: data.filter(v => v.status === 'active').length,
        pending: data.filter(v => v.status === 'pending').length,
        sold: data.filter(v => v.status === 'sold').length,
        archived: data.filter(v => v.status === 'archived').length,
        featured: data.filter(v => v.featured).length,
      };

      return stats;
    } catch (error) {
      console.error('Vehicle stats error:', error);
      throw error;
    }
  }

  private mapToVehicleWithImages(vehicle: VehicleRow, images: any[]): VehicleWithImages {
    return {
      id: vehicle.id,
      userId: vehicle.user_id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage || undefined,
      price: vehicle.price || undefined,
      description: vehicle.description || undefined,
      condition: vehicle.condition || undefined,
      location: vehicle.location || undefined,
      zipCode: vehicle.zip_code || undefined,
      status: vehicle.status,
      featured: vehicle.featured,
      vin: vehicle.vin || undefined,
      transmission: vehicle.transmission || undefined,
      fuelType: vehicle.fuel_type || undefined,
      exteriorColor: vehicle.exterior_color || undefined,
      interiorColor: vehicle.interior_color || undefined,
      cloudinaryFolder: vehicle.cloudinary_folder || undefined,
      images: images.map(img => ({
        id: img.id,
        vehicleId: img.vehicle_id,
        originalUrl: img.original_url,
        processedUrl: img.processed_url || undefined,
        cloudinaryPublicId: img.cloudinary_public_id || undefined,
        orderIndex: img.order_index || undefined,
        isPrimary: img.is_primary,
        processingStatus: img.processing_status,
        createdAt: new Date(img.created_at),
      })),
      createdAt: new Date(vehicle.created_at),
      updatedAt: new Date(vehicle.updated_at),
    };
  }
}